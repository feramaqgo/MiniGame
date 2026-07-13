export interface GoogleProfile {
  idToken: string;
  name: string | null;
  email: string | null;
  picture: string | null;
}

/** Sessão do arcade, persistida em localStorage — vale pra qualquer jogo. */
export interface ArcadeSession {
  idToken: string;
  celular: string;
  name: string | null;
  email: string | null;
  picture: string | null;
}
