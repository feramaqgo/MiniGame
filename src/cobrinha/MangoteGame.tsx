import { useEffect, useCallback, useRef, useState } from "react";
import { RotateCcw, Trophy, ChevronUp, ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";

const GRID = 15; // células por lado
const SIZE = 360; // tamanho lógico do canvas (px)
const CELL = SIZE / GRID;
const ALVO = 8; // porções de concreto pra vencer

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

  const snakeRef = useRef<Cell[]>([]);
  const dirRef = useRef<Dir>({ x: 1, y: 0 });
  const nextDirRef = useRef<Dir>({ x: 1, y: 0 });
  const foodRef = useRef<Cell>({ x: 10, y: 7 });
  const timerRef = useRef<number | null>(null);
  const estadoRef = useRef(estado);
  estadoRef.current = estado;
  const scoreRef = useRef(0);

  const novaComida = useCallback(() => {
    // Nasce longe das bordas (margem de 2 células) — fica mais fácil de pegar.
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
  }, []);

  const desenhar = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Fundo
    ctx.fillStyle = "#F3EBDA";
    ctx.fillRect(0, 0, SIZE, SIZE);

    // Grade sutil
    ctx.strokeStyle = "rgba(120,100,60,0.10)";
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

    // Comida — porção de concreto (blob cinza com brilho)
    const f = foodRef.current;
    const fx = (f.x + 0.5) * CELL;
    const fy = (f.y + 0.5) * CELL;
    ctx.beginPath();
    ctx.arc(fx, fy, CELL * 0.34, 0, Math.PI * 2);
    ctx.fillStyle = "#9A938A";
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = "#5F594F";
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(fx - CELL * 0.1, fy - CELL * 0.12, CELL * 0.09, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(255,255,255,0.7)";
    ctx.fill();

    const snake = snakeRef.current;
    if (snake.length === 0) return;

    // Corpo do mangote — traço grosso e contínuo com juntas
    const path = new Path2D();
    snake.forEach((s, i) => {
      const cx = (s.x + 0.5) * CELL;
      const cy = (s.y + 0.5) * CELL;
      if (i === 0) path.moveTo(cx, cy);
      else path.lineTo(cx, cy);
    });

    ctx.lineJoin = "round";
    ctx.lineCap = "round";

    // sombra/base
    ctx.strokeStyle = "#6E6A63";
    ctx.lineWidth = CELL * 0.82;
    ctx.stroke(path);
    // corpo cinza-concreto
    ctx.strokeStyle = "#8C877E";
    ctx.lineWidth = CELL * 0.64;
    ctx.stroke(path);
    // brilho central
    ctx.strokeStyle = "rgba(255,255,255,0.22)";
    ctx.lineWidth = CELL * 0.2;
    ctx.stroke(path);

    // Juntas do mangote (aneis entre segmentos)
    ctx.strokeStyle = "rgba(60,55,48,0.55)";
    ctx.lineWidth = 2.5;
    for (let i = 1; i < snake.length; i++) {
      const a = snake[i - 1];
      const b = snake[i];
      const mx = ((a.x + b.x) / 2 + 0.5) * CELL;
      const my = ((a.y + b.y) / 2 + 0.5) * CELL;
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      // perpendicular à direção do segmento
      const px = -dy;
      const py = dx;
      const h = CELL * 0.34;
      ctx.beginPath();
      ctx.moveTo(mx - px * h, my - py * h);
      ctx.lineTo(mx + px * h, my + py * h);
      ctx.stroke();
    }

    // Cabeça — bico laranja do mangote
    const head = snake[0];
    const hx = (head.x + 0.5) * CELL;
    const hy = (head.y + 0.5) * CELL;
    ctx.beginPath();
    ctx.arc(hx, hy, CELL * 0.46, 0, Math.PI * 2);
    ctx.fillStyle = "#FF6801";
    ctx.fill();
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = "#B4470A";
    ctx.stroke();
    // boca/saída do bico apontando pra frente
    const d = dirRef.current;
    ctx.beginPath();
    ctx.arc(hx + d.x * CELL * 0.22, hy + d.y * CELL * 0.22, CELL * 0.12, 0, Math.PI * 2);
    ctx.fillStyle = "#3A1603";
    ctx.fill();
  }, []);

  const tick = useCallback(() => {
    if (estadoRef.current !== "jogando") return;

    const snake = snakeRef.current;
    dirRef.current = nextDirRef.current;
    const d = dirRef.current;
    const head = snake[0];
    const novaCabeca: Cell = { x: head.x + d.x, y: head.y + d.y };

    // Colisão com parede
    if (novaCabeca.x < 0 || novaCabeca.x >= GRID || novaCabeca.y < 0 || novaCabeca.y >= GRID) {
      setEstado("perdeu");
      return;
    }
    // Colisão com o próprio corpo (menos a cauda que vai sair)
    const corpoSemCauda = snake.slice(0, snake.length - 1);
    if (corpoSemCauda.some((s) => mesmaCelula(s, novaCabeca))) {
      setEstado("perdeu");
      return;
    }

    const comeu = mesmaCelula(novaCabeca, foodRef.current);
    const novaSnake = [novaCabeca, ...snake];
    if (!comeu) {
      novaSnake.pop();
    }
    snakeRef.current = novaSnake;

    if (comeu) {
      const novoScore = scoreRef.current + 1;
      scoreRef.current = novoScore;
      setScore(novoScore);
      if (novoScore >= ALVO) {
        setEstado("venceu");
        desenhar();
        return;
      }
      novaComida();
    }

    desenhar();
  }, [desenhar, novaComida]);

  const iniciar = useCallback(() => {
    snakeRef.current = [
      { x: 4, y: 7 },
      { x: 3, y: 7 },
      { x: 2, y: 7 },
    ];
    dirRef.current = { x: 1, y: 0 };
    nextDirRef.current = { x: 1, y: 0 };
    scoreRef.current = 0;
    setScore(0);
    novaComida();
    setEstado("jogando");
    desenhar();
  }, [desenhar, novaComida]);

  const mudarDirecao = useCallback((nx: number, ny: number) => {
    const atual = dirRef.current;
    // não deixa inverter direto pra cima de si mesmo
    if (atual.x === -nx && atual.y === -ny) return;
    if (atual.x === nx && atual.y === ny) return;
    nextDirRef.current = { x: nx, y: ny };
  }, []);

  // Loop do jogo — velocidade aumenta levemente conforme cresce
  useEffect(() => {
    if (estado !== "jogando") {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      return;
    }
    const velocidade = Math.max(95, 155 - score * 6);
    timerRef.current = window.setInterval(tick, velocidade);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [estado, score, tick]);

  // Vitória -> resgatar prêmio na roleta
  useEffect(() => {
    if (estado === "venceu") {
      const t = setTimeout(onWin, 1400);
      return () => clearTimeout(t);
    }
  }, [estado, onWin]);

  // Setup inicial + teclado
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

  // Swipe no canvas
  const touchStart = useRef<{ x: number; y: number } | null>(null);
  const onTouchStart = (e: React.TouchEvent) => {
    const t = e.touches[0];
    touchStart.current = { x: t.clientX, y: t.clientY };
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (!touchStart.current) return;
    const t = e.changedTouches[0];
    const dx = t.clientX - touchStart.current.x;
    const dy = t.clientY - touchStart.current.y;
    if (Math.abs(dx) < 20 && Math.abs(dy) < 20) return;
    if (Math.abs(dx) > Math.abs(dy)) mudarDirecao(dx > 0 ? 1 : -1, 0);
    else mudarDirecao(0, dy > 0 ? 1 : -1);
    touchStart.current = null;
  };

  return (
    <div className="w-full max-w-md mx-auto flex flex-col items-center gap-4">
      {/* HUD */}
      <div className="w-full flex items-center justify-between px-1">
        <span className="font-display text-sm uppercase tracking-widest text-[#6B6048]">Concreto</span>
        <span className="font-display text-lg font-bold text-[#1A1208]">
          {score} <span className="text-[#857a5e] text-sm">/ {ALVO}</span>
        </span>
      </div>

      {/* Tabuleiro */}
      <div className="relative w-full max-w-[360px] aspect-square rounded-2xl overflow-hidden border-2 border-black/10 shadow-xl">
        <canvas
          ref={canvasRef}
          className="w-full h-full touch-none"
          style={{ imageRendering: "auto" }}
          onTouchStart={onTouchStart}
          onTouchEnd={onTouchEnd}
        />

        {estado === "perdeu" && (
          <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center gap-4 text-center p-6">
            <p className="font-display text-3xl text-white uppercase tracking-wider">Que pena!</p>
            <p className="text-sm text-white/80 font-sans">O mangote bateu. Tente de novo, sem limite!</p>
            <button
              onClick={iniciar}
              className="border-2 border-[#FF6801] bg-[#FF6801] text-white font-display text-base uppercase tracking-widest px-6 py-3 rounded-xl flex items-center gap-2 hover:bg-[#e05c01] transition-colors cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              Tentar de novo
            </button>
          </div>
        )}

        {estado === "venceu" && (
          <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center gap-3 text-center p-6">
            <Trophy className="w-14 h-14 text-[#F5C518] animate-bounce" />
            <p className="font-display text-3xl text-[#F5C518] uppercase tracking-wider glow-text-orange">
              Você venceu!
            </p>
            <p className="text-sm text-white/80 font-sans">Preparando sua roleta de prêmios...</p>
          </div>
        )}
      </div>

      {/* D-pad pra mobile */}
      {estado === "jogando" && (
        <div className="grid grid-cols-3 gap-2 w-44 select-none">
          <div />
          <DPad onClick={() => mudarDirecao(0, -1)}>
            <ChevronUp className="w-6 h-6" />
          </DPad>
          <div />
          <DPad onClick={() => mudarDirecao(-1, 0)}>
            <ChevronLeft className="w-6 h-6" />
          </DPad>
          <DPad onClick={() => mudarDirecao(0, 1)}>
            <ChevronDown className="w-6 h-6" />
          </DPad>
          <DPad onClick={() => mudarDirecao(1, 0)}>
            <ChevronRight className="w-6 h-6" />
          </DPad>
        </div>
      )}
    </div>
  );
}

function DPad({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className="aspect-square rounded-xl bg-[#FFFAF0] border-2 border-black/10 text-[#1A1208] flex items-center justify-center shadow-md active:bg-[#FF6801] active:text-white active:scale-95 transition-all cursor-pointer"
    >
      {children}
    </button>
  );
}
