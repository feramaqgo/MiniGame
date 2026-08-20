import { PartidaAtiva } from "../types";
import { novoId } from "./partida";

// Estado do tablet entre as páginas do arcade.
//
// Cada página é um bundle isolado, então o que atravessa vive em
// localStorage. No fluxo "joga primeiro, cadastra depois" isso deixou de ser
// uma sessão de usuário: o tablet não sabe quem está jogando. O que ele
// carrega é a PARTIDA em andamento — um UUID que só ganha dono depois, quando
// o visitante escaneia o QR e se cadastra no próprio celular.
//
// Versionada de propósito (`_v3`): aparelhos que ainda tenham a sessão do
// fluxo antigo (com código de pareamento) começam limpos, em vez de entrar
// num estado que não existe mais.
const CHAVE = "arcade_partida_v3";

export function getPartida(): PartidaAtiva | null {
  try {
    const cru = localStorage.getItem(CHAVE);
    if (!cru) return null;
    const p = JSON.parse(cru) as PartidaAtiva;
    return p?.id ? p : null;
  } catch {
    return null;
  }
}

export function salvarPartida(partida: PartidaAtiva) {
  try {
    localStorage.setItem(CHAVE, JSON.stringify(partida));
  } catch {
    /* modo privado: a partida vale só enquanto a página estiver aberta */
  }
}

/** Abre uma partida nova. Chamado quando o visitante entra no menu. */
export function novaPartida(equipe = false): PartidaAtiva {
  const partida: PartidaAtiva = { id: novoId(), ...(equipe ? { equipe: true } : {}) };
  salvarPartida(partida);
  return partida;
}

export function limparPartida() {
  try {
    localStorage.removeItem(CHAVE);
  } catch {
    /* nada a fazer */
  }
}

/**
 * Exige uma partida aberta — usado no mount de cada jogo.
 *
 * Diferente do fluxo antigo, isto NÃO é um portão de identificação: ninguém
 * precisa se cadastrar pra jogar. Só garante que o jogo foi aberto pelo menu
 * do tablet (e não por uma URL solta), pra a vitória ter onde ser registrada.
 */
export function requirePartida(): PartidaAtiva | null {
  const partida = getPartida();
  if (!partida) {
    window.location.href = "/tablet";
    return null;
  }
  return partida;
}
