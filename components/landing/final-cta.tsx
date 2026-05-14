import Link from "next/link";
import { Button } from "@/components/ui/button";

type FinalCtaProps = {
  scenario: string;
  ctaText:  string;
};

export function FinalCta({ scenario, ctaText }: FinalCtaProps) {
  return (
    <section className="py-14 px-4 text-center">
      <div className="max-w-xl mx-auto">
        <Button
          asChild
          size="lg"
          className="w-full sm:w-auto text-base px-8 py-4 h-auto mb-4"
          data-event="cta_click"
          data-scenario={scenario}
        >
          <Link href={`/scan?from=${scenario}`}>{ctaText}</Link>
        </Button>
        <p className="text-xs text-muted-foreground">
          Бесплатно. Без регистрации. 60 секунд.
        </p>
        <p className="text-xs text-muted-foreground mt-1">Мы не сохраняем ваши фотографии.</p>
      </div>
    </section>
  );
}
