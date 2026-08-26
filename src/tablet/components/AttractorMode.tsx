import { useEffect, useState, useRef } from "react";

interface AttractorModeProps {
  onInteraction: () => void;
}

export default function AttractorMode({ onInteraction }: AttractorModeProps) {
  const [stateIndex, setStateIndex] = useState(0); // 0, 1, 2
  const [prizesRemaining, setPrizesRemaining] = useState<number | null>(null);
  const [lastWinner, setLastWinner] = useState<{name: string, prizeName: string} | null>(null);
  const [prizes, setPrizes] = useState<{name: string}[]>([]);

  const v0Ref = useRef<HTMLVideoElement>(null);
  const v1Ref = useRef<HTMLVideoElement>(null);
  const v2Ref = useRef<HTMLVideoElement>(null);

  // Stop propagation e fecha no toque
  useEffect(() => {
    const handle = (e: Event) => {
      e.preventDefault();
      e.stopPropagation();
      onInteraction();
    };
    const overlay = document.getElementById("attractor-overlay");
    if (overlay) {
      overlay.addEventListener("pointerdown", handle, { capture: true });
      overlay.addEventListener("keydown", handle, { capture: true });
    }
    return () => {
      if (overlay) {
        overlay.removeEventListener("pointerdown", handle, { capture: true });
        overlay.removeEventListener("keydown", handle, { capture: true });
      }
    };
  }, [onInteraction]);

  // Busca dados e gera QR Code
  useEffect(() => {
    fetch("/api/prizes")
      .then(r => r.json())
      .then(d => {
        if (d.ok && d.prizes) {
          setPrizes(d.prizes);
          const total = d.prizes.reduce((acc: number, p: any) => acc + (p.remaining_stock || 0), 0);
          setPrizesRemaining(total);
        }
      })
      .catch(console.error);

    fetch("/api/ultimo-ganhador")
      .then(r => r.json())
      .then(d => {
        if (d.ok && d.winner) {
          setLastWinner(d.winner);
        }
      })
      .catch(console.error);
  }, []);

  // Loop de estados e controle dos vídeos
  useEffect(() => {
    // Durações: Estado 0 (8s), Estado 1 (6s), Estado 2 (10s)
    const durations = [8000, 6000, 10000];
    const timer = setTimeout(() => {
      setStateIndex((prev) => (prev + 1) % 3);
    }, durations[stateIndex]);

    const refs = [v0Ref.current, v1Ref.current, v2Ref.current];
    refs.forEach((v, i) => {
      if (v) {
        if (i === stateIndex) {
          v.play().catch(() => {});
        } else {
          v.pause();
        }
      }
    });

    return () => clearTimeout(timer);
  }, [stateIndex]);

  return (
    <div 
      id="attractor-overlay"
      className="fixed inset-0 z-[100] bg-[#FF6801] overflow-hidden select-none touch-none"
    >
      {/* ESTADO 1: Acenando (~8s) */}
      <div 
        className={`absolute inset-0 flex flex-col items-center justify-end pb-[10vh] transition-opacity duration-700 ${stateIndex === 0 ? 'opacity-100 z-10' : 'opacity-0 z-0'}`}
      >
        <video 
          ref={v0Ref}
          src="/rino-acenando.mp4" 
          poster="/rino-acenando.jpg"
          loop 
          playsInline 
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-x-0 bottom-[8vh] flex justify-center text-center">
          <h1 className="font-display text-[14vw] leading-[0.9] uppercase font-bold text-white drop-shadow-[0_10px_20px_rgba(0,0,0,0.5)] w-[95%] break-words motion-safe:animate-[pulse-scale_2s_ease-in-out_infinite]">
            Ganhe um<br/>brinde<br/>agora
          </h1>
        </div>
      </div>

      {/* ESTADO 2: Provocando (~6s) */}
      <div 
        className={`absolute inset-0 flex flex-col items-center justify-end transition-opacity duration-700 ${stateIndex === 1 ? 'opacity-100 z-10' : 'opacity-0 z-0'}`}
      >
        <video 
          ref={v1Ref}
          src="/rino-provocando.mp4" 
          poster="/rino-provocando.jpg"
          loop 
          playsInline 
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-x-0 bottom-0 pb-[8vh] pt-[15vh] bg-gradient-to-t from-black/80 to-transparent space-y-[4vh]">
          {prizesRemaining !== null && (
            <h2 className="font-display text-[10vw] leading-none uppercase font-bold text-white text-center drop-shadow-xl px-4">
              Faltam {prizesRemaining} brindes hoje
            </h2>
          )}
          
          {/* Carrossel de prêmios */}
          {prizes.length > 0 && (
             <div className="w-full overflow-hidden whitespace-nowrap bg-black/40 py-[2vh] backdrop-blur-sm border-y border-white/10">
                <div className="inline-block animate-[marquee_15s_linear_infinite] text-[6vw] font-sans font-bold text-white uppercase tracking-widest px-4">
                   {prizes.map(p => p.name).join(" • ")} • {prizes.map(p => p.name).join(" • ")}
                </div>
             </div>
          )}

          {/* Bônus: Último Ganhador */}
          {lastWinner && (
            <div className="flex justify-center mt-[2vh]">
              <div className="bg-[#FF6801] text-white px-[5vw] py-[2vh] rounded-2xl text-[4.5vw] font-sans font-bold shadow-2xl border-4 border-white/20 text-center mx-[4vw]">
                {lastWinner.name} acabou de ganhar {lastWinner.prizeName}!
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ESTADO 3: Apontando (~10s) */}
      <div 
        className={`absolute inset-0 flex flex-col items-center justify-end pb-[10vh] transition-opacity duration-700 ${stateIndex === 2 ? 'opacity-100 z-10' : 'opacity-0 z-0'}`}
      >
        <video 
          ref={v2Ref}
          src="/rino-apontando.mp4" 
          poster="/rino-apontando.jpg"
          loop 
          playsInline 
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-x-0 bottom-[8vh] flex justify-center text-center">
          <h1 className="font-display text-[12vw] leading-[0.9] uppercase font-bold text-white drop-shadow-[0_10px_20px_rgba(0,0,0,0.5)] w-[95%] break-words motion-safe:animate-[pulse-scale_2s_ease-in-out_infinite]">
            Toque na tela<br/>para jogar
          </h1>
        </div>
      </div>

      <style>{`
        @keyframes marquee {
          0% { transform: translateX(0%); }
          100% { transform: translateX(-50%); }
        }
        @keyframes pulse-qr-large {
          0%, 100% { box-shadow: 0 0 0 rgba(255, 255, 255, 0); }
          50% { box-shadow: 0 0 80px rgba(255, 255, 255, 0.5); }
        }
        @keyframes pulse-scale {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.04); }
        }
      `}</style>
    </div>
  );
}
