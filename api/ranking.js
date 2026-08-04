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
    const r = await fetch(`${process.env.SUPABASE_URL}/rest/v1/rpc/ranking_arcade`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: process.env.SUPABASE_SERVICE_ROLE_KEY,
        Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
      },
      body: JSON.stringify({ p_jogo: jogo || null, p_limite: limiteNum }),
    });

    if (!r.ok) throw new Error(await r.text());

    const linhas = await r.json();

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
