import { useEffect, useState } from "react";
import SenhaScreen from "./components/SenhaScreen";
import QrScreen from "./components/QrScreen";
import CodigoScreen from "./components/CodigoScreen";
import RecepcaoScreen from "./components/RecepcaoScreen";
import { getTabletSenha, clearTabletSenha } from "../shared/lib/tablet";
import { clearSession, saveSession } from "../shared/lib/session";
import { ArcadeSession } from "../shared/types";

type Etapa = "bloqueado" | "qr" | "codigo" | "recepcao";

/**
 * Tela do tablet do estande — ciclo de um visitante:
 * QR na tela → visitante escaneia e se cadastra no celular → "Já escaneei"
 * → digita o código recebido → recepção do Rino → escolhe um jogo → vence
 * → roleta (gira pelo código) → prêmio → volta pro QR sozinho.
 *
 * `?teste=1` simula tudo (sem senha, qualquer código, roleta simulada).
 */
export default function App() {
  const [testMode] = useState(
    () => typeof window !== "undefined" && new URLSearchParams(window.location.search).get("teste") === "1"
  );
  const [etapa, setEtapa] = useState<Etapa>(() =>
    testMode || getTabletSenha() ? "qr" : "bloqueado"
  );
  const [visitante, setVisitante] = useState<{ codigo: number; nome: string | null } | null>(null);

  // Todo início de ciclo no QR limpa a sessão do visitante anterior.
  useEffect(() => {
    if (etapa === "qr") {
      clearSession();
      setVisitante(null);
    }
  }, [etapa]);

  const handleCodigoValido = (codigo: number, nome: string | null) => {
    const session: ArcadeSession = {
      idToken: "tablet",
      celular: "tablet",
      name: nome,
      email: null,
      picture: null,
      codigo,
      tablet: true,
      demo: testMode || undefined,
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
      return <QrScreen testMode={testMode} onJaEscaneei={() => setEtapa("codigo")} />;
    case "codigo":
      return (
        <CodigoScreen
          testMode={testMode}
          onVoltar={() => setEtapa("qr")}
          onCodigoValido={handleCodigoValido}
          onTabletNaoAutorizado={handleTabletNaoAutorizado}
        />
      );
    case "recepcao":
      return (
        <RecepcaoScreen
          nome={visitante?.nome ?? null}
          onCancelar={() => setEtapa("qr")}
        />
      );
  }
}
