import { ArcadeSession } from "../types";

// Versionada de propósito: ao virar pra operação real, qualquer sessão de
// demonstração salva em tablets/celulares que já acessaram deixa de existir.
const STORAGE_KEY = "arcade_session_v2";

export function saveSession(session: ArcadeSession) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
}

export function getSession(): ArcadeSession | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed?.idToken || !parsed?.celular) return null;
    return parsed as ArcadeSession;
  } catch {
    return null;
  }
}

export function clearSession() {
  localStorage.removeItem(STORAGE_KEY);
}

/**
 * Exige uma sessão de tablet (código já validado em /tablet) — usado no
 * mount de cada jogo e da roleta. Os jogos só acontecem no tablet do
 * estande, então sessão de celular (cadastro) não abre jogo.
 *
 * Sem sessão válida, manda o aparelho pra onde ele pertence: um tablet já
 * ativado volta pro início do ciclo (/tablet); qualquer outro vai pro
 * cadastro (/), onde o visitante encontra o código dele.
 */
export function requireSession(): ArcadeSession | null {
  const session = getSession();
  if (!session?.tablet || session.codigo == null) {
    const ehTabletDoEstande = !!localStorage.getItem("tablet_senha");
    window.location.href = ehTabletDoEstande ? "/tablet" : "/";
    return null;
  }
  return session;
}
