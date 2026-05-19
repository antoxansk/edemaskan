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
        subtitle="Вы уже пробовали патчи, массаж и бессолевую диету — но каждое утро одно и то же. Мы покажем настоящую причину за 60 секунд. Бесплатно."
        ctaText="→ Узнать причину своего отёка"
      />

      <Separator />

      <PainBlock>
        <p>
          Вы встаёте, идёте к зеркалу — и видите не себя. Опухшее лицо, тяжёлые веки, потерявшийся овал.
        </p>
        <p>
          Уже всё пробовали. Патчи, лимфодренаж, бессолевую диету, БАДы. Помогает на 1–2 недели — потом возврат. Анализы хорошие. Врач говорит «стресс и возраст».
        </p>
        <p>
          Это не ваша вина. Просто никто не смотрел на полную картину.
          Отёки — это система: лимфа + питание + гормоны + движение. Убрать одно не значит решить всё.
        </p>
        <p>
          <strong>Сканирование — это ваша личная карта. Не чужой протокол, а понимание, что именно происходит в вашем теле.</strong>
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
        ctaText="→ Узнать причину своего отёка — бесплатно"
      />

      <Separator />
      <FaqSection />

      <StickyBottomCTA scenario={SCENARIO} />
      <SocialProofToast />
    </>
  );
}
