import { useCallback, useEffect, useRef, useState } from "react";
import { Trophy, RotateCcw } from "lucide-react";
import { sfx } from "../shared/lib/sfx";
import { registrarPartida } from "../shared/lib/score";

type Marca = "X" | "O" | null;
type Estado = "jogando" | "venceu" | "perdeu" | "empate";

interface VelhaGameProps {
  onWin: () => void;
}

const LINHAS = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6],
];

function vencedor(b: Marca[]): { marca: Marca; linha: number[] } | null {
  for (const linha of LINHAS) {
    const [a, c, d] = linha;
    if (b[a] && b[a] === b[c] && b[a] === b[d]) return { marca: b[a], linha };
  }
  return null;
}

function vazias(b: Marca[]): number[] {
  return b.map((v, i) => (v ? -1 : i)).filter((i) => i >= 0);
}

// Procura uma jogada que fecha 3 pra a marca informada.
function jogadaVitoriosa(b: Marca[], marca: Marca): number | null {
  for (const i of vazias(b)) {
    const copia = [...b];
    copia[i] = marca;
    if (vencedor(copia)?.marca === marca) return i;
  }
  return null;
}

// IA vencível, mas atenta: sempre fecha se puder e bloqueia o jogador na
// maioria das vezes. O jogo continua "sempre ganhável" (é só tentar de novo),
// só que vencer passou a ter mérito de verdade — o placar conta tentativas,
// então uma IA que erra demais tornaria a Velha a rota fácil pro topo.
const CHANCE_BLOQUEIO = 0.75;

function jogadaDaMaquina(b: Marca[]): number {
  const ganhar = jogadaVitoriosa(b, "O");
  if (ganhar !== null) return ganhar;

  const bloquear = jogadaVitoriosa(b, "X");
  if (bloquear !== null && Math.random() < CHANCE_BLOQUEIO) return bloquear;

  const livres = vazias(b);
  // leve preferência pelo centro pra parecer que "joga"
  if (livres.includes(4) && Math.random() < 0.5) return 4;
  return livres[Math.floor(Math.random() * livres.length)];
}

export default function VelhaGame({ onWin }: VelhaGameProps) {
  const [board, setBoard] = useState<Marca[]>(Array(9).fill(null));
  const [estado, setEstado] = useState<Estado>("jogando");
  const [linhaVit, setLinhaVit] = useState<number[] | null>(null);
  const [pensando, setPensando] = useState(false);
  const timeoutRef = useRef<number | null>(null);
  const inicioRef = useRef(performance.now()); // início da partida (placar)
  const jogadasRef = useRef(0); // jogadas do visitante, pro placar
  const tentativasRef = useRef(1); // em qual tentativa a pessoa está

  const reiniciar = () => {
    tentativasRef.current += 1;
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setBoard(Array(9).fill(null));
    setEstado("jogando");
    setLinhaVit(null);
    setPensando(false);
    inicioRef.current = performance.now();
    jogadasRef.current = 0;
  };

  const finalizar = useCallback((b: Marca[]): boolean => {
    const v = vencedor(b);
    if (v) {
      setLinhaVit(v.linha);
      setEstado(v.marca === "X" ? "venceu" : "perdeu");
      return true;
    }
    if (vazias(b).length === 0) {
      setEstado("empate");
      return true;
    }
    return false;
  }, []);

  const jogar = (i: number) => {
    if (estado !== "jogando" || pensando || board[i]) return;

    sfx.click();
    jogadasRef.current += 1;
    const apos = [...board];
    apos[i] = "X";
    setBoard(apos);

    if (finalizar(apos)) return;

    // vez da máquina
    setPensando(true);
    timeoutRef.current = window.setTimeout(() => {
      const jogada = jogadaDaMaquina(apos);
      const depois = [...apos];
      depois[jogada] = "O";
      setBoard(depois);
      setPensando(false);
      finalizar(depois);
    }, 480);
  };

  useEffect(() => {
    if (estado === "venceu") {
      sfx.vitoria();
      registrarPartida("velha", {
        tempoMs: performance.now() - inicioRef.current,
        tentativas: tentativasRef.current,
        jogadas: jogadasRef.current,
      });
      const t = setTimeout(onWin, 1500);
      return () => clearTimeout(t);
    } else if (estado === "perdeu" || estado === "empate") {
      sfx.erro();
    }
  }, [estado, onWin]);

  useEffect(() => () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
  }, []);

  return (
    <div className="w-full max-w-md mx-auto flex flex-col items-center gap-5 select-none">
      {/* HUD — de quem é a vez, com a marca colorida */}
      <div className="w-full flex items-center justify-center">
        {estado === "jogando" ? (
          <div
            className={`inline-flex items-center gap-2.5 rounded-full px-5 py-2 font-display text-sm uppercase tracking-widest transition-colors duration-300 ${
              pensando
                ? "bg-[#E7E1D5] text-[#6E675C]"
                : "bg-[#FF6801] text-white shadow-[0_0_20px_-4px_rgba(255,104,1,0.8)]"
            }`}
          >
            {pensando ? (
              <>
                <span className="flex gap-1">
                  {[0, 1, 2].map((i) => (
                    <span
                      key={i}
                      className="w-1.5 h-1.5 rounded-full bg-[#6E675C] animate-bounce"
                      style={{ animationDelay: `${i * 0.15}s` }}
                    />
                  ))}
                </span>
                Rino pensando
              </>
            ) : (
              <>
                <svg viewBox="0 0 100 100" className="w-4 h-4">
                  <line x1="22" y1="22" x2="78" y2="78" stroke="currentColor" strokeWidth="18" strokeLinecap="round" />
                  <line x1="78" y1="22" x2="22" y2="78" stroke="currentColor" strokeWidth="18" strokeLinecap="round" />
                </svg>
                Sua vez
              </>
            )}
          </div>
        ) : (
          <span className="font-display text-sm uppercase tracking-widest text-[#6E675C]">Fim de jogo</span>
        )}
      </div>

      {/* Tabuleiro — laje de concreto com moldura de canteiro */}
      <div className="relative w-full max-w-[400px] aspect-square rounded-2xl p-1.5 shadow-xl faixa-perigo">
        <div className="relative w-full h-full rounded-xl overflow-hidden border-2 border-[#1B1712] bg-[#241F1A] p-2.5">
          <div className="grid grid-cols-3 gap-2.5 w-full h-full">
            {board.map((marca, i) => {
              const naLinha = linhaVit?.includes(i);
              const jogavel = !marca && estado === "jogando" && !pensando;
              return (
                <button
                  key={i}
                  onClick={() => jogar(i)}
                  disabled={estado !== "jogando" || pensando || !!marca}
                  className={`group rounded-xl border flex items-center justify-center transition-all duration-200 ${
                    naLinha
                      ? "bg-emerald-500/25 border-emerald-400 shadow-[0_0_20px_-2px_rgba(16,185,129,0.7)]"
                      : "bg-[#3A342D] border-black/40"
                  } ${
                    jogavel
                      ? "hover:border-[#FF6801] hover:bg-[#443D34] active:scale-95 cursor-pointer"
                      : ""
                  }`}
                >
                  {/* prévia fantasma do X no hover — deixa claro onde vai cair */}
                  {jogavel && (
                    <svg
                      viewBox="0 0 100 100"
                      className="w-3/5 h-3/5 opacity-0 group-hover:opacity-25 transition-opacity"
                    >
                      <line x1="22" y1="22" x2="78" y2="78" stroke="#FF6801" strokeWidth="15" strokeLinecap="round" />
                      <line x1="78" y1="22" x2="22" y2="78" stroke="#FF6801" strokeWidth="15" strokeLinecap="round" />
                    </svg>
                  )}
                  {marca === "X" && (
                    <svg
                      viewBox="0 0 100 100"
                      className="w-3/5 h-3/5 drop-shadow-[0_2px_3px_rgba(0,0,0,0.4)] animate-[marcar_0.25s_ease-out]"
                    >
                      <line x1="22" y1="22" x2="78" y2="78" stroke="#FF6801" strokeWidth="15" strokeLinecap="round" />
                      <line x1="78" y1="22" x2="22" y2="78" stroke="#FF6801" strokeWidth="15" strokeLinecap="round" />
                    </svg>
                  )}
                  {marca === "O" && (
                    <svg
                      viewBox="0 0 100 100"
                      className="w-3/5 h-3/5 drop-shadow-[0_2px_3px_rgba(0,0,0,0.4)] animate-[marcar_0.25s_ease-out]"
                    >
                      <circle cx="50" cy="50" r="30" fill="none" stroke="#E7E1D5" strokeWidth="15" />
                    </svg>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {estado !== "jogando" && (
          <div className="absolute inset-0 bg-black/65 rounded-2xl flex flex-col items-center justify-center gap-3 text-center p-6">
            {estado === "venceu" ? (
              <>
                <Trophy className="w-14 h-14 text-[#F4B21C] animate-bounce" />
                <p className="font-display text-3xl text-[#F4B21C] uppercase tracking-wider glow-text-orange">
                  Você venceu!
                </p>
                <p className="text-sm text-white/80 font-sans">Preparando sua roleta de prêmios...</p>
              </>
            ) : (
              <>
                <p className="font-display text-3xl text-white uppercase tracking-wider">
                  {estado === "perdeu" ? "Quase!" : "Deu velha!"}
                </p>
                <p className="text-sm text-white/80 font-sans">
                  Tente de novo — dá pra ganhar da máquina!
                </p>
                <button
                  onClick={() => {
                    sfx.click();
                    reiniciar();
                  }}
                  className="btn-laranja font-display text-base uppercase tracking-widest px-6 py-3 rounded-xl flex items-center gap-2 cursor-pointer"
                >
                  <RotateCcw className="w-4 h-4" />
                  Jogar de novo
                </button>
              </>
            )}
          </div>
        )}
      </div>

      {estado === "jogando" && (
        <button
          onClick={() => {
            sfx.click();
            reiniciar();
          }}
          className="flex items-center gap-1.5 text-xs uppercase tracking-widest font-display text-[#6E675C] hover:text-[#FF6801] transition-colors cursor-pointer px-3 py-2"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Reiniciar
        </button>
      )}

      <style>{`
        @keyframes marcar {
          0% { transform: scale(0.4); opacity: 0; }
          70% { transform: scale(1.12); opacity: 1; }
          100% { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
