import { getSession } from "./session";

/** Rota secreta da equipe — abre o menu sem código de visitante. */
export const ROTA_EQUIPE = "/menu5398";

/**
 * Para onde ir quando o visitante vence um jogo.
 *
 * Visitante de verdade vai pra roleta ganhar o brinde. A equipe, entrando
 * pela rota secreta, volta pro menu: não há código real, então não teria como
 * girar — e assim testar os jogos nunca consome brinde nem polui o placar.
 */
export function destinoAposVitoria(): string {
  return getSession()?.equipe ? ROTA_EQUIPE : "/roleta";
}
