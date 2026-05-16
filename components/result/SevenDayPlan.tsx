type Step = { step: number; action: string; why: string };
type Props = { plan: Step[] };

const STEP_TITLES: Record<number, string> = {
  1: "Питьевой режим",
  2: "Лимфодренажная гимнастика",
  3: "Двигательный режим",
  4: "Позиция сна",
  5: "Самомассаж лица",
};

export function SevenDayPlan({ plan }: Props) {
  if (!plan.length) return null;
  return (
    <div>
      <h2 className="font-display text-xl md:text-2xl font-semibold mb-4 text-foreground">
        Ваш стартовый план на 7 дней
      </h2>
      <div className="flex flex-col gap-4">
        {plan.map((item) => (
          <div
            key={item.step}
            className="rounded-2xl border border-border p-5 bg-bg-card shadow-soft"
          >
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-primary text-text-inverse flex items-center justify-center shrink-0 font-display font-semibold text-xl select-none">
                {item.step}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  {STEP_TITLES[item.step] ?? `Шаг ${item.step}`}
                </h3>
                <p className="text-[17px] leading-relaxed text-foreground/90">{item.action}</p>
                <div className="flex items-center gap-3 my-3">
                  <div className="flex-1 h-px bg-border" />
                  <span className="text-sm text-text-muted shrink-0">Почему</span>
                  <div className="flex-1 h-px bg-border" />
                </div>
                <p className="text-[15px] italic text-text-muted leading-relaxed">{item.why}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
