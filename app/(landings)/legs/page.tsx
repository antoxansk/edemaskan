import type { Metadata } from "next";
import { Hero } from "@/components/landing/hero";
import { PainBlock } from "@/components/landing/pain-block";
import { StatsStrip } from "@/components/landing/stats-strip";
import { HowItWorks } from "@/components/landing/how-it-works";
import { Reviews } from "@/components/landing/reviews";
import { TrustBlock } from "@/components/landing/trust-block";
import { FinalCta } from "@/components/landing/final-cta";
import { FaqSection } from "@/components/landing/faq";
import { StickyBottomCTA } from "@/components/landing/sticky-bottom-cta";
import { SocialProofToast } from "@/components/landing/social-proof-toast";
import { Separator } from "@/components/ui/separator";

export const metadata: Metadata = {
  title: "Ноги тяжелеют к вечеру? — Edemaskan | УПДН",
  description:
    "Лицо утром + ноги вечером = системный сигнал. Узнайте причину по фото лица за 60 секунд. Бесплатно.",
};

const SCENARIO = "legs";

export default function LegsPage() {
  return (
    <>
      <Hero
        scenario={SCENARIO}
        title="Ноги тяжелеют к вечеру?"
        subtitle="Лицо по утрам + ноги к вечеру = системный сигнал. Узнайте причину по фото лица — за 60 секунд."
        ctaText="→ Определить причину бесплатно"
      />

      <Separator />

      <PainBlock>
        <p>
          Утром лицо немного опухшее. К вечеру наливаются ноги — не так сильно, чтобы идти к врачу, но достаточно, чтобы снимать обувь с облегчением и с трудом надевать кольца.
        </p>
        <p>
          <strong>Это классический паттерн системного лимфостаза.</strong> Лимфа движется снизу вверх в конечностях и сверху вниз от головы — когда её ток нарушен, жидкость оседает там, где сила тяжести: к вечеру в ногах, к утру в лице.
        </p>
        <p>
          <strong>Ноги и лицо — один и тот же процесс. Поэтому по фото лица мы можем определить вашу системную причину.</strong>
        </p>
      </PainBlock>

      <StatsStrip />
      <Separator />
      <HowItWorks />
      <Separator />
      <Reviews />
      <Separator />
      <TrustBlock />
      <Separator />

      <FinalCta
        scenario={SCENARIO}
        ctaText="→ Узнать причину (бесплатно, 60 секунд)"
      />

      <Separator />
      <FaqSection />

      <StickyBottomCTA scenario={SCENARIO} />
      <SocialProofToast />
    </>
  );
}
