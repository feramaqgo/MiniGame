import { useEffect, useRef, useState } from "react";
import { ArrowRight, Play } from "lucide-react";
import { formatarWhatsApp, validarWhatsApp } from "../shared/lib/validation";
import { renderGoogleButton, decodeGooglePayload } from "../shared/lib/googleIdentity";
import { clearSession, getSession, saveSession } from "../shared/lib/session";
import { ArcadeSession } from "../shared/types";
import { sfx } from "../shared/lib/sfx";
import { StoryScreen } from "../shared/components/StoryScreen";
import { MusicHUD } from "../shared/components/MusicHUD";
import CodigoScreen from "./CodigoScreen";

interface GoogleStep {
  idToken: string;
  name: string | null;
  email: string | null;
  picture: string | null;
}

export default function Hub() {
  const [session, setSession] = useState<ArcadeSession | null>(() => {
    const s = getSession();
    // Sessão de versão antiga (sem código) não serve mais — refaz o cadastro.
    if (s && s.codigo == null && !s.demo) {
      clearSession();
      return null;
    }
    return s;
  });
  const [etapa, setEtapa] = useState<"story" | "login">("story");
  const [googleData, setGoogleData] = useState<GoogleStep | null>(null);
  const [celular, setCelular] = useState("");
  const [celularError, setCelularError] = useState<string | null>(null);
  const [cadastrando, setCadastrando] = useState(false);
  const googleButtonRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (etapa !== "login" || session || googleData || !googleButtonRef.current) return;
    renderGoogleButton(googleButtonRef.current, (idToken) => {
      const decoded = decodeGooglePayload(idToken);
      setGoogleData({ idToken, ...decoded });
    }).catch((err) => console.error("Erro ao carregar login do Google:", err));
  }, [session, googleData, etapa]);

  const handleCelularChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCelular(formatarWhatsApp(e.target.value));
    if (celularError) setCelularError(null);
  };

  const handleContinuar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!googleData || cadastrando) return;

    if (!celular || !validarWhatsApp(celular)) {
      setCelularError("Celular inválido. Ex: (11) 98765-4321");
      return;
    }

    sfx.click();
    setCadastrando(true);
    setCelularError(null);

    try {
      const params = new URLSearchParams(window.location.search);
      const response = await fetch("/api/cadastrar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          idToken: googleData.idToken,
          celular,
          tracking: {
            utm_source: params.get("utm_source"),
            utm_medium: params.get("utm_medium"),
            utm_campaign: params.get("utm_campaign"),
            utm_content: params.get("utm_content"),
            utm_term: params.get("utm_term"),
          },
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok || !data.ok) {
        setCelularError(data.message || "Erro ao cadastrar. Tente de novo.");
        return;
      }

      const novaSessao: ArcadeSession = {
        idToken: googleData.idToken,
        celular,
        name: googleData.name,
        email: googleData.email,
        picture: googleData.picture,
        codigo: data.codigo,
        jaGirou: !!data.jaGirou,
      };
      saveSession(novaSessao);
      setSession(novaSessao);
      sfx.vitoria();
    } catch {
      setCelularError("Sem conexão. Confira a internet e tente de novo.");
    } finally {
      setCadastrando(false);
    }
  };

  // Botão demo: entra sem login real, só pra testar/mostrar o fluxo.
  const entrarDemo = () => {
    const demoSession: ArcadeSession = {
      idToken: "demo",
      celular: "(00) 00000-0000",
      name: "Visitante Demo",
      email: null,
      picture: null,
      codigo: 777,
      demo: true,
    };
    saveSession(demoSession);
    setSession(demoSession);
  };

  const trocarConta = () => {
    sfx.click();
    clearSession();
    setSession(null);
    setGoogleData(null);
    setCelular("");
    setEtapa("login");
  };

  // ------------------------------------------------------------------
  // Tela 3: código de participação (cadastro concluído)
  // ------------------------------------------------------------------
  if (session) {
    return (
      <>
        <MusicHUD src="/Música para o Hub (Menu).mp3" />
        <CodigoScreen session={session} onTrocarConta={trocarConta} />
      </>
    );
  }

  // ------------------------------------------------------------------
  // Tela 1: storytelling do Rino
  // ------------------------------------------------------------------
  if (etapa === "story") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center py-12 px-4 relative overflow-hidden">
        <MusicHUD src="/Música para o Hub (Menu).mp3" />
        <StoryScreen
          avatarSrc="/Rino para o Menu Inicial (Hub).png"
          lines={[
            "Olá! Eu sou o Rino, mascote da Feramaq! Bem-vindo à Concrete Show!",
            "Aqui no nosso estande você tem a chance de ganhar brindes incríveis girando a nossa roleta da sorte.",
            "Faça seu cadastro rapidinho, pegue seu código e digite ele no tablet do estande pra escolher seu desafio. Vença e a roleta é sua!",
          ]}
          onComplete={() => setEtapa("login")}
        />
      </div>
    );
  }

  // ------------------------------------------------------------------
  // Tela 2: login
  // ------------------------------------------------------------------
  return (
    <div className="min-h-screen flex flex-col items-center justify-center py-12 px-4 relative overflow-hidden">
      <MusicHUD src="/Música para o Hub (Menu).mp3" />
      <div className="max-w-md w-full card-arcade rounded-3xl p-6 md:p-8 pt-8 text-center space-y-6 relative z-10 overflow-hidden">
        <div className="faixa-perigo absolute top-0 inset-x-0 h-2.5" />
        <div className="inline-flex items-center gap-2 bg-[#FF6801] text-white px-4 py-1.5 rounded-full font-display text-xs font-bold uppercase tracking-wider mx-auto">
          Arcade Feramaq · Concreteshow
        </div>

        <h1 className="font-display text-3xl md:text-4xl uppercase leading-tight tracking-tight font-bold text-[#1A1208]">
          Entre pra <span className="texto-fera">jogar e ganhar</span>
        </h1>

        {!googleData ? (
          <>
            <p className="font-sans text-sm text-[#6B6048]">
              Entre com sua conta Google, receba seu código e jogue no tablet do estande.
            </p>
            <div className="flex justify-center py-2">
              <div ref={googleButtonRef} />
            </div>

            <button
              onClick={() => {
                sfx.click();
                entrarDemo();
              }}
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
                WhatsApp
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
              disabled={cadastrando}
              className="w-full bg-[#FF6801] hover:bg-[#e05c01] disabled:opacity-60 disabled:cursor-wait text-white font-display text-lg uppercase tracking-widest px-8 py-4 rounded-xl flex items-center justify-center gap-3 transition-all duration-300 cursor-pointer btn-glow hover:scale-[1.02] active:scale-[0.98]"
            >
              <span>{cadastrando ? "Gerando código..." : "Pegar meu código"}</span>
              {!cadastrando && <ArrowRight className="w-5 h-5" />}
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
