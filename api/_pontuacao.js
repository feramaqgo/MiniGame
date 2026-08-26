// Régua de pontuação do arcade — compartilhada entre os endpoints.
//
// Prefixo `_` para a Vercel não expor este arquivo como endpoint HTTP.
// A pontuação é calculada SEMPRE no servidor, a partir das métricas cruas: o
// cliente nunca envia "pontos", então o placar não depende de confiar na tela
// do tablet.

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
    // Habilidade combina rota e economia de toques (ver calcularPontos):
    // a rota mede planejamento, os toques medem controle. Nos outros jogos
    // cada clique já vira jogada contada; aqui precisou ser explícito.
    pesos: { tentativas: 350, habilidade: 400, rapidez: 250 },
    habilidade: { campo: "eficiencia", otimo: 0.85, pessimo: 0.25 },
    // Toques por porção coletada: ~2 é ótimo (planejou a rota), ~9 é bater
    // na tela sem pensar.
    toquesPorPorcao: { otimo: 2, pessimo: 9, peso: 0.4 },
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
  return Math.max(0, bruto);
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
  let fatorHabilidade;
  if (regra.habilidade.campo === "eficiencia") {
    // Mangote manda passos crus; a eficiência é calculada aqui.
    const passos = Number(dados.passos);
    const minimos = Number(dados.passosMinimos);
    const eficiencia = passos > 0 && minimos > 0 ? minimos / passos : 0;
    const fatorRota = normalizar(
      eficiencia,
      regra.habilidade.otimo,
      regra.habilidade.pessimo
    );

    // Toques por porção: quanto mais a pessoa bate na tela sem pensar, pior.
    const t = regra.toquesPorPorcao;
    const toques = Number(dados.toques);
    const porcoes = 6; // ALVO do jogo
    const fatorToques =
      Number.isFinite(toques) && toques > 0
        ? normalizar(toques / porcoes, t.otimo, t.pessimo)
        : 1; // sem dado (versão antiga do cliente): não penaliza

    fatorHabilidade = fatorRota * (1 - t.peso) + fatorToques * t.peso;
  } else {
    fatorHabilidade = normalizar(
      Number(dados[regra.habilidade.campo]),
      regra.habilidade.otimo,
      regra.habilidade.pessimo
    );
  }

  const segundos = Number(dados.tempoMs) / 1000;
  const fatorRapidez = normalizar(segundos, regra.rapidez.otimo, regra.rapidez.pessimo);

  const desempenho =
    fatorTentativas * pesos.tentativas +
    fatorHabilidade * pesos.habilidade +
    fatorRapidez * pesos.rapidez;

  return 1000 + Math.round(desempenho);
}

export { REGRAS, calcularPontos };
