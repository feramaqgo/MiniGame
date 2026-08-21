import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { ArrowRight, Cable, Hand, Keyboard } from "lucide-react";
import MangoteGame from "./MangoteGame";
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
      <MusicHUD src="/Música para a Cobrinha (Mangote).mp3" />
      {etapa === "story" ? (
        <StoryScreen 
          avatarSrc="/Rino para o Jogo da Cobrinha (Mangote).png"
          lines={[
            "Você sabia que nossos equipamentos estão nas maiores obras do país?",
            "Mas hoje, tivemos um pequeno problema... O mangote de concreto escapou da máquina!",
            "Ele precisa de você para comer as porções de concreto e crescer. Vamos ajudá-lo a voltar pra obra?"
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
            <Cable className="w-3.5 h-3.5" />
            <span>Mangote de Concreto</span>
          </div>

          <h1 className="font-display text-3xl md:text-4xl uppercase leading-tight tracking-tight font-bold text-[#23201B]">
            Guie o mangote <span className="text-[#FF6801]">e cresça</span>
          </h1>

          <p className="font-sans text-sm text-[#4A4438] leading-relaxed">
            Conduza o mangote pelas porções de concreto. Cada porção faz ele crescer. Bombeie
            <strong> 6 porções</strong> sem bater nas paredes nem em você mesmo pra ganhar a chance de
            girar a roleta de prêmios.
          </p>

          <div className="grid grid-cols-2 gap-3">
            <div className="bg-black/[0.04] border border-black/5 rounded-xl p-4 flex flex-col items-center gap-2">
              <Hand className="w-6 h-6 text-[#FF6801]" />
              <span className="font-display text-xs text-[#23201B] uppercase tracking-wider">Celular</span>
              <span className="text-[11px] text-[#6E675C] font-sans text-center leading-tight">
                Deslize ou use as setas
              </span>
            </div>
            <div className="bg-black/[0.04] border border-black/5 rounded-xl p-4 flex flex-col items-center gap-2">
              <Keyboard className="w-6 h-6 text-[#FF6801]" />
              <span className="font-display text-xs text-[#23201B] uppercase tracking-wider">Teclado</span>
              <span className="text-[11px] text-[#6E675C] font-sans text-center leading-tight">
                Setas ou W A S D
              </span>
            </div>
          </div>

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
            Perdeu? É só tentar de novo, sem limite
          </p>
        </motion.div>
      ) : (
        <MangoteGame onWin={() => (window.location.href = destinoAposVitoria())} />
      )}

      <SaidaDiscreta href="/tablet" className="mt-2">
        Trocar de jogo
      </SaidaDiscreta>
    </div>
  );
}
