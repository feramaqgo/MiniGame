import { useEffect, useState } from "react";
import { Etapa, FormFields, Prize, TrackingFields } from "./types";
import LandingScreen from "./components/LandingScreen";
import FormularioScreen from "./components/FormularioScreen";
import GirandoScreen from "./components/GirandoScreen";
import ResultadoScreen from "./components/ResultadoScreen";
import JaParticipouScreen from "./components/JaParticipouScreen";
import EsgotadoScreen from "./components/EsgotadoScreen";
import ErroScreen from "./components/ErroScreen";
import { buscarPremios } from "./lib/buscarPremios";
import { girarRoleta } from "./lib/girarRoleta";

export default function App() {
  const [etapa, setEtapa] = useState<Etapa>("landing");
  const [prizes, setPrizes] = useState<Prize[]>([]);
  const [prizesLoaded, setPrizesLoaded] = useState(false);
  const [targetPrizeId, setTargetPrizeId] = useState<string | null>(null);
  const [prizeGanho, setPrizeGanho] = useState<Prize | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [tracking, setTracking] = useState<TrackingFields>({
    utm_source: null,
    utm_medium: null,
    utm_campaign: null,
    utm_content: null,
    utm_term: null,
    userAgent: "",
    url: "",
  });

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      setTracking({
        utm_source: params.get("utm_source"),
        utm_medium: params.get("utm_medium"),
        utm_campaign: params.get("utm_campaign"),
        utm_content: params.get("utm_content"),
        utm_term: params.get("utm_term"),
        userAgent: navigator.userAgent || "Unknown User Agent",
        url: window.location.href,
      });
    }
  }, []);

  useEffect(() => {
    buscarPremios().then((result) => {
      setPrizes(result.prizes);
      setPrizesLoaded(true);
      if (result.ok && result.prizes.length === 0) {
        setEtapa((current) => (current === "landing" ? "esgotado" : current));
      }
    });
  }, []);

  const handleSubmit = async (dados: FormFields) => {
    setErrorMessage(null);
    setTargetPrizeId(null);
    setEtapa("girando");

    const resultado = await girarRoleta(dados, tracking);

    if (!resultado.ok) {
      if (resultado.reason === "ja_participou") {
        setEtapa("ja_participou");
        return;
      }
      if (resultado.reason === "esgotado") {
        setEtapa("esgotado");
        return;
      }
      setErrorMessage(resultado.message || "Erro ao girar a roleta.");
      setEtapa("erro");
      return;
    }

    if (resultado.prize) {
      setPrizeGanho(resultado.prize);
      setTargetPrizeId(resultado.prize.id);
    }
  };

  const renderScreen = () => {
    switch (etapa) {
      case "landing":
        return <LandingScreen prizes={prizes} onAdvance={() => setEtapa("formulario")} />;
      case "formulario":
        return (
          <FormularioScreen onSubmit={handleSubmit} isLoading={false} errorMessage={errorMessage} />
        );
      case "girando":
        return (
          <GirandoScreen
            prizes={prizes}
            targetPrizeId={targetPrizeId}
            onSpinComplete={() => setEtapa("resultado")}
          />
        );
      case "resultado":
        return <ResultadoScreen prize={prizeGanho} />;
      case "ja_participou":
        return <JaParticipouScreen />;
      case "esgotado":
        return <EsgotadoScreen />;
      case "erro":
        return (
          <ErroScreen message={errorMessage || undefined} onRetry={() => setEtapa("formulario")} />
        );
      default:
        return <LandingScreen prizes={prizes} onAdvance={() => setEtapa("formulario")} />;
    }
  };

  if (!prizesLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="font-sans text-sm text-[#6B6048] uppercase tracking-widest animate-pulse">
          Carregando...
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-transparent text-[#1A1208] relative">
      <main className="flex-1 flex flex-col relative z-10" id="roleta-viewport">
        {renderScreen()}
      </main>
    </div>
  );
}
