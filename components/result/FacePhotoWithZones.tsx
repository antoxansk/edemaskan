"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { ZONE_COORDS, ZONE_HEX, ZONE_LABELS, ZONE_ORDER, type ZoneKey } from "@/config/zone-coords";
import type { AiResultType } from "@/lib/validation";

const INTENSITY_LABEL: Record<string, string> = {
  mild:       "Лёгкая",
  moderate:   "Умеренная",
  pronounced: "Выраженная",
};

function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

type Props = {
  zones: NonNullable<AiResultType["zone_analysis"]>;
  frontalPhotoUrl?: string | null;
  showEllipses?: boolean;
};

export function FacePhotoWithZones({ zones, frontalPhotoUrl, showEllipses = true }: Props) {
  const [activeTooltip, setActiveTooltip] = useState<ZoneKey | null>(null);
  const tooltipTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [pulseDone, setPulseDone] = useState(false);

  // Stop initial pulse after 2 cycles (~1.6s)
  useEffect(() => {
    const t = setTimeout(() => setPulseDone(true), 1600);
    return () => clearTimeout(t);
  }, []);

  const openTooltip = useCallback((key: ZoneKey) => {
    if (tooltipTimer.current) clearTimeout(tooltipTimer.current);
    setActiveTooltip(key);
    tooltipTimer.current = setTimeout(() => setActiveTooltip(null), 3000);
  }, []);

  const closeTooltip = useCallback(() => {
    if (tooltipTimer.current) clearTimeout(tooltipTimer.current);
    setActiveTooltip(null);
  }, []);

  const handlePointerDown = useCallback((key: ZoneKey, e: React.PointerEvent) => {
    e.stopPropagation();
    longPressTimer.current = setTimeout(() => {
      document.getElementById(`zone-${key}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
      longPressTimer.current = null;
    }, 500);
  }, []);

  const handlePointerUp = useCallback((key: ZoneKey, e: React.PointerEvent) => {
    e.stopPropagation();
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
      openTooltip(key);
    }
  }, [openTooltip]);

  const handlePointerCancel = useCallback(() => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  }, []);

  const visibleZones = ZONE_ORDER.filter((k) => {
    const z = zones[k];
    return z?.visible && z?.intensity && z.intensity !== "none";
  });

  return (
    <div className="flex flex-col gap-3">
      {/* Photo container — 3:4 portrait ratio */}
      <div
        className="relative rounded-3xl overflow-hidden border border-border bg-bg-elevated"
        style={{ aspectRatio: "3/4" }}
        onClick={closeTooltip}
      >
        {frontalPhotoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={frontalPhotoUrl}
            alt="Ваше фото для анализа зон"
            className="w-full h-full object-cover"
            loading="eager"
          />
        ) : (
          <div className="w-full h-full bg-bg-elevated flex items-center justify-center">
            <span className="font-display text-5xl text-primary/15 select-none">лицо</span>
          </div>
        )}

        {/* SVG ellipse overlay */}
        {showEllipses && visibleZones.length > 0 && (
          <svg
            viewBox="0 0 100 133"
            className="absolute inset-0 w-full h-full"
            aria-hidden="true"
            style={{ pointerEvents: "none" }}
          >
            {visibleZones.map((key) => {
              const coords = ZONE_COORDS[key];
              const hex = ZONE_HEX[key];
              return (
                <ellipse
                  key={key}
                  cx={coords.cx}
                  cy={coords.cy}
                  rx={coords.rx}
                  ry={coords.ry}
                  fill={hexToRgba(hex, 0.30)}
                  stroke={hex}
                  strokeWidth="1.5"
                  style={{ pointerEvents: "all", cursor: "pointer" }}
                  className={!pulseDone ? "animate-ping" : undefined}
                  onPointerDown={(e) => handlePointerDown(key, e)}
                  onPointerUp={(e) => handlePointerUp(key, e)}
                  onPointerCancel={handlePointerCancel}
                />
              );
            })}
          </svg>
        )}

        {/* Tooltip pill */}
        {activeTooltip && showEllipses && (() => {
          const z = zones[activeTooltip];
          const intensity = z?.intensity;
          return (
            <div
              className="absolute top-3 left-1/2 -translate-x-1/2 bg-bg-card rounded-full px-4 py-2 shadow-card text-sm font-medium text-foreground border border-border z-10 whitespace-nowrap"
              style={{ animation: "fadeIn 200ms ease-out" }}
              onClick={(e) => { e.stopPropagation(); closeTooltip(); }}
            >
              {ZONE_LABELS[activeTooltip]}
              {intensity && intensity !== "none" && (
                <span className="text-text-muted ml-1.5">· {INTENSITY_LABEL[intensity]}</span>
              )}
            </div>
          );
        })()}
      </div>

      <p className="text-sm text-text-muted text-center">
        Нажмите на эллипс или тег ниже, чтобы прочитать разбор зоны
      </p>
    </div>
  );
}
