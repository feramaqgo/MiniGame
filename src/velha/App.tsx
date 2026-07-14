import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { ArrowRight, Grid3x3 } from "lucide-react";
import VelhaGame from "./VelhaGame";
import { requireSession } from "../shared/lib/session";

export default function App() {
  const [sessionChecked, setSessionChecked] = useState(false);
  const [etapa, setEtapa] = useState<"intro" | "jogando">("intro");

  useEffect(() => {
    if (requireSession()) setSessionChecked(true);
  }, []);

  if (!sessionChecked) return null;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center py-10 px-4 relative overflow-hidden">
      {etapa === "intro" ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md bg-[#FFFAF0]/90 border border-black/5 rounded-3xl p-6 md:p-8 shadow-2xl text-center space-y-6"
        >
          <div className="inline-flex items-center gap-2 bg-[#FF6801] text-black px-4 py-1.5 rounded-full font-display text-xs font-bold uppercase tracking-wider mx-auto">
            <Grid3x3 className="w-3.5 h-3.5" />
            <span>Jogo da Velha</span>
          </div>

          <h1 className="font-display text-3xl md:text-4xl uppercase leading-tight tracking-tight font-bold text-[#1A1208]">
            Vença <span className="text-[#FF6801]">a máquina</span>
          </h1>

          <p className="font-sans text-sm text-[#4A4030] leading-relaxed">
            Você é o <strong>X</strong> e começa jogando. Faça uma linha de três antes da máquina
            pra ganhar a chance de girar a roleta de prêmios. Empatou ou perdeu? É só jogar de novo,
            sem limite.
          </p>

          <button
            onClick={() => setEtapa("jogando")}
            className="w-full bg-[#FF6801] hover:bg-[#e05c01] text-white font-display text-lg md:text-xl uppercase tracking-widest px-8 py-4 rounded-xl flex items-center justify-center gap-3 transition-all duration-300 cursor-pointer btn-glow hover:scale-[1.02] active:scale-[0.98]"
          >
            <span>Começar</span>
            <ArrowRight className="w-5 h-5" />
          </button>
        </motion.div>
      ) : (
        <VelhaGame onWin={() => (window.location.href = "/roleta")} />
      )}
    </div>
  );
}
