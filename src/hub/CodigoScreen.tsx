import { CheckCircle2, MonitorSmartphone, RefreshCcw } from "lucide-react";
import { ArcadeSession } from "../shared/types";

interface CodigoScreenProps {
  session: ArcadeSession;
  onTrocarConta: () => void;
}

/** Tela final do celular: o código de participação, gigante, pra pessoa
 * digitar no tablet do estande. */
export default function CodigoScreen({ session, onTrocarConta }: CodigoScreenProps) {
  const primeiroNome = session.name?.split(" ")[0] || "visitante";

  return (
    <div className="min-h-screen flex flex-col items-center justify-center py-12 px-4 relative overflow-hidden">
      <div className="max-w-md w-full card-arcade rounded-3xl p-6 md:p-8 pt-8 text-center space-y-6 relative z-10 overflow-hidden">
        <div className="faixa-perigo absolute top-0 inset-x-0 h-2.5" />

        <div className="inline-flex items-center gap-2 bg-emerald-600 text-white px-4 py-1.5 rounded-full font-display text-xs font-bold uppercase tracking-wider mx-auto">
          <CheckCircle2 className="w-3.5 h-3.5" />
          Cadastro confirmado
        </div>

        <div className="space-y-1">
          <h1 className="font-display text-2xl uppercase tracking-tight font-bold text-[#1A1208]">
            Pronto, {primeiroNome}!
          </h1>
          <p className="font-sans text-sm text-[#6B6048]">Este é o seu código da sorte:</p>
        </div>

        {/* O código, protagonista absoluto da tela */}
        <div className="relative bg-[#1A1208] rounded-2xl py-8 px-4 overflow-hidden">
          <div className="faixa-perigo absolute top-0 inset-x-0 h-1.5 opacity-80" />
          <p className="relative z-10 font-display text-[clamp(4rem,24vw,7rem)] leading-none font-bold text-[#F5C518] tabular-nums tracking-tight [text-shadow:0_0_40px_rgba(245,197,24,0.45)]">
            {session.codigo ?? "—"}
          </p>
          {/* varredura de brilho — chama o olho pro número */}
          <div className="absolute inset-y-0 w-1/3 bg-gradient-to-r from-transparent via-white/10 to-transparent pointer-events-none animate-[varrer_3.5s_ease-in-out_infinite]" />
          <div className="faixa-perigo absolute bottom-0 inset-x-0 h-1.5 opacity-80" />
          <style>{`@keyframes varrer { 0% { left: -35%; } 60%, 100% { left: 105%; } }`}</style>
        </div>

        {session.demo && (
          <p className="text-[11px] font-bold uppercase tracking-widest text-amber-600">
            ● Modo demo — código de demonstração
          </p>
        )}

        {session.jaGirou ? (
          <p className="font-sans text-sm text-[#6B6048]">
            Você já girou a roleta com esse código. Obrigado por participar! 🎉
          </p>
        ) : (
          <div className="flex items-start gap-3 bg-[#FF6801]/10 border border-[#FF6801]/25 rounded-xl p-4 text-left">
            <MonitorSmartphone className="w-6 h-6 text-[#FF6801] shrink-0 mt-0.5" />
            <p className="font-sans text-sm text-[#4A4030] leading-relaxed">
              <span className="font-bold text-[#1A1208]">Digite este número no tablet do estande</span>{" "}
              pra liberar os jogos. Ganhou? A roleta de prêmios é sua!
            </p>
          </div>
        )}

        <button
          onClick={onTrocarConta}
          className="inline-flex items-center gap-2 font-sans text-xs text-[#857a5e] uppercase tracking-widest hover:text-[#FF6801] transition-colors cursor-pointer"
        >
          <RefreshCcw className="w-3 h-3" />
          Entrar com outra conta
        </button>
      </div>
    </div>
  );
}
