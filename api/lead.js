// Vercel Serverless Function — mantém a service_role key fora do bundle do front-end.
export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ ok: false, message: "Method not allowed" });
    return;
  }

  const { dados, tracking } = req.body || {};

  if (!dados || !dados.nomeCompleto || !dados.whatsapp || !dados.empresa || !dados.cnpj) {
    res.status(400).json({ ok: false, message: "Dados do lead incompletos" });
    return;
  }

  const webhookId = crypto.randomUUID();

  const row = {
    webhook_id: webhookId,
    name: dados.nomeCompleto,
    phone: dados.whatsapp,
    company_name: dados.empresa,
    company: dados.empresa,
    cnpj_b2b: dados.cnpj,
    equipamento_interesse: "FMCT 2000",
    lead_source: "feramaq-minigame",
    lead_tag: "LEAD-MKT",
    campanha: "MiniGame FMCT",
    lead_details: {
      id: webhookId,
      timestamp: new Date().toISOString(),
      event: "Lead LP Feramaq Pênalti",
      campanha: "MiniGame FMCT",
      dados_do_lead: {
        nome: dados.nomeCompleto,
        whatsapp: dados.whatsapp,
        empresa: dados.empresa,
        cnpj_b2b: dados.cnpj,
      },
      utm: {
        utm_source: tracking?.utm_source ?? null,
        utm_medium: tracking?.utm_medium ?? null,
        utm_campaign: tracking?.utm_campaign ?? null,
        utm_content: tracking?.utm_content ?? null,
        utm_term: tracking?.utm_term ?? null,
      },
    },
  };

  try {
    const supabaseResponse = await fetch(
      `${process.env.SUPABASE_URL}/rest/v1/webhook_leads_summary`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: process.env.SUPABASE_SERVICE_ROLE_KEY,
          Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
          Prefer: "return=minimal",
        },
        body: JSON.stringify(row),
      }
    );

    if (!supabaseResponse.ok) {
      const text = await supabaseResponse.text();
      console.error("Insert lead no Supabase falhou:", supabaseResponse.status, text);
      res.status(502).json({ ok: false, message: "Erro ao registrar lead" });
      return;
    }

    res.status(200).json({ ok: true });
  } catch (err) {
    console.error("Erro ao gravar lead no Supabase:", err);
    res.status(500).json({ ok: false, message: "Erro de conexão com o servidor de leads" });
  }
}
