import { useEffect, useState } from "react";
import { ArrowLeft, Crown, PartyPopper, Users } from "lucide-react";
import Confetti from "../../roleta/components/Confetti";
import { getTabletSenha } from "../../shared/lib/tablet";
import { sfx } from "../../shared/lib/sfx";

interface CampeaoScreenProps {
  onVoltar: () => void;
}

interface Campeao {
  nome: string;
  nomeExibicao: string;
  codigo: number | null;
  pontos: number;
  jogo: string;
}

interface LinhaRanking {
  posicao: number;
  nome: string;
  pontos: number;
}

const NOME_JOGO: Record<string, string> = {
  chute: "Pênalti",
  memoria: "Memória",
  cobrinha: "Mangote de Concreto",
  velha: "Jogo da Velha",
};

/** Encerramento do dia: anuncia o campeão geral pra equipe premiar. */
export default function CampeaoScreen({ onVoltar }: CampeaoScreenProps) {
  const [campeao, setCampeao] = useState<Campeao | null>(null);
  const [ranking, setRanking] = useState<LinhaRanking[]>([]);
  const [total, setTotal] = useState(0);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/campeao", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ senha: getTabletSenha() }),
    })
      .then(async (r) => {
        const d = await r.json().catch(() => ({}));
        if (!r.ok || !d.ok) throw new Error(d.message || "Erro ao buscar campeão");
        setCampeao(d.campeao);
        setRanking(d.ranking || []);
        setTotal(d.total || 0);
        if (d.campeao) sfx.vitoria();
      })
      .catch((e) => setErro(e.message))
      .finally(() => setCarregando(false));
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center py-10 px-6 relative overflow-hidden">
      <div className="faixa-perigo fixed top-0 inset-x-0 h-3 z-40 pointer-events-none" />
      <div className="faixa-perigo fixed bottom-0 inset-x-0 h-3 z-40 pointer-events-none" />
      {campeao && <Confetti />}

      <div className="max-w-2xl w-full space-y-6 relative z-10 text-center">
        {carregando ? (
          <p className="font-sans text-sm text-[#6B6048] uppercase tracking-widest animate-pulse">
            Apurando o resultado...
          </p>
        ) : erro ? (
          <div className="card-arcade rounded-2xl p-8 space-y-3">
            <p className="font-display text-xl uppercase text-[#23201B]">Não deu pra apurar</p>
            <p className="font-sans text-sm text-[#6E675C]">{erro}</p>
          </div>
        ) : !campeao ? (
          <div className="card-arcade rounded-2xl p-8 space-y-3">
            <Users className="w-12 h-12 text-[#8A8375] mx-auto" />
            <p className="font-display text-xl uppercase text-[#23201B]">Ninguém pontuou ainda</p>
            <p className="font-sans text-sm text-[#6E675C]">
              Assim que o primeiro visitante vencer um jogo, o campeão aparece aqui.
            </p>
          </div>
        ) : (
          <>
            <div className="inline-flex items-center gap-2 bg-[#FF6801] text-white px-4 py-1.5 rounded-full font-display text-xs font-bold uppercase tracking-wider">
              <PartyPopper className="w-3.5 h-3.5" />
              Campeão do dia
            </div>

            {/* O nome é o protagonista — a equipe anuncia lendo daqui */}
            <div className="card-arcade rounded-3xl p-8 pt-9 relative overflow-hidden space-y-3">
              <div className="faixa-perigo absolute top-0 inset-x-0 h-2.5" />
              <Crown className="w-16 h-16 text-[#F5C518] mx-auto drop-shadow-[0_4px_10px_rgba(245,197,24,0.5)] animate-bounce" />

              <p className="font-display text-4xl md:text-6xl uppercase leading-tight font-bold texto-fera break-words">
                {campeao.nome}
              </p>

              <div className="flex items-center justify-center gap-3 flex-wrap">
                <span className="font-display text-2xl md:text-3xl font-bold text-[#FF6801] tabular-nums">
                  {campeao.pontos} pts
                </span>
                <span className="font-sans text-sm text-[#6E675C]">
                  no {NOME_JOGO[campeao.jogo] || campeao.jogo}
                </span>
              </div>

              {campeao.codigo != null && (
                <p className="font-sans text-xs uppercase tracking-widest text-[#857a5e]">
                  Código de participação: <span className="font-bold">{campeao.codigo}</span>
                </p>
              )}
            </div>

            {ranking.length > 1 && (
              <div className="card-arcade rounded-2xl p-5">
                <p className="font-display text-xs uppercase tracking-widest text-[#6E675C] mb-3">
                  Restante do pódio
                </p>
                <ol className="space-y-1.5">
                  {ranking.slice(1, 5).map((l) => (
                    <li
                      key={l.posicao}
                      className="flex items-center gap-3 rounded-xl px-3 py-2 bg-black/[0.03]"
                    >
                      <span className="w-6 h-6 shrink-0 rounded-full bg-black/8 text-[#6E675C] flex items-center justify-center font-display text-xs font-bold">
                        {l.posicao}
                      </span>
                      <span className="flex-1 text-left font-sans text-sm font-bold text-[#23201B] truncate">
                        {l.nome}
                      </span>
                      <span className="font-display text-sm font-bold text-[#FF6801] tabular-nums">
                        {l.pontos}
                      </span>
                    </li>
                  ))}
                </ol>
              </div>
            )}

            <p className="font-sans text-xs uppercase tracking-widest text-[#857a5e]">
              {total} {total === 1 ? "participação" : "participações"} no placar
            </p>
          </>
        )}

        <button
          onClick={() => {
            sfx.click();
            onVoltar();
          }}
          className="mx-auto flex items-center gap-2 font-sans text-xs text-[#857a5e] uppercase tracking-widest hover:text-[#FF6801] transition-colors cursor-pointer px-3 py-2"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Voltar pro QR code
        </button>
      </div>
    </div>
  );
}
