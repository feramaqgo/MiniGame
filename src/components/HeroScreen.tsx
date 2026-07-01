/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { motion } from "motion/react";
import { ArrowRight, Flame, Gauge, ShieldCheck, Wrench } from "lucide-react";

interface HeroScreenProps {
  onAdvance: () => void;
}

export default function HeroScreen({ onAdvance }: HeroScreenProps) {
  return (
    <div className="w-full min-h-screen flex flex-col justify-center py-12 px-4 md:px-12 relative overflow-hidden">
      {/* Decorative ambient background elements */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-[#FF6801] opacity-5 blur-[120px] rounded-full pointer-events-none" />

      <div className="max-w-6xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-12 items-center relative z-10">
        {/* Content Side */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="lg:col-span-7 flex flex-col items-start text-left space-y-6 bg-[#FFFAF0]/75 backdrop-blur-md border border-black/5 rounded-3xl p-6 md:p-10 shadow-xl"
        >
          {/* Eyebrow badge */}
          <div className="inline-flex items-center gap-2 bg-[#FF6801] text-black px-4 py-1.5 rounded-full font-display text-xs font-bold uppercase tracking-wider unit-badge">
            <Flame className="w-3.5 h-3.5 fill-black animate-pulse" />
            <span>APENAS 1 UNIDADE NESSA CONDIÇÃO</span>
          </div>

          {/* Heading */}
          <h1 className="font-display text-5xl md:text-7xl lg:text-[64px] text-[#1A1208] uppercase leading-[0.95] tracking-tight font-bold">
            Sua empresa pode garantir um{" "}
            <span className="text-[#FF6801]">
              upgrade gratuito.
            </span>
          </h1>

          {/* Subtitle */}
          <p className="font-sans text-lg md:text-xl text-[#4A4030] max-w-xl leading-relaxed">
            Compre uma <span className="text-[#1A1208] font-bold">FMCT 2000</span> e dispute a condição de levar o aprimoramento para a <span className="text-[#8A6500] font-bold">FMCT 3000</span>. Entre em campo, chute e veja se faz o gol.
          </p>

          {/* Call to Action with glowing hover */}
          <div className="w-full sm:w-auto space-y-4">
            <button
              onClick={onAdvance}
              className="w-full sm:w-auto bg-[#FF6801] hover:bg-[#e05c01] text-white font-display text-xl md:text-2xl uppercase tracking-widest px-10 py-5 rounded-xl flex items-center justify-center gap-3 transition-all duration-300 cursor-pointer btn-glow hover:scale-[1.03] active:scale-[0.98]"
            >
              <svg viewBox="0 0 100 100" className="w-6 h-6 fill-white shrink-0">
                <circle cx="50" cy="50" r="48" fill="currentColor" />
                <polygon points="50,38 60,45 56,57 44,57 40,45" fill="#FF6801" />
                <line x1="50" y1="38" x2="50" y2="20" stroke="#FF6801" strokeWidth="3.5" />
                <line x1="60" y1="45" x2="76" y2="38" stroke="#FF6801" strokeWidth="3.5" />
                <line x1="56" y1="57" x2="68" y2="72" stroke="#FF6801" strokeWidth="3.5" />
                <line x1="44" y1="57" x2="32" y2="72" stroke="#FF6801" strokeWidth="3.5" />
                <line x1="40" y1="45" x2="24" y2="38" stroke="#FF6801" strokeWidth="3.5" />
              </svg>
              <span>CHUTAR PARA GANHAR</span>
              <ArrowRight className="w-5 h-5 animate-pulse" />
            </button>

            <p className="text-xs text-[#6B6048] uppercase tracking-widest font-sans font-medium">
              Mais desempenho e melhor custo-benefício pelo mesmo movimento de compra.
            </p>
          </div>
        </motion.div>

        {/* Visual Side (Hero Machine Transition mockup) */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="lg:col-span-5 flex justify-center"
        >
          <div className="w-full max-w-[380px] bg-[#FFFAF0]/90 border border-black/5 rounded-3xl p-6 relative overflow-hidden shadow-2xl backdrop-blur-sm">
            {/* Visual accent lines */}
            <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-[#FF6801] to-[#F5C518]" />

            <div className="flex justify-between items-center mb-6">
              <span className="font-display text-xs uppercase tracking-widest text-[#6B6048]">
                Sua Evolução
              </span>
              <span className="bg-[#1F7A3D]/10 text-[#1F7A3D] font-display text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border border-[#1F7A3D]/25">
                100% Grátis
              </span>
            </div>

            {/* Before / Upgrade-Arrow / After */}
            <div className="flex items-center gap-3">
              {/* FMCT 2000 */}
              <div className="flex-1 text-center">
                <span className="block font-display text-[9px] text-[#857a5e] uppercase tracking-wider mb-1.5">Você compra</span>
                <div className="bg-black/[0.03] border border-black/5 rounded-2xl py-4">
                  <p className="font-display text-3xl font-bold text-[#857a5e]">2000</p>
                  <p className="font-display text-[9px] text-[#857a5e] uppercase tracking-wider mt-0.5">Padrão</p>
                </div>
              </div>

              {/* Upgrade Arrow */}
              <div className="flex flex-col items-center gap-1.5 shrink-0 pt-4">
                <div className="w-10 h-10 rounded-full bg-[#FF6801] flex items-center justify-center btn-glow">
                  <ArrowRight className="w-5 h-5 text-white" />
                </div>
                <span className="font-display text-[8px] text-[#FF6801] uppercase tracking-wider font-bold">Grátis</span>
              </div>

              {/* FMCT 3000 */}
              <div className="flex-1 text-center relative">
                <div className="absolute -top-1.5 -right-1.5 bg-[#FF6801] text-white font-display text-[8px] font-bold uppercase px-2 py-0.5 rounded-full tracking-wider rotate-6 shadow-md z-10">
                  Upgrade
                </div>
                <span className="block font-display text-[9px] text-[#8A6500] uppercase tracking-wider mb-1.5">Você leva</span>
                <div className="bg-gradient-to-b from-[#FF6801]/10 to-[#F5C518]/15 border-2 border-[#FF6801] rounded-2xl py-4 btn-glow">
                  <p className="font-display text-3xl font-bold text-[#FF6801]">3000</p>
                  <p className="font-display text-[9px] text-[#8A6500] uppercase tracking-wider font-bold mt-0.5">Aprimorada</p>
                </div>
              </div>
            </div>

            {/* Value-prop stat chips */}
            <div className="grid grid-cols-3 gap-2 mt-5">
              <div className="bg-black/[0.03] border border-black/5 rounded-xl p-2.5 text-center">
                <Gauge className="w-4 h-4 text-[#FF6801] mx-auto mb-1" />
                <p className="text-[9px] text-[#4A4030] font-sans font-bold leading-tight">43% mais alcance</p>
              </div>
              <div className="bg-black/[0.03] border border-black/5 rounded-xl p-2.5 text-center">
                <Wrench className="w-4 h-4 text-[#FF6801] mx-auto mb-1" />
                <p className="text-[9px] text-[#4A4030] font-sans font-bold leading-tight">- Manutenção</p>
              </div>
              <div className="bg-black/[0.03] border border-black/5 rounded-xl p-2.5 text-center">
                <ShieldCheck className="w-4 h-4 text-[#FF6801] mx-auto mb-1" />
                <p className="text-[9px] text-[#4A4030] font-sans font-bold leading-tight">Garantia Nacional</p>
              </div>
            </div>

            {/* Micro disclaimer */}
            <p className="text-[10px] text-[#857a5e] text-center mt-5 leading-relaxed font-sans">
              *Condição aplicável mediante fechamento comercial acelerado. Apenas uma unidade qualificada para este aprimoramento gratuito.
            </p>
          </div>
        </motion.div>
      </div>

      {/* Fixed Decorative Wheel badge */}
      <div className="hidden lg:flex absolute bottom-12 right-12 w-40 h-40 opacity-15 pointer-events-none">
        <div className="w-full h-full border-2 border-dashed border-[#FF6801] rounded-full flex items-center justify-center">
          <div className="w-28 h-28 border border-[#FF6801] rounded-full flex items-center justify-center font-display text-[9px] text-center p-3 text-[#FF6801] uppercase tracking-wider leading-relaxed">
            FMCT 3000<br />MAX POWER
          </div>
        </div>
      </div>
    </div>
  );
}
