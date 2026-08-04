// Registra a pontuação de um visitante ao vencer um jogo.
//
// A pontuação é calculada AQUI, no servidor, a partir do tempo e das jogadas
// — o cliente nunca envia "pontos". Assim o placar não depende de confiar na
// tela do tablet.
//
// Escala única pros quatro jogos: 1000 por vencer + até 1000 de desempenho.
// Cada jogo declara o "custo" de uma partida perfeita e o de uma partida
// lenta; a nota é a posição do visitante entre esses dois extremos. Isso
// deixa o ranking geral justo, mesmo os jogos sendo bem diferentes.

const REGRAS = {
  // custo = segundos até vencer (chute é um único chute certeiro)
  chute: { perfeito: 3, ruim: 20, custo: (s) => s },
  // 6 pares; jogadas acima do mínimo (6) pesam 3s cada
  memoria: { perfeito: 25, ruim: 120, custo: (s, j) => s + Math.max(0, j - 6) * 3 },
  // 6 porções de concreto; só o tempo conta
  cobrinha: { perfeito: 25, ruim: 120, custo: (s) => s },
  // vitória mínima em 3 jogadas; cada jogada extra pesa 4s
  velha: { perfeito: 10, ruim: 60, custo: (s, j) => s + Math.max(0, j - 3) * 4 },
};

function calcularPontos(jogo, tempoMs, jogadas) {
  const regra = REGRAS[jogo];
  if (!regra) return null;

  const segundos = tempoMs / 1000;
  const custo = regra.custo(segundos, jogadas || 0);

  // 1 = partida perfeita, 0 = partida lenta (ou pior).
  const bruto = (regra.ruim - custo) / (regra.ruim - regra.perfeito);
  const desempenho = Math.max(0, Math.min(1, bruto));

  return 1000 + Math.round(desempenho * 1000);
}

/** "Vinicius Ferreira" -> "Vinicius F." — o placar fica numa tela pública. */
function abreviarNome(nome) {
  if (!nome) return "Visitante";
  const partes = nome.trim().split(/\s+/);
  if (partes.length === 1) return partes[0];
  return `${partes[0]} ${partes[partes.length - 1][0].toUpperCase()}.`;
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ ok: false, message: "Method not allowed" });
    return;
  }

  const { codigo, senha, jogo, tempoMs, jogadas } = req.body || {};

  if (!process.env.ADMIN_PASSPHRASE || senha !== process.env.ADMIN_PASSPHRASE) {
    res.status(401).json({ ok: false, message: "Tablet não autorizado" });
    return;
  }

  const codigoNum = Number.parseInt(codigo, 10);
  const tempo = Number.parseInt(tempoMs, 10);

  if (!Number.isInteger(codigoNum) || codigoNum <= 0 || !REGRAS[jogo]) {
    res.status(400).json({ ok: false, message: "Dados inválidos" });
    return;
  }
  // Tempo precisa ser plausível: nada de 0 ms nem de partidas de 1 hora.
  if (!Number.isInteger(tempo) || tempo < 500 || tempo > 30 * 60 * 1000) {
    res.status(400).json({ ok: false, message: "Tempo inválido" });
    return;
  }

  const headers = {
    "Content-Type": "application/json",
    apikey: process.env.SUPABASE_SERVICE_ROLE_KEY,
    Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
  };

  // Busca o participante pelo código (nome real vem do banco, não do cliente).
  let participante;
  try {
    const r = await fetch(
      `${process.env.SUPABASE_URL}/rest/v1/roleta_participants` +
        `?codigo=eq.${codigoNum}&select=id,google_name`,
      { headers }
    );
    if (!r.ok) throw new Error(`status ${r.status}`);
    participante = (await r.json())?.[0];
  } catch (err) {
    console.error("Erro ao buscar participante pro score:", err);
    res.status(502).json({ ok: false, message: "Erro ao registrar pontuação" });
    return;
  }

  if (!participante) {
    res.status(404).json({ ok: false, message: "Código não encontrado" });
    return;
  }

  const pontos = calcularPontos(jogo, tempo, jogadas);

  try {
    const r = await fetch(`${process.env.SUPABASE_URL}/rest/v1/arcade_scores`, {
      method: "POST",
      headers: { ...headers, Prefer: "return=minimal" },
      body: JSON.stringify({
        participant_id: participante.id,
        codigo: codigoNum,
        nome_exibicao: abreviarNome(participante.google_name),
        jogo,
        pontos,
        tempo_ms: tempo,
        jogadas: Number.isInteger(jogadas) ? jogadas : null,
      }),
    });
    if (!r.ok) throw new Error(await r.text());
  } catch (err) {
    console.error("Erro ao gravar score:", err);
    res.status(502).json({ ok: false, message: "Erro ao registrar pontuação" });
    return;
  }

  res.status(200).json({ ok: true, pontos });
}
