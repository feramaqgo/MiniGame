import { useEffect, useState } from "react";
import { CheckCircle2, MonitorSmartphone, PartyPopper, RefreshCcw } from "lucide-react";
import Confetti from "../roleta/components/Confetti";
import { ArcadeSession } from "../shared/types";

interface CodigoScreenProps {
  session: ArcadeSession;
  onTrocarConta: () => void;
}

/** De quanto em quanto tempo o celular pergunta se o brinde já saiu. */
const INTERVALO_MS = 4000;

/**
 * Tela do celular: mostra o código pra digitar no tablet e, depois do giro,
 * VIRA O COMPROVANTE do brinde.
 *
 * Por que a virada acontece aqui: o tablet fica preso no totem, então a
 * pessoa não tem como levá-lo até o atendente. O comprovante precisa viajar
 * com ela — e o celular já está na mão dela desde o cadastro. Enquanto esta
 * tela estiver aberta, ela pergunta ao servidor se o giro aconteceu; assim
 * que o brinde sai no tablet, aparece aqui sozinho.
 *
 * Se o celular estiver sem internet ou sem bateria, o caminho alternativo é
 * a foto da tela do tablet — por isso lá o texto manda fotografar, não
 * "mostrar a tela".
 */
export default function CodigoScreen({ session, onTrocarConta }: CodigoScreenProps) {
  const primeiroNome = session.name?.split(" ")[0] || "visitante";
  const [premio, setPremio] = useState<string | null>(null);

  // Fica de olho no giro. Para assim que o brinde chega — não há mais o que
  // esperar, e o estande não precisa de tráfego à toa.
  useEffect(() => {
    if (!session.codigo || premio) return;

    let vivo = true;

    const consultar = async () => {
      try {
        const r = await fetch("/api/meu-premio", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ codigo: session.codigo, celular: session.celular }),
        });
        if (!r.ok) return;
        const d = await r.json();
        if (vivo && d?.premio) setPremio(d.premio);
      } catch {
        /* sem rede agora: o celular tenta de novo no próximo ciclo, e a foto
           da tela do tablet continua valendo como comprovante */
      }
    };

    void consultar();
    const t = window.setInterval(consultar, INTERVALO_MS);
    return () => {
      vivo = false;
      window.clearInterval(t);
    };
  }, [session.codigo, session.celular, premio]);

  // ------------------------------------------------------------------
  // Brinde saiu: esta tela vira o comprovante
  // ------------------------------------------------------------------
  if (premio) {
    return (
      <div className="tela-arcade flex flex-col items-center justify-center px-4 relative overflow-hidden">
        <Confetti />
        <div className="max-w-md w-full card-arcade rounded-3xl p-5 md:p-8 pt-7 md:pt-8 text-center space-y-3 md:space-y-4 relative z-10 overflow-hidden">
          <div className="faixa-perigo absolute top-0 inset-x-0 h-2.5" />
          <PartyPopper className="w-12 h-12 md:w-14 md:h-14 text-[#B8860B] mx-auto animate-bounce" />

          <div className="space-y-1">
            <p className="font-sans text-[11px] uppercase tracking-[0.2em] text-[#857a5e]">
              {primeiroNome}, você ganhou
            </p>
            <p className="font-display text-[clamp(1.75rem,min(9vw,7vh),3rem)] leading-tight uppercase font-bold text-[#FF6801] [text-shadow:0_2px_16px_rgba(255,104,1,0.35)]">
              {premio}
            </p>
          </div>

          {/* O código continua visível: é ele que identifica a pessoa na
              retirada, junto com o nome do brinde. */}
          <div className="bg-[#1A1208] rounded-xl py-2.5 px-4">
            <p className="font-sans text-[10px] uppercase tracking-widest text-[#F5C518]/70">
              Código
            </p>
            <p className="font-display text-2xl md:text-3xl font-bold text-[#F5C518] tabular-nums leading-none">
              {session.codigo}
            </p>
          </div>

          <div className="bg-[#FF6801]/10 border border-[#FF6801]/30 rounded-xl p-3 md:p-4">
            <p className="text-sm text-[#4A4030] font-sans leading-relaxed">
              <span className="font-bold">Retire seu brinde</span> com a equipe do estande Feramaq.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ------------------------------------------------------------------
  // Ainda não girou: o código pra digitar no tablet
  // ------------------------------------------------------------------
  return (
    <div className="tela-arcade flex flex-col items-center justify-center px-4 relative overflow-hidden">
      <div className="max-w-md w-full card-arcade rounded-3xl p-5 md:p-8 pt-7 md:pt-8 text-center space-y-3 md:space-y-5 relative z-10 overflow-hidden">
        <div className="faixa-perigo absolute top-0 inset-x-0 h-2.5" />

        <div className="inline-flex items-center gap-2 bg-emerald-600 text-white px-4 py-1.5 rounded-full font-display text-xs font-bold uppercase tracking-wider mx-auto">
          <CheckCircle2 className="w-3.5 h-3.5" />
          Cadastro confirmado
        </div>

        <div className="space-y-1">
          <h1 className="font-display text-xl md:text-2xl uppercase tracking-tight font-bold text-[#1A1208]">
            Pronto, {primeiroNome}!
          </h1>
          <p className="font-sans text-sm text-[#6B6048]">Este é o seu código da sorte:</p>
        </div>

        {/* O código, protagonista absoluto da tela */}
        <div className="relative bg-[#1A1208] rounded-2xl py-4 md:py-7 px-4 overflow-hidden">
          <div className="faixa-perigo absolute top-0 inset-x-0 h-1.5 opacity-80" />
          <p className="relative z-10 font-display text-[clamp(3rem,min(24vw,18vh),7rem)] leading-none font-bold text-[#F5C518] tabular-nums tracking-tight [text-shadow:0_0_40px_rgba(245,197,24,0.45)]">
            {session.codigo ?? "—"}
          </p>
          {/* varredura de brilho — chama o olho pro número */}
          <div className="absolute inset-y-0 w-1/3 bg-gradient-to-r from-transparent via-white/10 to-transparent pointer-events-none animate-[varrer_3.5s_ease-in-out_infinite]" />
          <div className="faixa-perigo absolute bottom-0 inset-x-0 h-1.5 opacity-80" />
          <style>{`@keyframes varrer { 0% { left: -35%; } 60%, 100% { left: 105%; } }`}</style>
        </div>

        {session.jaGirou ? (
          <p className="font-sans text-sm text-[#6B6048]">
            Você já girou a roleta com esse código. Obrigado por participar! 🎉
          </p>
        ) : (
          <div className="flex items-start gap-3 bg-[#FF6801]/10 border border-[#FF6801]/25 rounded-xl p-3 md:p-4 text-left compacta-em-tela-baixa">
            <MonitorSmartphone className="w-6 h-6 text-[#FF6801] shrink-0 mt-0.5" />
            <p className="font-sans text-sm text-[#4A4030] leading-relaxed">
              <span className="font-bold text-[#1A1208]">Digite este número no tablet do estande</span>{" "}
              pra liberar os jogos. Ganhou? Seu brinde aparece aqui nesta tela!
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
