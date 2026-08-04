import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { Gift, ScanLine, Smartphone, Trophy } from "lucide-react";
import { sfx } from "../../shared/lib/sfx";

interface QrScreenProps {
  testMode: boolean;
  onJaEscaneei: () => void;
}

const passos = [
  { icon: Smartphone, texto: "Escaneie o QR code e cadastre-se no seu celular" },
  { icon: ScanLine, texto: "Receba seu código e digite aqui no tablet" },
  { icon: Trophy, texto: "Vença um jogo e gire a roleta de prêmios!" },
];

/** Tela de descanso do tablet: QR gigante convidando o visitante. */
export default function QrScreen({ testMode, onJaEscaneei }: QrScreenProps) {
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);

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
    <div className="min-h-screen flex flex-col items-center justify-center py-8 px-6 relative overflow-hidden">
      {testMode && (
        <div className="fixed top-3 left-1/2 -translate-x-1/2 z-50 bg-amber-500 text-black text-[11px] font-bold uppercase tracking-widest px-3 py-1 rounded-full shadow-lg pointer-events-none">
          ● Modo teste — nada é salvo
        </div>
      )}

      <div className="max-w-5xl w-full flex flex-col lg:flex-row items-center gap-8 lg:gap-14 relative z-10">
        {/* Lado esquerdo: convite + passos */}
        <div className="flex-1 space-y-7 text-center lg:text-left">
          <div className="inline-flex items-center gap-2 bg-[#FF6801] text-white px-4 py-1.5 rounded-full font-display text-xs font-bold uppercase tracking-wider">
            Arcade Feramaq · Concreteshow
          </div>

          <h1 className="font-display text-4xl md:text-6xl uppercase leading-[1.05] tracking-tight font-bold text-[#1A1208]">
            Jogue e<br />
            <span className="text-[#FF6801]">ganhe brindes</span>
          </h1>

          <div className="space-y-4">
            {passos.map((passo, i) => {
              const Icon = passo.icon;
              return (
                <div key={i} className="flex items-center gap-4 text-left max-w-md mx-auto lg:mx-0">
                  <div className="w-11 h-11 rounded-xl bg-[#1A1208] text-[#F5C518] font-display text-lg font-bold flex items-center justify-center shrink-0">
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

          <div className="hidden lg:flex items-center gap-3 text-[#857a5e]">
            <Gift className="w-5 h-5 text-[#F5C518]" />
            <p className="font-sans text-sm uppercase tracking-widest">
              Todo mundo que vence leva um brinde
            </p>
          </div>
        </div>

        {/* Lado direito: QR + botão */}
        <div className="flex flex-col items-center gap-6">
          <div className="card-arcade rounded-3xl p-6 pt-7 relative overflow-hidden animate-[pulse-qr_3s_ease-in-out_infinite]">
            <div className="faixa-perigo absolute top-0 inset-x-0 h-2" />
            {qrDataUrl ? (
              <img
                src={qrDataUrl}
                alt="QR code — aponte a câmera do celular"
                className="w-64 h-64 md:w-80 md:h-80 rounded-xl"
              />
            ) : (
              <div className="w-64 h-64 md:w-80 md:h-80 rounded-xl bg-black/5 animate-pulse" />
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
            className="w-full bg-[#1A1208] hover:bg-black text-[#F5C518] font-display text-xl uppercase tracking-widest px-10 py-5 rounded-2xl transition-all cursor-pointer shadow-[0_0_30px_rgba(245,197,24,0.25)] hover:scale-[1.02] active:scale-[0.98]"
          >
            Já escaneei →
          </button>
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
