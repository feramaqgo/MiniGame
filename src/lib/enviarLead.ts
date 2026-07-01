/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { FormFields, TrackingFields } from "../types";

/**
 * Envia o lead para a function serverless /api/lead, que repassa para o
 * webhook do Supabase CRM (token fica apenas no servidor, nunca no front-end).
 */
export async function enviarLead(
  dados: FormFields,
  tracking: TrackingFields
): Promise<{ ok: boolean; message?: string }> {
  try {
    const response = await fetch("/api/lead", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ dados, tracking }),
    });

    const result = await response.json().catch(() => ({}));

    if (!response.ok || !result.ok) {
      return {
        ok: false,
        message: result.message || "Erro ao enviar seus dados. Tente novamente.",
      };
    }

    return { ok: true };
  } catch (err) {
    console.error("Erro ao enviar lead:", err);
    return {
      ok: false,
      message: "Não foi possível conectar ao servidor. Verifique sua conexão.",
    };
  }
}
