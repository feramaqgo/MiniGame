import { ArrowRight, Brain, Cable, Flame, Grid3x3, RotateCcw, Target } from "lucide-react";
import { sfx } from "../../shared/lib/sfx";
import Placar from "./Placar";

interface RecepcaoScreenProps {
  nome: string | null;
  onCancelar: () => void;
  /** Aberto pela rota secreta da equipe: nada é gravado. */
  modoEquipe?: boolean;
}

const jogos = [
  {
    titulo: "Chute para Ganhar",
    descricao: "Marque um gol de pênalti contra o Rino goleiro.",
    href: "/chute",
    icon: Target,
    dificuldade: null,
  },
  {
    titulo: "Jogo da Memória",
    descricao: "Encontre os pares dos equipamentos Feramaq.",
    href: "/memoria",
    icon: Brain,
    dificuldade: null,
  },
  {
    titulo: "Mangote de Concreto",
    descricao: "Guie o mangote e colete as porções de concreto.",
    href: "/cobrinha",
    icon: Cable,
    dificuldade: "Difícil",
  },
  {
    titulo: "Jogo da Velha",
    descricao: "Vença a máquina no clássico da velha.",
    href: "/velha",
    icon: Grid3x3,
    dificuldade: null,
  },
];

/** Recepção do Rino: cumprimenta o visitante pelo nome e abre o menu. */
export default function RecepcaoScreen({ nome, onCancelar, modoEquipe }: RecepcaoScreenProps) {
  const primeiroNome = nome?.split(" ")[0] || "visitante";

  return (
    <div className="tela-arcade flex flex-col items-center justify-center px-4 sm:px-6 relative overflow-hidden">
      <div className="max-w-6xl w-full space-y-4 md:space-y-7 relative z-10">
        {/* Rino + balão de fala */}
        <div className="flex items-center justify-center gap-4 md:gap-6 animate-[entrar_0.5s_ease-out]">
          <img
            src="/rinoceronte-goleiro.png"
            alt="Rino, o mascote da Feramaq"
            className="w-20 h-20 sm:w-28 sm:h-28 md:w-36 md:h-36 object-contain drop-shadow-[0_12px_24px_rgba(0,0,0,0.25)] animate-[balancar_3s_ease-in-out_infinite]"
          />
          <div className="relative card-arcade rounded-2xl rounded-bl-sm px-4 py-3 md:px-7 md:py-5 max-w-md">
            <p className="font-display text-base sm:text-xl md:text-2xl uppercase tracking-tight font-bold text-[#1A1208]">
              Olá, <span className="text-[#FF6801]">{primeiroNome}</span>! Eu sou o Rino! 🦏
            </p>
            <p className="font-sans text-sm md:text-base text-[#6B6048] mt-1 compacta-em-tela-baixa">
              {modoEquipe ? (
                <>
                  Modo equipe: jogue à vontade — <span className="font-bold text-[#1A1208]">nada é gravado</span>{" "}
                  (sem placar e sem brinde).
                </>
              ) : (
                <>
                  Vença <span className="font-bold text-[#1A1208]">um jogo</span> e gire a roleta de prêmios!
                </>
              )}
            </p>
          </div>
        </div>

        {/* Jogos à esquerda, placar à direita — no tablet os dois cabem lado
            a lado, e quem está escolhendo o jogo já vê quem está ganhando. */}
        <div className="grid grid-cols-1 lg:grid-cols-[1.35fr_1fr] gap-3 md:gap-5 items-start">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 md:gap-4">
            {jogos.map((jogo, i) => {
              const Icon = jogo.icon;
              return (
                <a
                  key={jogo.href}
                  href={jogo.href}
                  onClick={() => sfx.click()}
                  style={{ animationDelay: `${0.1 + i * 0.08}s` }}
                  className="group relative overflow-hidden card-arcade rounded-2xl p-3.5 md:p-5 pt-5 md:pt-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_24px_50px_-20px_rgba(43,38,33,0.5)] flex items-center gap-4 opacity-0 animate-[entrar_0.4s_ease-out_forwards]"
                >
                  <div className="faixa-perigo absolute top-0 inset-x-0 h-1.5" />
                  <div className="w-11 h-11 md:w-14 md:h-14 rounded-xl bg-[#FF6801]/12 flex items-center justify-center shrink-0">
                    <Icon className="w-6 h-6 md:w-7 md:h-7 text-[#FF6801]" />
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h2 className="font-display text-lg uppercase tracking-tight font-bold text-[#23201B]">
                        {jogo.titulo}
                      </h2>
                      {jogo.dificuldade && (
                        <span className="inline-flex items-center gap-1 bg-[#C24E00] text-white text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full shrink-0">
                          <Flame className="w-2.5 h-2.5" />
                          {jogo.dificuldade}
                        </span>
                      )}
                    </div>
                    <p className="font-sans text-xs md:text-sm text-[#4A4438] leading-snug compacta-em-tela-baixa">{jogo.descricao}</p>
                  </div>
                  <ArrowRight className="w-5 h-5 text-[#FF6801] group-hover:translate-x-1 transition-transform shrink-0" />
                </a>
              );
            })}
          </div>

          <Placar />
        </div>

        <button
          onClick={() => {
            sfx.click();
            onCancelar();
          }}
          className="mx-auto flex items-center gap-2 font-sans text-xs text-[#857a5e] uppercase tracking-widest hover:text-[#FF6801] transition-colors cursor-pointer px-3 py-2"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Novo visitante
        </button>
      </div>

      <style>{`
        @keyframes entrar {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes balancar {
          0%, 100% { transform: rotate(-2deg); }
          50% { transform: rotate(2deg); }
        }
      `}</style>
    </div>
  );
}
