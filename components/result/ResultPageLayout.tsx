"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { PRICING } from "@/lib/pricing";
import type { AiResultType } from "@/lib/validation";
import { useFaceLandmarks } from "@/hooks/useFaceLandmarks";
import type { ZoneKey } from "@/lib/face-detection/zones";
import { ResultHero } from "./ResultHero";
import { FacePhotoWithZones } from "./FacePhotoWithZones";
import { FaceZoneCanvas } from "./FaceZoneCanvas";
import { ZoneTagBar } from "./ZoneTagBar";
import { ZoneDescriptionCard } from "./ZoneDescriptionCard";
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
  const [activeZone, setActiveZone] = useState<ZoneKey | null>(null);
  const { keypoints, status } = useFaceLandmarks(frontalPhotoUrl ?? null);

  const handleZoneClick = useCallback((zone: ZoneKey) => {
    setActiveZone((prev) => (prev === zone ? null : zone));
  }, []);
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
            {/* Landmark-based overlay (AI detected) */}
            {status === "loading" && (
              <div
                className="rounded-3xl border border-border bg-bg-elevated flex items-center justify-center"
                style={{ aspectRatio: "3/4" }}
              >
                <div className="flex flex-col items-center gap-3 text-text-muted">
                  <svg className="animate-spin w-8 h-8" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                  </svg>
                  <span className="text-sm">AI анализирует контуры лица…</span>
                </div>
              </div>
            )}

            {status === "done" && frontalPhotoUrl && keypoints && (
              <div className="flex flex-col gap-3">
                <FaceZoneCanvas
                  imageUrl={frontalPhotoUrl}
                  keypoints={keypoints}
                  activeZone={activeZone}
                  zones={result.zone_analysis}
                  onZoneClick={handleZoneClick}
                />
                <ZoneTagBar
                  zones={result.zone_analysis}
                  activeZone={activeZone}
                  onZoneClick={handleZoneClick}
                />
                {activeZone && result.zone_analysis[activeZone] && (
                  <ZoneDescriptionCard
                    zone={activeZone}
                    data={result.zone_analysis[activeZone]}
                  />
                )}
                <p className="text-sm text-text-muted text-center">
                  Нажмите на тег или зону, чтобы прочитать разбор
                </p>
              </div>
            )}

            {(status === "no-face" || status === "error" || (status === "done" && !keypoints)) && (
              <>
                {(status === "no-face") && (
                  <div className="rounded-2xl border border-border p-4 bg-bg-card text-center">
                    <p className="text-sm text-foreground mb-3">
                      Не удалось точно определить контуры лица.<br />
                      Попробуйте загрузить фото при дневном свете, без очков.
                    </p>
                    <Link
                      href="/scan/photos"
                      className="inline-flex h-10 px-6 rounded-full bg-primary text-text-inverse text-sm font-semibold items-center justify-center"
                    >
                      Сделать фото заново
                    </Link>
                  </div>
                )}
                <FacePhotoWithZones
                  zones={result.zone_analysis}
                  frontalPhotoUrl={frontalPhotoUrl}
                />
              </>
            )}

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
