import { useEffect, useState } from "react";
import { Gamepad2, PartyPopper, WifiOff } from "lucide-react";
import CadastroScreen from "./CadastroScreen";
import { resgatarPremio } from "./resgatar";
import RoletaWheel from "../roleta/components/RoletaWheel";
import Confetti from "../roleta/components/Confetti";
import SaidaDiscreta from "../shared/components/SaidaDiscreta";
import { getPremiosCache, prepararCachePremios, Premio } from "../shared/lib/premios";
import { pendentes, sincronizar } from "../shared/lib/outbox";
import { MusicHUD } from "../shared/components/MusicHUD";
import { LeadData } from "../shared/types";

type Etapa = "sem-partida" | "cadastro" | "girando" | "premio";

/**
 * Página do CELULAR do visitante — o outro lado do QR.
 *
 * No fluxo "joga primeiro, cadastra depois" esta tela é o FIM da jornada, não
 * o começo: a pessoa já jogou no tablet, já venceu, e chegou aqui pelo QR pra
 * se identificar e descobrir o brinde. O cadastro é o que libera o giro — e é
 * por isso que ele converte: o prêmio está à vista.
 */
export default function Hub() {
  // O QR do tablet traz a partida vencida: /?p=<uuid>
  const [partidaId] = useState<string | null>(() =>
    typeof window === "undefined"
      ? null
      : new URLSearchParams(window.location.search).get("p")
  );

  const [etapa, setEtapa] = useState<Etapa>(() => (partidaId ? "cadastro" : "sem-partida"));
  const [premios, setPremios] = useState<Premio[]>(() => getPremiosCache());
  const [premio, setPremio] = useState<Premio | null>(null);
  const [offline, setOffline] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [naFila, setNaFila] = useState(() => pendentes());

  // Lista de brindes pra desenhar as fatias (e pro sorteio local, se a rede cair).
  useEffect(() => {
    void prepararCachePremios().then(() => setPremios(getPremiosCache()));
  }, []);

  // Envios que ainda não subiram — dá visibilidade em vez de silêncio.
  useEffect(() => {
    const t = window.setInterval(() => setNaFila(pendentes()), 5000);
    return () => window.clearInterval(t);
  }, []);

  const handleCadastro = async (lead: LeadData) => {
    if (!partidaId) return;

    setEnviando(true);
    setErro(null);

    const r = await resgatarPremio(partidaId, lead);
    setEnviando(false);

    if (!r.ok || !r.prize) {
      setErro(r.message || "Não foi possível resgatar seu brinde.");
      return;
    }

    setPremio(r.prize);
    setOffline(!!r.offline);
    setEtapa("girando");
  };

  // ------------------------------------------------------------------
  // Chegou sem partida (digitou a URL, ou escaneou um QR já usado)
  // ------------------------------------------------------------------
  if (etapa === "sem-partida") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center py-12 px-4">
        <div className="max-w-md w-full card-arcade rounded-3xl p-8 pt-9 text-center space-y-5 relative overflow-hidden">
          <div className="faixa-perigo absolute top-0 inset-x-0 h-2.5" />
          <div className="w-16 h-16 rounded-2xl bg-[#FF6801]/12 flex items-center justify-center mx-auto">
            <Gamepad2 className="w-8 h-8 text-[#FF6801]" />
          </div>
          <h1 className="font-display text-2xl uppercase tracking-tight font-bold text-[#1A1208]">
            Jogue primeiro no <span className="texto-fera">tablet</span>
          </h1>
          <p className="font-sans text-sm text-[#6B6048] leading-relaxed">
            Vá até o tablet do estande Feramaq, escolha um jogo e vença. Ao final, um QR code
            aparece na tela — escaneie com este celular pra girar a roleta e retirar seu brinde.
          </p>
        </div>
      </div>
    );
  }

  // ------------------------------------------------------------------
  // Cadastro — é ele que libera o brinde
  // ------------------------------------------------------------------
  if (etapa === "cadastro") {
    return (
      <>
        <MusicHUD src="/Música para a Roleta.mp3" />
        <CadastroScreen onConcluir={handleCadastro} enviando={enviando} erro={erro} />
        {naFila > 0 && <AvisoFila quantidade={naFila} />}
      </>
    );
  }

  // ------------------------------------------------------------------
  // Roleta girando — o prêmio já foi decidido; isto é a encenação
  // ------------------------------------------------------------------
  if (etapa === "girando") {
    // Se o brinde sorteado não estiver na lista em cache, a roda não teria
    // fatia onde parar — nesse caso ela gira só com ele.
    const listaTemPremio = premios.some((p) => p.id === premio?.id);
    const lista = listaTemPremio ? premios : premio ? [premio] : [];

    return (
      <div className="min-h-screen flex flex-col items-center justify-center py-12 px-4">
        <MusicHUD src="/Música para a Roleta.mp3" />
        <div className="w-full max-w-md text-center space-y-6">
          <h2 className="font-display text-3xl uppercase tracking-tight font-bold">
            <span className="texto-fera">Boa sorte!</span>
          </h2>
          <RoletaWheel
            prizes={lista}
            targetPrizeId={premio?.id ?? null}
            onSpinComplete={() => setEtapa("premio")}
          />
          <div className="flex items-center justify-center gap-2">
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                className="w-2 h-2 rounded-full bg-[#FF6801] animate-bounce"
                style={{ animationDelay: `${i * 0.15}s` }}
              />
            ))}
            <p className="text-sm text-[#6B6048] uppercase tracking-widest font-sans ml-1">
              Girando
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ------------------------------------------------------------------
  // Prêmio — é esta tela que o atendente confere pra entregar
  // ------------------------------------------------------------------
  return (
    <div className="min-h-screen flex flex-col items-center justify-center py-12 px-4 relative overflow-hidden">
      <MusicHUD src="/Música para a Roleta.mp3" />
      <Confetti />

      <div className="max-w-md w-full card-arcade rounded-3xl p-8 pt-9 text-center space-y-4 relative z-10 overflow-hidden">
        <div className="faixa-perigo absolute top-0 inset-x-0 h-2.5" />
        <PartyPopper className="w-14 h-14 text-[#B8860B] mx-auto animate-bounce" />

        <div className="space-y-1.5">
          <p className="font-sans text-[11px] uppercase tracking-[0.2em] text-[#857a5e]">
            Você ganhou
          </p>
          <p className="font-display text-4xl md:text-5xl leading-tight uppercase font-bold text-[#FF6801] [text-shadow:0_2px_16px_rgba(255,104,1,0.35)]">
            {premio?.name ?? "seu brinde"}
          </p>
        </div>

        <div className="bg-[#FF6801]/10 border border-[#FF6801]/30 rounded-xl p-4">
          <p className="text-sm text-[#4A4030] font-sans leading-relaxed">
            <span className="font-bold">Mostre esta tela ao atendente</span> do estande Feramaq pra
            retirar seu brinde.
          </p>
        </div>

        {offline && (
          <p className="flex items-center justify-center gap-1.5 text-[11px] uppercase tracking-widest text-amber-600 font-sans">
            <WifiOff className="w-3 h-3" />
            Salvo no aparelho — envia sozinho quando a rede voltar
          </p>
        )}

        <SaidaDiscreta href="/">Próximo participante</SaidaDiscreta>
      </div>
    </div>
  );
}

/** Aviso discreto de que há cadastros esperando rede pra subir. */
function AvisoFila({ quantidade }: { quantidade: number }) {
  return (
    <button
      onClick={() => void sincronizar()}
      className="fixed bottom-3 left-1/2 -translate-x-1/2 z-40 inline-flex items-center gap-1.5 bg-amber-500/90 text-black text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-full shadow-lg cursor-pointer"
    >
      <WifiOff className="w-3 h-3" />
      {quantidade} {quantidade === 1 ? "envio pendente" : "envios pendentes"} · tocar pra tentar
    </button>
  );
}
