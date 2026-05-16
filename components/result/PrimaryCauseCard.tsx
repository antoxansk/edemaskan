import { Waves, ShieldAlert, Droplet, GlassWater, Sparkles } from "lucide-react";
import type { AiResultType } from "@/lib/validation";

type CauseKey = NonNullable<AiResultType["primary_cause"]>["key"];

const CAUSE_ICONS: Record<CauseKey, React.ComponentType<{ size?: number; className?: string }>> = {
  lymph_stasis:           Waves,
  parasitic_intoxication: ShieldAlert,
  iron_deficiency:        Droplet,
  water_salt_imbalance:   GlassWater,
  hormonal_imbalance:     Sparkles,
};

function ConfidenceIndicator({ value }: { value: number }) {
  const filled = Math.round(value * 5);
  const pct = Math.round(value * 100);
  return (
    <div className="flex items-center gap-3 mt-5">
      <div className="flex gap-1.5" aria-label={`Уверенность анализа: ${pct}%`} role="img">
        {Array.from({ length: 5 }).map((_, i) => (
          <span
            key={i}
            className={`w-3 h-3 rounded-full transition-colors ${
              i < filled ? "bg-primary" : "bg-primary/20"
            }`}
          />
        ))}
      </div>
      <span className="text-sm text-text-muted font-medium">Уверенность {pct}%</span>
    </div>
  );
}

type Props = { cause: NonNullable<AiResultType["primary_cause"]> };

export function PrimaryCauseCard({ cause }: Props) {
  const Icon = CAUSE_ICONS[cause.key] ?? Sparkles;
  return (
    <div className="rounded-3xl p-6 bg-bg-sage-soft shadow-card">
      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <Icon size={22} className="text-primary shrink-0" aria-hidden="true" />
        <span className="bg-primary text-text-inverse rounded-full text-xs px-3 py-1 font-medium">
          Главная вероятная причина
        </span>
      </div>
      <h2 className="font-display text-2xl md:text-3xl font-semibold leading-tight text-foreground mb-3">
        {cause.title}
      </h2>
      <p className="text-[17px] leading-relaxed text-foreground/90">
        {cause.explanation_for_user}
      </p>
      <ConfidenceIndicator value={cause.confidence} />
    </div>
  );
}
