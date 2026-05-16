import { Stethoscope } from "lucide-react";

type Props = { name: string; reason: string | null };

export function RedFlagCard({ name, reason }: Props) {
  return (
    <div className="rounded-3xl p-6 bg-bg-elevated">
      <Stethoscope size={32} className="text-primary mb-4" aria-hidden="true" />
      <h2 className="font-display text-2xl font-semibold text-foreground leading-tight mb-3">
        {name}, рекомендуем сначала очно показаться врачу
      </h2>
      {reason && (
        <p className="text-[17px] leading-relaxed text-foreground/80 mb-5">{reason}</p>
      )}
      <p className="text-sm text-text-muted leading-relaxed mb-5">
        Тон страницы — поддерживающий. Когда врач даст «зелёный свет» — программы УПДН по лимфе
        могут стать частью комплексной поддержки.
      </p>
      <button
        type="button"
        className="h-12 px-8 rounded-full bg-primary text-text-inverse font-semibold cursor-pointer transition-opacity duration-200 hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
      >
        Понятно
      </button>
    </div>
  );
}
