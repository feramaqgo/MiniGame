import { useEffect, useState } from "react";
import { Etapa, Prize } from "./types";
import ResgatarScreen from "./components/ResgatarScreen";
import GirandoScreen from "./components/GirandoScreen";
import ResultadoScreen from "./components/ResultadoScreen";
import JaParticipouScreen from "./components/JaParticipouScreen";
import EsgotadoScreen from "./components/EsgotadoScreen";
import ErroScreen from "./components/ErroScreen";
import { buscarPremios } from "./lib/buscarPremios";
import { girarRoleta } from "./lib/girarRoleta";
import { clearSession, requireSession } from "../shared/lib/session";
import { getTabletSenha } from "../shared/lib/tablet";
import { ArcadeSession } from "../shared/types";
import { MusicHUD } from "../shared/components/MusicHUD";

export default function App() {
  const [etapa, setEtapa] = useState<Etapa>("resgatar");
  const [prizes, setPrizes] = useState<Prize[]>([]);
  const [prizesLoaded, setPrizesLoaded] = useState(false);
  const [targetPrizeId, setTargetPrizeId] = useState<string | null>(null);
  const [prizeGanho, setPrizeGanho] = useState<Prize | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [resgatando, setResgatando] = useState(false);
  /** Giro sorteado no tablet sem rede — a fila leva depois. */
  const [offlineFlag, setOfflineFlag] = useState(false);

  // Sessão criada no tablet (código validado em /tablet). É o único caminho:
  // quem chega sem ela volta pro hub, onde o código da pessoa está esperando.
  const [session, setSession] = useState<ArcadeSession | null>(null);
  const [sessionChecked, setSessionChecked] = useState(false);

  useEffect(() => {
    const s = requireSession();
    if (s) {
      setSession(s);
      setSessionChecked(true);
    }
  }, []);

  useEffect(() => {
    buscarPremios().then((result) => {
      setPrizes(result.prizes);
      setPrizesLoaded(true);
      if (result.ok && result.prizes.length === 0) {
        setEtapa((current) =>
          current === "resgatar" ? "esgotado" : current
        );
      }
    });
  }, []);

  // Fim do ciclo no tablet: limpa a sessão do visitante e volta pro QR.
  const voltarProTablet = () => {
    clearSession();
    window.location.href = "/tablet";
  };

  const handleResgatar = async () => {
    if (!session || session.codigo == null || resgatando) return;

    setResgatando(true);
    setErrorMessage(null);

    const resultado = await girarRoleta(
      session.codigo,
      getTabletSenha(),
      !!session.validadoOffline
    );
    setResgatando(false);

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
      setOfflineFlag(!!resultado.offline);
      setPrizeGanho(resultado.prize);
      setTargetPrizeId(resultado.prize.id);
      setEtapa("girando");
    }
  };

  const renderScreen = () => {
    switch (etapa) {
      case "resgatar":
        return (
          <ResgatarScreen
            prizes={prizes}
            nome={session?.name ?? null}
            onResgatar={handleResgatar}
            isLoading={resgatando}
          />
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
        return <ResultadoScreen
            prize={prizeGanho}
            codigo={session?.codigo ?? null}
            onProximo={voltarProTablet}
            offline={offlineFlag}
          />;
      case "ja_participou":
        return <JaParticipouScreen onProximo={voltarProTablet} />;
      case "esgotado":
        return <EsgotadoScreen onProximo={voltarProTablet} />;
      case "erro":
        return (
          <ErroScreen message={errorMessage || undefined} onRetry={() => setEtapa("resgatar")} />
        );
      default:
        return (
          <ResgatarScreen
            prizes={prizes}
            nome={session?.name ?? null}
            onResgatar={handleResgatar}
            isLoading={resgatando}
          />
        );
    }
  };

  if (!prizesLoaded || !sessionChecked) {
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
      <MusicHUD src="/Música para a Roleta.mp3" />
      <main className="flex-1 flex flex-col relative z-10" id="roleta-viewport">
        {renderScreen()}
      </main>
    </div>
  );
}
