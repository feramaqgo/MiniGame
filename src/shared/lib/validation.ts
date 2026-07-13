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
  return limpo.length === 10 || limpo.length === 11;
}
