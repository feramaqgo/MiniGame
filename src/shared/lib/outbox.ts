// Fila de envios que sobrevive à queda de rede.
//
// Wi-fi de pavilhão cai justamente no pico do movimento. Sem isso, o visitante
// que venceu no momento errado veria um erro, iria embora achando que não
// funcionou, e o lead — a razão do arcade existir — se perderia.
//
// Como funciona: em vez de falhar na cara da pessoa, a requisição vai pra uma
// fila em localStorage e sobe sozinha quando a rede voltar. Cada item carrega
// uma chave de idempotência (o `partida_id`), então reenviar é seguro: o
// servidor reconhece o repetido e devolve o mesmo resultado.
//
// Política de retentativa, que é onde mora a sutileza:
//   * erro de rede / 5xx  -> MANTÉM na fila. O servidor pode estar fora do ar,
//     e desistir aqui apagaria um lead que já rendeu brinde entregue em mãos.
//   * 4xx                 -> REMOVE. É recusa definitiva (dados inválidos, já
//     participou); insistir só encheria a fila pra sempre.

const CHAVE = "arcade_outbox";
const INTERVALO_MS = 30_000;

export interface ItemFila {
  id: string;
  url: string;
  body: unknown;
  criadoEm: number;
  tentativas: number;
}

function ler(): ItemFila[] {
  try {
    const cru = localStorage.getItem(CHAVE);
    return cru ? (JSON.parse(cru) as ItemFila[]) : [];
  } catch {
    return [];
  }
}

function gravar(itens: ItemFila[]) {
  try {
    localStorage.setItem(CHAVE, JSON.stringify(itens));
  } catch {
    /* storage cheio ou indisponível: seguimos sem fila */
  }
}

/** Quantos envios ainda não subiram. Usado no aviso discreto da tela. */
export function pendentes(): number {
  return ler().length;
}

/** Põe um envio na fila. `id` é a chave de idempotência (partida_id). */
export function enfileirar(id: string, url: string, body: unknown) {
  const itens = ler();
  // Mesma partida reenviada: substitui em vez de duplicar.
  const semDuplicata = itens.filter((i) => i.id !== id);
  semDuplicata.push({ id, url, body, criadoEm: Date.now(), tentativas: 0 });
  gravar(semDuplicata);
}

let sincronizando = false;

/** Tenta escoar a fila inteira. Silencioso: nunca lança. */
export async function sincronizar(): Promise<void> {
  if (sincronizando) return;
  if (typeof navigator !== "undefined" && navigator.onLine === false) return;

  const itens = ler();
  if (itens.length === 0) return;

  sincronizando = true;
  try {
    const restantes: ItemFila[] = [];

    for (const item of itens) {
      try {
        const r = await fetch(item.url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(item.body),
        });

        if (r.ok) continue; // subiu: sai da fila

        if (r.status >= 400 && r.status < 500) {
          // Recusa definitiva do servidor — não adianta insistir.
          console.warn("Item recusado pelo servidor, removido da fila:", item.id, r.status);
          continue;
        }

        // 5xx: problema do lado de lá, tenta de novo depois.
        restantes.push({ ...item, tentativas: item.tentativas + 1 });
      } catch {
        // Rede caiu no meio: mantém e para de tentar os outros agora.
        restantes.push({ ...item, tentativas: item.tentativas + 1 });
      }
    }

    gravar(restantes);
  } finally {
    sincronizando = false;
  }
}

let iniciado = false;

/**
 * Liga a sincronização automática. Chamada em todos os `main.tsx`, então
 * qualquer página aberta do arcade escoa a fila — inclusive uma que não foi
 * quem enfileirou.
 */
export function iniciarSincronizacao() {
  if (iniciado || typeof window === "undefined") return;
  iniciado = true;

  void sincronizar();
  window.addEventListener("online", () => void sincronizar());
  window.setInterval(() => void sincronizar(), INTERVALO_MS);
}
