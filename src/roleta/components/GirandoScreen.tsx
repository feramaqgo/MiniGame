import { motion } from "motion/react";
import RoletaWheel from "./RoletaWheel";
import { Prize } from "../types";

interface GirandoScreenProps {
  prizes: Prize[];
  targetPrizeId: string | null;
  onSpinComplete: () => void;
}

export default function GirandoScreen({ prizes, targetPrizeId, onSpinComplete }: GirandoScreenProps) {
  return (
    <div className="w-full min-h-screen flex flex-col justify-center items-center py-12 px-4 relative overflow-hidden">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md text-center space-y-6"
      >
        <h2 className="font-display text-3xl md:text-4xl uppercase tracking-tight font-bold text-[#1A1208]">
          {targetPrizeId ? (
            <span className="texto-fera">Boa sorte!</span>
          ) : (
            "Preparando seu giro..."
          )}
        </h2>

        {/* halo pulsante atrás da roda — dá a sensação de energia girando */}
        <div className="relative">
          <div className="absolute inset-0 -m-6 rounded-full bg-[#FF6801]/20 blur-3xl animate-[energia_1.6s_ease-in-out_infinite] pointer-events-none" />
          <div className="relative">
            <RoletaWheel prizes={prizes} targetPrizeId={targetPrizeId} onSpinComplete={onSpinComplete} />
          </div>
        </div>

        <div className="flex items-center justify-center gap-2">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="w-2 h-2 rounded-full bg-[#FF6801] animate-bounce"
              style={{ animationDelay: `${i * 0.15}s` }}
            />
          ))}
          <p className="text-sm text-[#6B6048] uppercase tracking-widest font-sans ml-1">
            {targetPrizeId ? "Girando" : "Aguarde"}
          </p>
        </div>
      </motion.div>

      <style>{`
        @keyframes energia {
          0%, 100% { opacity: 0.5; transform: scale(0.95); }
          50% { opacity: 0.9; transform: scale(1.05); }
        }
      `}</style>
    </div>
  );
}
