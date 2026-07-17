import { useEffect, useCallback, useRef, useState } from "react";
import { RotateCcw, Trophy, ChevronUp, ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";
import { sfx } from "../shared/lib/sfx";

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

  const snakeRef = useRef<Cell[]>([]);
  const dirRef = useRef<Dir>({ x: 1, y: 0 });
  const nextDirRef = useRef<Dir>({ x: 1, y: 0 });
  const foodRef = useRef<Cell>({ x: 9, y: 6 });
  const timerRef = useRef<number | null>(null);
  const estadoRef = useRef(estado);
  estadoRef.current = estado;
  const scoreRef = useRef(0);
  const pulseRef = useRef(0); // brilho pulsante da comida

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

    if (comeu) {
      sfx.comer();
      const novoScore = scoreRef.current + 1;
      scoreRef.current = novoScore;
      setScore(novoScore);
      if (novoScore >= ALVO) {
        sfx.vitoria();
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
      { x: 4, y: 6 },
      { x: 3, y: 6 },
      { x: 2, y: 6 },
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
    if (atual.x === -nx && atual.y === -ny) return;
    if (atual.x === nx && atual.y === ny) return;
    nextDirRef.current = { x: nx, y: ny };
  }, []);

  useEffect(() => {
    if (estado !== "jogando") {
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
  }, [estado, score, tick]);

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

  const dpad = (nx: number, ny: number) => {
    sfx.click();
    mudarDirecao(nx, ny);
  };

  return (
    <div className="w-full max-w-md mx-auto flex flex-col items-center gap-4">
      {/* HUD */}
      <div className="w-full flex items-center justify-between px-1">
        <span className="font-display text-sm uppercase tracking-widest text-[#6E675C]">Concreto</span>
        <span className="font-display text-lg font-bold text-[#23201B]">
          {score} <span className="text-[#8A8375] text-sm">/ {ALVO}</span>
        </span>
      </div>

      {/* Tabuleiro — laje de concreto com moldura de canteiro */}
      <div className="relative w-full max-w-[380px] aspect-square rounded-2xl p-1.5 shadow-xl faixa-perigo">
        <div className="relative w-full h-full rounded-xl overflow-hidden border-2 border-[#1B1712]">
          <canvas
            ref={canvasRef}
            className="w-full h-full touch-none block"
            onTouchStart={onTouchStart}
            onTouchEnd={onTouchEnd}
          />

          {estado === "perdeu" && (
            <div className="absolute inset-0 bg-black/65 flex flex-col items-center justify-center gap-4 text-center p-6">
              <p className="font-display text-3xl text-white uppercase tracking-wider">Que pena!</p>
              <p className="text-sm text-white/80 font-sans">O mangote bateu. Tente de novo, sem limite!</p>
              <button
                onClick={() => {
                  sfx.click();
                  iniciar();
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

      {/* D-pad */}
      {estado === "jogando" && (
        <div className="grid grid-cols-3 gap-2 w-48 select-none">
          <div />
          <DPad onClick={() => dpad(0, -1)}>
            <ChevronUp className="w-6 h-6" />
          </DPad>
          <div />
          <DPad onClick={() => dpad(-1, 0)}>
            <ChevronLeft className="w-6 h-6" />
          </DPad>
          <DPad onClick={() => dpad(0, 1)}>
            <ChevronDown className="w-6 h-6" />
          </DPad>
          <DPad onClick={() => dpad(1, 0)}>
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
      className="aspect-square rounded-xl bg-[#FDFBF6] border-2 border-black/10 text-[#23201B] flex items-center justify-center shadow-md active:bg-[#FF6801] active:text-white active:scale-95 transition-all cursor-pointer"
    >
      {children}
    </button>
  );
}
