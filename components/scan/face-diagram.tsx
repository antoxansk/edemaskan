"use client";

import type { AiResultType } from "@/lib/validation";

type Zones = NonNullable<AiResultType["zone_analysis"]>;
type ZoneEntry = Zones[keyof Zones];

function zoneStyle(z: ZoneEntry | undefined): { fill: string; stroke: string } {
  if (!z?.visible || !z.intensity || z.intensity === "none") {
    return { fill: "rgba(203,213,225,0.15)", stroke: "#cbd5e1" };
  }
  const map = {
    mild:       { fill: "rgba(167,243,208,0.50)", stroke: "#34d399" },
    moderate:   { fill: "rgba(253,230,138,0.60)", stroke: "#f59e0b" },
    pronounced: { fill: "rgba(252,165,165,0.65)", stroke: "#f87171" },
  };
  return map[z.intensity] ?? { fill: "rgba(203,213,225,0.15)", stroke: "#cbd5e1" };
}

export function FaceDiagram({ zones }: { zones: AiResultType["zone_analysis"] }) {
  if (!zones) return null;

  const forehead    = zoneStyle(zones.forehead);
  const brows       = zoneStyle(zones.brows);
  const periorbital = zoneStyle(zones.periorbital);
  const nasolabial  = zoneStyle(zones.nasolabial);
  const face_oval   = zoneStyle(zones.face_oval);
  const lips        = zoneStyle(zones.lips_purse);
  const chin        = zoneStyle(zones.chin);
  const neck        = zoneStyle(zones.neck);

  return (
    <div className="flex flex-col items-center gap-3">
      <svg viewBox="0 0 160 250" className="w-44 h-auto" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <clipPath id="face-clip">
            <ellipse cx="80" cy="115" rx="64" ry="88" />
          </clipPath>
        </defs>

        {/* Neck */}
        <rect x="52" y="196" width="56" height="38" rx="10"
          fill={neck.fill} stroke={neck.stroke} strokeWidth="1.5" />

        {/* Face background */}
        <ellipse cx="80" cy="115" rx="64" ry="88" fill="white" stroke="#e2e8f0" strokeWidth="1.5" />

        {/* Zones clipped to face */}
        <g clipPath="url(#face-clip)">
          {/* Forehead */}
          <ellipse cx="80" cy="50" rx="58" ry="28"
            fill={forehead.fill} stroke={forehead.stroke} strokeWidth="1.2" />

          {/* Brows */}
          <rect x="26" y="74" width="108" height="18" rx="9"
            fill={brows.fill} stroke={brows.stroke} strokeWidth="1.2" />

          {/* Periorbital - left */}
          <ellipse cx="54" cy="100" rx="22" ry="13"
            fill={periorbital.fill} stroke={periorbital.stroke} strokeWidth="1.2" />
          {/* Periorbital - right */}
          <ellipse cx="106" cy="100" rx="22" ry="13"
            fill={periorbital.fill} stroke={periorbital.stroke} strokeWidth="1.2" />

          {/* Face oval / cheeks */}
          <ellipse cx="22" cy="138" rx="18" ry="34"
            fill={face_oval.fill} stroke={face_oval.stroke} strokeWidth="1.2" />
          <ellipse cx="138" cy="138" rx="18" ry="34"
            fill={face_oval.fill} stroke={face_oval.stroke} strokeWidth="1.2" />

          {/* Nasolabial */}
          <ellipse cx="52" cy="138" rx="14" ry="22"
            fill={nasolabial.fill} stroke={nasolabial.stroke} strokeWidth="1.2" />
          <ellipse cx="108" cy="138" rx="14" ry="22"
            fill={nasolabial.fill} stroke={nasolabial.stroke} strokeWidth="1.2" />

          {/* Lips */}
          <ellipse cx="80" cy="162" rx="28" ry="13"
            fill={lips.fill} stroke={lips.stroke} strokeWidth="1.2" />

          {/* Chin */}
          <ellipse cx="80" cy="188" rx="40" ry="18"
            fill={chin.fill} stroke={chin.stroke} strokeWidth="1.2" />
        </g>

        {/* Face outline on top */}
        <ellipse cx="80" cy="115" rx="64" ry="88" fill="none" stroke="#94a3b8" strokeWidth="1.5" />

        {/* Zone labels */}
        <text x="80" y="52"  textAnchor="middle" fontSize="7.5" fill="#475569" fontFamily="system-ui">Лоб</text>
        <text x="80" y="85"  textAnchor="middle" fontSize="7.5" fill="#475569" fontFamily="system-ui">Брови</text>
        <text x="80" y="101" textAnchor="middle" fontSize="7"   fill="#475569" fontFamily="system-ui">Периорб.</text>
        <text x="22" y="140" textAnchor="middle" fontSize="6.5" fill="#475569" fontFamily="system-ui">Овал</text>
        <text x="138" y="140" textAnchor="middle" fontSize="6.5" fill="#475569" fontFamily="system-ui">Овал</text>
        <text x="52"  y="140" textAnchor="middle" fontSize="6.5" fill="#475569" fontFamily="system-ui">НГС</text>
        <text x="108" y="140" textAnchor="middle" fontSize="6.5" fill="#475569" fontFamily="system-ui">НГС</text>
        <text x="80" y="164" textAnchor="middle" fontSize="7.5" fill="#475569" fontFamily="system-ui">Губы</text>
        <text x="80" y="190" textAnchor="middle" fontSize="7.5" fill="#475569" fontFamily="system-ui">Подбородок</text>
        <text x="80" y="222" textAnchor="middle" fontSize="7.5" fill="#475569" fontFamily="system-ui">Шея</text>
      </svg>

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
