import { useEffect, useCallback, useRef, useState } from "react";
import { ChevronDown, ChevronLeft, ChevronRight, ChevronUp, Hand, RotateCcw, Trophy } from "lucide-react";
import { sfx } from "../shared/lib/sfx";
import { registrarPartida } from "../shared/lib/score";

const GRID = 13; // células por lado (menos células = mais fáceis de mirar)
const SIZE = 390; // tamanho lógico do canvas (px)
const CELL = SIZE / GRID;
const ALVO = 6; // porções de concreto pra vencer

type Cell = { x: number; y: number };
type Dir = { x: number; y: number };

interface MangoteGameProps {
  onWin: () => void;
}

function mesmaCelula(a: Cell, b: Cell) {
  return a.x === b.x && a.y === b.y;
}

export default function MangoteGame({ onWin }: MangoteGameProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [score, setScore] = useState(0);
  const [estado, setEstado] = useState<"jogando" | "perdeu" | "venceu">("jogando");
  /**
   * O mangote fica PARADO até o primeiro comando. Sem isso ele já sai andando
   * e bate na parede enquanto a pessoa ainda está entendendo o controle — no
   * estande isso queimava a primeira partida de todo mundo.
   * Enquanto está parado, as setas de dica ficam na tela.
   */
  const [comecou, setComecou] = useState(false);

  const snakeRef = useRef<Cell[]>([]);
  const dirRef = useRef<Dir>({ x: 1, y: 0 });
  const nextDirRef = useRef<Dir>({ x: 1, y: 0 });
  const foodRef = useRef<Cell>({ x: 9, y: 6 });
  const timerRef = useRef<number | null>(null);
  const estadoRef = useRef(estado);
  estadoRef.current = estado;
  const scoreRef = useRef(0);
  const pulseRef = useRef(0); // brilho pulsante da comida
  const inicioRef = useRef(0); // instante em que a partida começou (placar)

  // --- métricas do placar ---
  const tentativasRef = useRef(1); // em qual tentativa a pessoa está
  const passosRef = useRef(0); // passos realmente dados
  /** Toques/mudanças de direção. Nos outros jogos cada clique já vira uma
   * jogada contada; aqui não virava nada, então quem batia na tela sem
   * pensar não era penalizado. Agora é. */
  const toquesRef = useRef(0);
  /** Soma das distâncias mínimas (Manhattan) até cada porção. Comparado com
   * os passos dados, mede a eficiência da rota — assim a pontuação não
   * depende da sorte de a comida nascer perto. */
  const passosMinimosRef = useRef(0);

  const novaComida = useCallback(() => {
    const MARGEM = 2;
    const faixa = GRID - MARGEM * 2;
    let c: Cell;
    do {
      c = {
        x: MARGEM + Math.floor(Math.random() * faixa),
        y: MARGEM + Math.floor(Math.random() * faixa),
      };
    } while (snakeRef.current.some((s) => mesmaCelula(s, c)));
    foodRef.current = c;

    // Guarda o caminho mais curto possível da cabeça até esta porção.
    const cabeca = snakeRef.current[0];
    if (cabeca) {
      passosMinimosRef.current += Math.abs(c.x - cabeca.x) + Math.abs(c.y - cabeca.y);
    }
  }, []);

  const desenhar = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Laje de concreto escuro
    const grad = ctx.createLinearGradient(0, 0, 0, SIZE);
    grad.addColorStop(0, "#332E28");
    grad.addColorStop(1, "#221E19");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, SIZE, SIZE);

    // Grade sutil
    ctx.strokeStyle = "rgba(255,255,255,0.045)";
    ctx.lineWidth = 1;
    for (let i = 1; i < GRID; i++) {
      ctx.beginPath();
      ctx.moveTo(i * CELL, 0);
      ctx.lineTo(i * CELL, SIZE);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, i * CELL);
      ctx.lineTo(SIZE, i * CELL);
      ctx.stroke();
    }

    // Comida — porção de concreto brilhante (alto contraste)
    const f = foodRef.current;
    const fx = (f.x + 0.5) * CELL;
    const fy = (f.y + 0.5) * CELL;
    const pulse = 0.5 + 0.5 * Math.sin(pulseRef.current);
    const glow = ctx.createRadialGradient(fx, fy, 2, fx, fy, CELL * 0.9);
    glow.addColorStop(0, `rgba(255,176,32,${0.5 + pulse * 0.25})`);
    glow.addColorStop(1, "rgba(255,176,32,0)");
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(fx, fy, CELL * 0.9, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(fx, fy, CELL * 0.32, 0, Math.PI * 2);
    ctx.fillStyle = "#FFB020";
    ctx.fill();
    ctx.lineWidth = 3;
    ctx.strokeStyle = "#FF6801";
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(fx - CELL * 0.1, fy - CELL * 0.12, CELL * 0.08, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(255,255,255,0.85)";
    ctx.fill();

    const snake = snakeRef.current;
    if (snake.length === 0) return;

    const path = new Path2D();
    snake.forEach((s, i) => {
      const cx = (s.x + 0.5) * CELL;
      const cy = (s.y + 0.5) * CELL;
      if (i === 0) path.moveTo(cx, cy);
      else path.lineTo(cx, cy);
    });

    ctx.lineJoin = "round";
    ctx.lineCap = "round";

    // sombra do mangote
    ctx.strokeStyle = "rgba(0,0,0,0.35)";
    ctx.lineWidth = CELL * 0.86;
    ctx.stroke(path);
    // corpo cinza-concreto claro (contrasta com a laje escura)
    ctx.strokeStyle = "#BDB6AA";
    ctx.lineWidth = CELL * 0.66;
    ctx.stroke(path);
    // brilho central
    ctx.strokeStyle = "rgba(255,255,255,0.35)";
    ctx.lineWidth = CELL * 0.2;
    ctx.stroke(path);

    // Juntas do mangote
    ctx.strokeStyle = "rgba(40,36,30,0.5)";
    ctx.lineWidth = 3;
    for (let i = 1; i < snake.length; i++) {
      const a = snake[i - 1];
      const b = snake[i];
      const mx = ((a.x + b.x) / 2 + 0.5) * CELL;
      const my = ((a.y + b.y) / 2 + 0.5) * CELL;
      const px = -(b.y - a.y);
      const py = b.x - a.x;
      const h = CELL * 0.34;
      ctx.beginPath();
      ctx.moveTo(mx - px * h, my - py * h);
      ctx.lineTo(mx + px * h, my + py * h);
      ctx.stroke();
    }

    // Cabeça — bico laranja
    const head = snake[0];
    const hx = (head.x + 0.5) * CELL;
    const hy = (head.y + 0.5) * CELL;
    ctx.beginPath();
    ctx.arc(hx, hy, CELL * 0.46, 0, Math.PI * 2);
    ctx.fillStyle = "#FF6801";
    ctx.fill();
    ctx.lineWidth = 3;
    ctx.strokeStyle = "#B4470A";
    ctx.stroke();
    const d = dirRef.current;
    ctx.beginPath();
    ctx.arc(hx + d.x * CELL * 0.22, hy + d.y * CELL * 0.22, CELL * 0.12, 0, Math.PI * 2);
    ctx.fillStyle = "#2A1206";
    ctx.fill();
  }, []);

  const tick = useCallback(() => {
    if (estadoRef.current !== "jogando") return;
    pulseRef.current += 0.5;

    const snake = snakeRef.current;
    dirRef.current = nextDirRef.current;
    const d = dirRef.current;
    const head = snake[0];
    const novaCabeca: Cell = { x: head.x + d.x, y: head.y + d.y };

    if (novaCabeca.x < 0 || novaCabeca.x >= GRID || novaCabeca.y < 0 || novaCabeca.y >= GRID) {
      sfx.erro();
      setEstado("perdeu");
      return;
    }
    const corpoSemCauda = snake.slice(0, snake.length - 1);
    if (corpoSemCauda.some((s) => mesmaCelula(s, novaCabeca))) {
      sfx.erro();
      setEstado("perdeu");
      return;
    }

    const comeu = mesmaCelula(novaCabeca, foodRef.current);
    const novaSnake = [novaCabeca, ...snake];
    if (!comeu) novaSnake.pop();
    snakeRef.current = novaSnake;
    passosRef.current += 1;

    if (comeu) {
      sfx.comer();
      const novoScore = scoreRef.current + 1;
      scoreRef.current = novoScore;
      setScore(novoScore);
      if (novoScore >= ALVO) {
        sfx.vitoria();
        setEstado("venceu");
        registrarPartida("cobrinha", {
          tempoMs: performance.now() - inicioRef.current,
          tentativas: tentativasRef.current,
          passos: passosRef.current,
          passosMinimos: passosMinimosRef.current,
          toques: toquesRef.current,
        });
        desenhar();
        return;
      }
      novaComida();
    }

    desenhar();
  }, [desenhar, novaComida]);

  const iniciar = useCallback(() => {
    snakeRef.current = [
      { x: 4, y: 6 },
      { x: 3, y: 6 },
      { x: 2, y: 6 },
    ];
    dirRef.current = { x: 1, y: 0 };
    nextDirRef.current = { x: 1, y: 0 };
    scoreRef.current = 0;
    setScore(0);
    setComecou(false); // espera o primeiro toque de novo
    inicioRef.current = performance.now();
    // Zera as métricas da partida (as tentativas seguem acumulando).
    passosRef.current = 0;
    passosMinimosRef.current = 0;
    toquesRef.current = 0;
    novaComida();
    setEstado("jogando");
    desenhar();
  }, [desenhar, novaComida]);

  /** "Tentar de novo" após bater: conta mais uma tentativa no placar. */
  const tentarDeNovo = useCallback(() => {
    tentativasRef.current += 1;
    iniciar();
  }, [iniciar]);

  const mudarDirecao = useCallback((nx: number, ny: number) => {
    const atual = dirRef.current;
    if (atual.x === -nx && atual.y === -ny) return;
    if (atual.x === nx && atual.y === ny) return;
    nextDirRef.current = { x: nx, y: ny };
    toquesRef.current += 1; // só conta quando a direção realmente muda
    // Primeiro comando destrava o mangote e tira as setas de dica.
    setComecou(true);
  }, []);

  useEffect(() => {
    // Só anda depois do primeiro comando (e enquanto a partida está viva).
    if (estado !== "jogando" || !comecou) {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      return;
    }
    const velocidade = Math.max(115, 175 - score * 8);
    timerRef.current = window.setInterval(tick, velocidade);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [estado, comecou, score, tick]);

  useEffect(() => {
    if (estado === "venceu") {
      const t = setTimeout(onWin, 1500);
      return () => clearTimeout(t);
    }
  }, [estado, onWin]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      const dpr = window.devicePixelRatio || 1;
      canvas.width = SIZE * dpr;
      canvas.height = SIZE * dpr;
      const ctx = canvas.getContext("2d");
      if (ctx) ctx.scale(dpr, dpr);
    }
    iniciar();

    const onKey = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if (k === "arrowup" || k === "w") mudarDirecao(0, -1);
      else if (k === "arrowdown" || k === "s") mudarDirecao(0, 1);
      else if (k === "arrowleft" || k === "a") mudarDirecao(-1, 0);
      else if (k === "arrowright" || k === "d") mudarDirecao(1, 0);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [iniciar, mudarDirecao]);

  // ------------------------------------------------------------------
  // Controles de toque — pensados pra tablet em pé no balcão.
  //
  // 1. TOCAR: onde o dedo encosta no tabuleiro define a direção, comparando
  //    com a posição atual da cabeça. Tocou acima da cabeça? sobe. À
  //    direita? vira à direita. O alvo é a tela inteira, então é impossível
  //    "errar o botão" — era o problema do d-pad.
  // 2. DESLIZAR: arrastar o dedo continua virando a cada ~30px, pra quem
  //    prefere pilotar sem levantar o dedo.
  // ------------------------------------------------------------------
  const boardRef = useRef<HTMLDivElement | null>(null);
  const arrastou = useRef(false);
  const touchStart = useRef<{ x: number; y: number } | null>(null);
  const [toque, setToque] = useState<{ x: number; y: number; id: number } | null>(null);
  const toqueId = useRef(0);
  const SWIPE_PASSO = 30;

  /** Converte um ponto da tela em direção, relativo à cabeça do mangote. */
  const dirigirPara = (clientX: number, clientY: number) => {
    const board = boardRef.current;
    const cabeca = snakeRef.current[0];
    if (!board || !cabeca) return;

    const r = board.getBoundingClientRect();
    const celula = r.width / GRID;
    const cabecaX = r.left + (cabeca.x + 0.5) * celula;
    const cabecaY = r.top + (cabeca.y + 0.5) * celula;

    const dx = clientX - cabecaX;
    const dy = clientY - cabecaY;
    // Toque quase em cima da cabeça não tem direção clara — ignora.
    if (Math.abs(dx) < celula * 0.4 && Math.abs(dy) < celula * 0.4) return;

    if (Math.abs(dx) > Math.abs(dy)) mudarDirecao(dx > 0 ? 1 : -1, 0);
    else mudarDirecao(0, dy > 0 ? 1 : -1);
    sfx.tick();

    // Marca visual de onde o dedo encostou (some sozinha).
    const id = ++toqueId.current;
    setToque({ x: clientX - r.left, y: clientY - r.top, id });
    window.setTimeout(() => {
      setToque((t) => (t?.id === id ? null : t));
    }, 420);
  };

  const aplicarSwipe = (cx: number, cy: number) => {
    if (!touchStart.current) return;
    const dx = cx - touchStart.current.x;
    const dy = cy - touchStart.current.y;
    if (Math.abs(dx) < SWIPE_PASSO && Math.abs(dy) < SWIPE_PASSO) return;
    arrastou.current = true;
    if (Math.abs(dx) > Math.abs(dy)) mudarDirecao(dx > 0 ? 1 : -1, 0);
    else mudarDirecao(0, dy > 0 ? 1 : -1);
    touchStart.current = { x: cx, y: cy };
  };

  const onPointerDown = (e: React.PointerEvent) => {
    touchStart.current = { x: e.clientX, y: e.clientY };
    arrastou.current = false;
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (!touchStart.current) return;
    aplicarSwipe(e.clientX, e.clientY);
  };
  const onPointerUp = (e: React.PointerEvent) => {
    // Só vira "toque" se o dedo praticamente não andou; senão já foi swipe.
    if (!arrastou.current) dirigirPara(e.clientX, e.clientY);
    touchStart.current = null;
    arrastou.current = false;
  };

  return (
    <div
      // A área de comando é esta caixa inteira — dá pra tocar dentro OU fora
      // do tabuleiro. Fora, a direção é lida do mesmo jeito (a conta é feita
      // contra a posição da cabeça), então clicar na margem também funciona.
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={() => {
        touchStart.current = null;
        arrastou.current = false;
      }}
      className="w-full max-w-xl mx-auto flex flex-col items-center gap-4 touch-none select-none cursor-pointer py-2"
    >
      {/* HUD */}
      <div className="w-full flex items-center justify-between px-1">
        <span className="font-display text-sm uppercase tracking-widest text-[#6E675C]">Concreto</span>
        <div className="flex items-center gap-1.5">
          {Array.from({ length: ALVO }, (_, i) => (
            <span
              key={i}
              className={`w-3.5 h-3.5 rounded-full border transition-all duration-300 ${
                i < score
                  ? "bg-[#FF6801] border-[#C24E00] shadow-[0_0_8px_rgba(255,104,1,0.6)] scale-110"
                  : "bg-black/10 border-black/15"
              }`}
            />
          ))}
        </div>
      </div>

      {/* Tabuleiro — o toque é capturado pela caixa externa, então tocar
          nas margens ao redor também comanda o mangote. */}
      <div className="relative w-full max-w-[min(560px,68vh)] aspect-square rounded-2xl p-1.5 shadow-xl faixa-perigo">
        <div
          ref={boardRef}
          className="relative w-full h-full rounded-xl overflow-hidden border-2 border-[#1B1712]"
        >
          <canvas ref={canvasRef} className="w-full h-full block pointer-events-none" />

          {/* Setas de dica: mostram que cada lado da tela é tocável naquela
              direção. Somem no primeiro comando. */}
          {estado === "jogando" && !comecou && (
            <div className="absolute inset-0 pointer-events-none">
              <SetaDica classe="top-2 left-1/2 -translate-x-1/2" atraso="0s">
                <ChevronUp className="w-8 h-8" strokeWidth={3} />
              </SetaDica>
              <SetaDica classe="bottom-2 left-1/2 -translate-x-1/2" atraso="0.4s">
                <ChevronDown className="w-8 h-8" strokeWidth={3} />
              </SetaDica>
              <SetaDica classe="left-2 top-1/2 -translate-y-1/2" atraso="0.2s">
                <ChevronLeft className="w-8 h-8" strokeWidth={3} />
              </SetaDica>
              <SetaDica classe="right-2 top-1/2 -translate-y-1/2" atraso="0.6s">
                <ChevronRight className="w-8 h-8" strokeWidth={3} />
              </SetaDica>

              <span className="absolute top-1/2 left-1/2 -translate-x-1/2 translate-y-10 bg-black/75 text-white font-display text-[11px] md:text-xs uppercase tracking-widest px-4 py-2.5 rounded-full whitespace-nowrap">
                Toque de um lado pra começar
              </span>
            </div>
          )}

          {/* Onda no ponto tocado — confirma que o toque foi lido */}
          {toque && (
            <span
              key={toque.id}
              className="absolute w-16 h-16 -ml-8 -mt-8 rounded-full border-2 border-[#FF6801] pointer-events-none animate-[toque-onda_0.42s_ease-out_forwards]"
              style={{ left: toque.x, top: toque.y }}
            />
          )}

          {estado === "perdeu" && (
            <div className="absolute inset-0 bg-black/65 flex flex-col items-center justify-center gap-4 text-center p-6">
              <p className="font-display text-3xl text-white uppercase tracking-wider">Que pena!</p>
              <p className="text-sm text-white/80 font-sans">O mangote bateu. Tente de novo, sem limite!</p>
              <button
                onClick={() => {
                  sfx.click();
                  tentarDeNovo();
                }}
                className="btn-laranja font-display text-base uppercase tracking-widest px-6 py-3 rounded-xl flex items-center gap-2 cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
                Tentar de novo
              </button>
            </div>
          )}

          {estado === "venceu" && (
            <div className="absolute inset-0 bg-black/65 flex flex-col items-center justify-center gap-3 text-center p-6">
              <Trophy className="w-14 h-14 text-[#F4B21C] animate-bounce" />
              <p className="font-display text-3xl text-[#F4B21C] uppercase tracking-wider glow-text-orange">
                Você venceu!
              </p>
              <p className="text-sm text-white/80 font-sans">Preparando sua roleta de prêmios...</p>
            </div>
          )}
        </div>
      </div>

      {estado === "jogando" && (
        <div className="flex items-center gap-2.5 text-[#6E675C]">
          <Hand className="w-4 h-4 text-[#FF6801]" />
          <p className="font-sans text-xs md:text-sm uppercase tracking-widest">
            Toque para onde quer ir — ou deslize
          </p>
        </div>
      )}

      <style>{`
        @keyframes toque-onda {
          0% { transform: scale(0.5); opacity: 0.9; }
          100% { transform: scale(1.7); opacity: 0; }
        }
        @keyframes seta-dica {
          0%, 100% { opacity: 0.45; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.18); }
        }
      `}</style>
    </div>
  );
}

/** Seta pulsante numa borda do tabuleiro — ensina que dá pra tocar ali. */
function SetaDica({
  classe,
  atraso,
  children,
}: {
  classe: string;
  atraso: string;
  children: React.ReactNode;
}) {
  return (
    <span
      style={{ animationDelay: atraso }}
      className={`absolute ${classe} w-14 h-14 rounded-full bg-[#FF6801]/25 border-2 border-[#FF6801] text-[#FFD9B8] flex items-center justify-center animate-[seta-dica_1.8s_ease-in-out_infinite]`}
    >
      {children}
    </span>
  );
}
