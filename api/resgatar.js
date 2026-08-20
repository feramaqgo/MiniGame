// Cadastro pós-jogo + giro da roleta — chamado pelo CELULAR do visitante.
//
// É aqui que a participação anônima vira lead. A pessoa jogou no tablet,
// venceu, escaneou o QR e agora se identifica; o brinde é a recompensa do
// cadastro, então o sorteio acontece nesta mesma chamada.
//
// Dois caminhos chegam aqui:
//   * online  — `prizeId` vem nulo e o servidor sorteia;
//   * offline — o navegador já sorteou (sem rede, pra pessoa ver o brinde na
//     hora) e o item está subindo pela fila, talvez horas depois. `prizeId`
//     vem preenchido e aqui só registramos a baixa.

/** Valida o ID token do Google direto com o Google, sem lib de criptografia. */
async function verificarTokenGoogle(idToken) {
  try {
    const response = await fetch(
      `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(idToken)}`
    );
    if (!response.ok) return null;

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
  } catch (err) {
    console.error("Falha ao verificar token do Google:", err);
    return null;
  }
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ ok: false, message: "Method not allowed" });
    return;
  }

  const { partidaId, lead, prizeId, tracking } = req.body || {};
  const { nome, empresa, cargo, celular, email, idToken } = lead || {};

  const celularDigitos = (celular || "").replace(/\D/g, "");
  const ehUuid = typeof partidaId === "string" && /^[0-9a-f-]{16,}$/i.test(partidaId);

  if (
    !ehUuid ||
    !nome?.trim() ||
    !empresa?.trim() ||
    !cargo?.trim() ||
    (celularDigitos.length !== 10 && celularDigitos.length !== 11)
  ) {
    res.status(400).json({ ok: false, message: "Dados inválidos" });
    return;
  }

  // O login do Google é o caminho preferido porque traz nome e e-mail
  // conferidos. Mas a verificação falhando NÃO derruba a participação: o caso
  // mais comum é justamente um resgate offline sincronizando depois, com o ID
  // token já expirado (valem ~1h). Aí o lead entra como não verificado —
  // perder o lead seria muito pior do que registrá-lo com confiança menor.
  const google = idToken ? await verificarTokenGoogle(idToken) : null;

  const headers = {
    "Content-Type": "application/json",
    apikey: process.env.SUPABASE_SERVICE_ROLE_KEY,
    Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
  };

  const nomeFinal = google?.name || nome.trim();
  const emailFinal = google?.email || email?.trim() || null;

  let rpcResponse;
  try {
    rpcResponse = await fetch(`${process.env.SUPABASE_URL}/rest/v1/rpc/resgatar_partida`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        p_partida_id: partidaId,
        p_nome: nomeFinal,
        p_empresa: empresa.trim(),
        p_cargo: cargo.trim(),
        p_celular: celular,
        p_email: emailFinal,
        p_google_sub: google?.sub || null,
        p_google_picture: google?.picture || null,
        p_google_verified: !!google,
        p_prize_id: prizeId || null,
      }),
    });
  } catch (err) {
    console.error("Erro de conexão ao resgatar:", err);
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
        message: "Esse celular ou conta já retirou um brinde.",
      });
      return;
    }

    if (message === "ESGOTADO") {
      res.status(409).json({ ok: false, reason: "esgotado", message: "Os brindes acabaram." });
      return;
    }

    if (message === "PARTIDA_NAO_ENCONTRADA") {
      // 404: recusa definitiva, a fila descarta em vez de insistir pra sempre.
      res.status(404).json({
        ok: false,
        reason: "partida_invalida",
        message: "Partida não encontrada. Jogue novamente no tablet.",
      });
      return;
    }

    // Inclui PREMIO_INVALIDO (brinde sorteado offline que sumiu do catálogo).
    // 5xx de propósito: a fila mantém o item e continua tentando, em vez de
    // descartar um lead que já rendeu brinde entregue em mãos.
    console.error("Erro ao resgatar partida:", rpcResponse.status, errorBody);
    res.status(502).json({ ok: false, reason: "erro", message: "Erro ao resgatar o brinde" });
    return;
  }

  const resultado = (await rpcResponse.json())?.[0];
  if (!resultado) {
    console.error("Resposta inesperada do resgatar_partida");
    res.status(502).json({ ok: false, reason: "erro", message: "Erro ao resgatar o brinde" });
    return;
  }

  const {
    participant_id: participantId,
    codigo,
    prize_id: prizeIdFinal,
    prize_name: prizeName,
    ja_resgatado: jaResgatado,
  } = resultado;

  // Reenvio da fila de algo que já subiu: devolve o mesmo brinde e não
  // duplica o lead no CRM.
  if (jaResgatado) {
    res.status(200).json({
      ok: true,
      codigo,
      prize: { id: prizeIdFinal, name: prizeName },
      jaResgatado: true,
    });
    return;
  }

  // Espelho best-effort no CRM — nunca falha a resposta ao visitante.
  try {
    const leadPayload = {
      webhook_id: participantId,
      name: nomeFinal,
      email: emailFinal,
      phone: celular,
      // Campo livre que o CRM não sobrescreve — `lead_tag` é reescrito pelo
      // trigger assign_lead_round_robin (LEAD-MKT/LEAD-REPETIDO).
      lead_source: "feramaq-minigame",
      // `campanha` roteia o pipeline no trigger: "feiras" = funil Concrete Show.
      campanha: "feiras",
      lead_details: {
        id: participantId,
        timestamp: new Date().toISOString(),
        event: "MiniGame Concreteshow",
        tag: "MiniGame",
        codigo_participacao: codigo,
        premio_ganho: prizeName,
        dados_do_lead: {
          nome: nomeFinal,
          empresa: empresa.trim(),
          cargo: cargo.trim(),
          email: emailFinal,
          celular,
          google_sub: google?.sub || null,
          identidade_verificada: !!google,
          sorteado_offline: !!prizeId,
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
      headers: { ...headers, Prefer: "return=minimal" },
      body: JSON.stringify(leadPayload),
    });

    if (!crmResponse.ok) {
      console.error("Insert espelho no CRM falhou:", crmResponse.status, await crmResponse.text());
    }
  } catch (err) {
    console.error("Erro ao espelhar lead no CRM:", err);
  }

  res.status(200).json({
    ok: true,
    codigo,
    prize: { id: prizeIdFinal, name: prizeName },
  });
}
