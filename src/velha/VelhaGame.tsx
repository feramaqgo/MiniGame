import { useCallback, useEffect, useRef, useState } from "react";
import { Trophy, RotateCcw } from "lucide-react";

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

// IA propositalmente vencível: sempre fecha se puder, mas só bloqueia o
// jogador com ~50% de chance — então dá pra ganhar tentando de novo.
function jogadaDaMaquina(b: Marca[]): number {
  const ganhar = jogadaVitoriosa(b, "O");
  if (ganhar !== null) return ganhar;

  const bloquear = jogadaVitoriosa(b, "X");
  if (bloquear !== null && Math.random() < 0.5) return bloquear;

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

  const reiniciar = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setBoard(Array(9).fill(null));
    setEstado("jogando");
    setLinhaVit(null);
    setPensando(false);
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
      const t = setTimeout(onWin, 1500);
      return () => clearTimeout(t);
    }
  }, [estado, onWin]);

  useEffect(() => () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
  }, []);

  return (
    <div className="w-full max-w-sm mx-auto flex flex-col items-center gap-5">
      {/* HUD */}
      <div className="w-full flex items-center justify-center">
        <span className="font-display text-sm uppercase tracking-widest text-[#6B6048]">
          {estado === "jogando"
            ? pensando
              ? "Máquina jogando..."
              : "Sua vez (você é o X)"
            : "Fim de jogo"}
        </span>
      </div>

      {/* Tabuleiro */}
      <div className="relative w-full max-w-[320px] aspect-square">
        <div className="grid grid-cols-3 gap-2.5 w-full h-full">
          {board.map((marca, i) => {
            const naLinha = linhaVit?.includes(i);
            return (
              <button
                key={i}
                onClick={() => jogar(i)}
                disabled={estado !== "jogando" || pensando || !!marca}
                className={`rounded-2xl border-2 flex items-center justify-center transition-colors ${
                  naLinha ? "bg-emerald-50 border-emerald-400" : "bg-[#FFFAF0] border-black/10"
                } ${!marca && estado === "jogando" && !pensando ? "hover:border-[#FF6801] cursor-pointer" : ""}`}
              >
                {marca === "X" && (
                  <svg viewBox="0 0 100 100" className="w-3/5 h-3/5">
                    <line x1="22" y1="22" x2="78" y2="78" stroke="#FF6801" strokeWidth="14" strokeLinecap="round" />
                    <line x1="78" y1="22" x2="22" y2="78" stroke="#FF6801" strokeWidth="14" strokeLinecap="round" />
                  </svg>
                )}
                {marca === "O" && (
                  <svg viewBox="0 0 100 100" className="w-3/5 h-3/5">
                    <circle cx="50" cy="50" r="30" fill="none" stroke="#3A322E" strokeWidth="14" />
                  </svg>
                )}
              </button>
            );
          })}
        </div>

        {estado !== "jogando" && (
          <div className="absolute inset-0 -m-2 bg-black/60 rounded-3xl flex flex-col items-center justify-center gap-3 text-center p-6">
            {estado === "venceu" ? (
              <>
                <Trophy className="w-14 h-14 text-[#F5C518] animate-bounce" />
                <p className="font-display text-3xl text-[#F5C518] uppercase tracking-wider glow-text-orange">
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
                  onClick={reiniciar}
                  className="border-2 border-[#FF6801] bg-[#FF6801] text-white font-display text-base uppercase tracking-widest px-6 py-3 rounded-xl flex items-center gap-2 hover:bg-[#e05c01] transition-colors cursor-pointer"
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
          onClick={reiniciar}
          className="flex items-center gap-1.5 text-xs uppercase tracking-widest font-display text-[#6B6048] hover:text-[#FF6801] transition-colors cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Reiniciar
        </button>
      )}
    </div>
  );
}
