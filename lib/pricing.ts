// Prices stored in kopecks (INTEGER). Source: SPEC.md §0.3
// These are compile-time constants — NOT in DB, NOT from frontend.

export const PRICING = {
  base: {
    key:             "base" as const,
    title:           "Программа по лимфатической системе (Базовый)",
    price_original:  1_850_000, // 18 500 ₽
    price_discounted:  940_000, // 9 400 ₽
    discount_percent:       49,
    url: process.env.UPSELL_LANDING_URL ?? "https://lid.nutritionist4day.ru/lymphatic-system_avto",
  },
  advanced: {
    key:             "advanced" as const,
    title:           "Программа (Продвинутый): Лимфа + Антипаразитарка + Железодефицит",
    price_original:  5_750_000, // 57 500 ₽
    price_discounted:1_490_000, // 14 900 ₽
    discount_percent:       74,
    url: process.env.UPSELL_LANDING_URL ?? "https://lid.nutritionist4day.ru/lymphatic-system_avto",
  },
} as const;

export type PricingKey = keyof typeof PRICING;

// Causes that push toward the Advanced program
export const ADVANCED_CAUSES = new Set([
  "parasitic_intoxication",
  "iron_deficiency",
] as const);

export function formatPrice(kopecks: number): string {
  return `${(kopecks / 100).toLocaleString("ru-RU")} ₽`;
}
