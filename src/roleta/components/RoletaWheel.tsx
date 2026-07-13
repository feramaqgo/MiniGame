import { useEffect, useMemo, useRef, useState } from "react";
import { Prize } from "../types";

interface Slice {
  prize: Prize;
  startAngle: number;
  endAngle: number;
  color: string;
}

interface RoletaWheelProps {
  prizes: Prize[];
  /** Set once the server has decided the winning prize — triggers the spin. */
  targetPrizeId: string | null;
  onSpinComplete?: () => void;
}

const CX = 150;
const CY = 150;
const R = 145;
const FULL_SPINS = 8;
const SPIN_DURATION_MS = 4500;

const PALETTE = ["#FF6801", "#1A1A1D", "#F5C518", "#2A2A2E"];

function polarToCartesian(angleDeg: number, radius: number) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return { x: CX + radius * Math.cos(rad), y: CY + radius * Math.sin(rad) };
}

function describeSlice(startAngle: number, endAngle: number) {
  const start = polarToCartesian(startAngle, R);
  const end = polarToCartesian(endAngle, R);
  const largeArcFlag = endAngle - startAngle > 180 ? 1 : 0;
  return `M ${CX},${CY} L ${start.x},${start.y} A ${R},${R} 0 ${largeArcFlag} 1 ${end.x},${end.y} Z`;
}

export default function RoletaWheel({ prizes, targetPrizeId, onSpinComplete }: RoletaWheelProps) {
  const [rotation, setRotation] = useState(0);
  const rotationRef = useRef(0);
  const hasSpunFor = useRef<string | null>(null);

  // Slices são calculadas uma vez a partir da lista de prêmios recebida
  // (já capturada estável pelo componente pai) — não recalcula durante o giro.
  const slices: Slice[] = useMemo(() => {
    const total = prizes.reduce((sum, p) => sum + (p.remaining_stock || 0), 0);
    if (total <= 0) return [];

    let cursor = 0;
    return prizes.map((prize, i) => {
      const angle = (360 * (prize.remaining_stock || 0)) / total;
      const startAngle = cursor;
      const endAngle = cursor + angle;
      cursor = endAngle;
      return { prize, startAngle, endAngle, color: PALETTE[i % PALETTE.length] };
    });
  }, [prizes]);

  useEffect(() => {
    if (!targetPrizeId || hasSpunFor.current === targetPrizeId) return;
    const winningSlice = slices.find((s) => s.prize.id === targetPrizeId);

    // Prêmio sorteado não está mais na lista local (raro: estoque mudou
    // entre o fetch de prêmios e a resposta do giro) — pula a animação.
    if (!winningSlice) {
      hasSpunFor.current = targetPrizeId;
      onSpinComplete?.();
      return;
    }

    hasSpunFor.current = targetPrizeId;

    const sliceWidth = winningSlice.endAngle - winningSlice.startAngle;
    const mid = (winningSlice.startAngle + winningSlice.endAngle) / 2;
    const maxJitter = Math.min(sliceWidth * 0.35, 15);
    const jitter = (Math.random() * 2 - 1) * maxJitter;

    const currentTurns = Math.floor(rotationRef.current / 360);
    const finalRotation = (currentTurns + FULL_SPINS) * 360 + (360 - (mid + jitter));

    rotationRef.current = finalRotation;
    setRotation(finalRotation);
  }, [targetPrizeId, slices, onSpinComplete]);

  return (
    <div className="relative w-full max-w-[320px] mx-auto aspect-square select-none">
      {/* Ponteiro fixo no topo, fora da roda giratória */}
      <div className="absolute left-1/2 -top-2 -translate-x-1/2 z-20 w-0 h-0 border-l-[14px] border-l-transparent border-r-[14px] border-r-transparent border-t-[22px] border-t-[#F5C518] drop-shadow-[0_2px_3px_rgba(0,0,0,0.5)]" />

      <svg
        viewBox="0 0 300 300"
        className="w-full h-full drop-shadow-[0_8px_20px_rgba(0,0,0,0.5)]"
        style={{
          transform: `rotate(${rotation}deg)`,
          transition: targetPrizeId ? `transform ${SPIN_DURATION_MS}ms cubic-bezier(0.17, 0.67, 0.12, 0.99)` : "none",
        }}
        onTransitionEnd={() => onSpinComplete?.()}
      >
        <circle cx={CX} cy={CY} r={R + 4} fill="#0D0D0D" />
        {slices.map((slice) => {
          const mid = (slice.startAngle + slice.endAngle) / 2;
          const labelPos = polarToCartesian(mid, R * 0.62);
          return (
            <g key={slice.prize.id}>
              <path d={describeSlice(slice.startAngle, slice.endAngle)} fill={slice.color} stroke="#0D0D0D" strokeWidth="2" />
              <text
                x={labelPos.x}
                y={labelPos.y}
                fill="#FFF6E6"
                fontSize="11"
                fontFamily="Russo One"
                textAnchor="middle"
                transform={`rotate(${mid}, ${labelPos.x}, ${labelPos.y})`}
                className="select-none uppercase"
              >
                {slice.prize.name}
              </text>
            </g>
          );
        })}
        <circle cx={CX} cy={CY} r={22} fill="#F5C518" stroke="#0D0D0D" strokeWidth="3" />
      </svg>
    </div>
  );
}
