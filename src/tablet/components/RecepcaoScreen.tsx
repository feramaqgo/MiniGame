import { ArrowRight, Brain, Cable, Grid3x3, RotateCcw, Target } from "lucide-react";
import { sfx } from "../../shared/lib/sfx";

interface RecepcaoScreenProps {
  nome: string | null;
  onCancelar: () => void;
}

const jogos = [
  {
    titulo: "Chute para Ganhar",
    descricao: "Marque um gol de pênalti contra o Rino goleiro.",
    href: "/chute",
    icon: Target,
  },
  {
    titulo: "Jogo da Memória",
    descricao: "Encontre os pares dos equipamentos Feramaq.",
    href: "/memoria",
    icon: Brain,
  },
  {
    titulo: "Mangote de Concreto",
    descricao: "Guie o mangote e colete as porções de concreto.",
    href: "/cobrinha",
    icon: Cable,
  },
  {
    titulo: "Jogo da Velha",
    descricao: "Vença a máquina no clássico da velha.",
    href: "/velha",
    icon: Grid3x3,
  },
];

/** Recepção do Rino: cumprimenta o visitante pelo nome e abre o menu. */
export default function RecepcaoScreen({ nome, onCancelar }: RecepcaoScreenProps) {
  const primeiroNome = nome?.split(" ")[0] || "visitante";

  return (
    <div className="min-h-screen flex flex-col items-center justify-center py-10 px-6 relative overflow-hidden">
      <div className="max-w-4xl w-full space-y-8 relative z-10">
        {/* Rino + balão de fala */}
        <div className="flex items-center justify-center gap-4 md:gap-6 animate-[entrar_0.5s_ease-out]">
          <img
            src="/rinoceronte-goleiro.png"
            alt="Rino, o mascote da Feramaq"
            className="w-28 h-28 md:w-40 md:h-40 object-contain drop-shadow-[0_12px_24px_rgba(0,0,0,0.25)] animate-[balancar_3s_ease-in-out_infinite]"
          />
          <div className="relative card-arcade rounded-2xl rounded-bl-sm px-5 py-4 md:px-7 md:py-5 max-w-md">
            <p className="font-display text-xl md:text-2xl uppercase tracking-tight font-bold text-[#1A1208]">
              Olá, <span className="text-[#FF6801]">{primeiroNome}</span>! Eu sou o Rino! 🦏
            </p>
            <p className="font-sans text-sm md:text-base text-[#6B6048] mt-1">
              Vença <span className="font-bold text-[#1A1208]">um jogo</span> e gire a roleta de prêmios!
            </p>
          </div>
        </div>

        {/* Menu de jogos */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-5">
          {jogos.map((jogo, i) => {
            const Icon = jogo.icon;
            return (
              <a
                key={jogo.href}
                href={jogo.href}
                onClick={() => sfx.click()}
                style={{ animationDelay: `${0.1 + i * 0.08}s` }}
                className="group relative overflow-hidden card-arcade rounded-2xl p-5 md:p-6 pt-6 md:pt-7 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_24px_50px_-20px_rgba(43,38,33,0.5)] flex items-center gap-4 opacity-0 animate-[entrar_0.4s_ease-out_forwards]"
              >
                <div className="faixa-perigo absolute top-0 inset-x-0 h-1.5" />
                <div className="w-14 h-14 rounded-xl bg-[#FF6801]/12 flex items-center justify-center shrink-0">
                  <Icon className="w-7 h-7 text-[#FF6801]" />
                </div>
                <div className="flex-1 space-y-1">
                  <h2 className="font-display text-lg md:text-xl uppercase tracking-tight font-bold text-[#23201B]">
                    {jogo.titulo}
                  </h2>
                  <p className="font-sans text-sm text-[#4A4438] leading-snug">{jogo.descricao}</p>
                </div>
                <ArrowRight className="w-5 h-5 text-[#FF6801] group-hover:translate-x-1 transition-transform shrink-0" />
              </a>
            );
          })}
        </div>

        <button
          onClick={() => {
            sfx.click();
            onCancelar();
          }}
          className="mx-auto flex items-center gap-2 font-sans text-xs text-[#857a5e] uppercase tracking-widest hover:text-[#FF6801] transition-colors cursor-pointer"
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
