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
import { clearSession, requireSession } from "../shared/lib/session";
import { getTabletSenha } from "../shared/lib/tablet";
import { ArcadeSession } from "../shared/types";
import { StoryScreen } from "../shared/components/StoryScreen";
import { MusicHUD } from "../shared/components/MusicHUD";

export default function App() {
  const [etapa, setEtapa] = useState<Etapa>("story_pre");
  const [prizes, setPrizes] = useState<Prize[]>([]);
  const [prizesLoaded, setPrizesLoaded] = useState(false);
  const [targetPrizeId, setTargetPrizeId] = useState<string | null>(null);
  const [prizeGanho, setPrizeGanho] = useState<Prize | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [resgatando, setResgatando] = useState(false);

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
          current === "resgatar" || current === "story_pre" ? "esgotado" : current
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
                "Cruze os dedos e gire a roleta. O que cair, é seu!",
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
          />
        );
      case "girando":
        return (
          <GirandoScreen
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
                `Você ganhou: ${prizeGanho?.name || "um prêmio especial"}!`,
                "Agora é só chegar ali no nosso balcão, mostrar a próxima tela para um dos nossos atendentes e retirar o seu brinde.",
                "Obrigado por jogar com a Feramaq e aproveite a Concrete Show!",
              ]}
              onComplete={() => setEtapa("resultado")}
            />
          </div>
        );
      case "resultado":
        return <ResultadoScreen prize={prizeGanho} onProximo={voltarProTablet} />;
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
