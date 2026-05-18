"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ymGoal } from "@/lib/ym";

const QUESTIONS = [
  {
    key:     "swelling_time",
    title:   "Когда отёки сильнее?",
    options: [
      { value: "morning",  label: "Утром" },
      { value: "evening",  label: "Вечером" },
      { value: "constant", label: "Постоянно" },
      { value: "cyclic",   label: "Циклично с месячным циклом" },
    ],
  },
  {
    key:     "water_intake",
    title:   "Сколько воды в день?",
    options: [
      { value: "under_1l",     label: "Меньше 1 л" },
      { value: "1_to_1_5l",   label: "1–1,5 л" },
      { value: "1_5_to_2l",   label: "1,5–2 л" },
      { value: "over_2l",     label: "Больше 2 л" },
    ],
  },
  {
    key:     "salt_processed_food",
    title:   "Солёное / полуфабрикаты?",
    options: [
      { value: "rarely",    label: "Редко" },
      { value: "sometimes", label: "Иногда" },
      { value: "often",     label: "Часто" },
      { value: "daily",     label: "Ежедневно" },
    ],
  },
  {
    key:     "sleep_quality",
    title:   "Качество сна?",
    options: [
      { value: "good_7plus",   label: "Хорошо, 7+ часов" },
      { value: "interrupted",  label: "Прерывистый" },
      { value: "under_6h",     label: "Меньше 6 часов" },
      { value: "cant_sleep",   label: "Не могу заснуть" },
    ],
  },
  {
    key:     "hormonal_phase",
    title:   "Гормональный фон?",
    options: [
      { value: "regular",        label: "Регулярный цикл" },
      { value: "irregular",      label: "Нерегулярный" },
      { value: "perimenopause",  label: "Перименопауза" },
      { value: "menopause",      label: "Менопауза" },
      { value: "skip",           label: "Не отвечу" },
    ],
  },
] as const;

export default function QuestionnairePage() {
  const router  = useRouter();
  const [answers, setAnswers] = useState<Record<string, string>>({});

  useEffect(() => {
    const token = sessionStorage.getItem("edm_session_token");
    if (!token) { router.replace("/scan"); return; }

    // Restore from sessionStorage if returning
    try {
      const saved = sessionStorage.getItem("edm_answers");
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (saved) setAnswers(JSON.parse(saved) as Record<string, string>);
    } catch { /* ignore */ }
  }, [router]);

  function select(key: string, value: string) {
    const next = { ...answers, [key]: value };
    setAnswers(next);
    try { sessionStorage.setItem("edm_answers", JSON.stringify(next)); } catch { /* ignore */ }
  }

  const allDone = QUESTIONS.every(({ key }) => key in answers);

  function proceed() {
    if (!allDone) return;
    ymGoal("questionnaire_completed");
    router.push("/scan/analyzing");
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold mb-1">5 коротких вопросов</h1>
        <p className="text-sm text-muted-foreground">AI учтёт ваш контекст</p>
      </div>

      <div className="flex flex-col gap-6">
        {QUESTIONS.map(({ key, title, options }) => (
          <div key={key} className="rounded-2xl border border-border p-4">
            <p className="font-medium text-sm mb-3">{title}</p>
            <div className="flex flex-wrap gap-2">
              {options.map(({ value, label }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => select(key, value)}
                  className={cn(
                    "px-3 py-2 rounded-xl border text-sm transition-all",
                    answers[key] === value
                      ? "bg-primary text-primary-foreground border-primary"
                      : "border-border text-foreground hover:border-primary/50",
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="sticky bottom-4">
        <Button size="lg" className="w-full h-14 text-lg font-bold btn-emerald-cta" disabled={!allDone} onClick={proceed}>
          Получить разбор
        </Button>
      </div>
    </div>
  );
}
