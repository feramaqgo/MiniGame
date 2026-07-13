/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useRef } from "react";

interface Particle {
  x: number;
  y: number;
  size: number;
  color: string;
  speedX: number;
  speedY: number;
  rotation: number;
  rotationSpeed: number;
  opacity: number;
}

export default function Confetti() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let particles: Particle[] = [];

    const colors = [
      "#FF6801", // Orange
      "#1F7A3D", // Green
      "#F5C518", // Gold
      "#FFA259", // Light Orange
      "#39D373"  // Light Green
    ];

    const resizeCanvas = () => {
      if (canvas) {
        canvas.width = canvas.parentElement?.clientWidth || window.innerWidth;
        canvas.height = canvas.parentElement?.clientHeight || window.innerHeight;
      }
    };

    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    // Create particles
    const particleCount = 120;
    for (let i = 0; i < particleCount; i++) {
      // Spawn from bottom/middle or randomly across screen width
      const x = canvas.width / 2 + (Math.random() - 0.5) * 100;
      const y = canvas.height * 0.7 + (Math.random() - 0.5) * 50;
      
      const angle = Math.random() * Math.PI - Math.PI; // Upwards burst
      const speed = Math.random() * 12 + 6;

      particles.push({
        x,
        y,
        size: Math.random() * 8 + 6,
        color: colors[Math.floor(Math.random() * colors.length)],
        speedX: Math.cos(angle) * speed + (Math.random() - 0.5) * 2,
        speedY: Math.sin(angle) * speed - 5, // Strongly upwards
        rotation: Math.random() * 360,
        rotationSpeed: (Math.random() - 0.5) * 10,
        opacity: 1
      });
    }

    // Animation Loop
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      let activeParticles = 0;

      particles.forEach((p) => {
        if (p.opacity <= 0) return;

        activeParticles++;

        // Update positions
        p.x += p.speedX;
        p.y += p.speedY;

        // Apply physics (gravity & drag)
        p.speedY += 0.22; // gravity
        p.speedX *= 0.98; // air resistance
        p.speedY *= 0.98;

        // Rotate
        p.rotation += p.rotationSpeed;

        // Fade out as they fall lower or age
        if (p.speedY > 0) {
          p.opacity -= 0.008;
        }

        // Draw particle
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rotation * Math.PI) / 180);
        ctx.globalAlpha = Math.max(0, p.opacity);
        ctx.fillStyle = p.color;
        
        // Draw square or rectangle
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
        ctx.restore();
      });

      if (activeParticles > 0) {
        animationFrameId = requestAnimationFrame(animate);
      }
    };

    animate();

    return () => {
      window.removeEventListener("resize", resizeCanvas);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none absolute inset-0 w-full h-full z-40"
      id="canvas-confetti"
    />
  );
}
