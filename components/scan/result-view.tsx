import Link from "next/link";
import { Sparkles, ListChecks, XCircle, Stethoscope, ArrowRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { CountdownTimer } from "@/components/scan/countdown-timer";
import { PricingCard } from "@/components/scan/pricing-card";
import { ZoneTags } from "@/components/scan/zone-tags";
import { PRICING } from "@/lib/pricing";
import type { AiResultType } from "@/lib/validation";

const INTENSITY_LABEL: Record<string, string> = {
  mild:       "Лёгкая",
  moderate:   "Умеренная",
  pronounced: "Выраженная",
  none:       "—",
};

const ZONE_LABELS: Record<string, string> = {
  forehead:    "Лоб",
  brows:       "Брови",
  periorbital: "Периорбитальная зона",
  nasolabial:  "Носогубная зона",
  face_oval:   "Овал лица",
  lips_purse:  "Область губ",
  chin:        "Подбородок",
  neck:        "Шея",
};

const UPSELL_URL = process.env.NEXT_PUBLIC_SITE_URL
  ? `https://lid.nutritionist4day.ru/lymphatic-system_avto`
  : "https://lid.nutritionist4day.ru/lymphatic-system_avto";

type ResultViewProps = {
  name:     string | null;
  result:   AiResultType;
  expiresAt: string | null;
};

export function ResultView({ name, result, expiresAt }: ResultViewProps) {
  const displayName = name ?? result.user_name ?? "Марина";

  if (result.red_flag) {
    return (
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-2xl font-semibold">{displayName}, разбор готов</h1>
        </div>

        <Card className="rounded-2xl border-destructive/30 bg-destructive/5">
          <CardContent className="p-5 flex flex-col gap-3">
            <div className="flex items-center gap-2 text-destructive">
              <Stethoscope size={20} />
              <span className="font-semibold">Важная информация</span>
            </div>
            {result.red_flag_reason && (
              <p className="text-sm">{result.red_flag_reason}</p>
            )}
            <p className="text-sm text-muted-foreground">
              Тон страницы — поддерживающий. Когда врач даст «зелёный свет» — программы УПДН по лимфе могут стать частью комплексной поддержки.
            </p>
          </CardContent>
        </Card>

        <ZoneTable zones={result.zone_analysis} />

        <Separator />

        <div className="text-center">
          <Button asChild variant="outline" className="gap-2">
            <Link href={UPSELL_URL} target="_blank" rel="noopener">
              Узнать о программах УПДН <ArrowRight size={16} />
            </Link>
          </Button>
        </div>

        <p className="text-xs text-muted-foreground text-center">{result.disclaimer}</p>
      </div>
    );
  }

  const recommended = result.recommended_program?.key === "advanced" ? PRICING.advanced : PRICING.base;
  const alternative = result.recommended_program?.key === "advanced" ? PRICING.base : PRICING.advanced;

  return (
    <div className="flex flex-col gap-8 pb-24">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold">{displayName}, разбор готов</h1>
      </div>

      {/* Zone tags */}
      <ZoneTags zones={result.zone_analysis} />

      {/* Zone table */}
      <ZoneTable zones={result.zone_analysis} />

      <Separator />

      {/* Primary cause */}
      {result.primary_cause && (
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2 text-primary">
            <Sparkles size={18} />
            <span className="font-semibold text-sm uppercase tracking-wide">Главная вероятная причина</span>
          </div>
          <h2 className="text-xl font-bold">{result.primary_cause.title}</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">{result.primary_cause.explanation_for_user}</p>
          <Badge variant="outline" className="self-start text-xs">
            Уверенность анализа: {Math.round(result.primary_cause.confidence * 100)}%
          </Badge>
        </div>
      )}

      {/* Secondary cause */}
      {result.secondary_cause && (
        <Card className="rounded-2xl">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground mb-1 font-medium uppercase tracking-wide">Сопутствующая причина</p>
            <p className="font-semibold text-sm">{result.secondary_cause.title}</p>
            <p className="text-xs text-muted-foreground mt-1">{result.secondary_cause.explanation_for_user}</p>
          </CardContent>
        </Card>
      )}

      {/* Personal comment */}
      {result.personal_comment && (
        <p className="text-sm leading-relaxed italic text-muted-foreground border-l-2 border-primary/30 pl-4">
          {result.personal_comment}
        </p>
      )}

      <Separator />

      {/* 7-day plan */}
      {result.seven_day_plan && result.seven_day_plan.length > 0 && (
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <ListChecks size={18} className="text-primary" />
            <h2 className="font-semibold">Стартовый план на 7 дней</h2>
          </div>
          <div className="flex flex-col gap-3">
            {result.seven_day_plan.map((step) => (
              <Card key={step.step} className="rounded-2xl">
                <CardContent className="p-4 flex gap-3">
                  <span className="shrink-0 w-7 h-7 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center">
                    {step.step}
                  </span>
                  <div>
                    <p className="text-sm">{step.action}</p>
                    <p className="text-xs text-muted-foreground mt-1">{step.why}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Avoid */}
      {result.avoid && result.avoid.length > 0 && (
        <div className="flex flex-col gap-3">
          <h2 className="font-semibold flex items-center gap-2">
            <XCircle size={18} className="text-destructive" /> Чего избегать
          </h2>
          <ul className="flex flex-col gap-2">
            {result.avoid.map((item) => (
              <li key={item} className="flex items-start gap-2 text-sm">
                <XCircle size={14} className="shrink-0 mt-0.5 text-destructive" />
                {item}
              </li>
            ))}
          </ul>
        </div>
      )}

      <Separator />

      {/* Timer */}
      {expiresAt && (
        <div className="text-center flex flex-col gap-2">
          <p className="text-sm text-muted-foreground">Специальная цена действует ещё:</p>
          <CountdownTimer expiresAt={expiresAt} />
        </div>
      )}

      {/* Pricing */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <PricingCard
          title={recommended.title}
          priceOriginal={recommended.price_original}
          priceDiscounted={recommended.price_discounted}
          discountPercent={recommended.discount_percent}
          url={recommended.url}
          recommended
        />
        <PricingCard
          title={alternative.title}
          priceOriginal={alternative.price_original}
          priceDiscounted={alternative.price_discounted}
          discountPercent={alternative.discount_percent}
          url={alternative.url}
          recommended={false}
        />
      </div>

      {/* Why this program */}
      {result.recommended_program?.why_this_program && (
        <p className="text-sm text-muted-foreground leading-relaxed">
          {result.recommended_program.why_this_program}
        </p>
      )}

      {/* Disclaimer */}
      <p className="text-xs text-muted-foreground border-t border-border pt-4">{result.disclaimer}</p>

      {/* Mobile sticky CTA */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-background border-t border-border sm:hidden">
        <Button asChild className="w-full gap-2" data-event="cta_to_upsell" data-tariff="sticky">
          <Link href={recommended.url} target="_blank" rel="noopener">
            Перейти к программе <ArrowRight size={16} />
          </Link>
        </Button>
      </div>
    </div>
  );
}

function ZoneTable({ zones }: { zones: AiResultType["zone_analysis"] }) {
  if (!zones) return null;
  return (
    <div className="rounded-2xl border border-border overflow-hidden">
      {Object.entries(ZONE_LABELS).map(([key, label]) => {
        const z = zones[key as keyof typeof zones];
        if (!z?.visible) return null;
        const intensity = z.intensity ?? "none";
        return (
          <div key={key} id={`zone-${key}`} className="flex items-center justify-between px-4 py-3 border-b border-border last:border-b-0">
            <span className="text-sm font-medium">{label}</span>
            <div className="flex items-center gap-2">
              {intensity !== "none" && (
                <Badge
                  variant="outline"
                  className={
                    intensity === "pronounced"
                      ? "border-destructive/40 text-destructive text-xs"
                      : intensity === "moderate"
                      ? "border-accent/60 text-accent-foreground text-xs"
                      : "text-xs"
                  }
                >
                  {INTENSITY_LABEL[intensity]}
                </Badge>
              )}
              {z.note && <span className="text-xs text-muted-foreground hidden sm:inline">{z.note}</span>}
            </div>
          </div>
        );
      })}
    </div>
  );
}
