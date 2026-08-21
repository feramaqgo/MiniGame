import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowLeft, Check, Delete } from "lucide-react";
import { getTabletSenha } from "../../shared/lib/tablet";
import { sfx } from "../../shared/lib/sfx";

interface CodigoScreenProps {
  onVoltar: () => void;
  /** `offline` = validado sem rede; o servidor confere quando a fila subir. */
  onCodigoValido: (codigo: number, nome: string | null, offline?: boolean) => void;
  onTabletNaoAutorizado: () => void;
}

const MAX_DIGITOS = 5;
const IDLE_MS = 90_000; // sem toque por 90s → volta pro QR sozinho

/** Teclado numérico do tablet: o visitante digita o código do celular. */
export default function CodigoScreen({
  onVoltar,
  onCodigoValido,
  onTabletNaoAutorizado,
}: CodigoScreenProps) {
  const [digitos, setDigitos] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [validando, setValidando] = useState(false);
  const idleTimer = useRef<number | null>(null);

  // Qualquer interação reinicia o relógio de abandono.
  const armIdle = useCallback(() => {
    if (idleTimer.current) window.clearTimeout(idleTimer.current);
    idleTimer.current = window.setTimeout(onVoltar, IDLE_MS);
  }, [onVoltar]);

  useEffect(() => {
    armIdle();
    return () => {
      if (idleTimer.current) window.clearTimeout(idleTimer.current);
    };
  }, [armIdle]);

  const apertar = (d: string) => {
    armIdle();
    if (validando) return;
    sfx.tick();
    setErro(null);
    setDigitos((atual) => (atual.length >= MAX_DIGITOS ? atual : atual + d));
  };

  const apagar = () => {
    armIdle();
    if (validando) return;
    sfx.click();
    setErro(null);
    setDigitos((atual) => atual.slice(0, -1));
  };

  const confirmar = async () => {
    armIdle();
    if (validando || digitos.length === 0) return;

    const codigo = Number.parseInt(digitos, 10);
    if (!Number.isInteger(codigo) || codigo <= 0) {
      sfx.erro();
      setErro("Código inválido.");
      return;
    }

    setValidando(true);
    setErro(null);

    try {
      const response = await fetch("/api/validar-codigo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ codigo, senha: getTabletSenha() }),
      });
      const data = await response.json().catch(() => ({}));

      if (response.status === 401) {
        onTabletNaoAutorizado();
        return;
      }

      if (!response.ok || !data.ok) {
        sfx.erro();
        setErro(data.message || "Código não encontrado.");
        setDigitos("");
        return;
      }

      sfx.vitoria();
      onCodigoValido(data.codigo, data.nome);
    } catch {
      // Sem rede: DEIXA ENTRAR.
      //
      // Bloquear aqui seria o pior desfecho possível — a pessoa se cadastrou
      // (com os dados dela no celular, que tem 4G próprio), atravessou o
      // estande, digitou o código certo, e levaria um "sem conexão" por
      // causa do wi-fi do pavilhão. Ela iria embora achando que não
      // funciona, e o lead que já foi capturado morreria sem virar visita.
      //
      // O risco de aceitar é pequeno e conhecido: alguém pode digitar um
      // código inventado enquanto a rede está fora. O giro que vier depois
      // sobe pela fila e o servidor confere de verdade — se o código não
      // existir, fica registrado pra equipe. Um brinde a menos é barato
      // perto de travar a fila inteira do estande.
      sfx.vitoria();
      onCodigoValido(codigo, null, true);
    } finally {
      setValidando(false);
    }
  };

  const teclas = ["1", "2", "3", "4", "5", "6", "7", "8", "9"];

  return (
    <div className="tela-arcade flex flex-col items-center justify-center px-4 sm:px-6 relative overflow-hidden">
      <div className="max-w-md w-full space-y-3 md:space-y-5 relative z-10">
        <div className="text-center space-y-2">
          <h1 className="font-display text-2xl md:text-4xl uppercase tracking-tight font-bold text-[#1A1208]">
            Insira seu <span className="texto-fera">código</span>
          </h1>
          <p className="font-sans text-sm text-[#6B6048] compacta-em-tela-baixa">
            O número que apareceu no seu celular depois do cadastro.
          </p>
        </div>

        {/* Visor */}
        <div className="relative bg-[#1A1208] rounded-2xl py-3 md:py-5 px-4 text-center overflow-hidden min-h-[68px] md:min-h-[96px] flex items-center justify-center">
          <div className="faixa-perigo absolute top-0 inset-x-0 h-1.5 opacity-80" />
          <p className="font-display text-4xl md:text-6xl leading-none font-bold text-[#F5C518] tabular-nums tracking-widest">
            {digitos || <span className="text-[#F5C518]/30">···</span>}
          </p>
        </div>

        {erro && (
          <p className="text-center text-sm text-rose-500 font-sans font-medium">{erro}</p>
        )}

        {/* Teclado */}
        <div className="grid grid-cols-3 gap-2 md:gap-3">
          {teclas.map((t) => (
            <button
              key={t}
              onClick={() => apertar(t)}
              className="card-arcade rounded-2xl py-3 md:py-5 font-display text-2xl md:text-3xl font-bold text-[#1A1208] cursor-pointer transition-all hover:bg-[#FF6801]/10 active:scale-95"
            >
              {t}
            </button>
          ))}
          <button
            onClick={apagar}
            aria-label="Apagar"
            className="card-arcade rounded-2xl py-3 md:py-5 flex items-center justify-center text-[#6B6048] cursor-pointer transition-all hover:bg-rose-500/10 active:scale-95"
          >
            <Delete className="w-6 h-6 md:w-8 md:h-8" />
          </button>
          <button
            onClick={() => apertar("0")}
            className="card-arcade rounded-2xl py-3 md:py-5 font-display text-2xl md:text-3xl font-bold text-[#1A1208] cursor-pointer transition-all hover:bg-[#FF6801]/10 active:scale-95"
          >
            0
          </button>
          <button
            onClick={confirmar}
            disabled={digitos.length === 0 || validando}
            aria-label="Confirmar"
            className="bg-[#FF6801] hover:bg-[#e05c01] disabled:opacity-40 rounded-2xl py-3 md:py-5 flex items-center justify-center text-white cursor-pointer transition-all active:scale-95 btn-glow"
          >
            <Check className="w-7 h-7 md:w-9 md:h-9" strokeWidth={3} />
          </button>
        </div>

        <button
          onClick={() => {
            sfx.click();
            onVoltar();
          }}
          className="mx-auto flex items-center gap-2 font-sans text-xs text-[#857a5e] uppercase tracking-widest hover:text-[#FF6801] transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Voltar pro QR code
        </button>
      </div>
    </div>
  );
}
