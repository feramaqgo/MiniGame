import { getSession } from "./session";
import { getTabletSenha } from "./tablet";

export type Jogo = "chute" | "memoria" | "cobrinha" | "velha";

/**
 * Registra a pontuação do visitante ao vencer um jogo.
 *
 * Manda só as métricas cruas (tempo e jogadas) — quem calcula os pontos é o
 * servidor. Falhar aqui nunca pode segurar o visitante: se o placar não
 * gravar, o jogo segue normalmente pra roleta.
 */
export async function registrarScore(
  jogo: Jogo,
  tempoMs: number,
  jogadas?: number
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
        tempoMs: Math.round(tempoMs),
        jogadas,
      }),
    });

    if (!resposta.ok) return null;
    const dados = await resposta.json();
    return typeof dados?.pontos === "number" ? dados.pontos : null;
  } catch {
    return null;
  }
}
