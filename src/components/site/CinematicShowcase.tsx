import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "@tanstack/react-router";
import { ArrowRight, Play, Pause } from "lucide-react";
import { bdt } from "@/lib/format";
import type { Product } from "@/lib/types";

/** Auto-rotating cinematic product film — Ken Burns + 3D tilt + crossfade */
export function CinematicShowcase({ products }: { products: Product[] }) {
  const [idx, setIdx] = useState(0);
  const [playing, setPlaying] = useState(true);
  const list = products.filter((p) => p.images?.[0]).slice(0, 8);

  useEffect(() => {
    if (!playing || list.length < 2) return;
    const t = setInterval(() => setIdx((i) => (i + 1) % list.length), 5200);
    return () => clearInterval(t);
  }, [playing, list.length]);

  if (!list.length) return null;
  const p = list[idx];

  return (
    <section className="relative mx-auto max-w-7xl px-6 pt-20">
      <div className="mb-6 flex items-end justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-gold">Now showing</p>
          <h2 className="font-display text-4xl mt-1">Cinematic Reel</h2>
        </div>
        <button
          onClick={() => setPlaying((v) => !v)}
          aria-label={playing ? "Pause" : "Play"}
          className="rounded-full glass border border-border/60 p-2.5 hover:text-gold transition"
        >
          {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
        </button>
      </div>

      <div className="relative h-[480px] md:h-[560px] rounded-3xl overflow-hidden glass-strong" style={{ perspective: 1400 }}>
        <AnimatePresence mode="sync">
          <motion.div
            key={p.id}
            initial={{ opacity: 0, scale: 1.08 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.02 }}
            transition={{ duration: 1.4, ease: [0.22, 1, 0.36, 1] }}
            className="absolute inset-0"
          >
            {/* Ken-Burns image */}
            <motion.img
              src={p.images![0]}
              alt={p.name}
              className="h-full w-full object-cover"
              initial={{ scale: 1.05, x: -20 }}
              animate={{ scale: 1.18, x: 20 }}
              transition={{ duration: 6, ease: "linear" }}
              loading="eager"
              style={{ willChange: "transform" }}
            />
            <div className="absolute inset-0 bg-gradient-to-r from-background/90 via-background/40 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
          </motion.div>
        </AnimatePresence>

        {/* Floating product card */}
        <AnimatePresence mode="wait">
          <motion.div
            key={`card-${p.id}`}
            initial={{ opacity: 0, y: 40, rotateY: -8 }}
            animate={{ opacity: 1, y: 0, rotateY: 0 }}
            exit={{ opacity: 0, y: -20, rotateY: 6 }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className="absolute inset-x-6 bottom-6 md:inset-auto md:left-10 md:bottom-10 md:max-w-md"
            style={{ transformStyle: "preserve-3d" }}
          >
            <div className="glass-strong rounded-2xl p-5 md:p-6 space-y-3 shadow-gold border border-gold/30">
              <p className="font-arabic text-gold text-sm">عرض حصري</p>
              <h3 className="font-display text-3xl md:text-4xl text-gradient-gold leading-tight">{p.name}</h3>
              {p.description && (
                <p className="text-sm text-muted-foreground line-clamp-2">{p.description}</p>
              )}
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-display text-gold">{bdt(Number(p.price))}</span>
                {p.compare_at_price && p.compare_at_price > p.price && (
                  <span className="text-sm text-muted-foreground line-through">{bdt(Number(p.compare_at_price))}</span>
                )}
              </div>
              <Link
                to="/products/$slug"
                params={{ slug: p.slug }}
                className="inline-flex items-center gap-2 rounded-full bg-gradient-gold px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-gold"
              >
                View product <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Dots */}
        <div className="absolute right-6 top-6 flex flex-col gap-2">
          {list.map((_, i) => (
            <button
              key={i}
              onClick={() => setIdx(i)}
              aria-label={`Slide ${i + 1}`}
              className={`h-1.5 rounded-full transition-all ${i === idx ? "w-8 bg-gradient-gold shadow-gold" : "w-1.5 bg-foreground/30 hover:bg-foreground/60"}`}
            />
          ))}
        </div>

        {/* Progress bar */}
        {playing && (
          <motion.div
            key={`bar-${idx}`}
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 5.2, ease: "linear" }}
            className="absolute bottom-0 left-0 h-0.5 w-full origin-left bg-gradient-gold"
          />
        )}
      </div>
    </section>
  );
}