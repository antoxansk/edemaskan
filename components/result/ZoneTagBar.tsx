"use client";

import { useCallback, useRef } from "react";
import type { ZoneKey } from "@/lib/face-detection/zones";
import { FACE_ZONES, ZONE_ORDER } from "@/lib/face-detection/zones";
import type { AiResultType } from "@/lib/validation";

type Props = {
  zones: NonNullable<AiResultType["zone_analysis"]>;
  activeZone: ZoneKey | null;
  onZoneClick: (zone: ZoneKey) => void;
};

function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

export function ZoneTagBar({ zones, activeZone, onZoneClick }: Props) {
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const handleClick = useCallback(
    (zone: ZoneKey) => {
      if (debounceRef.current) return;
      onZoneClick(zone);
      debounceRef.current = setTimeout(() => {
        debounceRef.current = undefined;
      }, 100);
    },
    [onZoneClick]
  );

  const visibleZones = ZONE_ORDER.filter((k) => {
    const z = zones[k];
    return z?.visible && z?.intensity && z.intensity !== "none";
  });

  if (!visibleZones.length) return null;

  return (
    <div className="flex flex-wrap gap-2" role="group" aria-label="Зоны анализа">
      {visibleZones.map((zone) => {
        const def = FACE_ZONES[zone];
        const isActive = activeZone === zone;
        return (
          <button
            key={zone}
            type="button"
            onClick={() => handleClick(zone)}
            style={{
              borderColor: def.color,
              backgroundColor: isActive ? def.color : hexToRgba(def.color, 0.08),
              color: isActive ? "#ffffff" : def.color,
              transition: "background-color 200ms ease, color 200ms ease",
            }}
            className="rounded-full px-3 py-1 text-sm font-medium border focus-visible:outline-none focus-visible:ring-2"
            aria-pressed={isActive}
          >
            {def.label}
          </button>
        );
      })}
    </div>
  );
}
