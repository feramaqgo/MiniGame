// Placar público do arcade — usado na tela de escolha de jogos do tablet.
// Devolve só nome abreviado e pontos: nenhum dado de contato sai daqui.
//
// GET /api/ranking            -> ranking geral (top 10)
// GET /api/ranking?jogo=velha -> ranking daquele jogo
// GET /api/ranking?limite=5   -> muda o tamanho da lista

const JOGOS_VALIDOS = ["chute", "memoria", "cobrinha", "velha"];

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.status(405).json({ ok: false, message: "Method not allowed" });
    return;
  }

  const { jogo, limite } = req.query || {};

  if (jogo && !JOGOS_VALIDOS.includes(jogo)) {
    res.status(400).json({ ok: false, message: "Jogo inválido" });
    return;
  }

  const limiteNum = Math.min(Math.max(Number.parseInt(limite, 10) || 10, 1), 50);

  try {
    const spDate = new Date(new Date().toLocaleString("en-US", { timeZone: "America/Sao_Paulo" }));
    spDate.setHours(0, 0, 0, 0);
    const startOfDay = spDate.toISOString();

    const url = new URL(`${process.env.SUPABASE_URL}/rest/v1/arcade_scores`);
    url.searchParams.append("created_at", `gte.${startOfDay}`);
    url.searchParams.append("select", "nome_exibicao,pontos,jogo");
    url.searchParams.append("order", "pontos.desc,created_at.asc");
    if (jogo) url.searchParams.append("jogo", `eq.${jogo}`);

    const r = await fetch(url.toString(), {
      headers: {
        apikey: process.env.SUPABASE_SERVICE_ROLE_KEY,
        Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
      },
    });

    if (!r.ok) throw new Error(await r.text());

    const rawScores = await r.json();
    const highestScores = new Map();
    for (const score of (rawScores || [])) {
      if (!highestScores.has(score.nome_exibicao)) {
        highestScores.set(score.nome_exibicao, score);
      }
    }
    
    const linhas = Array.from(highestScores.values())
      .sort((a, b) => b.pontos - a.pontos)
      .slice(0, limiteNum)
      .map((r, i) => ({ ...r, posicao: i + 1 }));

    // Placar muda o tempo todo durante o evento — não deixa cachear.
    res.setHeader("Cache-Control", "no-store");
    res.status(200).json({
      ok: true,
      ranking: (linhas || []).map((l) => ({
        posicao: Number(l.posicao),
        nome: l.nome_exibicao,
        jogo: l.jogo,
        pontos: l.pontos,
      })),
    });
  } catch (err) {
    console.error("Erro ao buscar ranking:", err);
    res.status(502).json({ ok: false, message: "Erro ao buscar ranking", ranking: [] });
  }
}
