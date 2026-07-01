/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { motion } from "motion/react";
import { AlertCircle, RotateCcw } from "lucide-react";

interface ErroScreenProps {
  onRetry: () => void;
}

export default function ErroScreen({ onRetry }: ErroScreenProps) {
  return (
    <div className="w-full min-h-screen flex flex-col justify-center py-12 px-4 md:px-12 relative overflow-hidden">
      <div className="max-w-xl mx-auto w-full text-center space-y-6 relative z-10 bg-[#FFFAF0]/90 border border-black/5 p-8 rounded-2xl backdrop-blur-sm shadow-2xl">

        {/* Warning Indicator */}
        <motion.div
          initial={{ scale: 0.8, rotate: -10 }}
          animate={{ scale: 1, rotate: 0 }}
          className="w-16 h-16 bg-rose-500/10 border border-rose-500/30 text-rose-500 rounded-full flex items-center justify-center mx-auto"
        >
          <AlertCircle className="w-8 h-8 animate-pulse" />
        </motion.div>

        {/* Title */}
        <motion.h2
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="font-display text-3xl md:text-4xl text-[#1A1208] uppercase tracking-tight font-bold"
        >
          Quase! A mira passou perto.
        </motion.h2>

        {/* Description */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="font-sans text-base text-[#4A4030] leading-relaxed"
        >
          Faltou pouco para o gol. Respira e chuta de novo — a vaga continua em jogo.
        </motion.p>

        {/* Retry Button */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="pt-4"
        >
          <button
            onClick={onRetry}
            className="w-full sm:w-auto border-2 border-[#FF6801] hover:bg-[#FF6801]/10 text-[#FF6801] font-display text-base md:text-lg uppercase tracking-widest px-8 py-4 rounded-xl flex items-center justify-center gap-2 mx-auto transition-all duration-300 cursor-pointer btn-glow hover:scale-[1.03]"
          >
            <RotateCcw className="w-4 h-4" />
            <span>CHUTAR DE NOVO</span>
          </button>
        </motion.div>

      </div>
    </div>
  );
}
