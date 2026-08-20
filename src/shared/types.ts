export interface GoogleProfile {
  idToken: string;
  name: string | null;
  email: string | null;
  picture: string | null;
}

/**
 * Partida em andamento no tablet.
 *
 * No fluxo "joga primeiro, cadastra depois" o tablet não sabe quem está
 * jogando — e não precisa saber. Ele carrega só o `id` da partida, que vira
 * a chave de idempotência do envio e viaja no QR code pro celular do
 * visitante fazer o cadastro.
 */
export interface PartidaAtiva {
  id: string;
  /** Rota secreta da equipe (/menu5398): joga igual, mas nada é gravado. */
  equipe?: boolean;
}

/**
 * Dados capturados no cadastro pós-jogo, no celular do visitante.
 *
 * `empresa` e `cargo` são sempre digitados: o Google não fornece nenhum dos
 * dois, e numa feira de construção pesada são eles que separam curioso de
 * comprador.
 */
export interface LeadData {
  nome: string;
  empresa: string;
  cargo: string;
  celular: string;
  email: string | null;
  picture: string | null;
  /** Presente quando veio do login Google; o servidor reconfere. */
  idToken: string | null;
}
