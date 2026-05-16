import type { AiResultType } from "@/lib/validation";

// Mock result for local development — matches §12 of UI/UX Brief
export const MOCK_RESULT: AiResultType = {
  red_flag: false,
  red_flag_reason: null,
  user_name: "Анна",
  entry_scenario: "morning-face",
  zone_analysis: {
    forehead:    { visible: true,  intensity: "mild",     note: "Лёгкая тяжесть в межбровье" },
    brows:       { visible: true,  intensity: "none",     note: null },
    periorbital: { visible: true,  intensity: "moderate", note: "Мешки под нижним веком" },
    nasolabial:  { visible: true,  intensity: "mild",     note: "Носогубные складки углублены" },
    face_oval:   { visible: true,  intensity: "moderate", note: "Контур нижней челюсти размыт" },
    lips_purse:  { visible: true,  intensity: "none",     note: null },
    chin:        { visible: true,  intensity: "mild",     note: "Лёгкая припухлость" },
    neck:        { visible: false, intensity: null,        note: null },
  },
  primary_cause: {
    key: "lymph_stasis",
    title: "Застой лимфатической системы",
    explanation_for_user:
      "Лимфатическая система — это дренаж организма. Когда её ток замедляется (малоподвижность, обезвоживание, стресс), жидкость задерживается в тканях: утром лицо «не как моё», вечером тяжелеют ноги. Именно этот механизм стоит за системной отёчностью у большинства женщин после 40.",
    confidence: 0.78,
  },
  secondary_cause: {
    key: "water_salt_imbalance",
    title: "Нарушение водно-солевого обмена",
    explanation_for_user:
      "По вашему ответу — вы пьёте менее 1,5 л воды в день. Это усиливает задержку жидкости: организм запасает то, что есть.",
  },
  personal_comment:
    "Анна, по фото и ответам видим классический паттерн утреннего лимфостаза в сочетании с недостаточным питьевым режимом. Хорошая новость — это обратимо без жёстких мер.",
  seven_day_plan: [
    {
      step: 1,
      action: "200 мл тёплой воды сразу после пробуждения, далее 30 мл × вес в кг в течение дня. При 65 кг = 1 950 мл.",
      why: "Запускает лимфоток и снимает ночной застой жидкости.",
    },
    {
      step: 2,
      action:
        "Лимфодренажная утренняя гимнастика 5 минут: 10 наклонов и поворотов головы, 20 мелких прыжков на носках, 10 циклов диафрагмального дыхания.",
      why: "Активирует отток лимфы от лица и из конечностей.",
    },
    {
      step: 3,
      action: "Не сидеть больше 60 минут подряд. Встать, пройтись 3–5 минут.",
      why: "Лимфа не имеет своего «сердца» — её движет мышечный насос.",
    },
    {
      step: 4,
      action: "Спать на спине или с приподнятым изголовьем. Сон лицом в подушку — одна из причин утренних «мешков».",
      why: "Гравитация работает на отток от лица.",
    },
    {
      step: 5,
      action: "Самомассаж лица 2 минуты утром: от центра к вискам и к ушам, от подбородка к ключицам. Без давления.",
      why: "Стимулирует поверхностные лимфатические сосуды.",
    },
  ],
  avoid: [
    "Мочегонные средства без назначения врача",
    "Жёсткие диеты и голодание",
    "Резкий агрессивный дренажный массаж без подготовки",
  ],
  recommended_program: {
    key: "base",
    title: "Программа по лимфатической системе",
    price_original: 1850000,
    price_discounted: 940000,
    discount_percent: 49,
    url: "https://lid.nutritionist4day.ru/lymphatic-system_avto",
    why_this_program:
      "При выявленном лимфостазе — базовая программа разбирает работу лимфатической системы шаг за шагом.",
  },
  alternative_program: {
    key: "advanced",
    title: "Расширенная программа",
    price_original: 5750000,
    price_discounted: 1490000,
    discount_percent: 74,
    url: "https://lid.nutritionist4day.ru/lymphatic-system_avto",
  },
  disclaimer:
    "Это не медицинская диагностика. Edemaskan — образовательный сервис УПДН. При выраженных или продолжительных отёках рекомендуем очную консультацию врача.",
};
