import { getPartida } from "./session";

/** Rota secreta da equipe — abre o menu direto, sem passar pelo QR. */
export const ROTA_EQUIPE = "/menu5398";

/** Tela do tablet que mostra o QR de resgate depois da vitória. */
export const ROTA_RESGATE = "/tablet?resgate=1";

/**
 * Para onde ir quando o visitante vence um jogo.
 *
 * Visitante de verdade vai pra tela do QR: é lá que ele escaneia pra se
 * cadastrar no próprio celular e girar a roleta. A equipe, entrando pela rota
 * secreta, volta pro menu — não há nada pra resgatar, e assim testar os jogos
 * nunca consome brinde nem polui o placar.
 */
export function destinoAposVitoria(): string {
  return getPartida()?.equipe ? ROTA_EQUIPE : ROTA_RESGATE;
}
