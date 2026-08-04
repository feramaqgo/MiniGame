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
  /** Código único de participação (sequencial, gerado no cadastro). No
   * celular é o número que a pessoa digita no tablet; no tablet é o código
   * validado que autoriza o giro da roleta. */
  codigo?: number | null;
  /** A pessoa já girou a roleta (código de uso único já consumido). */
  jaGirou?: boolean;
  /** Sessão criada no tablet do estande (código validado). Jogos rodam
   * normalmente; a roleta gira por código e volta pro /tablet no fim. */
  tablet?: boolean;
  /** Sessão de demonstração (botão demo / ?teste=1) — pula o login real e
   * faz a roleta simular o giro, sem tocar no servidor. */
  demo?: boolean;
}
