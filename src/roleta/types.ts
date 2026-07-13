export type Etapa =
  | "landing"
  | "formulario"
  | "girando"
  | "resultado"
  | "ja_participou"
  | "esgotado"
  | "erro";

export interface FormFields {
  nome: string;
  celular: string;
  cnpj: string;
}

export interface TrackingFields {
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  utm_content: string | null;
  utm_term: string | null;
  userAgent: string;
  url: string;
}

export interface Prize {
  id: string;
  name: string;
  remaining_stock?: number;
  sort_order?: number;
}
