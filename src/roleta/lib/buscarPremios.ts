import { Prize } from "../types";

export async function buscarPremios(): Promise<{ ok: boolean; prizes: Prize[] }> {
  try {
    const response = await fetch("/api/prizes");
    const result = await response.json().catch(() => ({}));

    if (!response.ok || !result.ok) {
      return { ok: false, prizes: [] };
    }

    return { ok: true, prizes: result.prizes || [] };
  } catch (err) {
    console.error("Erro ao buscar prêmios:", err);
    return { ok: false, prizes: [] };
  }
}
