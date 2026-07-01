/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type Etapa =
  | "hero"
  | "instrucao"
  | "jogando"
  | "erro"
  | "vitoria"
  | "formulario"
  | "enviando"
  | "obrigado";

export interface FormFields {
  nomeCompleto: string;
  whatsapp: string;
  empresa: string;
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
