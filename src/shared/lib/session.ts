import { ArcadeSession } from "../types";

const STORAGE_KEY = "arcade_session";

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

/** Redireciona pro login (/) se não houver sessão válida — usado no mount
 * de cada página protegida (jogos, roleta). */
export function requireSession(): ArcadeSession | null {
  const session = getSession();
  if (!session) {
    window.location.href = "/";
    return null;
  }
  return session;
}
