import { useRef } from "react";
import { motion } from "motion/react";
import { Gift, Play, Sparkles } from "lucide-react";
import RoletaWheel from "./RoletaWheel";
import VideoBackdrop from "./VideoBackdrop";
import { Prize } from "../types";

interface ResgatarScreenProps {
  prizes: Prize[];
  nome: string | null;
  onResgatar: () => void;
  isLoading: boolean;
  testMode?: boolean;
  onTest?: () => void;
}

export default function ResgatarScreen({
  prizes,
  nome,
  onResgatar,
  isLoading,
  testMode,
  onTest,
}: ResgatarScreenProps) {
  // Qualquer toque, clique ou deslize na tela dispara o giro — no tablet as
  // pessoas tocam/arrastam a roleta por instinto. A trava garante um disparo
  // só, mesmo com toque no botão (pointerdown + click) ou multi-toque.
  const disparado = useRef(false);
  const dispararGiro = () => {
    if (disparado.current || isLoading) return;
    disparado.current = true;
    onResgatar();
  };

  return (
    <div
      className="w-full min-h-screen flex flex-col justify-center items-center py-12 px-4 relative overflow-hidden cursor-pointer touch-none select-none"
      onPointerDown={(e) => {
        // Em modo teste o botão próprio decide (girar sem cadastro) — não
        // roubamos o toque dos botões pra não disparar dois fluxos.
        if (testMode && (e.target as HTMLElement).closest("button")) return;
        dispararGiro();
      }}
    >
      <VideoBackdrop src="/roleta-fundo.mp4" />
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-md bg-[#FFFAF0]/90 border border-black/5 backdrop-blur-md rounded-3xl p-6 md:p-8 shadow-2xl text-center space-y-6"
      >
        <div className="inline-flex items-center gap-2 bg-[#FF6801] text-black px-4 py-1.5 rounded-full font-display text-xs font-bold uppercase tracking-wider mx-auto">
          <Gift className="w-3.5 h-3.5" />
          <span>Você venceu!</span>
        </div>

        <h1 className="font-display uppercase tracking-tight font-bold text-[#1A1208] leading-[1.1]">
          <span className="block text-xl md:text-2xl text-[#6B6048]">
            {nome ? `Parabéns, ${nome.split(" ")[0]}!` : "Parabéns!"}
          </span>
          <span className="block text-4xl md:text-5xl texto-fera mt-1">Gire e ganhe</span>
        </h1>

        <RoletaWheel prizes={prizes} targetPrizeId={null} />

        <button
          onClick={dispararGiro}
          disabled={isLoading}
          className="w-full bg-[#FF6801] hover:bg-[#e05c01] disabled:opacity-60 text-white font-display text-lg md:text-xl uppercase tracking-widest px-8 py-4 rounded-xl flex items-center justify-center gap-3 transition-all duration-300 cursor-pointer btn-glow hover:scale-[1.02] active:scale-[0.98]"
        >
          <Sparkles className="w-5 h-5" />
          <span>{isLoading ? "Resgatando..." : "Toque para girar!"}</span>
        </button>

        {testMode && (
          <button
            onClick={onTest}
            className="w-full border-2 border-amber-500 text-amber-700 hover:bg-amber-500/10 font-display text-sm uppercase tracking-widest px-6 py-3 rounded-xl flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <Play className="w-4 h-4" />
            <span>Girar em modo teste (sem cadastro)</span>
          </button>
        )}

        <p className="text-xs text-[#6B6048] uppercase tracking-widest font-sans">
          Toque em qualquer lugar pra girar · Um giro por pessoa · Brinde na hora
        </p>
      </motion.div>
    </div>
  );
}
