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
  /** Código aceito sem rede (o tablet não conseguiu validar no servidor).
   * O giro vai pela fila e o servidor confere quando a conexão voltar. */
  validadoOffline?: boolean;
  /** Sessão da equipe pela rota secreta (/menu5398): entra direto no menu
   * sem código de visitante. Os jogos funcionam igual, mas nada é gravado —
   * sem pontuação no placar e sem giro de roleta (não gasta brinde). */
  equipe?: boolean;
}
