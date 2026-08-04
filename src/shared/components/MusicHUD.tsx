import { useState, useEffect, useRef } from "react";
import { Volume2, VolumeX } from "lucide-react";

interface MusicHUDProps {
  src: string;
}

export function MusicHUD({ src }: MusicHUDProps) {
  const musicRef = useRef<HTMLAudioElement | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [musicStarted, setMusicStarted] = useState(false);

  useEffect(() => {
    const handleFirstInteraction = () => {
      if (musicRef.current && !musicStarted) {
        musicRef.current.volume = 0.4;
        musicRef.current.play().catch(() => {
          // Autoplay was prevented even on interaction, ignore
        });
        setMusicStarted(true);
      }
    };

    // Listen to global interactions to start music (bypasses autoplay policies)
    window.addEventListener("click", handleFirstInteraction, { once: true });
    window.addEventListener("touchstart", handleFirstInteraction, { once: true });

    return () => {
      window.removeEventListener("click", handleFirstInteraction);
      window.removeEventListener("touchstart", handleFirstInteraction);
    };
  }, [musicStarted]);

  const toggleMute = () => {
    if (musicRef.current) {
      const nextMuted = !musicRef.current.muted;
      musicRef.current.muted = nextMuted;
      setIsMuted(nextMuted);
    }
  };

  return (
    <>
      <audio ref={musicRef} src={src} loop />

      {musicStarted && (
        <button
          onClick={toggleMute}
          aria-label={isMuted ? "Ativar som" : "Desativar som"}
          className="fixed bottom-4 right-4 z-[9999] w-12 h-12 rounded-full bg-black/60 backdrop-blur-md border-2 border-white/20 text-white flex items-center justify-center hover:bg-black/80 transition-colors cursor-pointer shadow-xl hover:scale-110 active:scale-95"
        >
          {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
        </button>
      )}
    </>
  );
}
