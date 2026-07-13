// Vercel Serverless Function — mantém a service_role key fora do bundle do front-end.
export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ ok: false, message: "Method not allowed" });
    return;
  }

  const { nome, celular, cnpj, tracking } = req.body || {};

  const celularDigitos = (celular || "").replace(/\D/g, "");
  const cnpjDigitos = (cnpj || "").replace(/\D/g, "");

  if (
    !nome ||
    !nome.trim() ||
    (celularDigitos.length !== 10 && celularDigitos.length !== 11) ||
    cnpjDigitos.length !== 14
  ) {
    res.status(400).json({ ok: false, message: "Dados inválidos" });
    return;
  }

  let rpcResponse;
  try {
    rpcResponse = await fetch(`${process.env.SUPABASE_URL}/rest/v1/rpc/girar_roleta`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: process.env.SUPABASE_SERVICE_ROLE_KEY,
        Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
      },
      body: JSON.stringify({ p_nome: nome, p_celular: celular, p_cnpj: cnpj }),
    });
  } catch (err) {
    console.error("Erro de conexão ao girar a roleta:", err);
    res.status(500).json({ ok: false, message: "Erro de conexão com o servidor" });
    return;
  }

  if (!rpcResponse.ok) {
    const errorBody = await rpcResponse.json().catch(() => ({}));
    const message = errorBody?.message || "";

    if (message === "JA_PARTICIPOU") {
      res.status(409).json({
        ok: false,
        reason: "ja_participou",
        message: "Você já participou dessa promoção.",
      });
      return;
    }

    if (message === "ESGOTADO") {
      res.status(409).json({
        ok: false,
        reason: "esgotado",
        message: "Os prêmios acabaram.",
      });
      return;
    }

    console.error("Erro ao girar a roleta:", rpcResponse.status, errorBody);
    res.status(502).json({ ok: false, reason: "erro", message: "Erro ao girar a roleta" });
    return;
  }

  const rows = await rpcResponse.json();
  const resultado = rows?.[0];

  if (!resultado) {
    console.error("Resposta inesperada do girar_roleta:", rows);
    res.status(502).json({ ok: false, reason: "erro", message: "Erro ao girar a roleta" });
    return;
  }

  const { participant_id: participantId, prize_id: prizeId, prize_name: prizeName } = resultado;

  // Insert espelho best-effort no CRM — nunca falha a resposta ao visitante.
  try {
    const leadPayload = {
      webhook_id: participantId,
      name: nome,
      phone: celular,
      cnpj_b2b: cnpj,
      lead_source: "feramaq-roleta",
      lead_tag: "LEAD-EVENTO",
      campanha: "Roleta Concreteshow",
      lead_details: {
        id: participantId,
        timestamp: new Date().toISOString(),
        event: "Roleta Concreteshow",
        premio_ganho: prizeName,
        dados_do_lead: { nome, celular, cnpj },
        utm: {
          utm_source: tracking?.utm_source ?? null,
          utm_medium: tracking?.utm_medium ?? null,
          utm_campaign: tracking?.utm_campaign ?? null,
          utm_content: tracking?.utm_content ?? null,
          utm_term: tracking?.utm_term ?? null,
        },
      },
    };

    const crmResponse = await fetch(`${process.env.SUPABASE_URL}/rest/v1/webhook_leads_summary`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: process.env.SUPABASE_SERVICE_ROLE_KEY,
        Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
        Prefer: "return=minimal",
      },
      body: JSON.stringify(leadPayload),
    });

    if (!crmResponse.ok) {
      const text = await crmResponse.text();
      console.error("Insert espelho no CRM falhou:", crmResponse.status, text);
    }
  } catch (err) {
    console.error("Erro ao espelhar lead no CRM:", err);
  }

  res.status(200).json({ ok: true, prize: { id: prizeId, name: prizeName } });
}
