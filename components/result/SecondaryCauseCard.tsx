import { Waves, ShieldAlert, Droplet, GlassWater, Sparkles } from "lucide-react";
import type { AiResultType } from "@/lib/validation";

const CAUSE_ICONS: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
  lymph_stasis:           Waves,
  parasitic_intoxication: ShieldAlert,
  iron_deficiency:        Droplet,
  water_salt_imbalance:   GlassWater,
  hormonal_imbalance:     Sparkles,
};

type Props = { cause: NonNullable<AiResultType["secondary_cause"]> };

export function SecondaryCauseCard({ cause }: Props) {
  const Icon = CAUSE_ICONS[cause.key] ?? GlassWater;
  return (
    <div className="rounded-2xl border border-border p-4 bg-bg-card">
      <p className="text-sm text-text-muted mb-2 font-medium uppercase tracking-wide text-[12px]">
        Сопутствующая причина
      </p>
      <div className="flex items-center gap-2 mb-2">
        <Icon size={18} className="text-primary shrink-0" aria-hidden="true" />
        <h3 className="text-lg font-semibold text-foreground">{cause.title}</h3>
      </div>
      <p className="text-[17px] leading-relaxed text-foreground/80">
        {cause.explanation_for_user}
      </p>
    </div>
  );
}
