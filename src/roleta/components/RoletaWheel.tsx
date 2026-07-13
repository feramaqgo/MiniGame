import { useEffect, useMemo, useRef, useState } from "react";
import { Prize } from "../types";

interface Slice {
  prize: Prize;
  start: number;
  end: number;
  mid: number;
  fill: string;
  ink: string;
}

interface RoletaWheelProps {
  prizes: Prize[];
  /** Definido quando o servidor já escolheu o prêmio — dispara o giro. */
  targetPrizeId: string | null;
  onSpinComplete?: () => void;
}

const SIZE = 300;
const C = SIZE / 2;
const R_RIM = 148; // borda externa do aro
const R_TRIM = 131; // borda interna do aro = raio das fatias
const R_LABEL = 94; // raio da linha de base do texto curvado
const R_HUB = 27;
const STUDS = 24;
const R_STUD = (R_RIM + R_TRIM) / 2;
const FULL_SPINS = 6;
const SPIN_MS = 5200;

// Cor de fundo e cor da tinta (texto) por fatia — dark em fundo claro, creme em fundo escuro.
const STYLES = [
  { fill: "url(#sl-orange)", ink: "#3A1603" },
  { fill: "url(#sl-dark)", ink: "#FFEFD8" },
  { fill: "url(#sl-gold)", ink: "#3A1603" },
  { fill: "url(#sl-graph)", ink: "#FFEFD8" },
  { fill: "url(#sl-rust)", ink: "#FFEFD8" },
];

function polar(angle: number, r: number) {
  const rad = ((angle - 90) * Math.PI) / 180;
  return { x: C + r * Math.cos(rad), y: C + r * Math.sin(rad) };
}

function slicePath(start: number, end: number, r: number) {
  const a = polar(start, r);
  const b = polar(end, r);
  const large = end - start > 180 ? 1 : 0;
  return `M ${C} ${C} L ${a.x} ${a.y} A ${r} ${r} 0 ${large} 1 ${b.x} ${b.y} Z`;
}

// Arco pra o texto curvado. Na metade de baixo da roda o arco é invertido
// pra o texto não ficar de cabeça pra baixo.
function labelArc(start: number, end: number, mid: number, r: number) {
  const lower = mid > 90 && mid < 270;
  if (!lower) {
    const a = polar(start, r);
    const b = polar(end, r);
    return `M ${a.x} ${a.y} A ${r} ${r} 0 0 1 ${b.x} ${b.y}`;
  }
  const a = polar(end, r);
  const b = polar(start, r);
  return `M ${a.x} ${a.y} A ${r} ${r} 0 0 0 ${b.x} ${b.y}`;
}

export default function RoletaWheel({ prizes, targetPrizeId, onSpinComplete }: RoletaWheelProps) {
  const [rotation, setRotation] = useState(0);
  const rotationRef = useRef(0);
  const hasSpunFor = useRef<string | null>(null);

  // Fatias iguais — todas com o mesmo tamanho. A chance real de cada prêmio
  // é controlada no servidor (ponderada por estoque); o visual não precisa
  // refletir isso, e fatias iguais ficam muito mais legíveis.
  const slices: Slice[] = useMemo(() => {
    const n = prizes.length;
    if (n === 0) return [];
    const step = 360 / n;
    return prizes.map((prize, i) => {
      const start = i * step;
      const end = start + step;
      return {
        prize,
        start,
        end,
        mid: start + step / 2,
        fill: STYLES[i % STYLES.length].fill,
        ink: STYLES[i % STYLES.length].ink,
      };
    });
  }, [prizes]);

  useEffect(() => {
    if (!targetPrizeId || hasSpunFor.current === targetPrizeId) return;
    const winning = slices.find((s) => s.prize.id === targetPrizeId);

    if (!winning) {
      hasSpunFor.current = targetPrizeId;
      onSpinComplete?.();
      return;
    }

    hasSpunFor.current = targetPrizeId;

    const sliceWidth = winning.end - winning.start;
    const jitter = (Math.random() * 2 - 1) * sliceWidth * 0.3;
    const currentTurns = Math.floor(rotationRef.current / 360);
    const finalRotation = (currentTurns + FULL_SPINS) * 360 + (360 - (winning.mid + jitter));

    rotationRef.current = finalRotation;
    setRotation(finalRotation);
  }, [targetPrizeId, slices, onSpinComplete]);

  const reduce =
    typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

  const studs = Array.from({ length: STUDS }, (_, i) => {
    const p = polar((360 / STUDS) * i, R_STUD);
    return { ...p, gold: i % 2 === 0 };
  });

  return (
    <div className="relative w-full max-w-[330px] mx-auto aspect-square select-none">
      {/* Ponteiro fixo no topo (não gira) */}
      <div className="absolute left-1/2 -translate-x-1/2 -top-1 z-30 pointer-events-none">
        <svg width="42" height="46" viewBox="0 0 42 46" className="drop-shadow-[0_4px_5px_rgba(0,0,0,0.45)]">
          <defs>
            <linearGradient id="ptr" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#FFE7A6" />
              <stop offset="0.5" stopColor="#F5B81C" />
              <stop offset="1" stopColor="#E08A00" />
            </linearGradient>
          </defs>
          <path
            d="M21 44 L6 18 Q4 13 8 10 L15 5 Q21 1 27 5 L34 10 Q38 13 36 18 Z"
            fill="url(#ptr)"
            stroke="#7A3B00"
            strokeWidth="2"
            strokeLinejoin="round"
          />
          <circle cx="21" cy="15" r="4.2" fill="#7A3B00" opacity="0.55" />
        </svg>
      </div>

      <svg
        viewBox={`0 0 ${SIZE} ${SIZE}`}
        className="w-full h-full drop-shadow-[0_14px_30px_rgba(120,60,0,0.35)]"
        style={{
          transform: `rotate(${rotation}deg)`,
          transition: targetPrizeId
            ? `transform ${reduce ? 400 : SPIN_MS}ms cubic-bezier(0.16, 0.84, 0.24, 1)`
            : "none",
          willChange: "transform",
        }}
        onTransitionEnd={() => onSpinComplete?.()}
      >
        <defs>
          <linearGradient id="sl-orange" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#FF9A4D" />
            <stop offset="1" stopColor="#F15A00" />
          </linearGradient>
          <linearGradient id="sl-gold" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#FFD874" />
            <stop offset="1" stopColor="#EBA310" />
          </linearGradient>
          <linearGradient id="sl-dark" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#2C2521" />
            <stop offset="1" stopColor="#151010" />
          </linearGradient>
          <linearGradient id="sl-graph" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#4C403A" />
            <stop offset="1" stopColor="#2C2420" />
          </linearGradient>
          <linearGradient id="sl-rust" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#DA6A1E" />
            <stop offset="1" stopColor="#A23C04" />
          </linearGradient>
          <radialGradient id="bezel" cx="0.5" cy="0.42" r="0.6">
            <stop offset="0" stopColor="#5A473A" />
            <stop offset="0.7" stopColor="#2A1E15" />
            <stop offset="1" stopColor="#120C08" />
          </radialGradient>
          <radialGradient id="sheen" cx="0.5" cy="0.42" r="0.62">
            <stop offset="0" stopColor="#FFFFFF" stopOpacity="0.24" />
            <stop offset="0.5" stopColor="#FFFFFF" stopOpacity="0" />
            <stop offset="1" stopColor="#000000" stopOpacity="0.26" />
          </radialGradient>
          <radialGradient id="hub" cx="0.5" cy="0.38" r="0.7">
            <stop offset="0" stopColor="#FFF0BE" />
            <stop offset="0.55" stopColor="#F6BE2C" />
            <stop offset="1" stopColor="#D6870A" />
          </radialGradient>
          {slices.map((s) => (
            <path key={`arc-${s.prize.id}`} id={`arc-${s.prize.id}`} d={labelArc(s.start, s.end, s.mid, R_LABEL)} />
          ))}
        </defs>

        {/* Aro metálico */}
        <circle cx={C} cy={C} r={R_RIM} fill="url(#bezel)" />
        <circle cx={C} cy={C} r={R_RIM - 1} fill="none" stroke="rgba(255,220,170,0.18)" strokeWidth="1.5" />

        {/* Fatias */}
        {slices.map((s) => (
          <path key={s.prize.id} d={slicePath(s.start, s.end, R_TRIM)} fill={s.fill} stroke="#160F0A" strokeWidth="1.5" />
        ))}

        {/* Brilho em cúpula por cima das fatias */}
        <circle cx={C} cy={C} r={R_TRIM} fill="url(#sheen)" pointerEvents="none" />
        {/* Borda interna do aro */}
        <circle cx={C} cy={C} r={R_TRIM} fill="none" stroke="rgba(255,236,205,0.35)" strokeWidth="2" />

        {/* Luzes do aro */}
        {studs.map((st, i) => (
          <g key={i}>
            <circle cx={st.x} cy={st.y} r="4.6" fill={st.gold ? "#F5C518" : "#FFF6E6"} opacity="0.28" />
            <circle cx={st.x} cy={st.y} r="2.6" fill={st.gold ? "#FFE083" : "#FFF6E6"} stroke="#3A2A12" strokeWidth="0.6" />
          </g>
        ))}

        {/* Rótulos curvados */}
        {slices.map((s) => (
          <text
            key={`t-${s.prize.id}`}
            fill={s.ink}
            fontSize="13"
            fontFamily="'Russo One', sans-serif"
            fontWeight="700"
            letterSpacing="0.5"
          >
            <textPath href={`#arc-${s.prize.id}`} startOffset="50%" textAnchor="middle" className="uppercase">
              {s.prize.name}
            </textPath>
          </text>
        ))}

        {/* Cubo central */}
        <circle cx={C} cy={C} r={R_HUB + 5} fill="#160F0A" />
        <circle cx={C} cy={C} r={R_HUB} fill="url(#hub)" stroke="#8A5605" strokeWidth="1.5" />
        <circle cx={C} cy={C} r={R_HUB} fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="1" strokeDasharray="2 96" />
        <circle cx={C} cy={C} r="7" fill="#B4740A" />
        <circle cx={C - 2} cy={C - 2.5} r="2.4" fill="#FFF0BE" opacity="0.8" />
      </svg>
    </div>
  );
}
