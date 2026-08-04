// Campeão do dia — tela de encerramento acionada pela equipe do estande.
// Protegido pela senha da equipe: além do nome de exibição, devolve o nome
// completo e o código, pra chamar a pessoa certa na hora de premiar.
// Não devolve e-mail nem celular; se precisar do contato, está no Supabase.

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
    // Melhor pontuação de cada participante, do maior pro menor.
    const r = await fetch(`${process.env.SUPABASE_URL}/rest/v1/rpc/ranking_arcade`, {
      method: "POST",
      headers,
      body: JSON.stringify({ p_jogo: null, p_limite: 5 }),
    });
    if (!r.ok) throw new Error(await r.text());

    const ranking = await r.json();
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
    if (registro?.participant_id) {
      const rp = await fetch(
        `${process.env.SUPABASE_URL}/rest/v1/roleta_participants` +
          `?id=eq.${registro.participant_id}&select=google_name`,
        { headers }
      );
      if (rp.ok) nomeCompleto = (await rp.json())?.[0]?.google_name || nomeCompleto;
    }

    // Quantas pessoas pontuaram no total (número pra anunciar no palco).
    const rc = await fetch(
      `${process.env.SUPABASE_URL}/rest/v1/arcade_scores?select=participant_id`,
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
      },
      ranking: (ranking || []).map((l) => ({
        posicao: Number(l.posicao),
        nome: l.nome_exibicao,
        pontos: l.pontos,
        jogo: l.jogo,
      })),
      total,
    });
  } catch (err) {
    console.error("Erro ao buscar campeão:", err);
    res.status(502).json({ ok: false, message: "Erro ao buscar campeão" });
  }
}
