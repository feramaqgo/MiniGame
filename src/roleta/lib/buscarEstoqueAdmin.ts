export interface PrizeAdmin {
  id: string;
  name: string;
  initial_stock: number;
  remaining_stock: number;
  active: boolean;
  sort_order: number;
}

export async function buscarEstoqueAdmin(
  chave: string
): Promise<{ ok: boolean; prizes: PrizeAdmin[]; unauthorized?: boolean }> {
  try {
    const response = await fetch("/api/admin-stock", {
      headers: { "x-admin-key": chave },
    });

    if (response.status === 401) {
      return { ok: false, prizes: [], unauthorized: true };
    }

    const result = await response.json().catch(() => ({}));

    if (!response.ok || !result.ok) {
      return { ok: false, prizes: [] };
    }

    return { ok: true, prizes: result.prizes || [] };
  } catch (err) {
    console.error("Erro ao buscar estoque:", err);
    return { ok: false, prizes: [] };
  }
}
