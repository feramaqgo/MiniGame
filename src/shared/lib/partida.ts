// Identidade da partida — o fio que liga jogo, pontuação, cadastro e brinde.
//
// O tablet gera este UUID quando o visitante começa a jogar, muito antes de
// saber quem ele é. Ele viaja no QR code, é a chave de idempotência do reenvio
// da fila offline e é por ele que o cadastro feito no celular encontra a
// partida certa. Um UUID por partida: o mesmo giro pode chegar duas vezes ao
// servidor e nunca vira dois sorteios.

const CHAVE = "arcade_partida";

/** UUID v4. `crypto.randomUUID` não existe em contexto inseguro (http://). */
export function novoId(): string {
  const c = globalThis.crypto;
  if (c?.randomUUID) return c.randomUUID();
  if (c?.getRandomValues) {
    const b = c.getRandomValues(new Uint8Array(16));
    b[6] = (b[6] & 0x0f) | 0x40;
    b[8] = (b[8] & 0x3f) | 0x80;
    const h = [...b].map((n) => n.toString(16).padStart(2, "0")).join("");
    return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
  }
  // Último recurso: só chega aqui em navegador muito antigo.
  return `${Date.now().toString(16)}-${Math.random().toString(16).slice(2, 10)}`;
}

/** Começa uma partida no tablet e devolve o id. */
export function iniciarPartida(): string {
  const id = novoId();
  try {
    localStorage.setItem(CHAVE, id);
  } catch {
    /* modo privado sem storage: a partida vale só em memória */
  }
  return id;
}

export function getPartidaId(): string | null {
  try {
    return localStorage.getItem(CHAVE);
  } catch {
    return null;
  }
}

export function limparPartida() {
  try {
    localStorage.removeItem(CHAVE);
  } catch {
    /* nada a fazer */
  }
}
