"use client";

import { useCallback } from "react";
import { ZONE_HEX, ZONE_LABELS, ZONE_ORDER } from "@/config/zone-coords";
import type { AiResultType } from "@/lib/validation";
import { cn } from "@/lib/utils";

type Props = { zones: NonNullable<AiResultType["zone_analysis"]> };

function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

export function ZoneChipGrid({ zones }: Props) {
  const scrollToZone = useCallback((key: string) => {
    const el = document.getElementById(`zone-${key}`);
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "start" });
    // Brief: 800ms ring highlight after scroll
    el.style.transition = "box-shadow 150ms ease";
    el.style.boxShadow = "0 0 0 3px #6B9080, 0 0 0 5px #CCE3DE";
    setTimeout(() => {
      el.style.boxShadow = "";
    }, 800);
  }, []);

  const visibleZones = ZONE_ORDER.filter((k) => zones[k]?.visible);
  if (visibleZones.length === 0) return null;

  return (
    <div>
      <h2 className="font-display text-xl font-semibold mb-3 text-foreground">
        Зоны на вашем лице
      </h2>
      <div className="flex flex-wrap gap-2">
        {visibleZones.map((key) => {
          const z = zones[key];
          const hex = ZONE_HEX[key];
          const isNone = !z?.intensity || z.intensity === "none";
          return (
            <button
              key={key}
              type="button"
              onClick={() => scrollToZone(key)}
              className={cn(
                "px-4 py-2 rounded-full text-[15px] font-medium border cursor-pointer",
                "transition-all duration-200 hover:scale-[1.03] active:scale-[0.97]",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
                isNone && "opacity-60",
              )}
              style={{
                backgroundColor: hexToRgba(hex, 0.25),
                borderColor: hex,
                color: "var(--color-foreground)",
              }}
            >
              {ZONE_LABELS[key]}
            </button>
          );
        })}
      </div>
    </div>
  );
}
