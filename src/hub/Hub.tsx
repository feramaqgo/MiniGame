import { useState } from "react";
import { ArrowRight } from "lucide-react";
import { formatarWhatsApp, validarWhatsApp } from "../shared/lib/validation";
import { clearSession, getSession, saveSession } from "../shared/lib/session";
import { ArcadeSession } from "../shared/types";
import { sfx } from "../shared/lib/sfx";
import { MusicHUD } from "../shared/components/MusicHUD";
import CodigoScreen from "./CodigoScreen";

/**
 * Cadastro do visitante, no celular dele — o começo do fluxo do estande.
 *
 * ENXUTO DE PROPÓSITO: só nome e WhatsApp. A operação do estande pediu que
 * cada passo a mais fosse cortado, porque no pico do movimento a fila anda
 * mais rápido do que o formulário. Saíram, nesta ordem de custo:
 *
 *   - o login com Google (era o caminho principal, mas trava em wi-fi de
 *     pavilhão e exige senha na hora errada);
 *   - as telas de história do Rino (3 toques antes de chegar ao formulário);
 *   - empresa e cargo (qualificavam o lead, mas dobravam o tempo de digitação
 *     num celular, em pé, na fila).
 *
 * `StoryScreen` e `googleIdentity` continuam no repositório sem uso: não
 * entram no bundle, e dá pra voltar atrás depois da feira só mexendo num
 * import. A RPC `cadastrar_participante` já aceita `google_sub` nulo —
 * identifica a pessoa pelo celular e devolve o mesmo código de antes.
 */
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
  const [nome, setNome] = useState("");
  const [celular, setCelular] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [cadastrando, setCadastrando] = useState(false);

  const handleCelularChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCelular(formatarWhatsApp(e.target.value));
    if (erro) setErro(null);
  };

  const handleContinuar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cadastrando) return;

    if (!nome.trim()) {
      setErro("Preencha seu nome.");
      return;
    }
    if (!celular || !validarWhatsApp(celular)) {
      setErro("Celular inválido. Ex: (11) 98765-4321");
      return;
    }

    sfx.click();
    setCadastrando(true);
    setErro(null);

    try {
      const params = new URLSearchParams(window.location.search);
      const response = await fetch("/api/cadastrar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          idToken: null,
          nome: nome.trim(),
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
        setErro(data.message || "Erro ao cadastrar. Tente de novo.");
        return;
      }

      const novaSessao: ArcadeSession = {
        // Sem Google não há token; "manual" mantém a sessão válida
        // (getSession exige idToken preenchido).
        idToken: "manual",
        celular,
        name: nome.trim(),
        email: null,
        picture: null,
        codigo: data.codigo,
        jaGirou: !!data.jaGirou,
      };
      saveSession(novaSessao);
      setSession(novaSessao);
      sfx.vitoria();
    } catch {
      setErro("Sem conexão. Confira a internet e tente de novo.");
    } finally {
      setCadastrando(false);
    }
  };

  const trocarConta = () => {
    sfx.click();
    clearSession();
    setSession(null);
    setNome("");
    setCelular("");
    setErro(null);
  };

  // ------------------------------------------------------------------
  // Cadastro concluído: o código pra digitar no tablet
  // ------------------------------------------------------------------
  if (session) {
    return (
      <>
        <MusicHUD src="/Música para o Hub (Menu).mp3" />
        <CodigoScreen session={session} onTrocarConta={trocarConta} />
      </>
    );
  }

  const campoClasse =
    "w-full bg-white border-2 border-black/10 focus:border-[#FF6801] text-[#1A1208] " +
    "px-4 py-3 rounded-lg outline-none font-sans text-base transition-colors " +
    "focus:ring-1 focus:ring-[#FF6801]";

  // ------------------------------------------------------------------
  // Cadastro — dois campos, direto ao ponto
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

        <p className="font-sans text-sm text-[#6B6048]">
          Preencha e receba seu código pra jogar no tablet do estande.
        </p>

        <form onSubmit={handleContinuar} className="space-y-3.5 text-left">
          <input
            type="text"
            required
            value={nome}
            onChange={(e) => {
              setNome(e.target.value);
              if (erro) setErro(null);
            }}
            placeholder="Seu nome"
            autoComplete="name"
            className={campoClasse}
          />

          <input
            type="tel"
            required
            value={celular}
            onChange={handleCelularChange}
            placeholder="WhatsApp — (00) 00000-0000"
            autoComplete="tel"
            className={campoClasse}
          />

          {erro && <p className="text-sm text-rose-600 font-sans font-medium">{erro}</p>}

          <button
            type="submit"
            disabled={cadastrando}
            className="w-full bg-[#FF6801] hover:bg-[#e05c01] disabled:opacity-60 disabled:cursor-wait text-white font-display text-lg uppercase tracking-widest px-8 py-4 rounded-xl flex items-center justify-center gap-3 transition-all duration-300 cursor-pointer btn-glow hover:scale-[1.02] active:scale-[0.98]"
          >
            <span>{cadastrando ? "Gerando código..." : "Pegar meu código"}</span>
            {!cadastrando && <ArrowRight className="w-5 h-5" />}
          </button>
        </form>

        <p className="text-[10px] text-[#857a5e] uppercase tracking-widest font-sans">
          Seus dados são usados apenas para contato comercial da Feramaq. Sem spam.
        </p>
      </div>
    </div>
  );
}
