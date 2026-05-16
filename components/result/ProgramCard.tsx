import Link from "next/link";

type ProgramData = {
  title: string;
  subtitle?: string;
  priceOriginal: number;    // kopecks
  priceDiscounted: number;  // kopecks
  discountPercent: number;
  url: string;
  whyThisProgram?: string;
};

type Props = {
  program: ProgramData;
  variant: "primary" | "alternative";
};

function formatPrice(kopecks: number): string {
  return `${(kopecks / 100).toLocaleString("ru-RU")} ₽`;
}

export function ProgramCard({ program, variant }: Props) {
  const isPrimary = variant === "primary";

  return (
    <div
      className={`relative rounded-3xl p-6 bg-bg-card shadow-card ${
        isPrimary ? "border-2 border-primary" : "border border-border"
      }`}
    >
      {isPrimary && (
        <div className="absolute -top-3 left-6 bg-primary text-text-inverse rounded-full text-xs px-3 py-1 font-medium whitespace-nowrap">
          Рекомендуем вам
        </div>
      )}

      <h3 className="font-display text-[22px] font-semibold text-foreground leading-tight mb-1 mt-1">
        {program.title}
      </h3>
      {program.subtitle && (
        <p className="text-sm text-text-muted mb-4 leading-relaxed">{program.subtitle}</p>
      )}

      <div className="flex items-center gap-3 mb-1 flex-wrap">
        <span className="text-lg line-through text-text-muted">
          {formatPrice(program.priceOriginal)}
        </span>
        <span className="text-sm font-semibold rounded-full px-3 py-1 bg-accent-soft text-accent">
          -{program.discountPercent}%
        </span>
      </div>

      <p className="text-4xl font-bold text-foreground mb-5">
        {formatPrice(program.priceDiscounted)}
      </p>

      {program.whyThisProgram && (
        <p className="text-sm text-text-muted leading-relaxed mb-4">{program.whyThisProgram}</p>
      )}

      <Link
        href={program.url}
        target="_blank"
        rel="noopener noreferrer"
        data-event="cta_to_upsell"
        data-variant={variant}
        className={`flex items-center justify-center w-full h-14 rounded-full text-lg font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 cursor-pointer ${
          isPrimary
            ? "bg-accent text-text-inverse hover:opacity-90 active:scale-[0.98] shadow-cta"
            : "border-2 border-primary text-primary bg-transparent hover:bg-primary hover:text-text-inverse active:scale-[0.98]"
        }`}
      >
        {isPrimary ? "Выбрать программу →" : "Подробнее →"}
      </Link>
    </div>
  );
}
