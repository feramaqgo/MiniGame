import { motion } from "motion/react";
import { AlertCircle, RotateCcw } from "lucide-react";

interface ErroScreenProps {
  message?: string;
  onRetry: () => void;
}

export default function ErroScreen({ message, onRetry }: ErroScreenProps) {
  return (
    <div className="w-full min-h-screen flex flex-col justify-center items-center py-12 px-4 relative overflow-hidden">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-[#FFFAF0]/90 border border-black/5 backdrop-blur-md rounded-3xl p-8 shadow-2xl text-center space-y-4"
      >
        <AlertCircle className="w-12 h-12 text-rose-500 mx-auto animate-pulse" />
        <h2 className="font-display text-2xl md:text-3xl uppercase tracking-tight font-bold text-[#1A1208]">
          Ops, algo deu errado
        </h2>
        <p className="font-sans text-sm text-[#6B6048] leading-relaxed">
          {message || "Não foi possível completar sua ação. Tente novamente."}
        </p>
        <button
          onClick={onRetry}
          className="w-full sm:w-auto border-2 border-[#FF6801] hover:bg-[#FF6801]/10 text-[#FF6801] font-display text-base uppercase tracking-widest px-8 py-4 rounded-xl flex items-center justify-center gap-2 mx-auto transition-all duration-300 cursor-pointer hover:scale-[1.03]"
        >
          <RotateCcw className="w-4 h-4" />
          <span>TENTAR DE NOVO</span>
        </button>
      </motion.div>
    </div>
  );
}
