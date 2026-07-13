import { ArrowRight, Gift, Target } from "lucide-react";

const jogos = [
  {
    titulo: "Chute para Ganhar",
    descricao: "Chute o pênalti e garanta a chance de resgatar o upgrade gratuito da FMCT 2000 para a FMCT 3000.",
    href: "/chute",
    icon: Target,
  },
  {
    titulo: "Roleta Concreteshow",
    descricao: "Gire a roleta no estande da Feramaq na Concreteshow e concorra a brindes na hora.",
    href: "/roleta",
    icon: Gift,
  },
];

export default function Hub() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center py-12 px-4 relative overflow-hidden">
      <div className="max-w-2xl w-full space-y-8 relative z-10">
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 bg-[#FF6801] text-black px-4 py-1.5 rounded-full font-display text-xs font-bold uppercase tracking-wider">
            Promoções Feramaq
          </div>
          <h1 className="font-display text-4xl md:text-5xl uppercase tracking-tight font-bold text-[#1A1208]">
            Escolha seu jogo
          </h1>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {jogos.map((jogo) => {
            const Icon = jogo.icon;
            return (
              <a
                key={jogo.href}
                href={jogo.href}
                className="group bg-[#FFFAF0]/90 border border-black/5 rounded-2xl p-6 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-[1.02] flex flex-col gap-4"
              >
                <div className="w-12 h-12 rounded-xl bg-[#FF6801]/10 flex items-center justify-center">
                  <Icon className="w-6 h-6 text-[#FF6801]" />
                </div>
                <div className="flex-1 space-y-1.5">
                  <h2 className="font-display text-xl uppercase tracking-tight font-bold text-[#1A1208]">
                    {jogo.titulo}
                  </h2>
                  <p className="font-sans text-sm text-[#4A4030] leading-relaxed">{jogo.descricao}</p>
                </div>
                <span className="inline-flex items-center gap-2 font-display text-sm uppercase tracking-widest text-[#FF6801] font-bold">
                  Jogar
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </span>
              </a>
            );
          })}
        </div>
      </div>
    </div>
  );
}
