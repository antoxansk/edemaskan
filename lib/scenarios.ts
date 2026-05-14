// 5 entry scenarios. SPEC.md §0.5

export const SCENARIOS = ["morning-face", "eye-bags", "face-oval", "legs", "rings"] as const;
export type Scenario = typeof SCENARIOS[number];

export function isValidScenario(value: unknown): value is Scenario {
  return SCENARIOS.includes(value as Scenario);
}

// Rotating facts shown on the onboarding screen (FactsCarousel)
export const UPDN_FACTS = [
  "На платформе занимаются более 500 000 человек",
  "Совместно с Первым МГМУ им. Сеченова",
  "Методика подтверждена научными исследованиями",
  "Европейская аккредитация",
] as const;
