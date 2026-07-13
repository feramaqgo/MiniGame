import { motion } from "motion/react";
import { ArrowRight, Gift, Play } from "lucide-react";
import RoletaWheel from "./RoletaWheel";
import VideoBackdrop from "./VideoBackdrop";
import { Prize } from "../types";

interface LandingScreenProps {
  prizes: Prize[];
  onAdvance: () => void;
  testMode?: boolean;
  onTest?: () => void;
}

export default function LandingScreen({ prizes, onAdvance, testMode, onTest }: LandingScreenProps) {
  return (
    <div className="w-full min-h-screen flex flex-col justify-center items-center py-12 px-4 relative overflow-hidden">
      <VideoBackdrop src="/roleta-fundo.mp4" />
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-md bg-[#FFFAF0]/90 border border-black/5 backdrop-blur-md rounded-3xl p-6 md:p-8 shadow-2xl text-center space-y-6"
      >
        <div className="inline-flex items-center gap-2 bg-[#FF6801] text-black px-4 py-1.5 rounded-full font-display text-xs font-bold uppercase tracking-wider mx-auto">
          <Gift className="w-3.5 h-3.5" />
          <span>Estande Feramaq · Concreteshow</span>
        </div>

        <h1 className="font-display text-3xl md:text-4xl uppercase leading-tight tracking-tight font-bold text-[#1A1208]">
          Gire a roleta <span className="text-[#FF6801]">e ganhe na hora</span>
        </h1>

        <RoletaWheel prizes={prizes} targetPrizeId={null} />

        <button
          onClick={onAdvance}
          className="w-full bg-[#FF6801] hover:bg-[#e05c01] text-white font-display text-lg md:text-xl uppercase tracking-widest px-8 py-4 rounded-xl flex items-center justify-center gap-3 transition-all duration-300 cursor-pointer btn-glow hover:scale-[1.02] active:scale-[0.98]"
        >
          <span>Girar agora</span>
          <ArrowRight className="w-5 h-5" />
        </button>

        {testMode && (
          <button
            onClick={onTest}
            className="w-full border-2 border-amber-500 text-amber-700 hover:bg-amber-500/10 font-display text-sm uppercase tracking-widest px-6 py-3 rounded-xl flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <Play className="w-4 h-4" />
            <span>Girar em modo teste (sem cadastro)</span>
          </button>
        )}

        <p className="text-xs text-[#6B6048] uppercase tracking-widest font-sans">
          Um giro por pessoa · Brinde entregue na hora pelo atendente
        </p>
      </motion.div>
    </div>
  );
}
