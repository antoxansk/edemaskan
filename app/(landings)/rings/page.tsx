import type { Metadata } from "next";
import { Hero } from "@/components/landing/hero";
import { PainBlock } from "@/components/landing/pain-block";
import { HowItWorks } from "@/components/landing/how-it-works";
import { TrustBlock } from "@/components/landing/trust-block";
import { FinalCta } from "@/components/landing/final-cta";
import { FaqSection } from "@/components/landing/faq";
import { Separator } from "@/components/ui/separator";

export const metadata: Metadata = {
  title: "Кольца перестали сниматься? — Edemaskan | УПДН",
  description:
    "Опухание рук, пальцев, лица и ног — это системный сигнал. Бесплатный AI-разбор по методологии УПДН за 60 секунд.",
};

const SCENARIO = "rings";

export default function RingsPage() {
  return (
    <>
      <Hero
        scenario={SCENARIO}
        title="Кольца перестали сниматься?"
        subtitle="Опухание рук, пальцев, лица и ног одновременно — это системный сигнал. Бесплатный AI-разбор по методологии УПДН."
        ctaText="→ Узнать причину своего отёка"
      />

      <Separator />

      <PainBlock>
        <p>
          Кольца, которые носили годами, вдруг стали тугими. Или снимаете только вечером. Или вообще уже не носите — чтобы не застряло.
        </p>
        <p>
          Вместе с этим: утром опухшее лицо, к вечеру тяжелеют ноги. <strong>Это не три разные проблемы — это одна.</strong> Организм задерживает жидкость системно.
        </p>
        <p>
          Причины разные: лимфатический застой, нарушение водно-солевого обмена, дефициты, гормональный фон. Чтобы работать с причиной, а не симптомом — нужно сначала её знать.
        </p>
      </PainBlock>

      <Separator />
      <HowItWorks />
      <Separator />
      <TrustBlock />
      <Separator />

      <FinalCta
        scenario={SCENARIO}
        ctaText="→ Определить причину системного отёка (бесплатно)"
      />

      <Separator />
      <FaqSection />
    </>
  );
}
