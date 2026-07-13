import { motion } from "motion/react";
import { PartyPopper, RotateCcw } from "lucide-react";
import Confetti from "./Confetti";
import { Prize } from "../types";

interface ResultadoScreenProps {
  prize: Prize | null;
  testMode?: boolean;
  onTestAgain?: () => void;
}

export default function ResultadoScreen({ prize, testMode, onTestAgain }: ResultadoScreenProps) {
  return (
    <div className="w-full min-h-screen flex flex-col justify-center items-center py-12 px-4 relative overflow-hidden">
      <Confetti />
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative z-50 w-full max-w-md bg-[#FFFAF0]/95 border border-[#F5C518]/40 backdrop-blur-md rounded-3xl p-8 shadow-2xl text-center space-y-4"
      >
        <PartyPopper className="w-14 h-14 text-[#B8860B] mx-auto animate-bounce" />

        <h2 className="font-display text-3xl md:text-4xl uppercase tracking-wider font-bold text-[#8A6500]">
          Parabéns!
        </h2>

        <p className="font-display text-xl md:text-2xl text-[#1A1208] uppercase tracking-wide">
          Você ganhou: <span className="text-[#FF6801]">{prize?.name ?? "seu brinde"}</span>
        </p>

        <div className="bg-[#FF6801]/10 border border-[#FF6801]/30 rounded-xl p-4">
          <p className="text-sm text-[#4A4030] font-sans leading-relaxed">
            Mostre esta tela para o atendente do estande Feramaq e retire seu brinde agora mesmo.
          </p>
        </div>

        {testMode && (
          <button
            onClick={onTestAgain}
            className="w-full border-2 border-amber-500 text-amber-700 hover:bg-amber-500/10 font-display text-sm uppercase tracking-widest px-6 py-3 rounded-xl flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Testar de novo</span>
          </button>
        )}
      </motion.div>
    </div>
  );
}
