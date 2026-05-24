import { useRouterState } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";

export function NavProgress() {
  const isNavigating = useRouterState({
    select: (s) => s.isLoading || s.isTransitioning,
  });
  const [width, setWidth] = useState(0);
  const [visible, setVisible] = useState(false);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  const hide = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (isNavigating) {
      if (hide.current) clearTimeout(hide.current);
      setVisible(true);
      setWidth(8);
      timer.current && clearInterval(timer.current);
      timer.current = setInterval(() => {
        setWidth((w) => (w < 85 ? w + (90 - w) * 0.12 : w));
      }, 120);
    } else {
      if (timer.current) clearInterval(timer.current);
      setWidth(100);
      hide.current = setTimeout(() => {
        setVisible(false);
        setWidth(0);
      }, 350);
    }
    return () => {
      if (timer.current) clearInterval(timer.current);
    };
  }, [isNavigating]);

  return (
    <div
      aria-hidden
      className="fixed top-0 left-0 right-0 z-[60] h-[2px] pointer-events-none"
      style={{ opacity: visible ? 1 : 0, transition: "opacity .3s" }}
    >
      <div
        className="h-full bg-gradient-gold shadow-gold"
        style={{
          width: `${width}%`,
          transition: "width .25s cubic-bezier(.2,.8,.2,1)",
          boxShadow: "0 0 10px var(--gold), 0 0 24px var(--gold)",
        }}
      />
    </div>
  );
}
