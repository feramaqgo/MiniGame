/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useRef } from "react";
import { Volume2, VolumeX } from "lucide-react";
import { Etapa, FormFields, TrackingFields } from "./types";
import HeroScreen from "./components/HeroScreen";
import InstrucaoScreen from "./components/InstrucaoScreen";
import Game from "./components/Game";
import ErroScreen from "./components/ErroScreen";
import VitoriaScreen from "./components/VitoriaScreen";
import FormularioScreen from "./components/FormularioScreen";
import ObrigadoScreen from "./components/ObrigadoScreen";
import { enviarLead } from "./lib/enviarLead";

export default function App() {
  const [etapa, setEtapa] = useState<Etapa>("hero");
  const [formError, setFormError] = useState<string | null>(null);

  // Background music — starts on the first user click (browsers block audio
  // with sound until there's a user gesture), loops for the rest of the flow.
  const musicRef = useRef<HTMLAudioElement | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [musicStarted, setMusicStarted] = useState(false);

  const startMusic = () => {
    if (musicRef.current && !musicStarted) {
      musicRef.current.volume = 0.4;
      musicRef.current.play().catch(() => {});
      setMusicStarted(true);
    }
  };

  const toggleMute = () => {
    if (musicRef.current) {
      const nextMuted = !musicRef.current.muted;
      musicRef.current.muted = nextMuted;
      setIsMuted(nextMuted);
    }
  };

  // UTM & tracking parameters capture
  const [tracking, setTracking] = useState<TrackingFields>({
    utm_source: null,
    utm_medium: null,
    utm_campaign: null,
    utm_content: null,
    utm_term: null,
    userAgent: "",
    url: ""
  });

  useEffect(() => {
    // Capture URLSearchParams on component load
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      setTracking({
        utm_source: params.get("utm_source"),
        utm_medium: params.get("utm_medium"),
        utm_campaign: params.get("utm_campaign"),
        utm_content: params.get("utm_content"),
        utm_term: params.get("utm_term"),
        userAgent: navigator.userAgent || "Unknown User Agent",
        url: window.location.href
      });
    }
  }, []);

  // Handle form submission
  const handleFormSubmit = async (dados: FormFields) => {
    setEtapa("enviando");
    setFormError(null);

    try {
      const response = await enviarLead(dados, tracking);

      if (response.ok) {
        setEtapa("obrigado");
      } else {
        // Fallback or submission error simulation
        setFormError(response.message || "Erro ao salvar seus dados. Tente novamente.");
        setEtapa("formulario");
      }
    } catch (err) {
      console.error("Erro durante o envio do formulário:", err);
      setFormError("Não foi possível conectar ao servidor. Verifique sua conexão.");
      setEtapa("formulario");
    }
  };

  // Render the current screen based on the single state `etapa`
  const renderScreen = () => {
    switch (etapa) {
      case "hero":
        return (
          <HeroScreen
            onAdvance={() => {
              startMusic();
              setEtapa("instrucao");
            }}
          />
        );
      case "instrucao":
        return <InstrucaoScreen onAdvance={() => setEtapa("jogando")} />;
      case "jogando":
        return (
          <div className="w-full min-h-screen flex flex-col justify-center py-12 px-4 md:px-12 relative overflow-hidden">
            <div className="max-w-3xl mx-auto w-full space-y-6 relative z-10">
              <h2 className="font-display text-4xl md:text-5xl text-[#1A1208] uppercase text-center tracking-tight font-bold flex items-center justify-center gap-3 bg-[#FFFAF0]/75 backdrop-blur-md border border-black/5 rounded-2xl py-4 px-6 shadow-xl">
                <svg viewBox="0 0 100 100" className="w-8 h-8 fill-[#FF6801] shrink-0">
                  <circle cx="50" cy="50" r="48" fill="#FF6801" />
                  <polygon points="50,38 60,45 56,57 44,57 40,45" fill="#040A06" />
                  <line x1="50" y1="38" x2="50" y2="20" stroke="#040A06" strokeWidth="3.5" />
                  <line x1="60" y1="45" x2="76" y2="38" stroke="#040A06" strokeWidth="3.5" />
                  <line x1="56" y1="57" x2="68" y2="72" stroke="#040A06" strokeWidth="3.5" />
                  <line x1="44" y1="57" x2="32" y2="72" stroke="#040A06" strokeWidth="3.5" />
                  <line x1="40" y1="45" x2="24" y2="38" stroke="#040A06" strokeWidth="3.5" />
                </svg>
                <span>CHUTE DE PRECISÃO</span>
              </h2>
              <Game
                onGoal={() => setEtapa("vitoria")}
                onMiss={() => setEtapa("erro")}
              />
            </div>
          </div>
        );
      case "erro":
        return <ErroScreen onRetry={() => setEtapa("jogando")} />;
      case "vitoria":
        return <VitoriaScreen onAdvance={() => setEtapa("formulario")} />;
      case "formulario":
        return (
          <FormularioScreen
            onSubmit={handleFormSubmit}
            isLoading={false}
            errorMessage={formError}
          />
        );
      case "enviando":
        return (
          <FormularioScreen
            onSubmit={handleFormSubmit}
            isLoading={true}
            errorMessage={formError}
          />
        );
      case "obrigado":
        return <ObrigadoScreen />;
      default:
        return <HeroScreen onAdvance={() => setEtapa("instrucao")} />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-transparent text-[#2A2118] relative">
      {/* Stadium Pitch Lines Overlays */}
      <div className="stadium-lines-overlay" />
      <div className="stadium-center-circle" />

      {/* Background music */}
      <audio ref={musicRef} src="/musica-fundo.mp3" loop />

      {/* Mute toggle, visible once the music has started */}
      {musicStarted && (
        <button
          onClick={toggleMute}
          aria-label={isMuted ? "Ativar som" : "Desativar som"}
          className="fixed bottom-4 right-4 z-50 w-10 h-10 rounded-full bg-black/50 backdrop-blur-sm border border-white/20 text-white flex items-center justify-center hover:bg-black/70 transition-colors cursor-pointer"
        >
          {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
        </button>
      )}

      {/* Main Single-View viewport containing exactly one screen */}
      <main className="flex-1 flex flex-col relative z-10" id="campaign-viewport">
        {renderScreen()}
      </main>
    </div>
  );
}
