/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { motion } from "motion/react";
import { CheckCircle2, ShieldAlert } from "lucide-react";

export default function ObrigadoScreen() {
  return (
    <div className="w-full min-h-screen flex flex-col justify-center py-12 px-4 md:px-12 relative overflow-hidden">
      <div className="max-w-2xl mx-auto w-full text-center space-y-6 relative z-10 bg-[#FFFAF0]/90 border border-black/5 p-8 md:p-10 rounded-2xl backdrop-blur-sm shadow-2xl">

        {/* Animated Check badge */}
        <motion.div
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          className="w-20 h-20 bg-emerald-500/10 border-2 border-emerald-500/30 text-emerald-600 rounded-full flex items-center justify-center mx-auto"
        >
          <CheckCircle2 className="w-10 h-10 animate-bounce" />
        </motion.div>

        {/* Title */}
        <motion.h2
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="font-display text-4xl md:text-5xl text-[#1A1208] uppercase tracking-tight font-bold"
        >
          Recebemos seus dados! ⚽
        </motion.h2>

        {/* Text body */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="space-y-4 font-sans text-base text-[#4A4030] leading-relaxed max-w-lg mx-auto"
        >
          <p>
            Em breve, um dos nossos consultores entrará em contato para validar sua participação e apresentar as condições da campanha.
          </p>
          
          <div className="bg-[#FF6801]/10 border border-[#FF6801]/30 rounded-xl p-4 flex items-start gap-3 text-left">
            <ShieldAlert className="w-5 h-5 text-[#FF6801] shrink-0 mt-0.5" />
            <p className="text-xs text-[#FF6801] leading-normal font-sans">
              <strong>Como existe apenas 1 unidade nessa condição, agilidade conta a seu favor.</strong> Fique atento ao seu WhatsApp e telefone para garantir prioridade.
            </p>
          </div>
        </motion.div>

        {/* Action footnote */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-[#857a5e] text-[11px] font-sans uppercase tracking-widest pt-4"
        >
          ⚡ Obrigado por participar da campanha Feramaq!
        </motion.p>

      </div>
    </div>
  );
}
