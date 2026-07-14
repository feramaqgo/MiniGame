import { useEffect, useState } from "react";
import { Trophy, RotateCcw } from "lucide-react";

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
  const [cartas, setCartas] = useState<Carta[]>(() => embaralhar());
  const [viradas, setViradas] = useState<number[]>([]); // índices atualmente virados (não encontrados)
  const [encontradas, setEncontradas] = useState<Set<string>>(new Set());
  const [movimentos, setMovimentos] = useState(0);
  const [travado, setTravado] = useState(false);

  const venceu = encontradas.size === PARES.length;

  const reiniciar = () => {
    setCartas(embaralhar());
    setViradas([]);
    setEncontradas(new Set());
    setMovimentos(0);
    setTravado(false);
  };

  const clicar = (indice: number) => {
    if (travado) return;
    if (viradas.includes(indice)) return;
    if (encontradas.has(cartas[indice].chave)) return;

    const novasViradas = [...viradas, indice];

    if (novasViradas.length < 2) {
      setViradas(novasViradas);
      return;
    }

    // segunda carta
    setViradas(novasViradas);
    setMovimentos((m) => m + 1);
    const [a, b] = novasViradas;

    if (cartas[a].chave === cartas[b].chave) {
      setEncontradas((prev) => new Set(prev).add(cartas[a].chave));
      setViradas([]);
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
      const t = setTimeout(onWin, 1400);
      return () => clearTimeout(t);
    }
  }, [venceu, onWin]);

  return (
    <div className="w-full max-w-md mx-auto flex flex-col items-center gap-4">
      {/* HUD */}
      <div className="w-full flex items-center justify-between px-1">
        <span className="font-display text-sm uppercase tracking-widest text-[#6B6048]">Movimentos</span>
        <span className="font-display text-lg font-bold text-[#1A1208]">{movimentos}</span>
      </div>

      {/* Tabuleiro */}
      <div className="relative w-full">
        <div className="grid grid-cols-3 gap-3">
          {cartas.map((carta, i) => {
            const faceUp = viradas.includes(i) || encontradas.has(carta.chave);
            const isMatched = encontradas.has(carta.chave);
            return (
              <button
                key={carta.id}
                onClick={() => clicar(i)}
                className="relative aspect-square [perspective:800px] cursor-pointer"
                aria-label={faceUp ? carta.chave : "carta virada"}
              >
                <div
                  className="relative w-full h-full transition-transform duration-300 [transform-style:preserve-3d]"
                  style={{ transform: faceUp ? "rotateY(180deg)" : "rotateY(0deg)" }}
                >
                  {/* Verso */}
                  <div className="absolute inset-0 [backface-visibility:hidden] rounded-2xl bg-[#FF6801] shadow-lg flex items-center justify-center">
                    <svg viewBox="0 0 100 100" className="w-8 h-8 fill-white/90">
                      <circle cx="50" cy="50" r="46" fill="none" stroke="white" strokeWidth="4" opacity="0.5" />
                      <polygon points="50,30 62,40 57,56 43,56 38,40" fill="white" opacity="0.9" />
                    </svg>
                  </div>
                  {/* Frente (foto do equipamento) */}
                  <div
                    className={`absolute inset-0 [backface-visibility:hidden] [transform:rotateY(180deg)] rounded-2xl overflow-hidden shadow-lg border-2 ${
                      isMatched ? "border-emerald-400" : "border-black/10"
                    }`}
                  >
                    <img src={carta.src} alt="" className="w-full h-full object-cover" />
                    {isMatched && <div className="absolute inset-0 bg-emerald-400/25" />}
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {venceu && (
          <div className="absolute inset-0 -m-2 bg-black/60 rounded-3xl flex flex-col items-center justify-center gap-3 text-center p-6">
            <Trophy className="w-14 h-14 text-[#F5C518] animate-bounce" />
            <p className="font-display text-3xl text-[#F5C518] uppercase tracking-wider glow-text-orange">
              Você venceu!
            </p>
            <p className="text-sm text-white/80 font-sans">Preparando sua roleta de prêmios...</p>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between w-full px-1">
        <span className="text-xs text-[#6B6048] font-sans">
          {encontradas.size} / {PARES.length} pares
        </span>
        <button
          onClick={reiniciar}
          className="flex items-center gap-1.5 text-xs uppercase tracking-widest font-display text-[#6B6048] hover:text-[#FF6801] transition-colors cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Embaralhar
        </button>
      </div>
    </div>
  );
}
