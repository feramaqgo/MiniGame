// Prêmios em cache e sorteio local — pra roleta girar mesmo sem internet.
//
// O visitante que venceu não pode ver um erro por causa do wi-fi do pavilhão.
// Então a lista de brindes é guardada enquanto ainda há rede (o hub e cada
// jogo aquecem o cache) e, se a hora do giro pegar o aparelho offline, o
// sorteio acontece aqui mesmo — ponderado por estoque restante, exatamente o
// mesmo critério do servidor.
//
// Ressalva assumida: numa queda longa, um brinde quase esgotado pode ser
// sorteado além do estoque. O servidor registra a baixa com greatest(stock-1,0)
// e marca a linha como sorteada offline pra equipe reconciliar. Negar um
// brinde já entregue na mão da pessoa seria pior do que furar o estoque.

export interface Premio {
  id: string;
  name: string;
  remaining_stock?: number;
  sort_order?: number;
}

const CHAVE = "arcade_premios_cache";
const CHAVE_DEBITO = "arcade_premios_debito";

interface Cache {
  premios: Premio[];
  atualizadoEm: number;
}

function lerCache(): Cache | null {
  try {
    const cru = localStorage.getItem(CHAVE);
    return cru ? (JSON.parse(cru) as Cache) : null;
  } catch {
    return null;
  }
}

/** Brindes já sorteados offline NESTE aparelho, pra não repetir além do estoque. */
function lerDebitos(): Record<string, number> {
  try {
    const cru = localStorage.getItem(CHAVE_DEBITO);
    return cru ? (JSON.parse(cru) as Record<string, number>) : {};
  } catch {
    return {};
  }
}

function debitar(prizeId: string) {
  try {
    const d = lerDebitos();
    d[prizeId] = (d[prizeId] || 0) + 1;
    localStorage.setItem(CHAVE_DEBITO, JSON.stringify(d));
  } catch {
    /* sem storage: seguimos sem débito local */
  }
}

/** Busca a lista no servidor e guarda. Silencioso — falha não quebra nada. */
export async function prepararCachePremios(): Promise<void> {
  try {
    const r = await fetch("/api/prizes");
    if (!r.ok) return;
    const d = await r.json();
    if (!d?.ok || !Array.isArray(d.prizes) || d.prizes.length === 0) return;

    localStorage.setItem(
      CHAVE,
      JSON.stringify({ premios: d.prizes, atualizadoEm: Date.now() } satisfies Cache)
    );
    // Lista nova do servidor já reflete o que saiu: zera o débito local.
    localStorage.removeItem(CHAVE_DEBITO);
  } catch {
    /* offline agora; o cache anterior continua valendo */
  }
}

/** Lista pra desenhar a roleta. Vem do cache quando não há rede. */
export function getPremiosCache(): Premio[] {
  return lerCache()?.premios ?? [];
}

/**
 * Sorteia no navegador, ponderado por estoque restante — mesma regra do
 * servidor. Desconta o que este aparelho já sorteou offline pra não estourar
 * o estoque mais do que o necessário.
 */
export function sortearLocalmente(): Premio | null {
  const premios = getPremiosCache();
  if (premios.length === 0) return null;

  const debitos = lerDebitos();
  const candidatos = premios
    .map((p) => ({
      premio: p,
      peso: Math.max(0, (p.remaining_stock ?? 1) - (debitos[p.id] || 0)),
    }))
    .filter((c) => c.peso > 0);

  if (candidatos.length === 0) return null;

  const total = candidatos.reduce((s, c) => s + c.peso, 0);
  let sorteio = Math.floor(Math.random() * total) + 1;

  for (const c of candidatos) {
    sorteio -= c.peso;
    if (sorteio <= 0) {
      debitar(c.premio.id);
      return c.premio;
    }
  }

  const ultimo = candidatos[candidatos.length - 1].premio;
  debitar(ultimo.id);
  return ultimo;
}

/**
 * Deixa o tablet pronto pra funcionar sem rede.
 *
 * Pré-cachear só o HTML não basta: cada página referencia arquivos JS/CSS
 * com hash no nome, e sem eles a tela abre em branco. Aqui buscamos a página
 * E os arquivos que ela referencia — o service worker intercepta cada
 * requisição e guarda. Depois disso o aparelho abre qualquer jogo offline.
 *
 * Roda enquanto o tablet está ocioso na tela inicial, que é justamente
 * quando sobra rede e ninguém está esperando.
 */
export async function aquecerCacheDasTelas(): Promise<void> {
  if (typeof navigator === "undefined" || navigator.onLine === false) return;
  if (!("serviceWorker" in navigator)) return;

  // Rotas limpas (produção, via rewrite) e os .html correspondentes: em
  // ambiente sem rewrite é o .html que responde, e o cache precisa dos dois
  // pra o aparelho abrir offline de qualquer jeito.
  const rotas = [
    "/tablet", "/tablet.html",
    "/chute", "/chute.html",
    "/cobrinha", "/cobrinha.html",
    "/memoria", "/memoria.html",
    "/velha", "/velha.html",
    "/roleta", "/roleta.html",
    "/", "/index.html",
  ];

  for (const rota of rotas) {
    try {
      const r = await fetch(rota, { cache: "no-cache" });
      if (!r.ok) continue;
      const html = await r.text();

      // Os assets têm hash no nome (mudam a cada build), então são
      // descobertos aqui em vez de listados no service worker.
      const assets = [...html.matchAll(/(?:src|href)="(\/assets\/[^"]+)"/g)].map((m) => m[1]);
      await Promise.all(assets.map((a) => fetch(a).catch(() => undefined)));
    } catch {
      // Rede caiu no meio do aquecimento: o que já entrou continua valendo.
      return;
    }
  }
}
