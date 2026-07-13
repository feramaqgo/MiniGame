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
        <h2 className="font-display text-2xl md:text-3xl uppercase tracking-tight font-bold text-[#FFF6E6] glow-text-orange">
          {targetPrizeId ? "Boa sorte!" : "Preparando seu giro..."}
        </h2>

        <RoletaWheel prizes={prizes} targetPrizeId={targetPrizeId} onSpinComplete={onSpinComplete} />

        <p className="text-sm text-[#B8A98A] uppercase tracking-widest font-sans animate-pulse">
          {targetPrizeId ? "Girando..." : "Aguarde um instante"}
        </p>
      </motion.div>
    </div>
  );
}
