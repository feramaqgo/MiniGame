// Campeão do dia — tela de encerramento acionada pela equipe do estande.
// Protegido pela senha da equipe: além do nome de exibição, devolve o nome
// completo, código e celular (para equipe apenas), pra chamar a pessoa certa.
// Não devolve e-mail; se precisar do contato longo, está no Supabase.

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ ok: false, message: "Method not allowed" });
    return;
  }

  const { senha } = req.body || {};

  if (!process.env.ADMIN_PASSPHRASE || senha !== process.env.ADMIN_PASSPHRASE) {
    res.status(401).json({ ok: false, message: "Não autorizado" });
    return;
  }

  const headers = {
    "Content-Type": "application/json",
    apikey: process.env.SUPABASE_SERVICE_ROLE_KEY,
    Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
  };

  try {
    const spDate = new Date(new Date().toLocaleString("en-US", { timeZone: "America/Sao_Paulo" }));
    spDate.setHours(0, 0, 0, 0);
    const startOfDay = spDate.toISOString();

    const rScores = await fetch(
      `${process.env.SUPABASE_URL}/rest/v1/arcade_scores?created_at=gte.${startOfDay}&select=nome_exibicao,pontos,jogo&order=pontos.desc,created_at.asc`,
      { headers }
    );
    if (!rScores.ok) throw new Error(await rScores.text());
    
    const rawScores = await rScores.json();
    const highestScores = new Map();
    for (const score of (rawScores || [])) {
      if (!highestScores.has(score.nome_exibicao)) {
        highestScores.set(score.nome_exibicao, score);
      }
    }
    
    const ranking = Array.from(highestScores.values())
      .sort((a, b) => b.pontos - a.pontos)
      .slice(0, 5)
      .map((r, i) => ({ ...r, posicao: i + 1 }));
    const lider = ranking?.[0];

    if (!lider) {
      res.setHeader("Cache-Control", "no-store");
      res.status(200).json({ ok: true, campeao: null, ranking: [], total: 0 });
      return;
    }

    // Nome completo e código do líder, pra anunciar sem ambiguidade.
    const rr = await fetch(
      `${process.env.SUPABASE_URL}/rest/v1/arcade_scores` +
        `?nome_exibicao=eq.${encodeURIComponent(lider.nome_exibicao)}` +
        `&pontos=eq.${lider.pontos}&select=codigo,participant_id&limit=1`,
      { headers }
    );
    const registro = rr.ok ? (await rr.json())?.[0] : null;

    let nomeCompleto = lider.nome_exibicao;
    let celularCampeao = null;
    if (registro?.participant_id) {
      const rp = await fetch(
        `${process.env.SUPABASE_URL}/rest/v1/roleta_participants` +
          `?id=eq.${registro.participant_id}&select=google_name,celular`,
        { headers }
      );
      if (rp.ok) {
        const pData = (await rp.json())?.[0];
        nomeCompleto = pData?.google_name || nomeCompleto;
        celularCampeao = pData?.celular || null;
      }
    }

    // Busca os telefones dos demais participantes do ranking
    const rankingEnriquecido = await Promise.all(
      (ranking || []).map(async (l) => {
        let celular = null;
        try {
          const rScore = await fetch(
            `${process.env.SUPABASE_URL}/rest/v1/arcade_scores` +
              `?nome_exibicao=eq.${encodeURIComponent(l.nome_exibicao)}` +
              `&pontos=eq.${l.pontos}&select=participant_id&limit=1`,
            { headers }
          );
          const scoreData = rScore.ok ? (await rScore.json())?.[0] : null;
          if (scoreData?.participant_id) {
            const rPart = await fetch(
              `${process.env.SUPABASE_URL}/rest/v1/roleta_participants` +
                `?id=eq.${scoreData.participant_id}&select=celular`,
              { headers }
            );
            if (rPart.ok) {
              const partData = (await rPart.json())?.[0];
              celular = partData?.celular || null;
            }
          }
        } catch (e) {
          console.error("Erro buscando celular de", l.nome_exibicao, e);
        }
        return {
          posicao: Number(l.posicao),
          nome: l.nome_exibicao,
          pontos: l.pontos,
          jogo: l.jogo,
          celular: celular,
        };
      })
    );

    // Quantas pessoas pontuaram no total (número pra anunciar no palco) APENAS HOJE.

    const rc = await fetch(
      `${process.env.SUPABASE_URL}/rest/v1/arcade_scores?select=participant_id&created_at=gte.${startOfDay}`,
      { headers: { ...headers, Prefer: "count=exact", Range: "0-0" } }
    );
    const contentRange = rc.headers.get("content-range") || "";
    const total = Number.parseInt(contentRange.split("/")[1], 10) || 0;

    res.setHeader("Cache-Control", "no-store");
    res.status(200).json({
      ok: true,
      campeao: {
        nome: nomeCompleto,
        nomeExibicao: lider.nome_exibicao,
        codigo: registro?.codigo ?? null,
        pontos: lider.pontos,
        jogo: lider.jogo,
        celular: celularCampeao,
      },
      ranking: rankingEnriquecido,
      total,
    });
  } catch (err) {
    console.error("Erro ao buscar campeão:", err);
    res.status(502).json({ ok: false, message: "Erro ao buscar campeão" });
  }
}
