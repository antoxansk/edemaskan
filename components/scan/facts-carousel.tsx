"use client";

import { useEffect, useState } from "react";
import { UPDN_FACTS } from "@/lib/scenarios";

const INTERVAL_MS = 3000;

export function FactsCarousel() {
  const [index, setIndex] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const total = UPDN_FACTS.length;
    let tick = 0;
    const steps = 60;
    const stepMs = INTERVAL_MS / steps;

    const t = setInterval(() => {
      tick++;
      setProgress((tick % steps) / steps);
      if (tick % steps === 0) {
        setIndex((i) => (i + 1) % total);
      }
    }, stepMs);

    return () => clearInterval(t);
  }, []);

  const circumference = 2 * Math.PI * 44;
  const dash = circumference * progress;

  return (
    <div className="flex flex-col items-center gap-4 py-6">
      <div className="relative w-28 h-28">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="44" className="fill-none stroke-muted" strokeWidth="6" />
          <circle
            cx="50" cy="50" r="44"
            className="fill-none stroke-primary transition-all duration-200"
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={circumference - dash}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-2xl">🌿</span>
        </div>
      </div>

      <p className="text-sm text-center text-muted-foreground max-w-xs min-h-[2.5rem] transition-all duration-300">
        {UPDN_FACTS[index]}
      </p>
    </div>
  );
}
