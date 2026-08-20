// Registra a partida vencida no TABLET — antes de saber quem é a pessoa.
//
// No fluxo "joga primeiro, cadastra depois", este é o primeiro contato com o
// servidor: o visitante venceu, mas ainda não se identificou. A pontuação é
// gravada sem dono e só ganha nome quando o cadastro acontece no celular
// (ver api/resgatar.js). Enquanto isso ela fica fora do placar público.
//
// `partidaId` é a chave de idempotência: a fila offline reenvia até obter
// resposta, então a mesma partida pode chegar duas vezes e não pode virar
// duas linhas.

import { REGRAS, calcularPontos } from "./_pontuacao.js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ ok: false, message: "Method not allowed" });
    return;
  }

  const { partidaId, senha, jogo, tempoMs, jogadas, tentativas, margem, passos, passosMinimos, toques } =
    req.body || {};

  // Só o tablet do estande registra partidas (a senha da equipe o desbloqueia).
  if (!process.env.ADMIN_PASSPHRASE || senha !== process.env.ADMIN_PASSPHRASE) {
    res.status(401).json({ ok: false, message: "Tablet não autorizado" });
    return;
  }

  const tempo = Number.parseInt(tempoMs, 10);
  const ehUuid = typeof partidaId === "string" && /^[0-9a-f-]{16,}$/i.test(partidaId);

  if (!ehUuid || !REGRAS[jogo]) {
    res.status(400).json({ ok: false, message: "Dados inválidos" });
    return;
  }
  // Tempo precisa ser plausível: nada de 0 ms nem de partidas de 1 hora.
  if (!Number.isInteger(tempo) || tempo < 500 || tempo > 30 * 60 * 1000) {
    res.status(400).json({ ok: false, message: "Tempo inválido" });
    return;
  }

  const pontos = calcularPontos(jogo, {
    tempoMs: tempo,
    jogadas,
    tentativas,
    margem,
    passos,
    passosMinimos,
    toques,
  });

  try {
    const r = await fetch(`${process.env.SUPABASE_URL}/rest/v1/rpc/registrar_partida`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: process.env.SUPABASE_SERVICE_ROLE_KEY,
        Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
      },
      body: JSON.stringify({
        p_partida_id: partidaId,
        p_jogo: jogo,
        p_pontos: pontos,
        p_tempo_ms: tempo,
        p_jogadas: Number.isInteger(jogadas) ? jogadas : null,
        p_tentativas: Number.isInteger(tentativas) ? tentativas : 1,
      }),
    });

    if (!r.ok) throw new Error(await r.text());

    const linha = (await r.json())?.[0];
    res.status(200).json({
      ok: true,
      pontos,
      jaExistia: !!linha?.ja_existia,
    });
  } catch (err) {
    console.error("Erro ao registrar partida:", err);
    // 5xx de propósito: a fila do tablet mantém o item e tenta de novo, em
    // vez de descartar uma partida que o visitante já venceu.
    res.status(502).json({ ok: false, message: "Erro ao registrar partida" });
  }
}
