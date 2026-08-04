import { useEffect, useState } from "react";
import { Crown, Medal, Trophy } from "lucide-react";

type Jogo = "chute" | "memoria" | "cobrinha" | "velha";

interface Linha {
  posicao: number;
  nome: string;
  jogo: Jogo;
  pontos: number;
}

const FILTROS: { rotulo: string; jogo: Jogo | null }[] = [
  { rotulo: "Geral", jogo: null },
  { rotulo: "Pênalti", jogo: "chute" },
  { rotulo: "Memória", jogo: "memoria" },
  { rotulo: "Mangote", jogo: "cobrinha" },
  { rotulo: "Velha", jogo: "velha" },
];

const NOME_JOGO: Record<Jogo, string> = {
  chute: "Pênalti",
  memoria: "Memória",
  cobrinha: "Mangote",
  velha: "Velha",
};

/** Cor da medalha por posição — ouro, prata, bronze. */
function estiloPosicao(pos: number) {
  if (pos === 1) return "bg-[#F5C518] text-[#3A2A02] border-[#D6A400]";
  if (pos === 2) return "bg-[#D8D2C6] text-[#3A3730] border-[#B9B2A3]";
  if (pos === 3) return "bg-[#E0A46A] text-[#3E2510] border-[#C08347]";
  return "bg-black/8 text-[#6E675C] border-black/10";
}

/**
 * Placar do estande. Fica na tela de escolha de jogos pra todo mundo ver —
 * é o que faz a pessoa querer jogar de novo e chamar os colegas.
 */
export default function Placar() {
  const [filtro, setFiltro] = useState<Jogo | null>(null);
  const [linhas, setLinhas] = useState<Linha[]>([]);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    let cancelado = false;
    setCarregando(true);

    const url = filtro ? `/api/ranking?jogo=${filtro}&limite=5` : "/api/ranking?limite=5";
    fetch(url)
      .then((r) => r.json())
      .then((d) => {
        if (!cancelado) setLinhas(d?.ranking || []);
      })
      .catch(() => {
        if (!cancelado) setLinhas([]);
      })
      .finally(() => {
        if (!cancelado) setCarregando(false);
      });

    return () => {
      cancelado = true;
    };
  }, [filtro]);

  return (
    <div className="card-arcade rounded-2xl p-5 relative overflow-hidden">
      <div className="faixa-perigo absolute top-0 inset-x-0 h-1.5" />

      <div className="flex items-center gap-2 mb-3">
        <Trophy className="w-5 h-5 text-[#F5C518]" />
        <h2 className="font-display text-lg uppercase tracking-tight font-bold text-[#23201B]">
          Placar do estande
        </h2>
      </div>

      {/* Filtros: geral + um por jogo */}
      <div className="flex flex-wrap gap-1.5 mb-3">
        {FILTROS.map((f) => (
          <button
            key={f.rotulo}
            onClick={() => setFiltro(f.jogo)}
            className={`px-3 py-1.5 rounded-full font-sans text-xs uppercase tracking-wider transition-colors cursor-pointer ${
              filtro === f.jogo
                ? "bg-[#FF6801] text-white font-bold"
                : "bg-black/5 text-[#6E675C] hover:bg-black/10"
            }`}
          >
            {f.rotulo}
          </button>
        ))}
      </div>

      {carregando ? (
        <p className="font-sans text-xs text-[#8A8375] uppercase tracking-widest py-6 text-center animate-pulse">
          Carregando placar...
        </p>
      ) : linhas.length === 0 ? (
        <p className="font-sans text-sm text-[#6E675C] py-6 text-center">
          Ninguém pontuou ainda. <span className="font-bold text-[#FF6801]">Seja o primeiro!</span>
        </p>
      ) : (
        <ol className="space-y-1.5">
          {linhas.map((l) => (
            <li
              key={`${l.posicao}-${l.nome}`}
              className={`flex items-center gap-3 rounded-xl px-3 py-2 ${
                l.posicao === 1 ? "bg-[#F5C518]/12 border border-[#F5C518]/35" : "bg-black/[0.03]"
              }`}
            >
              <span
                className={`w-7 h-7 shrink-0 rounded-full border flex items-center justify-center font-display text-xs font-bold ${estiloPosicao(
                  l.posicao
                )}`}
              >
                {l.posicao === 1 ? <Crown className="w-3.5 h-3.5" /> : l.posicao}
              </span>

              <span className="flex-1 min-w-0 font-sans text-sm font-bold text-[#23201B] truncate">
                {l.nome}
              </span>

              {!filtro && (
                <span className="hidden sm:inline font-sans text-[10px] uppercase tracking-wider text-[#8A8375]">
                  {NOME_JOGO[l.jogo]}
                </span>
              )}

              <span className="font-display text-sm font-bold text-[#FF6801] tabular-nums">
                {l.pontos}
              </span>
            </li>
          ))}
        </ol>
      )}

      <p className="mt-3 flex items-center justify-center gap-1.5 font-sans text-[10px] uppercase tracking-widest text-[#8A8375]">
        <Medal className="w-3 h-3" />
        1º lugar do dia leva prêmio especial
      </p>
    </div>
  );
}
