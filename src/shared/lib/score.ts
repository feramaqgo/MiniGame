import { getSession } from "./session";
import { getTabletSenha } from "./tablet";

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
}

/**
 * Registra a pontuação do visitante ao vencer um jogo.
 *
 * Manda só as métricas cruas — quem calcula os pontos é o servidor. Falhar
 * aqui nunca pode segurar o visitante: se o placar não gravar, o jogo segue
 * normalmente pra roleta.
 */
export async function registrarScore(
  jogo: Jogo,
  metricas: MetricasPartida
): Promise<number | null> {
  try {
    const session = getSession();
    if (!session?.codigo) return null;

    const resposta = await fetch("/api/score", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        codigo: session.codigo,
        senha: getTabletSenha(),
        jogo,
        ...metricas,
        tempoMs: Math.round(metricas.tempoMs),
      }),
    });

    if (!resposta.ok) return null;
    const dados = await resposta.json();
    return typeof dados?.pontos === "number" ? dados.pontos : null;
  } catch {
    return null;
  }
}
