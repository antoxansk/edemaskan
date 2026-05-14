"use client";

import { cn } from "@/lib/utils";
import type { AiResultType } from "@/lib/validation";

const ZONE_LABELS: Record<string, string> = {
  forehead:    "Лоб",
  brows:       "Брови",
  periorbital: "Периорбитальная",
  nasolabial:  "Носогубная",
  face_oval:   "Овал лица",
  lips_purse:  "Губы",
  chin:        "Подбородок",
  neck:        "Шея",
};

type ZoneTagsProps = {
  zones: AiResultType["zone_analysis"];
};

export function ZoneTags({ zones }: ZoneTagsProps) {
  function scrollTo(zone: string) {
    document.getElementById(`zone-${zone}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  if (!zones) return null;

  return (
    <div className="flex flex-wrap gap-2">
      {Object.entries(ZONE_LABELS).map(([key, label]) => {
        const z = zones[key as keyof typeof zones];
        const active = z?.visible && z?.intensity !== "none";
        return (
          <button
            key={key}
            type="button"
            onClick={() => scrollTo(key)}
            className={cn(
              "px-3 py-1.5 rounded-full text-xs font-medium border transition-colors",
              active
                ? "bg-primary/10 text-primary border-primary/30 hover:bg-primary/20"
                : "bg-muted text-muted-foreground border-border",
            )}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}
