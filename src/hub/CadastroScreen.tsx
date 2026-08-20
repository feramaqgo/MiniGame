import { useEffect, useRef, useState } from "react";
import { ArrowRight, Building2, Gift, IdCard } from "lucide-react";
import { formatarWhatsApp, validarWhatsApp } from "../shared/lib/validation";
import { renderGoogleButton, decodeGooglePayload } from "../shared/lib/googleIdentity";
import SaidaDiscreta from "../shared/components/SaidaDiscreta";
import { sfx } from "../shared/lib/sfx";
import { LeadData } from "../shared/types";

interface CadastroScreenProps {
  onConcluir: (lead: LeadData) => void;
  enviando: boolean;
  erro: string | null;
}

/** Se o script do Google não carregar nisso, o formulário manual assume. */
const TIMEOUT_GOOGLE_MS = 6000;

/**
 * Cadastro pós-jogo, no celular do visitante.
 *
 * Aparece só depois da vitória: a pessoa já jogou, já ganhou, e agora
 * preenche pra descobrir o brinde. É o ponto do fluxo onde o atrito custa
 * menos — e por isso é aqui que dá pra pedir mais do que nome e e-mail.
 *
 * EMPRESA e CARGO são sempre digitados, nos dois caminhos. O Google não
 * fornece nenhum dos dois, e numa feira de construção pesada são justamente
 * eles que separam curioso de comprador.
 */
export default function CadastroScreen({ onConcluir, enviando, erro }: CadastroScreenProps) {
  const [google, setGoogle] = useState<{
    idToken: string;
    name: string | null;
    email: string | null;
    picture: string | null;
  } | null>(null);

  // Quando o Google não é uma opção (script bloqueado, sem rede, ou a pessoa
  // clicou na porta de saída), o formulário manual assume por completo.
  const [manual, setManual] = useState(false);

  const [nome, setNome] = useState("");
  const [empresa, setEmpresa] = useState("");
  const [cargo, setCargo] = useState("");
  const [celular, setCelular] = useState("");
  const [email, setEmail] = useState("");
  const [erroLocal, setErroLocal] = useState<string | null>(null);

  const googleButtonRef = useRef<HTMLDivElement | null>(null);

  // Sem rede, nem tenta o Google — vai direto pro manual.
  useEffect(() => {
    if (typeof navigator !== "undefined" && navigator.onLine === false) setManual(true);
  }, []);

  useEffect(() => {
    if (google || manual || !googleButtonRef.current) return;

    let vivo = true;
    // Rede lenta de pavilhão: se o botão não vier, não deixamos a pessoa
    // presa esperando — o formulário manual entra sozinho.
    const timer = window.setTimeout(() => {
      if (vivo) setManual(true);
    }, TIMEOUT_GOOGLE_MS);

    renderGoogleButton(googleButtonRef.current, (idToken) => {
      const dados = decodeGooglePayload(idToken);
      setGoogle({ idToken, ...dados });
      if (dados.name) setNome(dados.name);
      if (dados.email) setEmail(dados.email);
    })
      .then(() => window.clearTimeout(timer))
      .catch(() => {
        if (vivo) setManual(true);
      });

    return () => {
      vivo = false;
      window.clearTimeout(timer);
    };
  }, [google, manual]);

  const identificado = !!google || manual;

  const enviar = (e: React.FormEvent) => {
    e.preventDefault();
    if (enviando) return;

    if (!nome.trim()) return setErroLocal("Preencha seu nome.");
    if (!empresa.trim()) return setErroLocal("Preencha a empresa.");
    if (!cargo.trim()) return setErroLocal("Preencha seu cargo.");
    if (!validarWhatsApp(celular)) return setErroLocal("WhatsApp inválido. Ex: (11) 98765-4321");

    setErroLocal(null);
    sfx.click();
    onConcluir({
      nome: nome.trim(),
      empresa: empresa.trim(),
      cargo: cargo.trim(),
      celular,
      email: (google?.email || email).trim() || null,
      picture: google?.picture ?? null,
      idToken: google?.idToken ?? null,
    });
  };

  const campo =
    "w-full bg-white border-2 border-black/10 focus:border-[#FF6801] text-[#1A1208] " +
    "px-4 py-3 rounded-lg outline-none font-sans text-base transition-colors " +
    "focus:ring-1 focus:ring-[#FF6801]";

  return (
    <div className="min-h-screen flex flex-col items-center justify-center py-10 px-4 relative overflow-hidden">
      <div className="max-w-md w-full card-arcade rounded-3xl p-6 pt-8 space-y-5 relative z-10 overflow-hidden">
        <div className="faixa-perigo absolute top-0 inset-x-0 h-2.5" />

        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 bg-emerald-600 text-white px-4 py-1.5 rounded-full font-display text-xs font-bold uppercase tracking-wider">
            <Gift className="w-3.5 h-3.5" />
            Você venceu!
          </div>
          <h1 className="font-display text-2xl md:text-3xl uppercase leading-tight tracking-tight font-bold text-[#1A1208]">
            Falta pouco pro seu <span className="texto-fera">brinde</span>
          </h1>
          <p className="font-sans text-sm text-[#6B6048]">
            Complete o cadastro pra girar a roleta e descobrir o que você ganhou.
          </p>
        </div>

        {!identificado ? (
          <div className="space-y-3">
            <div className="flex justify-center py-1">
              <div ref={googleButtonRef} />
            </div>
            {/* Porta de saída: o Google trava mais do que parece em wi-fi de
                feira, e ninguém pode ficar preso por causa disso. */}
            <div className="text-center">
              <SaidaDiscreta onClick={() => setManual(true)}>
                Não consegui entrar com o Google
              </SaidaDiscreta>
            </div>
          </div>
        ) : (
          <form onSubmit={enviar} className="space-y-3.5">
            {google && (
              <div className="flex items-center gap-3 bg-white border border-black/10 rounded-xl p-3">
                {google.picture && (
                  <img
                    src={google.picture}
                    alt=""
                    className="w-10 h-10 rounded-full"
                    referrerPolicy="no-referrer"
                  />
                )}
                <div className="min-w-0">
                  <p className="font-sans text-sm font-bold text-[#1A1208] truncate">
                    {google.name}
                  </p>
                  <p className="font-sans text-xs text-[#6B6048] truncate">{google.email}</p>
                </div>
              </div>
            )}

            {/* No caminho manual pedimos nome e e-mail; com Google eles já vieram. */}
            {!google && (
              <>
                <input
                  type="text"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  placeholder="Seu nome completo"
                  autoComplete="name"
                  className={campo}
                />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="E-mail (opcional)"
                  autoComplete="email"
                  className={campo}
                />
              </>
            )}

            <div className="relative">
              <Building2 className="w-4 h-4 text-[#8A8375] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={empresa}
                onChange={(e) => setEmpresa(e.target.value)}
                placeholder="Empresa"
                autoComplete="organization"
                className={campo + " pl-10"}
              />
            </div>

            <div className="relative">
              <IdCard className="w-4 h-4 text-[#8A8375] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={cargo}
                onChange={(e) => setCargo(e.target.value)}
                placeholder="Seu cargo"
                autoComplete="organization-title"
                className={campo + " pl-10"}
              />
            </div>

            <input
              type="tel"
              value={celular}
              onChange={(e) => setCelular(formatarWhatsApp(e.target.value))}
              placeholder="WhatsApp — (00) 00000-0000"
              autoComplete="tel"
              className={campo}
            />

            {(erroLocal || erro) && (
              <p className="text-sm text-rose-600 font-sans font-medium">{erroLocal || erro}</p>
            )}

            <button
              type="submit"
              disabled={enviando}
              className="w-full bg-[#FF6801] hover:bg-[#e05c01] disabled:opacity-60 disabled:cursor-wait text-white font-display text-lg uppercase tracking-widest px-8 py-4 rounded-xl flex items-center justify-center gap-3 transition-all cursor-pointer btn-glow"
            >
              <span>{enviando ? "Girando..." : "Girar a roleta"}</span>
              {!enviando && <ArrowRight className="w-5 h-5" />}
            </button>
          </form>
        )}

        <p className="text-[10px] text-[#857a5e] uppercase tracking-widest font-sans text-center">
          Seus dados são usados apenas para contato comercial da Feramaq. Sem spam.
        </p>
      </div>
    </div>
  );
}
