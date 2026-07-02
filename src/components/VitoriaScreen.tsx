/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from "react";
import { motion } from "motion/react";
import { Award, ArrowRight, ShieldCheck } from "lucide-react";
import Confetti from "./Confetti";

interface VitoriaScreenProps {
  onAdvance: () => void;
}

export default function VitoriaScreen({ onAdvance }: VitoriaScreenProps) {
  const [imageError, setImageError] = useState(false);

  return (
    <div className="w-full min-h-screen flex flex-col justify-center py-12 px-4 md:px-12 relative overflow-hidden">
      {/* Interactive Celebratory Confetti */}
      <Confetti />

      <div className="max-w-6xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-12 items-center relative z-10">
        
        {/* Visual machine showcase */}
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          className="lg:col-span-5 order-2 lg:order-1 flex justify-center"
        >
          <div className="w-full max-w-[380px] bg-[#FFFAF0]/90 border-2 border-emerald-500/25 rounded-2xl overflow-hidden shadow-2xl relative glow-green flex flex-col">
            {/* Top status bar */}
            <div className="bg-[#1F7A3D]/10 px-4 py-2 border-b border-black/5 flex items-center justify-between">
              <span className="font-display text-xs text-emerald-700 font-bold uppercase tracking-wider">
                Vaga Confirmada
              </span>
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
            </div>

            {/* Image section with fallback */}
            <div className="aspect-square bg-[#F1E4C8] flex items-center justify-center relative overflow-hidden">
              {!imageError ? (
                <img
                  src="/maquina-fmct.png"
                  alt="Feramaq FMCT"
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                  onError={() => setImageError(true)}
                />
              ) : (
                <div className="w-full h-full border border-dashed border-black/15 rounded-lg flex flex-col items-center justify-center text-center p-6 bg-[#FFFAF0]">
                  <div className="w-12 h-12 rounded-full bg-[#FF6801]/10 flex items-center justify-center text-[#FF6801] mb-3">
                    <Award className="w-6 h-6" />
                  </div>
                  <span className="font-display text-sm text-[#4A4030] uppercase tracking-wider mb-1">
                    FOTO DA MÁQUINA AQUI
                  </span>
                  <span className="font-sans text-[10px] text-[#857a5e] max-w-[180px] leading-tight">
                    Upgrade Garantido da FMCT 2000 para FMCT 3000
                  </span>
                </div>
              )}
            </div>

            {/* Bottom info label */}
            <div className="p-4 bg-[#F1E4C8] border-t border-black/5 text-center">
              <span className="text-xs font-display text-[#4A4030] font-bold uppercase tracking-wider">
                FMCT 3000 (Aprimorada)
              </span>
            </div>
          </div>
        </motion.div>

        {/* Celebratory Copy side */}
        <motion.div
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="lg:col-span-7 order-1 lg:order-2 flex flex-col items-start text-left space-y-6 bg-[#FFFAF0]/75 backdrop-blur-md border border-black/5 rounded-3xl p-6 md:p-10 shadow-xl"
        >
          {/* Champion Badge */}
          <div className="inline-flex items-center gap-2 bg-[#F5C518]/20 border border-[#B8860B]/30 text-[#8A6500] rounded-full px-4 py-1.5 font-bold font-display text-xs uppercase tracking-widest">
            🏆 CAMPANHA FERAMAQ
          </div>

          {/* H1 Title */}
          <h1 className="font-display text-5xl md:text-7xl text-[#1A1208] uppercase tracking-tight leading-[0.95] font-bold">
            🏆 GOOOL! <br />
            <span className="text-[#8A6500]">Você fez o gol.</span>
          </h1>

          {/* Portuguese Copy */}
          <div className="space-y-4 font-sans text-base md:text-lg text-[#4A4030] leading-relaxed">
            <p>
              Você garantiu a chance de resgatar o upgrade gratuito da <strong className="text-[#1A1208]">FMCT 2000</strong> para a <strong className="text-[#1A1208]">FMCT 3000</strong>.
            </p>
            <p className="text-[#6B6048] border-l-2 border-[#FF6801] pl-3 text-sm md:text-base">
              Existe apenas <strong>1 unidade</strong> nessa condição, e ela é de quem fechar primeiro. Preencha seus dados para um consultor Feramaq validar sua participação.
            </p>
          </div>

          {/* Primary CTA to form */}
          <div className="pt-2 w-full sm:w-auto">
            <button
              onClick={onAdvance}
              className="w-full sm:w-auto bg-[#FF6801] hover:bg-[#e05c01] text-white font-display text-lg md:text-xl uppercase tracking-widest px-10 py-5 rounded-xl flex items-center justify-center gap-3 transition-all duration-300 cursor-pointer btn-glow hover:scale-[1.03]"
            >
              <span>RESGATAR MEU UPGRADE GRÁTIS</span>
              <ArrowRight className="w-5 h-5 animate-pulse" />
            </button>
          </div>
        </motion.div>

      </div>
    </div>
  );
}
