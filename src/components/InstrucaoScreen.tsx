/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { motion } from "motion/react";
import { HelpCircle as HelpIcon, Keyboard as KeyIcon, MousePointer as MouseIcon, Smartphone as TouchIcon } from "lucide-react";

interface InstrucaoScreenProps {
  onAdvance: () => void;
}

export default function InstrucaoScreen({ onAdvance }: InstrucaoScreenProps) {
  return (
    <div className="w-full min-h-screen flex flex-col justify-center py-12 px-4 md:px-12 relative overflow-hidden">
      <div className="max-w-4xl mx-auto w-full text-center space-y-8 relative z-10">

        <div className="bg-[#FFFAF0]/75 backdrop-blur-md border border-black/5 rounded-3xl p-6 md:p-10 shadow-xl space-y-6">
          {/* Animated Badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="inline-flex items-center gap-2 bg-[#F5C518]/20 border border-[#B8860B]/30 text-[#8A6500] px-4 py-1.5 rounded-full"
          >
            <HelpIcon className="w-4 h-4 animate-bounce" />
            <span className="font-display text-xs font-bold uppercase tracking-widest">
              REGRAS DA DISPUTA
            </span>
          </motion.div>

          {/* Title & Copy */}
          <div className="space-y-4">
            <motion.h2
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="font-display text-4xl md:text-6xl text-[#1A1208] uppercase leading-[0.95] tracking-tight font-bold"
            >
              É hora do pênalti.
            </motion.h2>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="font-sans text-base md:text-xl text-[#4A4030] max-w-2xl mx-auto leading-relaxed"
            >
              A mira vai de um lado para o outro. Toque na tela, clique ou aperte espaço para chutar na hora certa. Acertou o gol, você garante a chance de girar a roleta de prêmios.
            </motion.p>
          </div>
        </div>

        {/* Triple inputs graphic */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-xl mx-auto pt-4"
        >
          {/* KeyIcon */}
          <div className="bg-[#FFFAF0]/85 border border-black/5 rounded-xl p-5 flex flex-col items-center space-y-2 backdrop-blur-sm shadow-lg">
            <KeyIcon className="w-6 h-6 text-[#FF6801]" />
            <span className="font-display text-xs text-[#1A1208] uppercase tracking-wider">TECLADO</span>
            <span className="text-xs text-[#6B6048] font-sans">Aperte barra de Espaço</span>
          </div>

          {/* MouseIcon */}
          <div className="bg-[#FFFAF0]/85 border border-black/5 rounded-xl p-5 flex flex-col items-center space-y-2 backdrop-blur-sm shadow-lg">
            <MouseIcon className="w-6 h-6 text-[#FF6801]" />
            <span className="font-display text-xs text-[#1A1208] uppercase tracking-wider">MOUSE</span>
            <span className="text-xs text-[#6B6048] font-sans">Clique na área do jogo</span>
          </div>

          {/* TouchIcon */}
          <div className="bg-[#FFFAF0]/85 border border-black/5 rounded-xl p-5 flex flex-col items-center space-y-2 backdrop-blur-sm shadow-lg">
            <TouchIcon className="w-6 h-6 text-[#FF6801]" />
            <span className="font-display text-xs text-[#1A1208] uppercase tracking-wider">MOBILE</span>
            <span className="text-xs text-[#6B6048] font-sans">Toque em qualquer lugar</span>
          </div>
        </motion.div>

        {/* Action button */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4 }}
          className="pt-6 space-y-4"
        >
          <button
            onClick={onAdvance}
            className="w-full sm:w-auto bg-[#FF6801] hover:bg-[#e05c01] text-white font-display text-xl md:text-2xl uppercase tracking-widest px-12 py-5 rounded-xl transition-all btn-glow cursor-pointer hover:scale-[1.03]"
          >
            ESTOU PRONTO
          </button>
          
          <p className="text-xs text-[#6B6048] font-sans uppercase tracking-widest">
            ⚡ Pode chutar quantas vezes quiser. Sem limites!
          </p>
        </motion.div>

      </div>
    </div>
  );
}
