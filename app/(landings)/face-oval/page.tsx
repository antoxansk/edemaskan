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
  title: "Овал лица поплыл после 40? — Edemaskan | УПДН",
  description:
    "Прежде чем идти к косметологу — узнайте, не задержка ли это жидкости. Бесплатный AI-разбор за 60 секунд.",
};

const SCENARIO = "face-oval";

export default function FaceOvalPage() {
  return (
    <>
      <Hero
        scenario={SCENARIO}
        title="Овал лица поплыл после 40?"
        subtitle="Прежде чем идти к косметологу за аппаратной процедурой — узнайте, не задержка ли это жидкости. Разбор бесплатно."
        ctaText="→ Проверить бесплатно"
      />

      <Separator />

      <PainBlock>
        <p>
          После 40 многие замечают: лицо меняется не так, как ожидали. Не морщины — а именно <strong>тяжесть, припухлость, смягчение контуров</strong>. Прежний овал словно «набрал воды».
        </p>
        <p>
          Часто это не возрастные изменения тканей — <strong>это задержка жидкости</strong>. Лимфатическая система перестаёт справляться с оттоком, жидкость оседает в нижней части лица: по контуру нижней челюсти, в подбородочной зоне, вокруг рта.
        </p>
        <p>
          <strong>Разница важна: если это лимфостаз — работаем с лимфой. Если гормональный фактор — другой подход. Угадывать дорого.</strong>
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
        ctaText="→ Узнать, что происходит с моим овалом лица"
      />

      <Separator />
      <FaqSection />

      <StickyBottomCTA scenario={SCENARIO} />
      <SocialProofToast />
    </>
  );
}
