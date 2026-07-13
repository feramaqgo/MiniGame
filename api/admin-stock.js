// Endpoint protegido por senha compartilhada — painel da equipe do estande.
// Nunca devolve PII de participante, só nomes/contagens de prêmio.
export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.status(405).json({ ok: false, message: "Method not allowed" });
    return;
  }

  const chaveEnviada = req.headers["x-admin-key"] || req.query?.key;

  if (!chaveEnviada || chaveEnviada !== process.env.ADMIN_PASSPHRASE) {
    res.status(401).json({ ok: false, message: "Não autorizado" });
    return;
  }

  try {
    const query = new URLSearchParams({
      select: "id,name,initial_stock,remaining_stock,active,sort_order",
      order: "sort_order.asc",
    });

    const response = await fetch(`${process.env.SUPABASE_URL}/rest/v1/roleta_prizes?${query}`, {
      headers: {
        apikey: process.env.SUPABASE_SERVICE_ROLE_KEY,
        Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
      },
    });

    if (!response.ok) {
      const text = await response.text();
      console.error("Erro ao buscar estoque (admin):", response.status, text);
      res.status(502).json({ ok: false, message: "Erro ao buscar estoque" });
      return;
    }

    const prizes = await response.json();
    res.status(200).json({ ok: true, prizes });
  } catch (err) {
    console.error("Erro de conexão ao buscar estoque (admin):", err);
    res.status(500).json({ ok: false, message: "Erro de conexão com o servidor" });
  }
}
