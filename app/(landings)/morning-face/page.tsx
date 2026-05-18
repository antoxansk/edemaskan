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
          Утро. Будильник. Идёте к зеркалу — и видите <strong>не своё лицо</strong>. Опухшее, тяжёлое. Щёки, веки, овал — как будто набрали литр воды за ночь.
        </p>
        <p>
          К обеду чуть отпускает. Списываете на соль, воду, возраст — и живёте дальше. А завтра утром одно и то же.
        </p>
        <p>
          Уже пробовали: патчи, ледяные ложки, лимфодренажный массаж, БАДы, бессолевую диету. Работает неделю-две — потом откат. Анализы в норме. Врач говорит: «от стресса».
        </p>
        <p>
          <strong>Почему ничего не работает надолго?</strong> Потому что каждый раз берёте один элемент и ждёте результата. Массаж — без питания. Диету — без лимфы. БАДы — без понимания, что именно не так. А отёчность — это система: лимфа, питание, гормональный фон, движение. Пока не увидите свою картину целиком — отёки будут возвращаться.
        </p>
        <p>
          <strong>Именно это делает сканирование — показывает вашу картину.</strong>
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
