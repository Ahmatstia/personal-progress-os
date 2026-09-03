"use client";

import { useEffect, useRef } from "react";

type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  alpha: number;
  color: string;
  size: number;
  rotation: number;
  rotationSpeed: number;
  shape: "rect" | "circle" | "star";
};

const COLORS = [
  "#6366f1", // primary
  "#8b5cf6", // ai violet
  "#2fa263", // success
  "#e7a93a", // warning
  "#d95f5f", // coral
  "#3d9bda", // info
  "#a78bfa", // light violet
  "#46ba7f", // light green
];

function createParticle(originX: number, originY: number): Particle {
  const angle = Math.random() * Math.PI * 2;
  const speed = 4 + Math.random() * 8;
  return {
    x: originX,
    y: originY,
    vx: Math.cos(angle) * speed,
    vy: Math.sin(angle) * speed - 4,
    alpha: 1,
    color: COLORS[Math.floor(Math.random() * COLORS.length)],
    size: 5 + Math.random() * 8,
    rotation: Math.random() * 360,
    rotationSpeed: (Math.random() - 0.5) * 15,
    shape: (["rect", "circle", "star"] as const)[Math.floor(Math.random() * 3)],
  };
}

function drawStar(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number, points = 5) {
  const inner = r * 0.4;
  ctx.beginPath();
  for (let i = 0; i < points * 2; i++) {
    const radius = i % 2 === 0 ? r : inner;
    const angle = (i * Math.PI) / points - Math.PI / 2;
    const x = cx + Math.cos(angle) * radius;
    const y = cy + Math.sin(angle) * radius;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.fill();
}

export function CelebrationEffect({
  trigger,
  originEl,
  particleCount = 60,
}: {
  trigger: boolean;
  originEl?: React.RefObject<HTMLElement | null>;
  particleCount?: number;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const particlesRef = useRef<Particle[]>([]);

  useEffect(() => {
    if (!trigger) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Origin: center of originEl or center of viewport
    let ox = window.innerWidth / 2;
    let oy = window.innerHeight / 3;
    if (originEl?.current) {
      const rect = originEl.current.getBoundingClientRect();
      ox = rect.left + rect.width / 2;
      oy = rect.top + rect.height / 2;
    }

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    particlesRef.current = Array.from({ length: particleCount }, () =>
      createParticle(ox, oy)
    );

    function draw() {
      if (!ctx || !canvas) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particlesRef.current = particlesRef.current.filter((p) => p.alpha > 0.01);

      for (const p of particlesRef.current) {
        ctx.save();
        ctx.globalAlpha = p.alpha;
        ctx.fillStyle = p.color;
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rotation * Math.PI) / 180);

        if (p.shape === "circle") {
          ctx.beginPath();
          ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
          ctx.fill();
        } else if (p.shape === "star") {
          drawStar(ctx, 0, 0, p.size / 2);
        } else {
          ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
        }

        ctx.restore();

        // Physics
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.25; // gravity
        p.vx *= 0.99; // air resistance
        p.alpha -= 0.018;
        p.rotation += p.rotationSpeed;
      }

      if (particlesRef.current.length > 0) {
        animRef.current = requestAnimationFrame(draw);
      } else {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    }

    cancelAnimationFrame(animRef.current);
    animRef.current = requestAnimationFrame(draw);

    return () => cancelAnimationFrame(animRef.current);
  }, [trigger, originEl, particleCount]);

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none fixed inset-0 z-[9999]"
      aria-hidden="true"
    />
  );
}
