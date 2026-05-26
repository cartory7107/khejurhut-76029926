import { useEffect, useRef } from "react";

/** Floating golden particles canvas — cinematic Arabic luxury feel */
export function GoldParticles({ density = 40, className = "" }: { density?: number; className?: string }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const c = ref.current;
    if (!c) return;
    const ctx = c.getContext("2d")!;
    let raf = 0;
    const dpr = window.devicePixelRatio || 1;
    const resize = () => {
      const r = c.getBoundingClientRect();
      c.width = r.width * dpr; c.height = r.height * dpr;
    };
    resize();
    window.addEventListener("resize", resize);
    const parts = Array.from({ length: density }, () => ({
      x: Math.random() * c.width,
      y: Math.random() * c.height,
      r: (Math.random() * 1.6 + 0.4) * dpr,
      vy: -(Math.random() * 0.4 + 0.1) * dpr,
      vx: (Math.random() - 0.5) * 0.15 * dpr,
      a: Math.random() * 0.6 + 0.2,
    }));
    const tick = () => {
      ctx.clearRect(0, 0, c.width, c.height);
      for (const p of parts) {
        p.x += p.vx; p.y += p.vy;
        if (p.y < -10) { p.y = c.height + 10; p.x = Math.random() * c.width; }
        if (p.x < -10) p.x = c.width + 10;
        if (p.x > c.width + 10) p.x = -10;
        const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 6);
        g.addColorStop(0, `rgba(232,196,108,${p.a})`);
        g.addColorStop(1, "rgba(232,196,108,0)");
        ctx.fillStyle = g;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r * 6, 0, Math.PI * 2); ctx.fill();
      }
      raf = requestAnimationFrame(tick);
    };
    tick();
    return () => { cancelAnimationFrame(raf); window.removeEventListener("resize", resize); };
  }, [density]);
  return <canvas ref={ref} className={`pointer-events-none absolute inset-0 h-full w-full ${className}`} />;
}