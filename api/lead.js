// Vercel Serverless Function — mantém o token do webhook fora do bundle do front-end.
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

  const payload = {
    id: crypto.randomUUID(),
    timestamp: new Date().toISOString(),
    event: "Lead LP Feramaq Copa Pênalti",
    campanha: "Upgrade_FMCT",
    dados_do_lead: {
      nome: dados.nomeCompleto,
      whatsapp: dados.whatsapp,
      empresa: dados.empresa,
      email: null,
      estado: null,
      cidade: null,
      detalhes: {
        ramo_concreto: null,
        destinacao_uso: null,
        equipamento_interesse: "FMCT 2000",
        especificacoes: {
          potencia_requerida: null,
          torque_profundidade: null,
          caminhao_proprio: null,
        },
        modelo_bomba_atual: null,
        possui_bomba: null,
        m3_bombeado_dia: null,
        prazo_aquisicao: null,
        investimento_planejado: null,
        cnpj_b2b: dados.cnpj,
        potencial: null,
      },
      score: { total: null, tier: null },
      roteamento: { vendedor: null, temperatura: null },
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
    const webhookResponse = await fetch(process.env.SUPABASE_WEBHOOK_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.SUPABASE_WEBHOOK_TOKEN}`,
      },
      body: JSON.stringify(payload),
    });

    if (!webhookResponse.ok) {
      const text = await webhookResponse.text();
      console.error("Webhook lead falhou:", webhookResponse.status, text);
      res.status(502).json({ ok: false, message: "Erro ao registrar lead" });
      return;
    }

    res.status(200).json({ ok: true });
  } catch (err) {
    console.error("Erro ao chamar webhook de lead:", err);
    res.status(500).json({ ok: false, message: "Erro de conexão com o servidor de leads" });
  }
}
