"use client";

import type { AiResultType } from "@/lib/validation";

type Zones = NonNullable<AiResultType["zone_analysis"]>;
type ZoneEntry = Zones[keyof Zones];

function zoneStyle(z: ZoneEntry | undefined): { fill: string; stroke: string } {
  if (!z?.visible || !z.intensity || z.intensity === "none") return { fill: "transparent", stroke: "transparent" };
  const map = {
    mild:       { fill: "rgba(167,243,208,0.40)", stroke: "rgba(52,211,153,0.70)" },
    moderate:   { fill: "rgba(253,230,138,0.45)", stroke: "rgba(245,158,11,0.75)" },
    pronounced: { fill: "rgba(252,165,165,0.50)", stroke: "rgba(248,113,113,0.80)" },
  };
  return map[z.intensity] ?? { fill: "transparent", stroke: "transparent" };
}

function ZoneOverlaySvg({ zones }: { zones: NonNullable<AiResultType["zone_analysis"]> }) {
  const forehead    = zoneStyle(zones.forehead);
  const brows       = zoneStyle(zones.brows);
  const periorbital = zoneStyle(zones.periorbital);
  const nasolabial  = zoneStyle(zones.nasolabial);
  const face_oval   = zoneStyle(zones.face_oval);
  const lips        = zoneStyle(zones.lips_purse);
  const chin        = zoneStyle(zones.chin);
  const neck        = zoneStyle(zones.neck);

  // Coordinates are % of viewBox 100x133 (3:4 portrait ratio)
  return (
    <svg viewBox="0 0 100 133" className="absolute inset-0 w-full h-full" fill="none">
      {/* Forehead: top of face */}
      <ellipse cx="50" cy="22" rx="28" ry="10"
        fill={forehead.fill} stroke={forehead.stroke} strokeWidth="1" />
      {/* Brows */}
      <rect x="22" y="31" width="56" height="8" rx="4"
        fill={brows.fill} stroke={brows.stroke} strokeWidth="1" />
      {/* Periorbital - left */}
      <ellipse cx="35" cy="44" rx="13" ry="8"
        fill={periorbital.fill} stroke={periorbital.stroke} strokeWidth="1" />
      {/* Periorbital - right */}
      <ellipse cx="65" cy="44" rx="13" ry="8"
        fill={periorbital.fill} stroke={periorbital.stroke} strokeWidth="1" />
      {/* Face oval - cheeks */}
      <ellipse cx="15" cy="60" rx="10" ry="20"
        fill={face_oval.fill} stroke={face_oval.stroke} strokeWidth="1" />
      <ellipse cx="85" cy="60" rx="10" ry="20"
        fill={face_oval.fill} stroke={face_oval.stroke} strokeWidth="1" />
      {/* Nasolabial */}
      <ellipse cx="32" cy="62" rx="9" ry="14"
        fill={nasolabial.fill} stroke={nasolabial.stroke} strokeWidth="1" />
      <ellipse cx="68" cy="62" rx="9" ry="14"
        fill={nasolabial.fill} stroke={nasolabial.stroke} strokeWidth="1" />
      {/* Lips */}
      <ellipse cx="50" cy="79" rx="18" ry="8"
        fill={lips.fill} stroke={lips.stroke} strokeWidth="1" />
      {/* Chin */}
      <ellipse cx="50" cy="93" rx="22" ry="10"
        fill={chin.fill} stroke={chin.stroke} strokeWidth="1" />
      {/* Neck */}
      <rect x="34" y="107" width="32" height="20" rx="6"
        fill={neck.fill} stroke={neck.stroke} strokeWidth="1" />
    </svg>
  );
}

export function FaceDiagram({
  zones,
  frontalPhotoUrl,
}: {
  zones: AiResultType["zone_analysis"];
  frontalPhotoUrl?: string | null;
}) {
  if (!zones) return null;

  const hasPhoto = !!frontalPhotoUrl;

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative w-44 mx-auto rounded-2xl overflow-hidden border border-border"
        style={{ aspectRatio: "3/4" }}>
        {hasPhoto ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={frontalPhotoUrl!} alt="Анализ лица" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-muted" />
        )}
        <ZoneOverlaySvg zones={zones} />
      </div>

      {/* Legend */}
      <div className="flex gap-3 text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded-sm bg-emerald-200 border border-emerald-400 inline-block" />
          Слабо
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded-sm bg-amber-200 border border-amber-400 inline-block" />
          Умеренно
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded-sm bg-rose-200 border border-rose-400 inline-block" />
          Выражено
        </span>
      </div>
    </div>
  );
}
