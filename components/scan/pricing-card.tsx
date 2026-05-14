import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { formatPrice } from "@/lib/pricing";
import { cn } from "@/lib/utils";

type PricingCardProps = {
  title:           string;
  priceOriginal:   number;
  priceDiscounted: number;
  discountPercent: number;
  url:             string;
  recommended:     boolean;
};

export function PricingCard({
  title, priceOriginal, priceDiscounted, discountPercent, url, recommended,
}: PricingCardProps) {
  return (
    <Card className={cn("rounded-2xl transition-all", recommended && "border-accent shadow-md ring-2 ring-accent/30")}>
      <CardContent className="p-5 flex flex-col gap-3">
        {recommended && (
          <Badge className="self-start bg-accent text-accent-foreground">Рекомендовано вам</Badge>
        )}

        <p className="font-semibold text-sm leading-snug">{title}</p>

        <div>
          <p className="text-2xl font-bold">{formatPrice(priceDiscounted)}</p>
          <p className="text-sm text-muted-foreground line-through">{formatPrice(priceOriginal)}</p>
          <p className="text-xs text-success font-medium">Скидка {discountPercent}%</p>
        </div>

        <Button asChild className="w-full" data-event="cta_to_upsell" data-tariff={recommended ? "base" : "advanced"}>
          <Link href={url} target="_blank" rel="noopener">
            Выбрать →
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}
