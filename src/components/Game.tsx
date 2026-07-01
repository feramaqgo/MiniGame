/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import Confetti from "./Confetti";

interface GameProps {
  onGoal: () => void;
  onMiss: () => void;
}

export default function Game({ onGoal, onMiss }: GameProps) {
  const [gameState, setGameState] = useState<"idle" | "kicking" | "resolved">("idle");
  const [result, setResult] = useState<"goal" | "miss" | null>(null);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const reticleRef = useRef<HTMLDivElement | null>(null);
  const ballRef = useRef<HTMLDivElement | null>(null);

  // Animation values
  const aimPosRef = useRef<number>(50); // percentage 12 to 88
  const directionRef = useRef<number>(1); // 1 = right, -1 = left
  const animFrameIdRef = useRef<number | null>(null);

  // Speed of the aim marker
  const speed = 1.3;

  useEffect(() => {
    const updateAim = () => {
      if (gameState !== "idle") return;

      let nextPos = aimPosRef.current + directionRef.current * speed;

      if (nextPos >= 88) {
        nextPos = 88;
        directionRef.current = -1;
      } else if (nextPos <= 12) {
        nextPos = 12;
        directionRef.current = 1;
      }

      aimPosRef.current = nextPos;

      if (reticleRef.current) {
        reticleRef.current.style.left = `${nextPos}%`;
      }

      animFrameIdRef.current = requestAnimationFrame(updateAim);
    };

    if (gameState === "idle") {
      animFrameIdRef.current = requestAnimationFrame(updateAim);
    }

    return () => {
      if (animFrameIdRef.current) {
        cancelAnimationFrame(animFrameIdRef.current);
      }
    };
  }, [gameState]);

  const handleKick = () => {
    if (gameState !== "idle") return;

    if (animFrameIdRef.current) {
      cancelAnimationFrame(animFrameIdRef.current);
    }

    setGameState("kicking");
    const finalX = aimPosRef.current;

    // Hit detection: [26, 74] is GOAL
    const isGoal = finalX >= 26 && finalX <= 74;

    // Determine target location for the ball
    let targetX = finalX;
    let targetY = 120; // top in px inside a 400px container
    let hitPost = false;
    let bounceX = finalX;

    if (!isGoal) {
      if (finalX >= 20 && finalX < 26) {
        targetX = 20; // left post
        hitPost = true;
        bounceX = 14;
      } else if (finalX > 74 && finalX <= 80) {
        targetX = 80; // right post
        hitPost = true;
        bounceX = 86;
      }
    }

    // Animate ball
    if (ballRef.current) {
      ballRef.current.style.transition = "all 0.6s cubic-bezier(0.25, 1, 0.5, 1)";
      ballRef.current.style.left = `${targetX}%`;
      ballRef.current.style.top = `${targetY}px`;
      ballRef.current.style.transform = `translate(-50%, -50%) scale(0.28) rotate(${isGoal ? 720 : 360}deg)`;
    }

    // Bounce off the post
    if (hitPost) {
      setTimeout(() => {
        if (ballRef.current) {
          ballRef.current.style.transition = "all 0.4s ease-out";
          ballRef.current.style.left = `${bounceX}%`;
          ballRef.current.style.top = "180px"; // falls down slightly
          ballRef.current.style.transform = `translate(-50%, -50%) scale(0.25) rotate(${finalX < 50 ? 840 : 240}deg)`;
        }
      }, 600);
    }

    setTimeout(() => {
      setResult(isGoal ? "goal" : "miss");
      setGameState("resolved");

      setTimeout(() => {
        if (isGoal) {
          onGoal();
        } else {
          onMiss();
        }
      }, 1600);
    }, 1000);
  };

  // Keyboard listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === "Space") {
        e.preventDefault();
        handleKick();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [gameState]);

  return (
    <div
      ref={containerRef}
      onClick={handleKick}
      className="relative w-full h-[400px] md:h-[450px] rounded-2xl overflow-hidden cursor-pointer select-none border border-white/40 flex flex-col justify-between shadow-2xl bg-gradient-to-b from-[#A9D18A]/30 via-[#4C8C42]/45 to-[#1F7A3D]/65 backdrop-blur-sm"
      id="game-canvas-area"
    >
      {/* Stadium backdrop lights inside the container */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#000000]/30 via-transparent to-transparent pointer-events-none" />

      {/* Goal Area at the top */}
      <div className="relative w-full h-[180px] flex items-end justify-center pt-6 pointer-events-none">
        
        {/* Goal SVG */}
        <svg viewBox="0 0 600 200" className="w-[60%] h-[140px] md:h-[160px] z-10" overflow="visible">
          {/* Net Background Shadow */}
          <rect x="0" y="0" width="600" height="200" fill="rgba(0, 0, 0, 0.22)" rx="4" />
          
          {/* Net Mesh Pattern */}
          <defs>
            <pattern id="net-mesh" width="12" height="12" patternUnits="userSpaceOnUse">
              <path d="M 12 0 L 0 0 0 12" fill="none" stroke="rgba(255, 255, 255, 0.15)" strokeWidth="1" />
            </pattern>
          </defs>
          <rect x="0" y="0" width="600" height="200" fill="url(#net-mesh)" rx="4" />
          
          {/* Shaded Goal Zone: 80% width centered ([26%, 74%] container coordinates -> x=60 to x=540) */}
          <rect
            x="60"
            y="0"
            width="480"
            height="200"
            fill="rgba(16, 185, 129, 0.15)"
            stroke="rgba(16, 185, 129, 0.4)"
            strokeWidth="2"
            strokeDasharray="4 4"
          />
          
          {/* Goal Zone Label */}
          <text
            x="300"
            y="110"
            fill="rgba(13, 46, 26, 0.4)"
            fontSize="18"
            fontFamily="Russo One"
            textAnchor="middle"
            letterSpacing="2"
            className="select-none font-bold"
          >
            ZONA DE GOL
          </text>

          {/* Goal Posts & Crossbar */}
          {/* Left Post */}
          <rect x="-6" y="0" width="12" height="200" fill="#FFFFFF" rx="2" className="drop-shadow-[0_0_4px_rgba(255,255,255,0.6)]" />
          {/* Right Post */}
          <rect x="594" y="0" width="12" height="200" fill="#FFFFFF" rx="2" className="drop-shadow-[0_0_4px_rgba(255,255,255,0.6)]" />
          {/* Crossbar */}
          <rect x="-6" y="-6" width="612" height="12" fill="#FFFFFF" rx="2" className="drop-shadow-[0_0_4px_rgba(255,255,255,0.6)]" />

          {/* Goal posts shadows */}
          <circle cx="0" cy="200" r="10" fill="rgba(0,0,0,0.4)" filter="blur(3px)" />
          <circle cx="600" cy="200" r="10" fill="rgba(0,0,0,0.4)" filter="blur(3px)" />
        </svg>

        {/* Shaded goal zone outside border overlay labels */}
        <div className="absolute top-[30px] left-[20%] w-[6%] h-[140px] md:h-[160px] flex items-center justify-center pointer-events-none">
          <span className="font-display text-[8px] md:text-[10px] text-red-500/60 font-bold tracking-widest uppercase -rotate-90">FORA</span>
        </div>
        <div className="absolute top-[30px] right-[20%] w-[6%] h-[140px] md:h-[160px] flex items-center justify-center pointer-events-none">
          <span className="font-display text-[8px] md:text-[10px] text-red-500/60 font-bold tracking-widest uppercase rotate-90">FORA</span>
        </div>
      </div>

      {/* Pitch markings overlay inside container */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-20" overflow="visible">
        {/* Goal Line */}
        <line x1="0" y1="180" x2="100%" y2="180" stroke="#FFFFFF" strokeWidth="1.5" />
        {/* Penalty area perspective left line */}
        <line x1="20%" y1="180" x2="5%" y2="100%" stroke="#FFFFFF" strokeWidth="1.5" />
        {/* Penalty area perspective right line */}
        <line x1="80%" y1="180" x2="95%" y2="100%" stroke="#FFFFFF" strokeWidth="1.5" />
        {/* Penalty Spot */}
        <circle cx="50%" cy="85%" r="5" fill="#FFFFFF" />
      </svg>

      {/* Target Reticle Sweeping (Moves inside the goal area) */}
      <div
        ref={reticleRef}
        className="absolute w-10 h-10 -ml-5 -mt-5 border-2 border-[#FF6801] rounded-full flex items-center justify-center pointer-events-none z-20 shadow-[0_0_15px_#FF6801] transition-shadow duration-300"
        style={{ left: "50%", top: "120px" }}
      >
        <div className="w-2.5 h-2.5 bg-[#FF6801] rounded-full" />
        <div className="absolute w-5 h-[2px] bg-[#FF6801]" />
        <div className="absolute w-[2px] h-5 bg-[#FF6801]" />
      </div>

      {/* FIXED ORANGE BALL AT BOTTOM CENTER */}
      <div
        ref={ballRef}
        className="absolute left-1/2 top-[85%] -translate-x-1/2 -translate-y-1/2 w-16 h-16 z-30 pointer-events-none transition-all duration-700"
        style={{ transform: "translate(-50%, -50%) scale(1) rotate(0deg)" }}
      >
        {/* Soccer Ball SVG */}
        <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-[0_12px_8px_rgba(0,0,0,0.6)]">
          <circle cx="50" cy="50" r="48" fill="#FF6801" stroke="#000000" strokeWidth="2.5" />
          <polygon points="50,38 60,45 56,57 44,57 40,45" fill="#1A1A1D" stroke="#000000" strokeWidth="2" />
          <line x1="50" y1="38" x2="50" y2="20" stroke="#000000" strokeWidth="2" />
          <line x1="60" y1="45" x2="76" y2="38" stroke="#000000" strokeWidth="2" />
          <line x1="56" y1="57" x2="68" y2="72" stroke="#000000" strokeWidth="2" />
          <line x1="44" y1="57" x2="32" y2="72" stroke="#000000" strokeWidth="2" />
          <line x1="40" y1="45" x2="24" y2="38" stroke="#000000" strokeWidth="2" />
          <polygon points="50,20 62,10 74,18 68,32 58,30" fill="none" stroke="#000000" strokeWidth="2" />
          <polygon points="76,38 88,38 92,52 82,60 70,52" fill="none" stroke="#000000" strokeWidth="2" />
          <polygon points="68,72 74,86 60,94 48,86 54,72" fill="none" stroke="#000000" strokeWidth="2" />
          <polygon points="32,72 26,86 40,94 52,86 46,72" fill="none" stroke="#000000" strokeWidth="2" />
          <polygon points="24,38 12,38 8,52 18,60 30,52" fill="none" stroke="#000000" strokeWidth="2" />
          <path d="M 12 30 A 38 38 0 0 1 70 12 A 44 44 0 0 0 12 30" fill="#FFFFFF" opacity="0.25" />
        </svg>
        {/* Ball Shadow */}
        {gameState === "idle" && (
          <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-14 h-4 bg-black/60 rounded-full blur-sm z-[-1]" />
        )}
      </div>

      {/* Tap/Click Instructions overlay at the bottom */}
      {gameState === "idle" && (
        <div className="absolute bottom-4 left-0 right-0 text-center pointer-events-none z-10 animate-pulse">
          <p className="font-display text-xs text-white uppercase tracking-widest bg-black/40 py-1.5 px-4 rounded-full inline-block">
            Toque, clique ou aperte espaço para chutar
          </p>
        </div>
      )}

      {/* Confetti triggered on Goal */}
      {gameState === "resolved" && result === "goal" && <Confetti />}

      {/* Resolution announcement screen */}
      {gameState === "resolved" && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/70 z-40 pointer-events-none">
          <div className="text-center p-6 rounded-lg max-w-[80%]">
            {result === "goal" ? (
              <div className="space-y-2">
                <span className="text-5xl block animate-bounce">🏆</span>
                <h3 className="font-display text-4xl md:text-5xl text-emerald-400 uppercase tracking-wider glow-text-orange">
                  GOOOL!
                </h3>
                <p className="text-sm md:text-base text-white font-mono uppercase tracking-widest mt-1">
                  Chute Perfeito!
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                <span className="text-5xl block animate-pulse">❌</span>
                <h3 className="font-display text-4xl text-rose-500 uppercase tracking-wider">
                  QUASE!
                </h3>
                <p className="text-sm md:text-base text-gray-300 font-mono uppercase tracking-widest mt-1">
                  Chutou para fora!
                </p>
              </div>
            )}
            <div className="flex justify-center items-center mt-4">
              <Loader2 className="w-5 h-5 animate-spin text-[#FF6801] mr-2" />
              <span className="text-xs text-gray-400 uppercase font-mono tracking-wider">
                Carregando...
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
