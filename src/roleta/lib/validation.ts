/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Valida um número de CNPJ baseado no cálculo dos dígitos verificadores (DVs).
 * @param cnpj CNPJ a ser validado (com ou sem máscara)
 */
export function validarCNPJ(cnpj: string): boolean {
  if (!cnpj) return false;

  // Remover caracteres não numéricos
  const limpo = cnpj.replace(/\D/g, "");

  // Deve ter exatamente 14 dígitos
  if (limpo.length !== 14) return false;

  // Eliminar CNPJs conhecidos que são inválidos mas passam na matemática básica
  if (/^(\d)\1{13}$/.test(limpo)) return false;

  // Validar primeiro dígito verificador
  let tamanho = limpo.length - 2;
  let numeros = limpo.substring(0, tamanho);
  const digitos = limpo.substring(tamanho);
  let soma = 0;
  let pos = tamanho - 7;

  for (let i = tamanho; i >= 1; i--) {
    soma += parseInt(numeros.charAt(tamanho - i)) * pos--;
    if (pos < 2) pos = 9;
  }

  let resultado = soma % 11 < 2 ? 0 : 11 - (soma % 11);
  if (resultado !== parseInt(digitos.charAt(0))) return false;

  // Validar segundo dígito verificador
  tamanho = tamanho + 1;
  numeros = limpo.substring(0, tamanho);
  soma = 0;
  pos = tamanho - 7;

  for (let i = tamanho; i >= 1; i--) {
    soma += parseInt(numeros.charAt(tamanho - i)) * pos--;
    if (pos < 2) pos = 9;
  }

  resultado = soma % 11 < 2 ? 0 : 11 - (soma % 11);
  if (resultado !== parseInt(digitos.charAt(1))) return false;

  return true;
}

/**
 * Aplica a máscara de CNPJ (00.000.000/0000-00) em uma string.
 */
export function formatarCNPJ(valor: string): string {
  const limpo = valor.replace(/\D/g, "");
  return limpo
    .replace(/^(\d{2})(\d)/, "$1.$2")
    .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d)/, ".$1/$2")
    .replace(/(\d{4})(\d)/, "$1-$2")
    .substring(0, 18); // Limita ao tamanho máximo com máscara
}

/**
 * Aplica a máscara de WhatsApp/Telefone ((00) 00000-0000 ou (00) 0000-0000).
 */
export function formatarWhatsApp(valor: string): string {
  const limpo = valor.replace(/\D/g, "");
  
  if (limpo.length <= 10) {
    return limpo
      .replace(/^(\d{2})(\d)/g, "($1) $2")
      .replace(/(\d{4})(\d)/g, "$1-$2")
      .substring(0, 14);
  } else {
    return limpo
      .replace(/^(\d{2})(\d)/g, "($1) $2")
      .replace(/(\d{5})(\d)/g, "$1-$2")
      .substring(0, 15);
  }
}

/**
 * Valida se o formato do WhatsApp é plausível (DDD + número com 8 ou 9 dígitos).
 * O número limpo deve ter de 10 a 11 dígitos numéricos.
 */
export function validarWhatsApp(telefone: string): boolean {
  if (!telefone) return false;
  const limpo = telefone.replace(/\D/g, "");
  // Telefone celular no Brasil tem DDD (2 dígitos) + 9 dígitos (celular) ou 8 dígitos (fixo/antigo). Total: 10 ou 11 dígitos.
  return limpo.length === 10 || limpo.length === 11;
}
