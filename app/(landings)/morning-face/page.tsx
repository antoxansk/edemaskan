import type { Metadata } from "next";
import { Hero } from "@/components/landing/hero";
import { PainBlock } from "@/components/landing/pain-block";
import { StatsStrip } from "@/components/landing/stats-strip";
import { HowItWorks } from "@/components/landing/how-it-works";
import { TrustBlock } from "@/components/landing/trust-block";
import { FinalCta } from "@/components/landing/final-cta";
import { FaqSection } from "@/components/landing/faq";
import { StickyBottomCTA } from "@/components/landing/sticky-bottom-cta";
import { SocialProofToast } from "@/components/landing/social-proof-toast";
import { Separator } from "@/components/ui/separator";

export const metadata: Metadata = {
  title: "Лицо опухает по утрам? — Edemaskan | УПДН",
  description:
    "Узнайте настоящую причину утреннего отёка лица. Бесплатный AI-разбор по методологии УПДН: 4 фото + 5 вопросов = персональный план за 60 секунд.",
};

const SCENARIO = "morning-face";

export default function MorningFacePage() {
  return (
    <>
      <Hero
        scenario={SCENARIO}
        title="Лицо опухает по утрам?"
        subtitle="Узнайте причину — не косметологическую, а настоящую. Бесплатный AI-разбор по методологии УПДН."
        ctaText="→ Узнать причину своего отёка"
      />

      <Separator />

      <PainBlock>
        <p>
          Вы просыпаетесь — и первое, что делаете: идёте к зеркалу и видите <strong>не своё лицо</strong>. Опухшее, тяжёлое. Щёки, веки, овал — всё будто набрало воды за ночь.
        </p>
        <p>
          К обеду проходит. Вы списываете на что угодно: вчера немного солили, выпила стакан лишний, просто возраст. А завтра утром — снова то же самое.
        </p>
        <p>
          <strong>Это не просто косметика.</strong> Системный утренний отёк — это сигнал организма. Лимфатическая система, гормоны, микронутриенты — всё взаимосвязано. Угадать без анализа нельзя.
        </p>
      </PainBlock>

      <StatsStrip />
      <Separator />
      <HowItWorks />
      <Separator />
      <TrustBlock />
      <Separator />

      <FinalCta
        scenario={SCENARIO}
        ctaText="→ Узнать причину своего утреннего отёка"
      />

      <Separator />
      <FaqSection />

      <StickyBottomCTA scenario={SCENARIO} />
      <SocialProofToast />
    </>
  );
}
