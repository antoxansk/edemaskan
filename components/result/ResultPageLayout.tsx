"use client";

import { PRICING } from "@/lib/pricing";
import type { AiResultType } from "@/lib/validation";
import { ResultHero } from "./ResultHero";
import { FacePhotoWithZones } from "./FacePhotoWithZones";
import { ZoneChipGrid } from "./ZoneChipGrid";
import { PrimaryCauseCard } from "./PrimaryCauseCard";
import { SecondaryCauseCard } from "./SecondaryCauseCard";
import { ZoneAnalysisList } from "./ZoneAnalysisList";
import { SevenDayPlan } from "./SevenDayPlan";
import { AvoidList } from "./AvoidList";
import { OfferTimer } from "./OfferTimer";
import { ProgramCard } from "./ProgramCard";
import { StickyBottomCTA } from "./StickyBottomCTA";
import { RedFlagCard } from "./RedFlagCard";
import { ResultDisclaimer } from "./ResultDisclaimer";

type Props = {
  result: AiResultType;
  name: string | null;
  frontalPhotoUrl?: string | null;
};

export function ResultPageLayout({ result, name, frontalPhotoUrl }: Props) {
  const displayName = name ?? result.user_name ?? "Марина";
  const recommendedKey = result.recommended_program?.key ?? "base";
  const primaryPricing = PRICING[recommendedKey];
  const alternativeKey: "base" | "advanced" = recommendedKey === "base" ? "advanced" : "base";
  const alternativePricing = PRICING[alternativeKey];

  const primarySubtitle =
    recommendedKey === "base"
      ? "Базовая программа УПДН по методологии Синицыной С.В."
      : "Продвинутая программа УПДН — лимфа + антипаразитарная + железодефицит";
  const alternativeSubtitle =
    alternativeKey === "base"
      ? "Базовая программа УПДН по методологии Синицыной С.В."
      : "Лимфа + Антипаразитарка + Железодефицит";

  const priceFormatted = `${(primaryPricing.price_discounted / 100).toLocaleString("ru-RU")} ₽`;

  // ── Red flag branch ──────────────────────────────────────────
  if (result.red_flag) {
    return (
      <div className="flex flex-col gap-6 max-w-[480px] mx-auto px-4 pb-12 w-full">
        <ResultHero name={displayName} />
        {result.zone_analysis && (
          <FacePhotoWithZones
            zones={result.zone_analysis}
            frontalPhotoUrl={frontalPhotoUrl}
            showEllipses={false}
          />
        )}
        <RedFlagCard name={displayName} reason={result.red_flag_reason} />
        <ResultDisclaimer text={result.disclaimer} />
      </div>
    );
  }

  // ── Full result ──────────────────────────────────────────────
  return (
    <>
      <div className="flex flex-col gap-8 max-w-[480px] mx-auto px-4 pb-32 md:pb-12 w-full">
        <ResultHero name={displayName} />

        {result.zone_analysis && (
          <>
            <FacePhotoWithZones
              zones={result.zone_analysis}
              frontalPhotoUrl={frontalPhotoUrl}
            />
            <ZoneChipGrid zones={result.zone_analysis} />
          </>
        )}

        {result.primary_cause && (
          <PrimaryCauseCard cause={result.primary_cause} />
        )}

        {result.secondary_cause && (
          <SecondaryCauseCard cause={result.secondary_cause} />
        )}

        {result.zone_analysis && (
          <ZoneAnalysisList zones={result.zone_analysis} />
        )}

        {result.seven_day_plan && result.seven_day_plan.length > 0 && (
          <SevenDayPlan plan={result.seven_day_plan} />
        )}

        {result.avoid && result.avoid.length > 0 && (
          <AvoidList items={result.avoid} />
        )}

        <OfferTimer />

        {/* Programs section — StickyBottomCTA observes this */}
        <div id="programs-section" className="flex flex-col gap-6">
          <ProgramCard
            variant="primary"
            program={{
              title: primaryPricing.title,
              subtitle: primarySubtitle,
              priceOriginal: primaryPricing.price_original,
              priceDiscounted: primaryPricing.price_discounted,
              discountPercent: primaryPricing.discount_percent,
              url: primaryPricing.url,
              whyThisProgram: result.recommended_program?.why_this_program,
            }}
          />
          <ProgramCard
            variant="alternative"
            program={{
              title: alternativePricing.title,
              subtitle: alternativeSubtitle,
              priceOriginal: alternativePricing.price_original,
              priceDiscounted: alternativePricing.price_discounted,
              discountPercent: alternativePricing.discount_percent,
              url: alternativePricing.url,
            }}
          />
        </div>

        <ResultDisclaimer text={result.disclaimer} />
      </div>

      {/* Invisible sentinel div that StickyBottomCTA observes */}
      <div id="programs-sentinel" className="h-px" />

      {/* Sticky CTA — hidden on desktop (md+) */}
      <StickyBottomCTA
        sentinelId="programs-sentinel"
        url={primaryPricing.url}
        discountPercent={primaryPricing.discount_percent}
        priceFormatted={priceFormatted}
      />
    </>
  );
}
