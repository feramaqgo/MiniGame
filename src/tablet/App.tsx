import { useEffect, useState } from "react";
import SenhaScreen from "./components/SenhaScreen";
import AtracaoScreen from "./components/AtracaoScreen";
import RecepcaoScreen from "./components/RecepcaoScreen";
import ResgateScreen from "./components/ResgateScreen";
import CampeaoScreen from "./components/CampeaoScreen";
import { getTabletSenha } from "../shared/lib/tablet";
import { getPartida, limparPartida, novaPartida } from "../shared/lib/session";
import { prepararCachePremios } from "../shared/lib/premios";
import { ROTA_EQUIPE } from "../shared/lib/vitoria";

type Etapa = "bloqueado" | "atracao" | "recepcao" | "resgate" | "campeao";

/**
 * Tela do tablet do estande. Ciclo de um visitante:
 *
 *   "Toque para jogar" → escolhe o jogo → joga → vence → QR de resgate
 *   → (o celular assume daqui) → tablet volta pro início.
 *
 * A inversão em relação ao fluxo anterior: NÃO se pede nada pra jogar. Nem
 * cadastro, nem código digitado. Quem chega, joga. O cadastro só acontece
 * depois da vitória, no celular do visitante, e é ele que libera o giro da
 * roleta — a pessoa já investiu tempo e tem o brinde à vista, então o atrito
 * custa menos ali.
 *
 * Isso também tira o gargalo: o tablet é um recurso compartilhado e agora
 * fica ocupado só pelo tempo de jogo. O preenchimento do cadastro acontece
 * na mão da pessoa, em paralelo com o próximo jogador.
 */
export default function App() {
  // Rota secreta da equipe: abre o menu direto pra demonstrar e testar.
  // Nada é gravado nesse modo — sem placar, sem brinde.
  const modoEquipe =
    typeof window !== "undefined" && window.location.pathname.startsWith(ROTA_EQUIPE);

  // O jogo devolve o visitante pra cá com ?resgate=1 depois de vencer.
  const voltouDeVitoria =
    typeof window !== "undefined" &&
    new URLSearchParams(window.location.search).get("resgate") === "1";

  const [etapa, setEtapa] = useState<Etapa>(() => {
    if (modoEquipe) return "recepcao";
    if (!getTabletSenha()) return "bloqueado";
    // Voltou de uma vitória com a partida ainda aberta: mostra o QR.
    if (voltouDeVitoria && getPartida()) return "resgate";
    return "atracao";
  });

  const [partidaId, setPartidaId] = useState<string | null>(() => getPartida()?.id ?? null);

  // Modo equipe precisa de uma partida aberta pra os jogos rodarem, mas
  // marcada como `equipe` pra não sujar o placar nem gastar brinde.
  useEffect(() => {
    if (modoEquipe && !getPartida()?.equipe) {
      novaPartida(true);
    }
  }, [modoEquipe]);

  // Aquece o cache de brindes enquanto o tablet está ocioso e com rede.
  useEffect(() => {
    if (etapa === "atracao") void prepararCachePremios();
  }, [etapa]);

  /** Começa o ciclo de um visitante novo. */
  const comecarPartida = () => {
    const p = novaPartida();
    setPartidaId(p.id);
    setEtapa("recepcao");
  };

  /** Libera o aparelho pro próximo — a partida atual já foi registrada. */
  const proximoVisitante = () => {
    limparPartida();
    setPartidaId(null);
    // Tira o ?resgate=1 da URL pra um refresh não reabrir a tela do QR.
    if (voltouDeVitoria) {
      window.location.href = "/tablet";
      return;
    }
    setEtapa("atracao");
  };

  switch (etapa) {
    case "bloqueado":
      return <SenhaScreen onDesbloqueado={() => setEtapa("atracao")} />;

    case "atracao":
      return (
        <AtracaoScreen onJogar={comecarPartida} onVerCampeao={() => setEtapa("campeao")} />
      );

    case "recepcao":
      return (
        <RecepcaoScreen
          modoEquipe={modoEquipe}
          onCancelar={() => {
            if (modoEquipe) {
              limparPartida();
              window.location.href = "/tablet";
              return;
            }
            proximoVisitante();
          }}
        />
      );

    case "resgate":
      // Sem partida não há o que resgatar (recarregou a URL solta).
      return partidaId ? (
        <ResgateScreen partidaId={partidaId} onProximo={proximoVisitante} />
      ) : (
        <AtracaoScreen onJogar={comecarPartida} onVerCampeao={() => setEtapa("campeao")} />
      );

    case "campeao":
      return <CampeaoScreen onVoltar={() => setEtapa("atracao")} />;
  }
}
