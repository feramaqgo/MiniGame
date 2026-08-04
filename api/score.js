// Registra a pontuação de um visitante ao vencer um jogo.
//
// A pontuação é calculada AQUI, no servidor, a partir das métricas cruas — o
// cliente nunca envia "pontos". Assim o placar não depende de confiar na tela
// do tablet.
//
// ---------------------------------------------------------------------------
// COMO O PLACAR É EQUILIBRADO
//
// Todo jogo dá 1000 por vencer + até 1000 de desempenho, dividido em três
// componentes. O que muda de jogo pra jogo é o PESO de cada componente, não a
// escala final — assim chegar perto de 2000 custa um esforço parecido nos
// quatro, mesmo eles sendo jogos muito diferentes.
//
//   TENTATIVAS — quantas partidas até vencer. É a única métrica que significa
//     a mesma coisa em todos os jogos, então é ela que segura o equilíbrio.
//     Pesa mais onde a habilidade é pouco mensurável (Chute e Velha vencem em
//     uma ou três jogadas) e menos na Memória, que quase não tem derrota.
//
//   HABILIDADE — a métrica própria do jogo, escolhida pra medir perícia e não
//     sorte. No Mangote é eficiência de rota (não o tempo: tempo puro premia
//     quem teve a comida nascendo perto). No Chute é a distância do goleiro,
//     que é o timing real. Memória e Velha usam jogadas.
//
//   RAPIDEZ — peso pequeno de propósito. Quando o tempo valia tudo, qualquer
//     pessoa ágil estourava o teto de 2000 e o ranking empatava no topo.
// ---------------------------------------------------------------------------

const REGRAS = {
  chute: {
    // Uma ação só: quem acerta de primeira e longe do goleiro tem mérito.
    pesos: { tentativas: 400, habilidade: 400, rapidez: 200 },
    // Distância entre a mira e o goleiro no momento do chute (unidades de %
    // da largura do gol). Abaixo de 5 o goleiro defende, então 5 é o piso.
    // O "ótimo" fica perto do máximo teórico (~50) de propósito: bater no
    // teto de 2000 precisa ser raro, senão o topo do ranking empata.
    habilidade: { campo: "margem", otimo: 44, pessimo: 5 },
    rapidez: { otimo: 4, pessimo: 25 },
  },
  memoria: {
    // Praticamente não tem derrota — o mérito está em errar poucos pares.
    pesos: { tentativas: 150, habilidade: 600, rapidez: 250 },
    // 6 jogadas é o mínimo teórico (nunca errar um par) — praticamente
    // impossível, então quem chega perto disso merece o topo.
    habilidade: { campo: "jogadas", otimo: 6, pessimo: 18 },
    rapidez: { otimo: 26, pessimo: 110 },
  },
  cobrinha: {
    // Eficiência de rota: passos mínimos necessários / passos realmente dados.
    // 1.0 seria a rota perfeita — impossível na prática por causa das curvas.
    pesos: { tentativas: 350, habilidade: 400, rapidez: 250 },
    habilidade: { campo: "eficiencia", otimo: 0.85, pessimo: 0.25 },
    rapidez: { otimo: 15, pessimo: 75 },
  },
  velha: {
    // Com a IA mais atenta, vencer de primeira virou o grande diferencial.
    pesos: { tentativas: 450, habilidade: 350, rapidez: 200 },
    habilidade: { campo: "jogadas", otimo: 3, pessimo: 5 },
    rapidez: { otimo: 6, pessimo: 40 },
  },
};

/** Normaliza um valor entre "ótimo" (1) e "péssimo" (0), em qualquer direção. */
function normalizar(valor, otimo, pessimo) {
  if (typeof valor !== "number" || Number.isNaN(valor)) return 0;
  const bruto = (valor - pessimo) / (otimo - pessimo);
  return Math.max(0, Math.min(1, bruto));
}

function calcularPontos(jogo, dados) {
  const regra = REGRAS[jogo];
  if (!regra) return null;

  const { pesos } = regra;

  // Tentativas: venceu de primeira leva tudo; cada partida perdida antes da
  // vitória corta 25%. A partir da 5ª tentativa esse componente zera.
  const tentativas = Math.max(1, Number.parseInt(dados.tentativas, 10) || 1);
  const fatorTentativas = Math.max(0, 1 - (tentativas - 1) * 0.25);

  // Habilidade: métrica própria do jogo.
  let valorHabilidade = dados[regra.habilidade.campo];
  if (regra.habilidade.campo === "eficiencia") {
    // Mangote manda passos crus; a eficiência é calculada aqui.
    const passos = Number(dados.passos);
    const minimos = Number(dados.passosMinimos);
    valorHabilidade = passos > 0 && minimos > 0 ? minimos / passos : 0;
  } else {
    valorHabilidade = Number(valorHabilidade);
  }
  const fatorHabilidade = normalizar(
    valorHabilidade,
    regra.habilidade.otimo,
    regra.habilidade.pessimo
  );

  const segundos = Number(dados.tempoMs) / 1000;
  const fatorRapidez = normalizar(segundos, regra.rapidez.otimo, regra.rapidez.pessimo);

  const desempenho =
    fatorTentativas * pesos.tentativas +
    fatorHabilidade * pesos.habilidade +
    fatorRapidez * pesos.rapidez;

  return 1000 + Math.round(desempenho);
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

  const { codigo, senha, jogo, tempoMs, jogadas, tentativas, margem, passos, passosMinimos } =
    req.body || {};

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

  const pontos = calcularPontos(jogo, {
    tempoMs: tempo,
    jogadas,
    tentativas,
    margem,
    passos,
    passosMinimos,
  });

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
        tentativas: Number.isInteger(tentativas) ? tentativas : 1,
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
