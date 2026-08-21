import { useEffect, useRef, useState } from "react";
import { ArrowRight, Building2, IdCard } from "lucide-react";
import { formatarWhatsApp, validarWhatsApp } from "../shared/lib/validation";
import SaidaDiscreta from "../shared/components/SaidaDiscreta";
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
    // Sessão sem código não serve mais — refaz o cadastro.
    if (s && s.codigo == null) {
      clearSession();
      return null;
    }
    return s;
  });
  const [etapa, setEtapa] = useState<"story" | "login">("story");
  const [googleData, setGoogleData] = useState<GoogleStep | null>(null);
  /** Cadastro manual assumiu (Google não abriu, ou a pessoa pediu). */
  const [manual, setManual] = useState(false);
  /** A saída manual só fica visível depois de um tempo parado na tela.
   * Quem tem problema de verdade fica ali esperando e encontra; quem só
   * quer pular o login já teria clicado no Google e seguido. Isso evita
   * que a porta de emergência vire o caminho principal — o cadastro manual
   * não tem identidade verificada. */
  const [mostrarSaidaManual, setMostrarSaidaManual] = useState(false);
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [empresa, setEmpresa] = useState("");
  const [cargo, setCargo] = useState("");
  const [celular, setCelular] = useState("");
  const [celularError, setCelularError] = useState<string | null>(null);
  const [cadastrando, setCadastrando] = useState(false);
  const googleButtonRef = useRef<HTMLDivElement | null>(null);

  const identificado = !!googleData || manual;

  const campoClasse =
    "w-full bg-white border-2 border-black/10 focus:border-[#FF6801] text-[#1A1208] " +
    "px-4 py-3 rounded-lg outline-none font-sans text-base transition-colors " +
    "focus:ring-1 focus:ring-[#FF6801]";

  // Sem rede, o Google não vai abrir — vai direto pro manual.
  useEffect(() => {
    if (typeof navigator !== "undefined" && navigator.onLine === false) setManual(true);
  }, []);

  // A porta de emergência aparece só pra quem ficou travado de verdade.
  useEffect(() => {
    if (etapa !== "login" || identificado) return;
    const t = window.setTimeout(() => setMostrarSaidaManual(true), 12000);
    return () => window.clearTimeout(t);
  }, [etapa, identificado]);

  useEffect(() => {
    if (etapa !== "login" || session || identificado || !googleButtonRef.current) return;

    let vivo = true;
    // Rede lenta de pavilhão: se o botão do Google não vier em 6s, o
    // formulário manual entra sozinho em vez de deixar a pessoa esperando.
    const timer = window.setTimeout(() => {
      if (vivo) setManual(true);
    }, 6000);

    renderGoogleButton(googleButtonRef.current, (idToken) => {
      const decoded = decodeGooglePayload(idToken);
      setGoogleData({ idToken, ...decoded });
      if (decoded.name) setNome(decoded.name);
      if (decoded.email) setEmail(decoded.email);
    })
      .then(() => window.clearTimeout(timer))
      .catch((err) => {
        console.error("Erro ao carregar login do Google:", err);
        if (vivo) {
          setMostrarSaidaManual(true);
          setManual(true);
        }
      });

    return () => {
      vivo = false;
      window.clearTimeout(timer);
    };
  }, [session, identificado, etapa]);

  const handleCelularChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCelular(formatarWhatsApp(e.target.value));
    if (celularError) setCelularError(null);
  };

  const handleContinuar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identificado || cadastrando) return;

    const nomeFinal = googleData?.name || nome.trim();
    if (!nomeFinal) {
      setCelularError("Preencha seu nome.");
      return;
    }
    if (!empresa.trim()) {
      setCelularError("Preencha a empresa.");
      return;
    }
    if (!cargo.trim()) {
      setCelularError("Preencha seu cargo.");
      return;
    }
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
          idToken: googleData?.idToken ?? null,
          nome: nomeFinal,
          email: googleData?.email || email.trim() || null,
          empresa: empresa.trim(),
          cargo: cargo.trim(),
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
        // No cadastro manual não há token; "manual" mantém a sessão válida
        // (getSession exige idToken preenchido).
        idToken: googleData?.idToken ?? "manual",
        celular,
        name: nomeFinal,
        email: googleData?.email || email.trim() || null,
        picture: googleData?.picture ?? null,
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

  const trocarConta = () => {
    sfx.click();
    clearSession();
    setSession(null);
    setGoogleData(null);
    setManual(false);
    setNome("");
    setEmail("");
    setEmpresa("");
    setCargo("");
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
      <div className="tela-arcade flex flex-col items-center justify-center px-4 relative overflow-hidden">
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
    <div className="tela-arcade flex flex-col items-center justify-center px-4 relative overflow-hidden">
      <MusicHUD src="/Música para o Hub (Menu).mp3" />
      <div className="max-w-md w-full card-arcade rounded-3xl p-5 md:p-8 pt-7 md:pt-8 text-center space-y-3.5 md:space-y-5 relative z-10 overflow-hidden">
        <div className="faixa-perigo absolute top-0 inset-x-0 h-2.5" />
        <div className="inline-flex items-center gap-2 bg-[#FF6801] text-white px-4 py-1.5 rounded-full font-display text-xs font-bold uppercase tracking-wider mx-auto">
          Arcade Feramaq · Concreteshow
        </div>

        <h1 className="font-display text-2xl md:text-4xl uppercase leading-tight tracking-tight font-bold text-[#1A1208]">
          Entre pra <span className="texto-fera">jogar e ganhar</span>
        </h1>

        {!identificado ? (
          <>
            <p className="font-sans text-sm text-[#6B6048]">
              Entre com sua conta Google, receba seu código e jogue no tablet do estande.
            </p>
            <div className="flex justify-center py-2">
              <div ref={googleButtonRef} />
            </div>
            {/* Porta de emergência, não atalho: só aparece pra quem ficou
                parado 12s ou pra quem o Google realmente falhou. Deixá-la
                sempre visível transformaria o cadastro sem verificação no
                caminho fácil. */}
            {mostrarSaidaManual && (
              <SaidaDiscreta
                onClick={() => setManual(true)}
                className="opacity-60 hover:opacity-100 text-[10px]"
              >
                Problemas para entrar?
              </SaidaDiscreta>
            )}
          </>
        ) : (
          <form onSubmit={handleContinuar} className="space-y-3.5 text-left">
            {googleData ? (
              <div className="flex items-center gap-3 bg-white border border-black/10 rounded-xl p-3">
                {googleData.picture && (
                  <img src={googleData.picture} alt="" className="w-10 h-10 rounded-full" referrerPolicy="no-referrer" />
                )}
                <div className="min-w-0">
                  <p className="font-sans text-sm font-bold text-[#1A1208] truncate">{googleData.name}</p>
                  <p className="font-sans text-xs text-[#6B6048] truncate">{googleData.email}</p>
                </div>
              </div>
            ) : (
              // Caminho manual: nome e e-mail viriam do Google, então são pedidos.
              <>
                <input
                  type="text"
                  required
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  placeholder="Seu nome completo"
                  autoComplete="name"
                  className={campoClasse}
                />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="E-mail (opcional)"
                  autoComplete="email"
                  className={campoClasse}
                />
              </>
            )}

            {/* Empresa e cargo: o Google não fornece nenhum dos dois, e são
                eles que transformam o lead em conversa de venda. */}
            <div className="relative">
              <Building2 className="w-4 h-4 text-[#8A8375] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                required
                value={empresa}
                onChange={(e) => setEmpresa(e.target.value)}
                placeholder="Empresa"
                autoComplete="organization"
                className={campoClasse + " pl-10"}
              />
            </div>

            <div className="relative">
              <IdCard className="w-4 h-4 text-[#8A8375] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                required
                value={cargo}
                onChange={(e) => setCargo(e.target.value)}
                placeholder="Seu cargo"
                autoComplete="organization-title"
                className={campoClasse + " pl-10"}
              />
            </div>

            <input
              type="tel"
              required
              value={celular}
              onChange={handleCelularChange}
              placeholder="WhatsApp — (00) 00000-0000"
              autoComplete="tel"
              className={campoClasse}
            />

            {celularError && <p className="text-sm text-rose-600 font-sans font-medium">{celularError}</p>}

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
