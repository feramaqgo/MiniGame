// Endpoint público (sem PII) — lista os prêmios com estoque disponível,
// usado pelo front-end pra desenhar as fatias da roleta.
export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.status(405).json({ ok: false, message: "Method not allowed" });
    return;
  }

  try {
    const query = new URLSearchParams({
      select: "id,name,remaining_stock,sort_order",
      active: "eq.true",
      remaining_stock: "gt.0",
      order: "sort_order.asc,id.asc",
    });

    const response = await fetch(`${process.env.SUPABASE_URL}/rest/v1/roleta_prizes?${query}`, {
      headers: {
        apikey: process.env.SUPABASE_SERVICE_ROLE_KEY,
        Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
      },
    });

    if (!response.ok) {
      const text = await response.text();
      console.error("Erro ao buscar prêmios:", response.status, text);
      res.status(502).json({ ok: false, message: "Erro ao buscar prêmios" });
      return;
    }

    const prizes = await response.json();
    res.status(200).json({ ok: true, prizes });
  } catch (err) {
    console.error("Erro de conexão ao buscar prêmios:", err);
    res.status(500).json({ ok: false, message: "Erro de conexão com o servidor" });
  }
}
