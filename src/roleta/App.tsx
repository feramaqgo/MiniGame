import { useEffect } from "react";

/**
 * `/roleta` deixou de ser uma página própria.
 *
 * No fluxo "joga primeiro, cadastra depois" o giro acontece no celular do
 * visitante, logo após o cadastro (ver `src/hub/Hub.tsx`). É o cadastro que
 * libera o brinde, então separar as duas coisas em telas distintas só criaria
 * mais um passo pra abandonar no meio.
 *
 * A rota continua existindo porque pode ter sido favoritada ou impressa em
 * material antigo: quem chegar aqui é levado pro lugar certo. Os componentes
 * visuais (`RoletaWheel`, `Confetti`) seguem em uso, agora pelo hub.
 */
export default function App() {
  useEffect(() => {
    const partida = new URLSearchParams(window.location.search).get("p");
    window.location.replace(partida ? `/?p=${encodeURIComponent(partida)}` : "/");
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="font-sans text-sm text-[#6B6048] uppercase tracking-widest animate-pulse">
        Redirecionando...
      </p>
    </div>
  );
}
