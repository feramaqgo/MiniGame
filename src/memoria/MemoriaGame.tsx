import { useEffect, useRef, useState } from "react";
import { Check, Trophy, RotateCcw } from "lucide-react";
import { sfx } from "../shared/lib/sfx";
import { registrarScore } from "../shared/lib/score";

interface MemoriaGameProps {
  onWin: () => void;
}

interface Carta {
  id: number;
  chave: string;
  src: string;
}

const PARES: { chave: string; src: string }[] = [
  { chave: "eq1", src: "/memoria-1.jpg" },
  { chave: "eq2", src: "/memoria-2.jpg" },
  { chave: "eq3", src: "/memoria-3.jpg" },
  { chave: "eq4", src: "/memoria-4.jpg" },
  { chave: "eq5", src: "/memoria-5.jpg" },
  { chave: "eq6", src: "/memoria-6.jpg" },
];

function embaralhar(): Carta[] {
  const dobradas = PARES.flatMap((p) => [p, p]);
  const cartas = dobradas.map((p, i) => ({ id: i, chave: p.chave, src: p.src }));
  for (let i = cartas.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [cartas[i], cartas[j]] = [cartas[j], cartas[i]];
  }
  return cartas;
}

export default function MemoriaGame({ onWin }: MemoriaGameProps) {
  const inicioRef = useRef(performance.now()); // início da partida (placar)
  /** Quantas vezes embaralhou — a Memória não tem derrota, então "recomeçar
   * do zero" é o equivalente a perder uma tentativa. */
  const tentativasRef = useRef(1);
  const [cartas, setCartas] = useState<Carta[]>(() => embaralhar());
  const [viradas, setViradas] = useState<number[]>([]); // índices atualmente virados (não encontrados)
  const [encontradas, setEncontradas] = useState<Set<string>>(new Set());
  const [movimentos, setMovimentos] = useState(0);
  const [travado, setTravado] = useState(false);
  /** Par recém-encontrado — dispara o "pop" verde de acerto. */
  const [ultimoPar, setUltimoPar] = useState<string | null>(null);

  const venceu = encontradas.size === PARES.length;

  const reiniciar = () => {
    tentativasRef.current += 1;
    setCartas(embaralhar());
    setViradas([]);
    setEncontradas(new Set());
    setMovimentos(0);
    setTravado(false);
    setUltimoPar(null);
    inicioRef.current = performance.now();
  };

  const clicar = (indice: number) => {
    if (travado) return;
    if (viradas.includes(indice)) return;
    if (encontradas.has(cartas[indice].chave)) return;

    const novasViradas = [...viradas, indice];
    sfx.flip();

    if (novasViradas.length < 2) {
      setViradas(novasViradas);
      return;
    }

    // segunda carta
    setViradas(novasViradas);
    setMovimentos((m) => m + 1);
    const [a, b] = novasViradas;

    if (cartas[a].chave === cartas[b].chave) {
      sfx.match();
      setEncontradas((prev) => new Set(prev).add(cartas[a].chave));
      setViradas([]);
      // Marca o par pra tocar a animação de acerto uma vez só.
      setUltimoPar(cartas[a].chave);
      setTimeout(() => setUltimoPar(null), 700);
    } else {
      setTravado(true);
      setTimeout(() => {
        setViradas([]);
        setTravado(false);
      }, 850);
    }
  };

  useEffect(() => {
    if (venceu) {
      sfx.vitoria();
      registrarScore("memoria", {
        tempoMs: performance.now() - inicioRef.current,
        tentativas: tentativasRef.current,
        jogadas: movimentos,
      });
      const t = setTimeout(onWin, 1400);
      return () => clearTimeout(t);
    }
    // `movimentos` de propósito fora das deps: o placar é gravado uma vez só,
    // no instante da vitória.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [venceu, onWin]);

  return (
    <div className="w-full max-w-[min(92vw,760px)] mx-auto flex flex-col items-center gap-2.5 md:gap-4 select-none">
      {/* HUD — pares em pips que acendem + contador de movimentos */}
      <div className="w-full flex items-center justify-between px-1">
        <div className="flex items-center gap-1.5">
          {PARES.map((p, i) => (
            <span
              key={p.chave}
              className={`w-3.5 h-3.5 rounded-full border transition-all duration-300 ${
                i < encontradas.size
                  ? "bg-emerald-500 border-emerald-600 shadow-[0_0_8px_rgba(16,185,129,0.6)] scale-110"
                  : "bg-black/10 border-black/15"
              }`}
            />
          ))}
        </div>
        <span className="font-display text-sm uppercase tracking-widest text-[#6E675C]">
          {movimentos} <span className="text-[#8A8375]">jogadas</span>
        </span>
      </div>

      {/* Tabuleiro — 3 colunas no celular (retrato), 4 no tablet (paisagem),
          pra as 12 cartas caberem na tela inteira sem rolagem. */}
      <div className="relative w-full">
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 md:gap-3.5 w-full max-w-[min(92vw,62vh*1.4,700px)]">
          {cartas.map((carta, i) => {
            const faceUp = viradas.includes(i) || encontradas.has(carta.chave);
            const isMatched = encontradas.has(carta.chave);
            return (
              <button
                key={carta.id}
                onClick={() => clicar(i)}
                className={`relative aspect-square [perspective:900px] cursor-pointer transition-transform duration-200 ${
                  isMatched ? "" : "hover:scale-[1.03] active:scale-95"
                } ${ultimoPar === carta.chave ? "animate-[acerto_0.6s_ease-out]" : ""}`}
                aria-label={faceUp ? carta.chave : "carta virada"}
              >
                <div
                  className="relative w-full h-full transition-transform duration-500 [transform-style:preserve-3d]"
                  style={{ transform: faceUp ? "rotateY(180deg)" : "rotateY(0deg)" }}
                >
                  {/* Verso — plaquinha de equipamento com faixa de perigo */}
                  <div className="absolute inset-0 [backface-visibility:hidden] rounded-2xl overflow-hidden shadow-[0_8px_20px_-8px_rgba(43,38,33,0.55)] border border-black/10 bg-gradient-to-br from-[#ff7a1c] to-[#ef5c00] flex items-center justify-center">
                    <svg viewBox="0 0 100 100" className="w-10 h-10 md:w-12 md:h-12">
                      <circle cx="50" cy="50" r="30" fill="none" stroke="rgba(255,255,255,0.55)" strokeWidth="5" />
                      <path d="M50 30 L61 42 L56 58 L44 58 L39 42 Z" fill="rgba(255,255,255,0.92)" />
                    </svg>
                    {/* lustro diagonal */}
                    <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/20 to-transparent pointer-events-none" />
                    <div className="faixa-perigo absolute bottom-0 inset-x-0 h-2 opacity-90" />
                  </div>
                  {/* Frente (foto do equipamento) */}
                  <div
                    className={`absolute inset-0 [backface-visibility:hidden] [transform:rotateY(180deg)] rounded-2xl overflow-hidden border-2 transition-shadow duration-300 ${
                      isMatched
                        ? "border-emerald-400 shadow-[0_0_20px_-2px_rgba(16,185,129,0.65)]"
                        : "border-black/10 shadow-[0_8px_20px_-8px_rgba(43,38,33,0.55)]"
                    }`}
                  >
                    <img src={carta.src} alt="" className="w-full h-full object-cover" />
                    {isMatched && (
                      <>
                        <div className="absolute inset-0 bg-emerald-400/20" />
                        <div className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center shadow-md">
                          <Check className="w-4 h-4 text-white" strokeWidth={3} />
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {venceu && (
          <div className="absolute inset-0 -m-2 bg-black/60 rounded-3xl flex flex-col items-center justify-center gap-3 text-center p-6">
            <Trophy className="w-14 h-14 text-[#F4B21C] animate-bounce" />
            <p className="font-display text-3xl text-[#F4B21C] uppercase tracking-wider glow-text-orange">
              Você venceu!
            </p>
            <p className="text-sm text-white/80 font-sans">Preparando sua roleta de prêmios...</p>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between w-full px-1">
        <span className="text-xs text-[#6E675C] font-sans">
          {encontradas.size} / {PARES.length} pares
        </span>
        <button
          onClick={() => {
            sfx.click();
            reiniciar();
          }}
          className="flex items-center gap-1.5 text-xs uppercase tracking-widest font-display text-[#6E675C] hover:text-[#FF6801] transition-colors cursor-pointer px-3 py-2"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Embaralhar
        </button>
      </div>

      <style>{`
        @keyframes acerto {
          0% { transform: scale(1); }
          40% { transform: scale(1.12); }
          100% { transform: scale(1); }
        }
      `}</style>
    </div>
  );
}
