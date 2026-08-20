import { Gamepad2, Gift, Trophy, Zap } from "lucide-react";
import { sfx } from "../../shared/lib/sfx";
import BotaoInstalar from "../../shared/components/BotaoInstalar";
import SaidaDiscreta from "../../shared/components/SaidaDiscreta";
import Placar from "./Placar";

interface AtracaoScreenProps {
  onJogar: () => void;
  /** Equipe: abre o encerramento com o campeão do dia. */
  onVerCampeao: () => void;
}

const passos = [
  { icon: Gamepad2, texto: "Escolha um dos quatro jogos e vença" },
  { icon: Gift, texto: "Escaneie o QR com seu celular pra girar a roleta" },
  { icon: Trophy, texto: "Retire seu brinde na hora com o atendente" },
];

/**
 * Tela de descanso do tablet — o convite pra quem passa no corredor.
 *
 * Aqui não se pede nada: nem cadastro, nem código, nem QR. A pessoa chega e
 * joga. O cadastro só aparece depois da vitória, no celular dela, quando já
 * investiu tempo e tem o brinde à vista — é o que reduz o atrito e faz mais
 * gente entrar.
 */
export default function AtracaoScreen({ onJogar, onVerCampeao }: AtracaoScreenProps) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center py-8 px-6 relative overflow-hidden">
      {/* Molduras de canteiro — enquadram o tablet no estande */}
      <div className="faixa-perigo fixed top-0 inset-x-0 h-3 z-40 pointer-events-none" />
      <div className="faixa-perigo fixed bottom-0 inset-x-0 h-3 z-40 pointer-events-none" />

      <div className="max-w-6xl w-full grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] items-center gap-8 lg:gap-12 relative z-10">
        {/* Chamada + botão gigante */}
        <div className="space-y-7 text-center lg:text-left">
          <div className="inline-flex items-center gap-2 bg-[#FF6801] text-white px-4 py-1.5 rounded-full font-display text-xs font-bold uppercase tracking-wider">
            Arcade Feramaq · Concreteshow
          </div>

          <h1 className="font-display text-5xl md:text-7xl uppercase leading-[1.03] tracking-tight font-bold text-[#1A1208]">
            Jogue e<br />
            <span className="texto-fera">ganhe brindes</span>
          </h1>

          <div className="space-y-3.5">
            {passos.map((passo, i) => {
              const Icon = passo.icon;
              return (
                <div key={i} className="flex items-center gap-4 max-w-md mx-auto lg:mx-0 text-left">
                  <div className="w-10 h-10 rounded-xl bg-[#1A1208] text-[#F5C518] font-display text-base font-bold flex items-center justify-center shrink-0">
                    {i + 1}
                  </div>
                  <div className="flex items-center gap-3">
                    <Icon className="w-5 h-5 text-[#FF6801] shrink-0" />
                    <p className="font-sans text-base text-[#4A4030]">{passo.texto}</p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* O botão é o herói da tela: é a única coisa que a pessoa precisa
              fazer pra começar. */}
          <button
            onClick={() => {
              sfx.click();
              onJogar();
            }}
            className="w-full max-w-md bg-[#FF6801] hover:bg-[#e05c01] text-white font-display text-2xl md:text-3xl uppercase tracking-widest px-10 py-7 rounded-2xl flex items-center justify-center gap-4 transition-all cursor-pointer btn-glow hover:scale-[1.02] active:scale-[0.98] animate-[respirar-cta_2.4s_ease-in-out_infinite]"
          >
            <Zap className="w-7 h-7" />
            Toque para jogar
          </button>

          <div className="flex flex-col items-center lg:items-start gap-0.5">
            <BotaoInstalar variante="discreto" />
            {/* Da equipe, não do visitante — por isso quase invisível. */}
            <SaidaDiscreta onClick={onVerCampeao}>Campeão do dia</SaidaDiscreta>
          </div>
        </div>

        {/* Placar: mostra que tem gente jogando e dá o que superar */}
        <Placar />
      </div>

      <style>{`
        @keyframes respirar-cta {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.025); }
        }
      `}</style>
    </div>
  );
}
