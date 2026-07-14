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
  /** Sessão de demonstração (botão demo) — pula o login real e faz a roleta
   * simular o giro, sem tocar no servidor. Só pra testar/mostrar o fluxo. */
  demo?: boolean;
}
