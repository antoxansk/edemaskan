"use client";

import { useEffect, useRef, useState } from "react";

type Cell =
  | { type: "number"; value: number; suffix: string; label: string }
  | { type: "text";   text: string;                  label: string };

const CELLS: Cell[] = [
  { type: "number", value: 327,   suffix: "+", label: "успешных сканирований" },
  { type: "number", value: 3000,  suffix: "+", label: "учеников на курсах УПДН" },
  { type: "number", value: 30000, suffix: "+", label: "человек прошли наши материалы" },
  { type: "text",   text: "Сеченова",           label: "методика совместно с Первым МГМУ им. И.М. Сеченова" },
];

const SESSION_KEY = "edm_stats_animated";
const DURATION_MS = 1500;

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

function formatNumber(n: number): string {
  return n.toLocaleString("ru-RU").replace(/,/g, " ");
}

function CountUpNumber({ value, suffix, started }: { value: number; suffix: string; started: boolean }) {
  const [current, setCurrent] = useState(0);
  const [done, setDone]       = useState(false);
  const rafRef                = useRef<number>(0);

  useEffect(() => {
    if (!started) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      // Async to avoid synchronous setState in effect body
      const id = window.setTimeout(() => {
        setCurrent(value);
        setDone(true);
      }, 0);
      return () => window.clearTimeout(id);
    }

    const startTime = performance.now();

    function tick(now: number) {
      const elapsed  = now - startTime;
      const progress = Math.min(elapsed / DURATION_MS, 1);
      const eased    = easeOutCubic(progress);
      setCurrent(Math.round(eased * value));

      if (progress < 1) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        setCurrent(value);
        setDone(true);
      }
    }

    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [started, value]);

  return (
    <span>
      {formatNumber(current)}
      <span
        className="ml-0.5 transition-opacity duration-300"
        style={{ opacity: done ? 1 : 0 }}
      >
        {suffix}
      </span>
    </span>
  );
}

function TextFade({ text, started }: { text: string; started: boolean }) {
  return (
    <span
      className="transition-opacity duration-700"
      style={{ opacity: started ? 1 : 0 }}
    >
      {text}
    </span>
  );
}

export function StatsStrip() {
  const rootRef               = useRef<HTMLDivElement>(null);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    // Already animated in this session — activate immediately (async)
    if (sessionStorage.getItem(SESSION_KEY)) {
      const id = window.setTimeout(() => setStarted(true), 0);
      return () => window.clearTimeout(id);
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry?.isIntersecting) {
          setStarted(true);
          sessionStorage.setItem(SESSION_KEY, "1");
          observer.disconnect();
        }
      },
      { threshold: 0.5 }
    );

    if (rootRef.current) observer.observe(rootRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section className="py-10 px-4 bg-emerald-50/60" ref={rootRef}>
      <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
        {CELLS.map((cell) => (
          <div key={cell.label}>
            <div className="text-3xl md:text-4xl font-extrabold text-emerald-700 leading-none">
              {cell.type === "number" ? (
                <CountUpNumber value={cell.value} suffix={cell.suffix} started={started} />
              ) : (
                <TextFade text={cell.text} started={started} />
              )}
            </div>
            <p className="mt-2 text-xs text-muted-foreground leading-snug">{cell.label}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
