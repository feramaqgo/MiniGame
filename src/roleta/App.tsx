import { useEffect, useState } from "react";
import { Etapa, Prize } from "./types";
import ResgatarScreen from "./components/ResgatarScreen";
import GirandoScreen from "./components/GirandoScreen";
import ResultadoScreen from "./components/ResultadoScreen";
import Confetti from "./components/Confetti";
import JaParticipouScreen from "./components/JaParticipouScreen";
import EsgotadoScreen from "./components/EsgotadoScreen";
import ErroScreen from "./components/ErroScreen";
import { buscarPremios } from "./lib/buscarPremios";
import { girarRoleta } from "./lib/girarRoleta";
import { clearSession, getSession } from "../shared/lib/session";
import { getTabletSenha } from "../shared/lib/tablet";
import { ArcadeSession } from "../shared/types";
import { StoryScreen } from "../shared/components/StoryScreen";
import { MusicHUD } from "../shared/components/MusicHUD";

// Prêmios fictícios usados quando o modo simulado (demo/?teste=1) não
// consegue buscar os reais — a roleta nunca fica vazia numa demonstração.
const PREMIOS_DEMO: Prize[] = [
  { id: "demo-1", name: "Boné", sort_order: 1 },
  { id: "demo-2", name: "Trena", sort_order: 2 },
  { id: "demo-3", name: "Cordão", sort_order: 3 },
  { id: "demo-4", name: "Caneta", sort_order: 4 },
  { id: "demo-5", name: "Abridor", sort_order: 5 },
  { id: "demo-6", name: "Chaveiro", sort_order: 6 },
];

export default function App() {
  const [etapa, setEtapa] = useState<Etapa>("story_pre");
  const [prizes, setPrizes] = useState<Prize[]>([]);
  const [prizesLoaded, setPrizesLoaded] = useState(false);
  const [targetPrizeId, setTargetPrizeId] = useState<string | null>(null);
  const [prizeGanho, setPrizeGanho] = useState<Prize | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [resgatando, setResgatando] = useState(false);

  // Modo teste (ativado por ?teste=1 na URL). Não aparece pro público do evento.
  // Nele o fluxo inteiro é simulado no navegador: nada é enviado pro servidor,
  // não gasta estoque, não trava por cadastro repetido, e pode girar à vontade.
  const [testMode] = useState(
    () => typeof window !== "undefined" && new URLSearchParams(window.location.search).get("teste") === "1"
  );
  const [spinNonce, setSpinNonce] = useState(0);

  // Sessão do tablet (código validado no /tablet) — obrigatória, exceto em
  // modo teste. Sessão de celular (sem tablet) volta pro hub, onde o código
  // da pessoa está esperando por ela.
  const [session, setSession] = useState<ArcadeSession | null>(null);
  const [sessionChecked, setSessionChecked] = useState(false);

  useEffect(() => {
    if (testMode) {
      setSessionChecked(true);
      return;
    }
    const s = getSession();
    if (!s || (!s.tablet && !s.demo)) {
      window.location.href = "/";
      return;
    }
    setSession(s);
    setSessionChecked(true);
  }, [testMode]);

  useEffect(() => {
    buscarPremios().then((result) => {
      let lista = result.prizes;
      // Modo simulado sem prêmios reais (dev sem /api, estoque vazio, etc):
      // usa a lista fictícia pra demonstração nunca quebrar.
      const simulado = testMode || !!getSession()?.demo;
      if (lista.length === 0 && simulado) {
        lista = PREMIOS_DEMO;
      }
      setPrizes(lista);
      setPrizesLoaded(true);
      if (result.ok && lista.length === 0) {
        setEtapa((current) =>
          current === "resgatar" || current === "story_pre" ? "esgotado" : current
        );
      }
    });
  }, [testMode]);

  // Fim do ciclo no tablet: limpa a sessão do visitante e volta pro QR.
  const voltarProTablet = () => {
    const url = session?.demo ? "/tablet?teste=1" : "/tablet";
    clearSession();
    window.location.href = url;
  };

  // O tablet volta sozinho pro QR; quem abriu /roleta?teste=1 avulso não sai.
  const emTablet = !!session?.tablet;

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

  // Em modo teste (?teste=1) ou sessão demo, o giro é simulado no navegador.
  const modoSimulado = testMode || !!session?.demo;

  const handleResgatar = async () => {
    if (modoSimulado) {
      girarTeste();
      return;
    }
    if (!session || session.codigo == null) return;

    setResgatando(true);
    setErrorMessage(null);

    const resultado = await girarRoleta(session.codigo, getTabletSenha());
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
      setPrizeGanho(resultado.prize);
      setTargetPrizeId(resultado.prize.id);
      setEtapa("girando");
    }
  };

  const renderScreen = () => {
    switch (etapa) {
      case "story_pre":
        return (
          <div className="w-full flex justify-center py-10 px-4 mt-8 md:mt-20">
            <StoryScreen 
              avatarSrc="/Rino para a Roleta (Antes de Girar - AnsiedadeSorte).png"
              lines={[
                "Aí sim! Você mandou muito bem no jogo e provou que é fera.",
                "Chegou a melhor hora. A nossa roleta da sorte.",
                "Cruze os dedos e gire a roleta. O que cair, é seu!"
              ]}
              onComplete={() => setEtapa("resgatar")}
            />
          </div>
        );
      case "resgatar":
        return (
          <ResgatarScreen
            prizes={prizes}
            nome={session?.name ?? null}
            onResgatar={handleResgatar}
            isLoading={resgatando}
            testMode={testMode}
            onTest={girarTeste}
          />
        );
      case "girando":
        return (
          <GirandoScreen
            key={spinNonce}
            prizes={prizes}
            targetPrizeId={targetPrizeId}
            onSpinComplete={() => setEtapa("story_post")}
          />
        );
      case "story_post":
        return (
          <div className="w-full flex justify-center py-10 px-4 mt-8 md:mt-20">
            <Confetti />
            <StoryScreen 
              avatarSrc="/Rino para a Roleta (Depois de Girar - Comemoração).png"
              lines={[
                "Uhuuu! Parabéns pelo prêmio!",
                `Você ganhou: ${prizeGanho?.name || 'um prêmio especial'}!`,
                "Agora é só chegar ali no nosso balcão, mostrar a próxima tela para um dos nossos atendentes e retirar o seu brinde.",
                "Obrigado por jogar com a Feramaq e aproveite a Concrete Show!"
              ]}
              onComplete={() => setEtapa("resultado")}
            />
          </div>
        );
      case "resultado":
        return (
          <ResultadoScreen
            prize={prizeGanho}
            testMode={modoSimulado}
            onTestAgain={emTablet ? undefined : girarTeste}
            onProximo={emTablet ? voltarProTablet : undefined}
            autoVoltarSegundos={emTablet ? 15 : undefined}
          />
        );
      case "ja_participou":
        return <JaParticipouScreen onProximo={emTablet ? voltarProTablet : undefined} />;
      case "esgotado":
        return <EsgotadoScreen onProximo={emTablet ? voltarProTablet : undefined} />;
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
            testMode={testMode}
            onTest={girarTeste}
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
      {modoSimulado && (
        <div className="fixed top-3 left-1/2 -translate-x-1/2 z-50 bg-amber-500 text-black text-[11px] font-bold uppercase tracking-widest px-3 py-1 rounded-full shadow-lg pointer-events-none">
          ● {session?.demo ? "Modo demo" : "Modo teste"} — nada é salvo
        </div>
      )}
      <main className="flex-1 flex flex-col relative z-10" id="roleta-viewport">
        {renderScreen()}
      </main>
    </div>
  );
}
