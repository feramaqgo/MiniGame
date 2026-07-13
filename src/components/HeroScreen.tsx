/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { motion } from "motion/react";
import { ArrowRight, Gift, Target } from "lucide-react";

interface HeroScreenProps {
  onAdvance: () => void;
}

export default function HeroScreen({ onAdvance }: HeroScreenProps) {
  return (
    <div className="w-full min-h-screen flex flex-col justify-center items-center py-12 px-4 md:px-12 relative overflow-hidden">
      {/* Decorative ambient background elements */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-[#FF6801] opacity-5 blur-[120px] rounded-full pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-2xl flex flex-col items-center text-center space-y-6 bg-[#FFFAF0]/75 backdrop-blur-md border border-black/5 rounded-3xl p-6 md:p-10 shadow-xl relative z-10"
      >
        {/* Eyebrow badge */}
        <div className="inline-flex items-center gap-2 bg-[#FF6801] text-black px-4 py-1.5 rounded-full font-display text-xs font-bold uppercase tracking-wider">
          <Gift className="w-3.5 h-3.5" />
          <span>Estande Feramaq · Concreteshow</span>
        </div>

        {/* Heading */}
        <h1 className="font-display text-5xl md:text-6xl text-[#1A1208] uppercase leading-[0.95] tracking-tight font-bold">
          Chute e garanta a chance de{" "}
          <span className="text-[#FF6801]">ganhar um prêmio.</span>
        </h1>

        {/* Subtitle */}
        <p className="font-sans text-lg md:text-xl text-[#4A4030] max-w-xl leading-relaxed">
          Entre em campo, chute o pênalti e faça o gol pra girar a roleta de prêmios do estande Feramaq.
        </p>

        {/* Call to Action with glowing hover */}
        <div className="w-full sm:w-auto space-y-4">
          <button
            onClick={onAdvance}
            className="w-full sm:w-auto bg-[#FF6801] hover:bg-[#e05c01] text-white font-display text-xl md:text-2xl uppercase tracking-widest px-10 py-5 rounded-xl flex items-center justify-center gap-3 transition-all duration-300 cursor-pointer btn-glow hover:scale-[1.03] active:scale-[0.98]"
          >
            <Target className="w-6 h-6" />
            <span>CHUTAR PARA GANHAR</span>
            <ArrowRight className="w-5 h-5 animate-pulse" />
          </button>

          <p className="text-xs text-[#6B6048] uppercase tracking-widest font-sans font-medium">
            Faça o gol e concorra a um brinde na hora
          </p>
        </div>
      </motion.div>
    </div>
  );
}
