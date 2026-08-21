import { motion } from "motion/react";
import { ArrowRight, Camera, PartyPopper, WifiOff } from "lucide-react";
import Confetti from "./Confetti";
import VideoBackdrop from "./VideoBackdrop";
import { Prize } from "../types";

interface ResultadoScreenProps {
  prize: Prize | null;
  /** Código do participante — identifica a pessoa na hora de retirar. */
  codigo?: number | null;
  /** Libera a tela pro próximo visitante — ação da equipe do estande. */
  onProximo?: () => void;
  /** Sorteado no tablet, sem rede: sobe pela fila quando a conexão voltar. */
  offline?: boolean;
}

/**
 * Tela final: mostra o prêmio até o atendente liberar.
 *
 * De propósito NÃO existe contagem regressiva nem botão grande no meio: o
 * visitante precisa dessa tela como comprovante pra retirar o brinde, e um
 * toque acidental (ou um timer estourando) faria ele perder a prova. Quem
 * libera é a equipe, no botão discreto do canto.
 */
export default function ResultadoScreen({ prize, codigo, onProximo, offline }: ResultadoScreenProps) {
  return (
    <div className="w-full min-h-screen flex flex-col justify-center items-center py-12 px-4 relative overflow-hidden">
      <VideoBackdrop src="/roleta-resultado-fundo.mp4" />
      <Confetti />

      {/* Botão da equipe: pequeno, no canto, longe de onde a pessoa toca */}
      {onProximo && (
        <button
          onClick={onProximo}
          className="fixed top-3 right-3 z-[60] inline-flex items-center gap-1.5 bg-black/35 hover:bg-black/60 backdrop-blur-sm text-white/80 hover:text-white font-sans text-[10px] uppercase tracking-widest px-3 py-2 rounded-full border border-white/20 transition-colors cursor-pointer"
        >
          Próximo visitante
          <ArrowRight className="w-3 h-3" />
        </button>
      )}

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

        {/* O código identifica a pessoa na retirada — junto com o nome do
            brinde, é o que a foto precisa conter. */}
        {codigo != null && (
          <div className="bg-[#1A1208] rounded-xl py-2.5 px-4">
            <p className="font-sans text-[10px] uppercase tracking-widest text-[#F5C518]/70">
              Código
            </p>
            <p className="font-display text-3xl font-bold text-[#F5C518] tabular-nums leading-none">
              {codigo}
            </p>
          </div>
        )}

        <div className="bg-[#FF6801]/10 border border-[#FF6801]/30 rounded-xl p-4">
          <p className="text-sm text-[#4A4030] font-sans leading-relaxed flex items-center justify-center gap-2">
            <Camera className="w-5 h-5 text-[#FF6801] shrink-0" />
            <span>
              <span className="font-bold">Tire uma foto desta tela</span> — seu brinde também
              aparece no seu celular.
            </span>
          </p>
        </div>

        {/* O brinde vale igual: o registro sobe sozinho quando a rede voltar */}
        {offline && (
          <p className="flex items-center justify-center gap-1.5 text-[11px] uppercase tracking-widest text-amber-600 font-sans">
            <WifiOff className="w-3 h-3" />
            Salvo no aparelho — envia sozinho quando a rede voltar
          </p>
        )}
      </motion.div>
    </div>
  );
}
