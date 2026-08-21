import { useEffect, useState } from "react";
import SenhaScreen from "./components/SenhaScreen";
import QrScreen from "./components/QrScreen";
import CodigoScreen from "./components/CodigoScreen";
import RecepcaoScreen from "./components/RecepcaoScreen";
import CampeaoScreen from "./components/CampeaoScreen";
import { getTabletSenha, clearTabletSenha } from "../shared/lib/tablet";
import { clearSession, saveSession } from "../shared/lib/session";
import { prepararCachePremios, aquecerCacheDasTelas } from "../shared/lib/premios";
import { ROTA_EQUIPE } from "../shared/lib/vitoria";
import { ArcadeSession } from "../shared/types";

type Etapa = "bloqueado" | "qr" | "codigo" | "recepcao" | "campeao";

/**
 * Tela do tablet do estande — ciclo de um visitante:
 * QR na tela → visitante escaneia e se cadastra no celular → "Já escaneei"
 * → digita o código recebido → recepção do Rino → escolhe um jogo → vence
 * → roleta (gira pelo código) → prêmio → volta pro QR sozinho.
 */
export default function App() {
  // Rota secreta da equipe: abre o menu direto, sem código de visitante.
  // Serve pra demonstrar e testar os jogos — nada é gravado nesse modo
  // (sem pontuação no placar, sem giro de roleta, sem gastar brinde).
  const modoEquipe =
    typeof window !== "undefined" && window.location.pathname.startsWith(ROTA_EQUIPE);

  const [etapa, setEtapa] = useState<Etapa>(() => {
    if (modoEquipe) return "recepcao";
    return getTabletSenha() ? "qr" : "bloqueado";
  });
  const [visitante, setVisitante] = useState<{ codigo: number; nome: string | null } | null>(null);

  // Modo equipe precisa de uma sessão pra os jogos abrirem (eles exigem
  // sessão de tablet), mas marcada como `equipe` pra não sujar nada.
  useEffect(() => {
    if (!modoEquipe) return;
    saveSession({
      idToken: "tablet",
      celular: "tablet",
      name: "Equipe Feramaq",
      email: null,
      picture: null,
      codigo: 0,
      tablet: true,
      equipe: true,
    });
  }, [modoEquipe]);

  // Todo início de ciclo no QR limpa a sessão do visitante anterior.
  useEffect(() => {
    if (etapa === "qr") {
      clearSession();
      setVisitante(null);
    }
  }, [etapa]);

  // Enquanto o tablet está parado na tela do QR — ninguém esperando, rede
  // disponível — ele se prepara pra sobreviver à queda do wi-fi: guarda a
  // lista de brindes e baixa as telas dos jogos pro cache do navegador.
  useEffect(() => {
    if (etapa !== "qr") return;
    void prepararCachePremios();
    void aquecerCacheDasTelas();
  }, [etapa]);

  const handleCodigoValido = (codigo: number, nome: string | null, offline?: boolean) => {
    const session: ArcadeSession = {
      idToken: "tablet",
      celular: "tablet",
      name: nome,
      email: null,
      picture: null,
      codigo,
      tablet: true,
      // Entrou sem rede: o giro vai pela fila e o servidor confere depois.
      validadoOffline: offline || undefined,
    };
    saveSession(session);
    setVisitante({ codigo, nome });
    setEtapa("recepcao");
  };

  const handleTabletNaoAutorizado = () => {
    clearTabletSenha();
    setEtapa("bloqueado");
  };

  switch (etapa) {
    case "bloqueado":
      return <SenhaScreen onDesbloqueado={() => setEtapa("qr")} />;
    case "qr":
      return (
        <QrScreen
          onJaEscaneei={() => setEtapa("codigo")}
          onVerCampeao={() => setEtapa("campeao")}
        />
      );
    case "codigo":
      return (
        <CodigoScreen
          onVoltar={() => setEtapa("qr")}
          onCodigoValido={handleCodigoValido}
          onTabletNaoAutorizado={handleTabletNaoAutorizado}
        />
      );
    case "recepcao":
      return (
        <RecepcaoScreen
          nome={modoEquipe ? "Equipe" : visitante?.nome ?? null}
          modoEquipe={modoEquipe}
          onCancelar={() => {
            // Na rota da equipe não há ciclo de visitante pra reiniciar —
            // sair de lá significa voltar pro fluxo normal do tablet.
            if (modoEquipe) {
              clearSession();
              window.location.href = "/tablet";
              return;
            }
            setEtapa("qr");
          }}
        />
      );
    case "campeao":
      return <CampeaoScreen onVoltar={() => setEtapa("qr")} />;
  }
}
