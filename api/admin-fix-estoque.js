export default async function handler(req, res) {
  if (req.query.senha !== process.env.ADMIN_PASSPHRASE) {
    res.status(401).json({ error: "Não autorizado" });
    return;
  }

  const headers = {
    apikey: process.env.SUPABASE_SERVICE_ROLE_KEY,
    Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
    "Content-Type": "application/json",
  };

  try {
    const r = await fetch(`${process.env.SUPABASE_URL}/rest/v1/prizes`, {
      method: "GET",
      headers,
    });
    
    if (!r.ok) throw new Error(await r.text());
    
    const prizes = await r.json();
    const results = [];
    
    for (const p of prizes) {
      const novoEstoque = Math.max(0, p.remaining_stock - 20);
      
      const patchReq = await fetch(`${process.env.SUPABASE_URL}/rest/v1/prizes?id=eq.${p.id}`, {
        method: "PATCH",
        headers,
        body: JSON.stringify({ remaining_stock: novoEstoque })
      });
      
      results.push({ id: p.id, old: p.remaining_stock, new: novoEstoque, ok: patchReq.ok });
    }
    
    res.status(200).json({ success: true, results });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
