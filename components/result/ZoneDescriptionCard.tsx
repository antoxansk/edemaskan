"use client";

import type { AiResultType } from "@/lib/validation";
import type { ZoneKey } from "@/lib/face-detection/zones";
import { FACE_ZONES } from "@/lib/face-detection/zones";

type ZoneData = NonNullable<AiResultType["zone_analysis"]>[ZoneKey];

type Props = {
  zone: ZoneKey;
  data: ZoneData;
};

const INTENSITY_LABEL: Record<string, string> = {
  mild: "Лёгкая выраженность",
  moderate: "Умеренная выраженность",
  pronounced: "Выраженная отёчность",
};

export function ZoneDescriptionCard({ zone, data }: Props) {
  if (!data) return null;

  const def = FACE_ZONES[zone];
  const intensity = data.intensity && data.intensity !== "none"
    ? INTENSITY_LABEL[data.intensity] ?? null
    : null;

  return (
    <div
      className="rounded-2xl border p-4 bg-bg-card"
      style={{ borderColor: def.color, animation: "fadeIn 200ms ease-out" }}
    >
      <div className="flex items-center gap-2 mb-2">
        <span
          className="inline-block w-3 h-3 rounded-full flex-shrink-0"
          style={{ backgroundColor: def.color }}
          aria-hidden="true"
        />
        <span className="font-semibold text-foreground">{def.label}</span>
        {intensity && (
          <span className="ml-auto text-xs text-text-muted">{intensity}</span>
        )}
      </div>
      <p className="text-sm text-foreground leading-relaxed">
        {data.note ?? "Зона в норме, особых изменений не выявлено."}
      </p>
    </div>
  );
}
