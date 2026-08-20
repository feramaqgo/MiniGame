import { getPartida } from "./session";
import { getTabletSenha } from "./tablet";
import { enfileirar, sincronizar } from "./outbox";

export type Jogo = "chute" | "memoria" | "cobrinha" | "velha";

/** Métricas cruas da partida. O servidor é quem transforma isso em pontos. */
export interface MetricasPartida {
  tempoMs: number;
  /** Em qual tentativa a pessoa venceu (1 = de primeira). */
  tentativas?: number;
  /** Memória e Velha: jogadas até vencer. */
  jogadas?: number;
  /** Chute: distância entre a mira e o goleiro no momento do chute. */
  margem?: number;
  /** Mangote: passos dados e o mínimo necessário (mede rota, não sorte). */
  passos?: number;
  passosMinimos?: number;
  /** Mangote: mudanças de direção — bater na tela sem pensar penaliza. */
  toques?: number;
}

/**
 * Registra a partida vencida — ainda sem saber quem é a pessoa.
 *
 * Manda só as métricas cruas: quem calcula os pontos é o servidor, então o
 * placar não depende de confiar na tela do tablet. Se a rede estiver fora, o
 * envio vai pra fila e sobe sozinho depois — o visitante não pode perder a
 * pontuação por causa do wi-fi do pavilhão.
 *
 * O dono dessa pontuação é definido depois, quando a pessoa escaneia o QR e
 * se cadastra no celular (`api/resgatar.js`).
 */
export async function registrarPartida(
  jogo: Jogo,
  metricas: MetricasPartida
): Promise<void> {
  const partida = getPartida();
  if (!partida) return;
  // Modo equipe (/menu5398) nunca entra no placar oficial.
  if (partida.equipe) return;

  const corpo = {
    partidaId: partida.id,
    senha: getTabletSenha(),
    jogo,
    ...metricas,
    tempoMs: Math.round(metricas.tempoMs),
  };

  try {
    const resposta = await fetch("/api/partida", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(corpo),
    });

    if (resposta.ok) return;

    // 4xx é recusa definitiva (dados inválidos, tablet não autorizado):
    // insistir não resolveria nada.
    if (resposta.status >= 400 && resposta.status < 500) {
      console.warn("Partida recusada pelo servidor:", resposta.status);
      return;
    }

    // 5xx: problema do lado de lá — guarda e tenta de novo depois.
    enfileirar(partida.id, "/api/partida", corpo);
  } catch {
    // Sem rede: a partida não pode se perder por isso.
    enfileirar(partida.id, "/api/partida", corpo);
    void sincronizar();
  }
}
