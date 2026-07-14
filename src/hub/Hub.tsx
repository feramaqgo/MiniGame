import { useEffect, useRef, useState } from "react";
import { ArrowRight, Brain, Cable, Grid3x3, Target, Lock, Play } from "lucide-react";
import { formatarWhatsApp, validarWhatsApp } from "../shared/lib/validation";
import { renderGoogleButton, decodeGooglePayload } from "../shared/lib/googleIdentity";
import { getSession, saveSession } from "../shared/lib/session";
import { ArcadeSession } from "../shared/types";

interface GoogleStep {
  idToken: string;
  name: string | null;
  email: string | null;
  picture: string | null;
}

const jogos = [
  {
    titulo: "Chute para Ganhar",
    descricao: "Chute o pênalti e ganhe a chance de girar a roleta de prêmios.",
    href: "/chute",
    icon: Target,
    disponivel: true,
  },
  {
    titulo: "Jogo da Memória",
    descricao: "Encontre os pares e concorra a um prêmio.",
    href: "/memoria",
    icon: Brain,
    disponivel: false,
  },
  {
    titulo: "Mangote de Concreto",
    descricao: "Guie o mangote, cresça e ganhe seu prêmio.",
    href: "/cobrinha",
    icon: Cable,
    disponivel: true,
  },
  {
    titulo: "Jogo da Velha",
    descricao: "Vença a máquina e concorra a um prêmio.",
    href: "/velha",
    icon: Grid3x3,
    disponivel: false,
  },
];

export default function Hub() {
  const [session, setSession] = useState<ArcadeSession | null>(() => getSession());
  const [googleData, setGoogleData] = useState<GoogleStep | null>(null);
  const [celular, setCelular] = useState("");
  const [celularError, setCelularError] = useState<string | null>(null);
  const googleButtonRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (session || googleData || !googleButtonRef.current) return;
    renderGoogleButton(googleButtonRef.current, (idToken) => {
      const decoded = decodeGooglePayload(idToken);
      setGoogleData({ idToken, ...decoded });
    }).catch((err) => console.error("Erro ao carregar login do Google:", err));
  }, [session, googleData]);

  const handleCelularChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCelular(formatarWhatsApp(e.target.value));
    if (celularError) setCelularError(null);
  };

  const handleContinuar = (e: React.FormEvent) => {
    e.preventDefault();
    if (!googleData) return;

    if (!celular || !validarWhatsApp(celular)) {
      setCelularError("Celular inválido. Ex: (11) 98765-4321");
      return;
    }

    const novaSessao: ArcadeSession = {
      idToken: googleData.idToken,
      celular,
      name: googleData.name,
      email: googleData.email,
      picture: googleData.picture,
    };
    saveSession(novaSessao);
    setSession(novaSessao);
  };

  // Botão demo: entra sem login real, só pra testar/mostrar o fluxo.
  const entrarDemo = () => {
    const demoSession: ArcadeSession = {
      idToken: "demo",
      celular: "(00) 00000-0000",
      name: "Visitante Demo",
      email: null,
      picture: null,
      demo: true,
    };
    saveSession(demoSession);
    setSession(demoSession);
  };

  // ------------------------------------------------------------------
  // Tela 1: login
  // ------------------------------------------------------------------
  if (!session) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center py-12 px-4 relative overflow-hidden">
        <div className="max-w-md w-full bg-[#FFFAF0]/90 border border-black/5 rounded-3xl p-6 md:p-8 shadow-2xl text-center space-y-6 relative z-10">
          <div className="inline-flex items-center gap-2 bg-[#FF6801] text-black px-4 py-1.5 rounded-full font-display text-xs font-bold uppercase tracking-wider mx-auto">
            Arcade Feramaq · Concreteshow
          </div>

          <h1 className="font-display text-3xl md:text-4xl uppercase leading-tight tracking-tight font-bold text-[#1A1208]">
            Entre pra <span className="text-[#FF6801]">jogar e ganhar</span>
          </h1>

          {!googleData ? (
            <>
              <p className="font-sans text-sm text-[#6B6048]">
                Entre com sua conta Google pra começar. Leva 5 segundos.
              </p>
              <div className="flex justify-center py-2">
                <div ref={googleButtonRef} />
              </div>

              <button
                onClick={entrarDemo}
                className="w-full border-2 border-amber-500 text-amber-700 hover:bg-amber-500/10 font-display text-sm uppercase tracking-widest px-6 py-3 rounded-xl flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <Play className="w-4 h-4" />
                <span>Entrar em modo demo</span>
              </button>
            </>
          ) : (
            <form onSubmit={handleContinuar} className="space-y-4 text-left">
              <div className="flex items-center gap-3 bg-white border border-black/10 rounded-xl p-3">
                {googleData.picture && (
                  <img src={googleData.picture} alt="" className="w-10 h-10 rounded-full" referrerPolicy="no-referrer" />
                )}
                <div>
                  <p className="font-sans text-sm font-bold text-[#1A1208]">{googleData.name}</p>
                  <p className="font-sans text-xs text-[#6B6048]">{googleData.email}</p>
                </div>
              </div>

              <div className="space-y-1">
                <label className="block font-sans text-xs font-bold text-[#4A4030] uppercase tracking-widest">
                  Celular
                </label>
                <input
                  type="tel"
                  required
                  value={celular}
                  onChange={handleCelularChange}
                  placeholder="(00) 00000-0000"
                  className="w-full bg-white border-2 border-black/10 focus:border-[#FF6801] text-[#1A1208] px-4 py-3 rounded-lg outline-none font-sans text-sm md:text-base transition-colors focus:ring-1 focus:ring-[#FF6801]"
                />
                {celularError && <p className="text-xs text-rose-500 font-sans font-medium">{celularError}</p>}
              </div>

              <button
                type="submit"
                className="w-full bg-[#FF6801] hover:bg-[#e05c01] text-white font-display text-lg uppercase tracking-widest px-8 py-4 rounded-xl flex items-center justify-center gap-3 transition-all duration-300 cursor-pointer btn-glow hover:scale-[1.02] active:scale-[0.98]"
              >
                <span>Continuar</span>
                <ArrowRight className="w-5 h-5" />
              </button>
            </form>
          )}

          <p className="text-[10px] text-[#857a5e] uppercase tracking-widest font-sans">
            Seus dados são usados apenas para contato comercial da Feramaq. Sem spam.
          </p>
        </div>
      </div>
    );
  }

  // ------------------------------------------------------------------
  // Tela 2: menu de jogos
  // ------------------------------------------------------------------
  return (
    <div className="min-h-screen flex flex-col items-center justify-center py-12 px-4 relative overflow-hidden">
      <div className="max-w-2xl w-full space-y-8 relative z-10">
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 bg-[#FF6801] text-black px-4 py-1.5 rounded-full font-display text-xs font-bold uppercase tracking-wider">
            Olá, {session.name?.split(" ")[0] || "visitante"}!
          </div>
          <h1 className="font-display text-4xl md:text-5xl uppercase tracking-tight font-bold text-[#1A1208]">
            Escolha seu jogo
          </h1>
          <p className="font-sans text-sm text-[#6B6048]">
            Ganhe qualquer jogo abaixo e concorra a um prêmio na roleta.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {jogos.map((jogo) => {
            const Icon = jogo.icon;
            const conteudo = (
              <>
                <div className="w-12 h-12 rounded-xl bg-[#FF6801]/10 flex items-center justify-center">
                  <Icon className="w-6 h-6 text-[#FF6801]" />
                </div>
                <div className="flex-1 space-y-1.5">
                  <h2 className="font-display text-xl uppercase tracking-tight font-bold text-[#1A1208] flex items-center gap-2">
                    {jogo.titulo}
                    {!jogo.disponivel && (
                      <span className="inline-flex items-center gap-1 bg-black/5 text-[#857a5e] text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full">
                        <Lock className="w-2.5 h-2.5" />
                        Em breve
                      </span>
                    )}
                  </h2>
                  <p className="font-sans text-sm text-[#4A4030] leading-relaxed">{jogo.descricao}</p>
                </div>
                {jogo.disponivel && (
                  <span className="inline-flex items-center gap-2 font-display text-sm uppercase tracking-widest text-[#FF6801] font-bold">
                    Jogar
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </span>
                )}
              </>
            );

            if (!jogo.disponivel) {
              return (
                <div
                  key={jogo.href}
                  className="opacity-60 bg-[#FFFAF0]/60 border border-black/5 rounded-2xl p-6 shadow-md flex flex-col gap-4 cursor-not-allowed"
                >
                  {conteudo}
                </div>
              );
            }

            return (
              <a
                key={jogo.href}
                href={jogo.href}
                className="group bg-[#FFFAF0]/90 border border-black/5 rounded-2xl p-6 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-[1.02] flex flex-col gap-4"
              >
                {conteudo}
              </a>
            );
          })}
        </div>
      </div>
    </div>
  );
}
