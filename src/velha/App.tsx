import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { ArrowRight, Grid3x3 } from "lucide-react";
import VelhaGame from "./VelhaGame";
import { requireSession } from "../shared/lib/session";
import { sfx } from "../shared/lib/sfx";
import { destinoAposVitoria } from "../shared/lib/vitoria";
import { StoryScreen } from "../shared/components/StoryScreen";
import { MusicHUD } from "../shared/components/MusicHUD";
import SaidaDiscreta from "../shared/components/SaidaDiscreta";
import { prepararCachePremios } from "../shared/lib/premios";

export default function App() {
  const [sessionChecked, setSessionChecked] = useState(false);
  const [etapa, setEtapa] = useState<"story" | "intro" | "jogando">("story");

  useEffect(() => {
    if (requireSession()) setSessionChecked(true);
    // Guarda a lista de brindes enquanto ainda há rede — se o wi-fi
    // cair na hora do giro, a roleta sorteia com esse cache.
    void prepararCachePremios();
  }, []);

  if (!sessionChecked) return null;

  return (
    <div className="tela-arcade flex flex-col items-center justify-center px-3 sm:px-4 relative overflow-hidden">
      <MusicHUD src="/Música para o Jogo da Velha.mp3" />
      {etapa === "story" ? (
        <StoryScreen 
          avatarSrc="/Rino para o Jogo da Velha.png"
          lines={[
            "Chegou a hora do clássico Jogo da Velha!",
            "Você vai enfrentar o mestre das obras... eu mesmo! Hahaha.",
            "Você precisa formar uma linha de 3 antes de mim. Se empatar, você pode tentar de novo.",
            "Só quem vence gira a roleta. Vamos nessa!"
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
            <Grid3x3 className="w-3.5 h-3.5" />
            <span>Jogo da Velha</span>
          </div>

          <h1 className="font-display text-3xl md:text-4xl uppercase leading-tight tracking-tight font-bold text-[#23201B]">
            Vença <span className="text-[#FF6801]">o Rino</span>
          </h1>

          <p className="font-sans text-sm text-[#4A4438] leading-relaxed">
            Você é o <strong>X</strong> e começa jogando. Faça uma linha de três antes da máquina
            pra ganhar a chance de girar a roleta de prêmios. Empatou ou perdeu? É só jogar de novo,
            sem limite.
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
        </motion.div>
      ) : (
        <VelhaGame onWin={() => (window.location.href = destinoAposVitoria())} />
      )}

      <SaidaDiscreta href="/tablet" className="mt-2">
        Trocar de jogo
      </SaidaDiscreta>
    </div>
  );
}
