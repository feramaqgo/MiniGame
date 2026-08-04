import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { ArrowRight, PartyPopper } from "lucide-react";
import Confetti from "./Confetti";
import VideoBackdrop from "./VideoBackdrop";
import { Prize } from "../types";

interface ResultadoScreenProps {
  prize: Prize | null;
  /** Volta pro início (tela do QR) pro próximo visitante. */
  onProximo?: () => void;
  /** Segundos até voltar sozinho pro início. */
  autoVoltarSegundos?: number;
}

export default function ResultadoScreen({
  prize,
  onProximo,
  autoVoltarSegundos,
}: ResultadoScreenProps) {
  const [restante, setRestante] = useState(autoVoltarSegundos ?? 0);

  // Contagem regressiva do tablet: mostra o prêmio, espera o atendente ver,
  // e devolve a tela pro QR sozinha.
  useEffect(() => {
    if (!onProximo || !autoVoltarSegundos) return;
    setRestante(autoVoltarSegundos);
    const timer = window.setInterval(() => {
      setRestante((s) => {
        if (s <= 1) {
          window.clearInterval(timer);
          onProximo();
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => window.clearInterval(timer);
  }, [onProximo, autoVoltarSegundos]);

  return (
    <div className="w-full min-h-screen flex flex-col justify-center items-center py-12 px-4 relative overflow-hidden">
      <VideoBackdrop src="/roleta-resultado-fundo.mp4" />
      <Confetti />
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative z-50 w-full max-w-md bg-[#FFFAF0]/95 border border-[#F5C518]/40 backdrop-blur-md rounded-3xl p-8 shadow-2xl text-center space-y-4"
      >
        <PartyPopper className="w-14 h-14 text-[#B8860B] mx-auto animate-bounce" />

        <h2 className="font-display text-2xl md:text-3xl uppercase tracking-wider font-bold text-[#8A6500]">
          Parabéns!
        </h2>

        {/* O prêmio é o protagonista — o atendente lê isso de longe */}
        <div className="space-y-1.5">
          <p className="font-sans text-[11px] uppercase tracking-[0.2em] text-[#857a5e]">
            Você ganhou
          </p>
          <motion.p
            initial={{ scale: 0.7, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.15, type: "spring", stiffness: 220, damping: 14 }}
            className="font-display text-3xl md:text-5xl leading-tight uppercase font-bold text-[#FF6801] [text-shadow:0_2px_16px_rgba(255,104,1,0.35)]"
          >
            {prize?.name ?? "seu brinde"}
          </motion.p>
        </div>

        <div className="bg-[#FF6801]/10 border border-[#FF6801]/30 rounded-xl p-4">
          <p className="text-sm text-[#4A4030] font-sans leading-relaxed">
            Chame o atendente do estande Feramaq e retire seu brinde agora mesmo.
          </p>
        </div>

        {onProximo && (
          <button
            onClick={onProximo}
            className="w-full bg-[#1A1208] hover:bg-black text-[#F5C518] font-display text-sm uppercase tracking-widest px-6 py-3.5 rounded-xl flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <span>Próximo visitante</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        )}

        {onProximo && restante > 0 && autoVoltarSegundos && (
          <div className="space-y-1.5">
            {/* barra que esvazia — o atendente vê quanto tempo resta na tela */}
            <div className="h-1 w-full bg-black/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-[#FF6801] rounded-full transition-[width] duration-1000 ease-linear"
                style={{ width: `${(restante / autoVoltarSegundos) * 100}%` }}
              />
            </div>
            <p className="text-[11px] text-[#857a5e] uppercase tracking-widest font-sans">
              Voltando pro início em {restante}s
            </p>
          </div>
        )}

      </motion.div>
    </div>
  );
}
