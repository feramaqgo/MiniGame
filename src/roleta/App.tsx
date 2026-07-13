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

  // Modo teste (ativado por ?teste=1 na URL). Não aparece pro público do evento.
  // Nele o fluxo inteiro é simulado no navegador: nada é enviado pro servidor,
  // não gasta estoque, não trava por cadastro repetido, e pode girar à vontade.
  const [testMode] = useState(
    () => typeof window !== "undefined" && new URLSearchParams(window.location.search).get("teste") === "1"
  );
  const [spinNonce, setSpinNonce] = useState(0);

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

  // Giro simulado (modo teste): sorteia um prêmio local, sem tocar no servidor.
  const girarTeste = () => {
    if (prizes.length === 0) return;
    const p = prizes[Math.floor(Math.random() * prizes.length)];
    setErrorMessage(null);
    setPrizeGanho(p);
    setTargetPrizeId(p.id);
    setSpinNonce((n) => n + 1);
    setEtapa("girando");
  };

  const handleSubmit = async (dados: FormFields) => {
    if (testMode) {
      girarTeste();
      return;
    }

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
        return (
          <LandingScreen
            prizes={prizes}
            onAdvance={() => setEtapa("formulario")}
            testMode={testMode}
            onTest={girarTeste}
          />
        );
      case "formulario":
        return (
          <FormularioScreen onSubmit={handleSubmit} isLoading={false} errorMessage={errorMessage} />
        );
      case "girando":
        return (
          <GirandoScreen
            key={spinNonce}
            prizes={prizes}
            targetPrizeId={targetPrizeId}
            onSpinComplete={() => setEtapa("resultado")}
          />
        );
      case "resultado":
        return <ResultadoScreen prize={prizeGanho} testMode={testMode} onTestAgain={girarTeste} />;
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
      {testMode && (
        <div className="fixed top-3 left-1/2 -translate-x-1/2 z-50 bg-amber-500 text-black text-[11px] font-bold uppercase tracking-widest px-3 py-1 rounded-full shadow-lg pointer-events-none">
          ● Modo teste — nada é salvo
        </div>
      )}
      <main className="flex-1 flex flex-col relative z-10" id="roleta-viewport">
        {renderScreen()}
      </main>
    </div>
  );
}
