// Cadastro do participante (fluxo celular): valida o login Google, chama a
// RPC cadastrar_participante e devolve o código único. Idempotente — a mesma
// conta Google sempre recebe o mesmo código. Também espelha o lead no CRM
// (best-effort) já no cadastro, pra capturar o contato mesmo se a pessoa não
// chegar a girar a roleta.

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
    rpcResponse = await fetch(`${process.env.SUPABASE_URL}/rest/v1/rpc/cadastrar_participante`, {
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
    console.error("Erro de conexão no cadastro:", err);
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
        message: "Esse celular já foi usado por outra conta.",
      });
      return;
    }

    console.error("Erro ao cadastrar participante:", rpcResponse.status, errorBody);
    res.status(502).json({ ok: false, reason: "erro", message: "Erro ao cadastrar" });
    return;
  }

  const rows = await rpcResponse.json();
  const resultado = rows?.[0];

  if (!resultado || typeof resultado.codigo !== "number") {
    console.error("Resposta inesperada do cadastrar_participante:", rows);
    res.status(502).json({ ok: false, reason: "erro", message: "Erro ao cadastrar" });
    return;
  }

  const { participant_id: participantId, codigo, ja_girou: jaGirou, novo } = resultado;

  // Espelho best-effort no CRM — nunca falha a resposta ao visitante.
  // Só quando o cadastro é novo (re-login devolve o mesmo código e o lead
  // já foi espelhado na primeira vez).
  if (novo) {
    try {
      const leadPayload = {
        webhook_id: participantId,
        name: google.name,
        email: google.email,
        phone: celular,
        // Marca de origem do arcade. É o campo que o CRM NÃO sobrescreve —
        // `lead_tag` é reescrito pelo trigger assign_lead_round_robin, que
        // força LEAD-MKT/LEAD-REPETIDO, então não adianta marcar por lá.
        lead_source: "feramaq-minigame",
        // `campanha` é o que roteia o pipeline no trigger: "feiras" joga o
        // lead no funil "Concrete Show" em vez do funil padrão de vendedor.
        campanha: "feiras",
        lead_details: {
          id: participantId,
          timestamp: new Date().toISOString(),
          event: "MiniGame Concreteshow",
          tag: "MiniGame",
          codigo_participacao: codigo,
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
  }

  res.status(200).json({ ok: true, codigo, jaGirou: !!jaGirou });
}
