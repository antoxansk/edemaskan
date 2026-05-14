import type { Metadata } from "next";
import { Hero } from "@/components/landing/hero";
import { PainBlock } from "@/components/landing/pain-block";
import { HowItWorks } from "@/components/landing/how-it-works";
import { TrustBlock } from "@/components/landing/trust-block";
import { FinalCta } from "@/components/landing/final-cta";
import { FaqSection } from "@/components/landing/faq";
import { Separator } from "@/components/ui/separator";

export const metadata: Metadata = {
  title: "Мешки под глазами не уходят? — Edemaskan | УПДН",
  description:
    "Узнайте нутрициологическую причину мешков под глазами. Бесплатный AI-разбор: 4 фото + 5 вопросов за 60 секунд.",
};

const SCENARIO = "eye-bags";

export default function EyeBagsPage() {
  return (
    <>
      <Hero
        scenario={SCENARIO}
        title="Мешки под глазами не уходят?"
        subtitle="Тональный крем скрывает, но не решает. Узнайте нутрициологическую причину — бесплатно, за 60 секунд."
        ctaText="→ Узнать причину"
      />

      <Separator />

      <PainBlock>
        <p>
          Вы уже перепробовали патчи, криоролы, дорогие кремы, рекомендации косметолога. Помогает — на время. Потом снова.
        </p>
        <p>
          Дело в том, что <strong>мешки под глазами — это не проблема кожи</strong>. Периорбитальная зона реагирует на то, что происходит внутри:
        </p>
        <ul>
          <li>Лимфатический застой</li>
          <li>Дефицит железа (80% женщин репродуктивного возраста имеют скрытый железодефицит)</li>
          <li>Нарушение водно-солевого обмена</li>
          <li>Гормональные изменения после 40</li>
        </ul>
        <p>
          Пока не знаете причину — косметология работает на симптом, а не на причину.
        </p>
      </PainBlock>

      <Separator />
      <HowItWorks />
      <Separator />
      <TrustBlock />
      <Separator />

      <FinalCta
        scenario={SCENARIO}
        ctaText="→ Узнать причину мешков под глазами (бесплатно)"
      />

      <Separator />
      <FaqSection />
    </>
  );
}
