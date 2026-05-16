import { ZONE_HEX, ZONE_LABELS, ZONE_ORDER } from "@/config/zone-coords";
import type { AiResultType } from "@/lib/validation";

const INTENSITY_LABEL: Record<string, string> = {
  mild:       "Лёгкая",
  moderate:   "Умеренная",
  pronounced: "Выраженная",
};

const INTENSITY_STYLE: Record<string, string> = {
  mild:       "text-primary bg-primary/10",
  moderate:   "text-warning bg-warning/10",
  pronounced: "text-error bg-error/10",
};

type Props = { zones: NonNullable<AiResultType["zone_analysis"]> };

export function ZoneAnalysisList({ zones }: Props) {
  const visibleZones = ZONE_ORDER.filter((k) => {
    const z = zones[k];
    return z?.visible && z?.intensity && z.intensity !== "none";
  });

  if (visibleZones.length === 0) return null;

  return (
    <div>
      <h2 className="font-display text-xl font-semibold mb-4 text-foreground">Разбор по зонам</h2>
      <div className="flex flex-col gap-3">
        {visibleZones.map((key) => {
          const z = zones[key];
          const hex = ZONE_HEX[key];
          const intensity = z?.intensity ?? "none";
          return (
            <div
              key={key}
              id={`zone-${key}`}
              className="rounded-2xl border border-border p-4 bg-bg-card transition-all duration-300 scroll-mt-4"
            >
              <div className="flex items-center gap-3 mb-2 flex-wrap">
                <span
                  className="w-3 h-3 rounded-full shrink-0"
                  style={{ backgroundColor: hex }}
                  aria-hidden="true"
                />
                <h3 className="text-lg font-semibold text-foreground flex-1">
                  {ZONE_LABELS[key]}
                </h3>
                {intensity !== "none" && (
                  <span
                    className={`text-xs font-medium rounded-full px-2.5 py-0.5 ${INTENSITY_STYLE[intensity] ?? ""}`}
                  >
                    {INTENSITY_LABEL[intensity]}
                  </span>
                )}
              </div>
              {z?.note && (
                <p className="text-[17px] leading-relaxed text-text-muted ml-6">{z.note}</p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
