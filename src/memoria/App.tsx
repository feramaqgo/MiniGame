import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { ArrowRight, Brain } from "lucide-react";
import MemoriaGame from "./MemoriaGame";
import { requireSession } from "../shared/lib/session";
import { sfx } from "../shared/lib/sfx";
import { destinoAposVitoria } from "../shared/lib/vitoria";
import { StoryScreen } from "../shared/components/StoryScreen";
import { MusicHUD } from "../shared/components/MusicHUD";

export default function App() {
  const [sessionChecked, setSessionChecked] = useState(false);
  const [etapa, setEtapa] = useState<"story" | "intro" | "jogando">("story");

  useEffect(() => {
    if (requireSession()) setSessionChecked(true);
  }, []);

  if (!sessionChecked) return null;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center py-10 px-4 relative overflow-hidden">
      <MusicHUD src="/Música para o Jogo da Memória.mp3" />
      {etapa === "story" ? (
        <StoryScreen 
          avatarSrc="/Rino para o Jogo da Memória.png"
          lines={[
            "Bem-vindo ao Jogo da Memória Feramaq!",
            "Sua missão aqui é simples: encontre todos os pares de equipamentos.",
            "Se você encontrar todos os 6 pares, eu libero o seu acesso pra roleta de prêmios.",
            "Preparado?"
          ]}
          onComplete={() => setEtapa("intro")}
        />
      ) : etapa === "intro" ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md card-arcade rounded-3xl p-6 md:p-8 pt-8 text-center space-y-6 relative overflow-hidden"
        >
          <div className="faixa-perigo absolute top-0 inset-x-0 h-2.5" />
          <div className="inline-flex items-center gap-2 bg-[#FF6801] text-white px-4 py-1.5 rounded-full font-display text-xs font-bold uppercase tracking-wider mx-auto">
            <Brain className="w-3.5 h-3.5" />
            <span>Jogo da Memória</span>
          </div>

          <h1 className="font-display text-3xl md:text-4xl uppercase leading-tight tracking-tight font-bold text-[#23201B]">
            Encontre <span className="text-[#FF6801]">os pares</span>
          </h1>

          <p className="font-sans text-sm text-[#4A4438] leading-relaxed">
            Toque nas cartas pra virar e encontre os <strong>6 pares</strong> de equipamentos Feramaq.
            Achou todos, você ganha a chance de girar a roleta de prêmios. Sem tempo, sem pressa.
          </p>

          <button
            onClick={() => {
              sfx.click();
              setEtapa("jogando");
            }}
            className="btn-laranja w-full font-display text-lg md:text-xl uppercase tracking-widest px-8 py-4 rounded-xl flex items-center justify-center gap-3 cursor-pointer"
          >
            <span>Começar</span>
            <ArrowRight className="w-5 h-5" />
          </button>

          <p className="text-xs text-[#6E675C] uppercase tracking-widest font-sans">
            Pode embaralhar e tentar quantas vezes quiser
          </p>
        </motion.div>
      ) : (
        <MemoriaGame onWin={() => (window.location.href = destinoAposVitoria())} />
      )}
    </div>
  );
}
