// Vercel Serverless Function — mantém a service_role key fora do bundle do front-end.

// Valida o ID token do Google Sign-In direto com o Google (sem lib de
// criptografia própria) e confirma que foi emitido pro nosso Client ID.
async function verificarTokenGoogle(idToken) {
  const response = await fetch(
    `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(idToken)}`
  );

  if (!response.ok) {
    return null;
  }

  const claims = await response.json();

  if (claims.aud !== process.env.GOOGLE_CLIENT_ID) return null;
  if (claims.email_verified !== "true" && claims.email_verified !== true) return null;
  if (!claims.sub) return null;

  return {
    sub: claims.sub,
    email: claims.email || null,
    name: claims.name || null,
    picture: claims.picture || null,
  };
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ ok: false, message: "Method not allowed" });
    return;
  }

  const { idToken, celular, tracking } = req.body || {};

  const celularDigitos = (celular || "").replace(/\D/g, "");

  if (!idToken || (celularDigitos.length !== 10 && celularDigitos.length !== 11)) {
    res.status(400).json({ ok: false, message: "Dados inválidos" });
    return;
  }

  const google = await verificarTokenGoogle(idToken);
  if (!google) {
    res.status(401).json({ ok: false, message: "Login com Google inválido. Tente novamente." });
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
      body: JSON.stringify({
        p_google_sub: google.sub,
        p_google_email: google.email,
        p_google_name: google.name,
        p_google_picture: google.picture,
        p_celular: celular,
      }),
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
      name: google.name,
      phone: celular,
      lead_source: "feramaq-roleta",
      lead_tag: "LEAD-EVENTO",
      campanha: "Roleta Concreteshow",
      lead_details: {
        id: participantId,
        timestamp: new Date().toISOString(),
        event: "Roleta Concreteshow",
        premio_ganho: prizeName,
        dados_do_lead: {
          nome: google.name,
          email: google.email,
          celular,
          google_sub: google.sub,
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
