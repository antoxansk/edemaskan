import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ShieldCheck } from "lucide-react";

type HeroProps = {
  scenario:   string;
  title:      string;
  subtitle:   string;
  ctaText:    string;
  disclaimer?: string;
};

export function Hero({ scenario, title, subtitle, ctaText, disclaimer }: HeroProps) {
  const ctaUrl = `/scan?from=${scenario}`;
  const dis = disclaimer ?? "Это не медицинская диагностика. Анализируем зоны и рекомендуем образовательную программу.";

  return (
    <section className="py-16 px-4 text-center" data-hero-section>
      <div className="max-w-3xl mx-auto">
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-semibold tracking-tight mb-4">
          {title}
        </h1>
        <p className="text-lg text-muted-foreground mb-8 max-w-xl mx-auto">{subtitle}</p>

        <Button
          asChild
          size="lg"
          className="btn-emerald-cta w-full sm:w-auto text-base px-8 py-4 h-auto"
          data-event="cta_click"
          data-scenario={scenario}
        >
          <Link href={ctaUrl}>{ctaText}</Link>
        </Button>

        <p className="mt-3 text-sm font-medium text-emerald-700">
          🟢 327 человек успешно прошли сканирование
        </p>

        <p className="mt-3 flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
          <ShieldCheck size={14} className="text-emerald-600 shrink-0" />
          {dis}
        </p>
      </div>
    </section>
  );
}
