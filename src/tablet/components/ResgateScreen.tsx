import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { PartyPopper, Smartphone } from "lucide-react";
import Confetti from "../../roleta/components/Confetti";
import SaidaDiscreta from "../../shared/components/SaidaDiscreta";
import { sfx } from "../../shared/lib/sfx";

interface ResgateScreenProps {
  partidaId: string;
  onProximo: () => void;
}

/** Depois disso o tablet volta sozinho — ninguém precisa lembrar de liberar. */
const SEGUNDOS_ATE_LIBERAR = 45;

/**
 * O visitante venceu. Esta tela faz uma coisa só: passar a vez pro celular
 * dele.
 *
 * O brinde NÃO é revelado aqui de propósito. Ele é a recompensa do cadastro —
 * quem escaneia, se identifica e só então descobre o que ganhou. Revelar no
 * tablet mataria o motivo de escanear, e o lead (a razão do arcade existir)
 * se perderia junto.
 *
 * E é justamente por isso que o tablet libera rápido: a roleta gira no
 * celular da pessoa, então o aparelho do estande fica ocupado só pelo tempo
 * de jogo — a fila anda enquanto ela preenche o cadastro na mão dela.
 */
export default function ResgateScreen({ partidaId, onProximo }: ResgateScreenProps) {
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [restante, setRestante] = useState(SEGUNDOS_ATE_LIBERAR);

  useEffect(() => {
    sfx.vitoria();
  }, []);

  useEffect(() => {
    const url = `${window.location.origin}/?p=${encodeURIComponent(partidaId)}`;
    QRCode.toDataURL(url, {
      width: 640,
      margin: 1,
      color: { dark: "#1A1208", light: "#FFFFFF" },
    })
      .then(setQrDataUrl)
      .catch((err) => console.error("Erro ao gerar QR code:", err));
  }, [partidaId]);

  // Volta sozinho pro início: se a pessoa saiu sem escanear, o próximo não
  // encontra o tablet travado na tela de outra pessoa.
  useEffect(() => {
    const t = window.setInterval(() => {
      setRestante((s) => {
        if (s <= 1) {
          window.clearInterval(t);
          onProximo();
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => window.clearInterval(t);
  }, [onProximo]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center py-8 px-6 relative overflow-hidden">
      <div className="faixa-perigo fixed top-0 inset-x-0 h-3 z-40 pointer-events-none" />
      <div className="faixa-perigo fixed bottom-0 inset-x-0 h-3 z-40 pointer-events-none" />
      <Confetti />

      <div className="max-w-5xl w-full flex flex-col lg:flex-row items-center gap-8 lg:gap-14 relative z-10">
        <div className="flex-1 space-y-6 text-center lg:text-left">
          <div className="inline-flex items-center gap-2 bg-emerald-600 text-white px-4 py-1.5 rounded-full font-display text-xs font-bold uppercase tracking-wider">
            <PartyPopper className="w-3.5 h-3.5" />
            Você venceu!
          </div>

          <h1 className="font-display text-4xl md:text-6xl uppercase leading-[1.05] tracking-tight font-bold text-[#1A1208]">
            Seu brinde<br />
            <span className="texto-fera">está esperando</span>
          </h1>

          <div className="flex items-start gap-3 bg-[#FF6801]/10 border border-[#FF6801]/25 rounded-xl p-5 max-w-md mx-auto lg:mx-0 text-left">
            <Smartphone className="w-7 h-7 text-[#FF6801] shrink-0 mt-0.5" />
            <p className="font-sans text-base text-[#4A4030] leading-relaxed">
              <span className="font-bold text-[#1A1208]">Escaneie o QR com seu celular</span> pra
              girar a roleta e descobrir qual brinde você ganhou.
            </p>
          </div>

          <p className="font-sans text-xs uppercase tracking-widest text-[#857a5e]">
            O tablet libera em {restante}s pro próximo visitante
          </p>
        </div>

        <div className="flex flex-col items-center gap-4">
          <div className="card-arcade rounded-3xl p-6 pt-7 relative overflow-hidden">
            <div className="faixa-perigo absolute top-0 inset-x-0 h-2" />
            {qrDataUrl ? (
              <img
                src={qrDataUrl}
                alt="QR code — escaneie pra girar a roleta"
                className="w-64 h-64 md:w-80 md:h-80 rounded-xl"
              />
            ) : (
              <div className="w-64 h-64 md:w-80 md:h-80 rounded-xl bg-black/5 animate-pulse" />
            )}
            <p className="font-display text-center text-sm uppercase tracking-widest text-[#6B6048] mt-4">
              Aponte a câmera do celular
            </p>
          </div>

          <SaidaDiscreta onClick={onProximo}>Próximo participante</SaidaDiscreta>
        </div>
      </div>
    </div>
  );
}
