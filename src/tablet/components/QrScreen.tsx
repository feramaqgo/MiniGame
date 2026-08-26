import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { Gift, ScanLine, Smartphone, Trophy, PlayCircle } from "lucide-react";
import { sfx } from "../../shared/lib/sfx";
import BotaoInstalar from "../../shared/components/BotaoInstalar";
import AttractorMode from "./AttractorMode";

const TEMPO_INATIVIDADE_ATRADOR = 5 * 60 * 1000;

interface QrScreenProps {
  onJaEscaneei: () => void;
  /** Equipe: abre o encerramento com o campeão do dia. */
  onVerCampeao: () => void;
}

const passos = [
  { icon: Smartphone, texto: "Escaneie o QR code e cadastre-se no seu celular" },
  { icon: ScanLine, texto: "Receba seu código e digite aqui no tablet" },
  { icon: Trophy, texto: "Vença um jogo e gire a roleta de prêmios!" },
];

/** Tela de descanso do tablet: QR gigante convidando o visitante. */
export default function QrScreen({ onJaEscaneei, onVerCampeao }: QrScreenProps) {
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [isAttractorActive, setIsAttractorActive] = useState(false);

  useEffect(() => {
    let timeout: NodeJS.Timeout;

    const resetTimer = () => {
      clearTimeout(timeout);
      setIsAttractorActive(false);
      timeout = setTimeout(() => setIsAttractorActive(true), TEMPO_INATIVIDADE_ATRADOR);
    };

    const events = ["touchstart", "mousedown", "keydown", "mousemove", "scroll"];
    events.forEach(e => window.addEventListener(e, resetTimer, { capture: true }));
    
    resetTimer();

    return () => {
      clearTimeout(timeout);
      events.forEach(e => window.removeEventListener(e, resetTimer, { capture: true }));
    };
  }, []);

  useEffect(() => {
    QRCode.toDataURL(window.location.origin, {
      width: 640,
      margin: 1,
      color: { dark: "#1A1208", light: "#FFFFFF" },
    })
      .then(setQrDataUrl)
      .catch((err) => console.error("Erro ao gerar QR code:", err));
  }, []);

  return (
    <div className="tela-arcade flex flex-col items-center justify-center px-4 sm:px-6 relative overflow-hidden">
      {isAttractorActive && (
        <AttractorMode onInteraction={() => setIsAttractorActive(false)} />
      )}
      {/* Molduras de canteiro no topo e na base — enquadram o tablet no estande */}
      <div className="faixa-perigo fixed top-0 inset-x-0 h-3 z-40 pointer-events-none" />
      <div className="faixa-perigo fixed bottom-0 inset-x-0 h-3 z-40 pointer-events-none" />

      <div className="max-w-5xl w-full flex flex-col md:flex-row items-center gap-5 md:gap-8 lg:gap-14 relative z-10">
        {/* Lado esquerdo: convite + passos */}
        <div className="flex-1 space-y-4 md:space-y-6 text-center md:text-left">
          <div className="inline-flex items-center gap-2 bg-[#FF6801] text-white px-4 py-1.5 rounded-full font-display text-xs font-bold uppercase tracking-wider">
            Arcade Feramaq · Concreteshow
          </div>

          <h1 className="font-display text-3xl sm:text-4xl md:text-5xl lg:text-6xl uppercase leading-[1.05] tracking-tight font-bold text-[#1A1208]">
            Jogue e<br />
            <span className="texto-fera">ganhe brindes</span>
          </h1>

          <div className="space-y-1.5 sm:space-y-2.5 md:space-y-4">
            {passos.map((passo, i) => {
              const Icon = passo.icon;
              return (
                <div key={i} className="flex items-center gap-4 text-left max-w-md mx-auto lg:mx-0">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 md:w-11 md:h-11 rounded-xl bg-[#1A1208] text-[#F5C518] font-display text-sm sm:text-base md:text-lg font-bold flex items-center justify-center shrink-0">
                    {i + 1}
                  </div>
                  <div className="flex items-center gap-3">
                    <Icon className="w-5 h-5 text-[#FF6801] shrink-0" />
                    <p className="font-sans text-xs sm:text-sm md:text-base text-[#4A4030]">{passo.texto}</p>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="hidden lg:flex items-center gap-3 text-[#857a5e] compacta-em-tela-baixa">
            <Gift className="w-5 h-5 text-[#F5C518]" />
            <p className="font-sans text-sm uppercase tracking-widest">
              Todo mundo que vence leva um brinde
            </p>
          </div>
        </div>

        {/* Lado direito: QR + botão */}
        <div className="flex flex-col items-center gap-3 md:gap-5">
          <div className="card-arcade rounded-2xl md:rounded-3xl p-3 sm:p-4 md:p-6 pt-4 md:pt-7 relative overflow-hidden animate-[pulse-qr_3s_ease-in-out_infinite]">
            <div className="faixa-perigo absolute top-0 inset-x-0 h-2" />
            {qrDataUrl ? (
              <img
                src={qrDataUrl}
                alt="QR code — aponte a câmera do celular"
                className="quadrado-responsivo-menor rounded-xl"
              />
            ) : (
              <div className="quadrado-responsivo-menor rounded-xl bg-black/5 animate-pulse" />
            )}
            <p className="font-display text-center text-sm uppercase tracking-widest text-[#6B6048] mt-4">
              Aponte a câmera do celular
            </p>
          </div>

          <button
            onClick={() => {
              sfx.click();
              onJaEscaneei();
            }}
            className="w-full bg-[#1A1208] hover:bg-black text-[#F5C518] font-display text-lg md:text-xl uppercase tracking-widest px-6 md:px-10 py-4 md:py-5 rounded-2xl transition-all cursor-pointer shadow-[0_0_30px_rgba(245,197,24,0.25)] hover:scale-[1.02] active:scale-[0.98]"
          >
            Já escaneei →
          </button>

          <div className="flex flex-col items-center gap-1">
            <BotaoInstalar variante="discreto" />
            {/* Discreto de propósito: é da equipe, não do visitante. */}
            <button
              onClick={() => {
                sfx.click();
                onVerCampeao();
              }}
              className="inline-flex items-center gap-1.5 font-sans text-[10px] uppercase tracking-widest text-[#a89e86] hover:text-[#FF6801] transition-colors cursor-pointer px-3 py-2"
            >
              <Trophy className="w-3 h-3" />
              Campeão do dia
            </button>
            <button
              onClick={() => {
                sfx.click();
                setIsAttractorActive(true);
              }}
              className="inline-flex items-center gap-1.5 font-sans text-[10px] uppercase tracking-widest text-[#a89e86] hover:text-[#FF6801] transition-colors cursor-pointer px-3 py-2"
            >
              <PlayCircle className="w-3 h-3" />
              Play
            </button>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes pulse-qr {
          0%, 100% { box-shadow: 0 0 0 rgba(255, 104, 1, 0); }
          50% { box-shadow: 0 0 40px rgba(255, 104, 1, 0.35); }
        }
      `}</style>
    </div>
  );
}
