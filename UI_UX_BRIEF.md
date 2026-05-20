# UI/UX Brief: Edemaskan — экран результата сканирования

> Версия: 1.0 | Дата: 2026-05-16 | Статус: Production-ready
> Назначение: единый источник истины для Claude Code при вёрстке Edemaskan
> Главный фокус документа — **финальный экран результата AI-разбора** (`/result`).
> Стиль и дизайн-система распространяются на все экраны (онбординг, скан, опросник, email-гейт, результат).

---

## 1. Общее описание интерфейса

### Концепция

**Soft Wellness Editorial** — мягкий wellness-интерфейс с подачей "редакционного разбора", а не "медицинского отчёта". Премиальное ощущение спа/кабинета нутрициолога: тёплый кремовый фон, серифные заголовки, цветные пастельные акценты на зонах лица, генерирующие визуальную метафору "лицо как карта". Никакой клиники, никакого "технологического" неона, никаких агрессивных красных таймеров.

Главная задача интерфейса — чтобы женщина 40-55 лет, открыв страницу на телефоне, **за 3 секунды** поняла: "это про меня, это серьёзно, это понятно, и здесь не давят".

### Целевая аудитория

- **Аватар:** Марина, 40-55 лет, Новосибирск/Кемерово/Пермь/Екатеринбург. Доход семьи 200-250 К ₽/мес. Уже потратила 30-80 К ₽ на косметологов/БАДы — без результата.
- **Технический уровень:** средний-низкий. Свободно пользуется iPhone/Android, мессенджерами, маркетплейсами. Не любит "хайтек-вид". Не доверяет интерфейсам, которые "выглядят как реклама".
- **Устройства:** **mobile-first**. 90%+ трафика — телефон, потому что 4 фото снимаются камерой. Desktop — обязательный fallback с QR-кодом или загрузкой файлов, но визуально вторичен.
- **Контекст использования:** дома, утром после умывания (хорошее освещение + только что увидела отёк в зеркале) или вечером после работы. Часто параллельно с домашними делами — нужны крупные тач-зоны и быстрое сканирование текста.
- **Возрастная адаптация:** базовый размер шрифта тела **17px** (не 14px). Контраст текста к фону минимум 7:1. Кнопки высотой **52px**. Никаких выпадающих меню с мелким текстом.

### Ключевые референсы (что взято)

1. **revitonica.ru (скан результата)** — взято: формат "фото лица сверху + цветные зоны + чипы-теги для перехода к разбору + продажа курса внизу". Дорабатываем: убираем агрессивный таймер "3 часа", делаем мягче, добавляем 7-дневный план.
2. **frata.myluuk.app** — взято: идея ВИЗУАЛЬНОЙ маркировки конкретных проблем прямо на фото (точки морщин, теплокарта покраснений, цветовые зоны типа кожи). У нас будет своя версия — эллипсы зон отёчности.
3. **Headspace / Calm (мобильный wellness)** — взято: тёплый кремовый фон, серифные заголовки, мягкие закруглённые карточки, генерирующие ощущение заботы, а не диагноза.

### Тон голоса в интерфейсе

| Можно | Нельзя |
|---|---|
| «Анна, ваш разбор готов» | «Результаты теста» |
| «Главная вероятная причина» | «Диагноз» |
| «Стартовый план на 7 дней» | «Курс лечения» |
| «Имеет смысл проверить ферритин» | «Сдайте срочно ферритин» |
| «Это не медицинская диагностика» (тонко, серым) | (Огромный warning-баннер) |

---

## 2. Цветовая схема

### Режим: **Light only** (тёплый кремовый, не белый)

Никакого dark-mode-переключателя в MVP. Женщины 40+ ассоциируют тёмный режим с "молодёжными приложениями" и хуже воспринимают на нём текст.

### Базовая палитра (Tailwind v4 `@theme`)

```css
@theme {
  /* ====== ФОНЫ ====== */
  --color-bg: #FBF7F0;              /* Тёплый кремовый — основной фон страницы */
  --color-bg-card: #FFFFFF;          /* Карточки — чистый белый для контраста */
  --color-bg-elevated: #F5EFE4;      /* Приподнятые секции, выделение */
  --color-bg-sage-soft: #EDF2EE;     /* Мягкий sage для primary-блоков (главная причина) */

  /* ====== БРЕНД / PRIMARY (sage teal) ====== */
  --color-primary: #6B9080;          /* Sage Teal — главный бренд (УПДН, природа, спокойствие) */
  --color-primary-hover: #4F6F65;    /* Тёмная вариация для hover/active */
  --color-primary-muted: #A4C3B2;    /* Светлая вариация для бейджей */
  --color-primary-soft: #CCE3DE;     /* Для подложек primary-карточек */

  /* ====== АКЦЕНТ / CTA (warm coral) ====== */
  --color-accent: #E07A5F;           /* Тёплый коралл — главная CTA-кнопка */
  --color-accent-hover: #C5654A;     /* Hover/active */
  --color-accent-soft: #F4D5C8;      /* Подложка таймера, скидки */

  /* ====== ТЕКСТ ====== */
  --color-text: #2D2A26;             /* Тёмный графит — основной текст */
  --color-text-muted: #6B6660;       /* Вторичный текст, подписи */
  --color-text-soft: #9A938B;        /* Дисклеймеры, мета-инфо */
  --color-text-inverse: #FBF7F0;     /* Текст на тёмном/цветном фоне */

  /* ====== СТАТУСЫ ====== */
  --color-success: #6B9080;          /* Совпадает с primary, sage */
  --color-warning: #D4A574;          /* Тёплая охра, не агрессивный жёлтый */
  --color-error: #BE6B5F;            /* Приглушённый терракот, не алый */
  --color-info: #7BA098;             /* Spa-teal */

  /* ====== ГРАНИЦЫ ====== */
  --color-border: #E8E2D8;           /* Тёплый бежевый */
  --color-border-strong: #C9C1B4;    /* Для активных состояний */
  --color-border-focus: #6B9080;     /* Совпадает с primary */

  /* ====== 8 ЦВЕТОВ ЗОН ЛИЦА (mapping ключ зоны → цвет эллипса/чипа) ====== */
  /* Каждый цвет: фон-чип + бордер-чип + цвет-эллипса с alpha-30 */
  --zone-forehead:      #A8C9B9;     /* Лоб — sage green */
  --zone-brows:         #B4D4C5;     /* Брови и межбровка — mint */
  --zone-periorbital:   #F0D78A;     /* Периорбитальная — butter yellow */
  --zone-nasolabial:    #F0B5B5;     /* Носогубная — soft rose */
  --zone-face-oval:     #A8C9E0;     /* Овал лица — soft sky */
  --zone-lips-purse:    #D5B8E0;     /* Губы и кисетки — lavender */
  --zone-chin:          #F0C9A8;     /* Подбородочная — peach */
  --zone-neck:          #A0CFC8;     /* Шея — turquoise */
}
```

### Скругления (тёплые, не острые)

- Кнопки: **`rounded-full`** (52px высота — pill-форма, ассоциация с заботой)
- Карточки контента: **`rounded-2xl`** (16px)
- Карточки программ (главные): **`rounded-3xl`** (24px)
- Чипы зон: **`rounded-full`**
- Инпуты: **`rounded-xl`** (12px)
- Фото лица в результате: **`rounded-3xl`** (24px) с тонкой `border border-border`

### Тени (мягкие, не drop-shadow-резкие)

```css
--shadow-soft: 0 2px 8px rgb(45 42 38 / 0.04), 0 1px 2px rgb(45 42 38 / 0.06);
--shadow-card: 0 4px 16px rgb(45 42 38 / 0.06), 0 2px 4px rgb(45 42 38 / 0.04);
--shadow-cta: 0 8px 24px rgb(224 122 95 / 0.25);  /* Тёплая тень для CTA */
```

---

## 3. Типографика

### Шрифты (НЕ Inter, НЕ Roboto — это распознаваемый AI-стиль)

- **Display / заголовки:** `'Cormorant Garamond', Georgia, serif` — изящный серифный шрифт, ассоциация с премиальным wellness, не "медицина". Веса: 500, 600.
- **Body / интерфейс:** `'Manrope', -apple-system, sans-serif` — современный гуманистический sans с тёплыми формами, отличная читаемость на маленьких размерах. Веса: 400, 500, 600, 700.
- **Numeric / таймер:** `'Manrope', tabular-nums` — табличные цифры, чтобы цифры таймера не "прыгали".

```html
<!-- Подключение в layout.tsx -->
<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@500;600&family=Manrope:wght@400;500;600;700&display=swap" rel="stylesheet">
```

### Шкала размеров (бамп для 40+)

| Применение | Tailwind класс | Размер | Шрифт | Вес |
|---|---|---|---|---|
| Hero заголовок результата (`Анна, ваш разбор готов`) | `text-3xl md:text-4xl` | 30/36px | Cormorant | 600 |
| Название главной причины | `text-2xl md:text-3xl` | 24/30px | Cormorant | 600 |
| Заголовок секции (`План на 7 дней`) | `text-xl md:text-2xl` | 20/24px | Cormorant | 600 |
| Подзаголовок карточки | `text-lg` | 18px | Manrope | 600 |
| **Основной текст** | **`text-[17px]`** | **17px** | Manrope | 400 |
| Текст в кнопках | `text-base` | 16px | Manrope | 600 |
| Подпись/мета | `text-sm` | 14px | Manrope | 500 |
| Дисклеймер | `text-xs` | 12px | Manrope | 400 |
| Цифры цены большие | `text-4xl` | 36px | Manrope | 700 |
| Таймер | `text-3xl tabular-nums` | 30px | Manrope | 700 |

### Межстрочные интервалы

- Заголовки серифные: `leading-tight` (1.2)
- Основной текст: **`leading-relaxed`** (1.625) — критично для аудитории 40+
- Текст в кнопках: `leading-none`

---

## 4. Лейаут и навигация

### Тип лейаута

**Single column, mobile-first**, без sidebar. На desktop — центрированная колонка max-width 480px (mobile-приложение в браузере), на сторонах декоративный кремовый фон.

### Структура хедера (тонкая, не отвлекает)

```
┌─────────────────────────────────────┐
│   [edemaskan logo · sage]   ⓘ помощь│  56px высота, sticky, фон bg
└─────────────────────────────────────┘
```

- Лого слева: текстовое `edemaskan` шрифтом Cormorant 600, размер 18px, цвет `text-primary`. Слева крошечный значок капли (Lucide `Droplet` 16px) того же цвета.
- Справа: иконка-кнопка `HelpCircle` (Lucide, 20px) — открывает Sheet с FAQ. На результате эту кнопку убираем (чтобы не отвлекать от CTA).

### Структура страницы результата (полная мобильная композиция)

```
┌──────────────────────────────────────┐
│  [edemaskan logo]                    │  Header (56px, sticky)
├──────────────────────────────────────┤
│                                      │
│  Анна, ваш разбор готов              │  Hero (32px серий + 17px подзаг)
│  На основе 4 фото и ваших ответов    │
│                                      │
├──────────────────────────────────────┤
│  ╭──────────────────────────────╮    │
│  │   ┌────────────────────┐     │    │  Photo card (rounded-3xl,
│  │   │                    │     │    │  фото с overlay-эллипсами)
│  │   │   FACE PHOTO       │     │    │
│  │   │   + 8 ellipses     │     │    │
│  │   │   (color = zone)   │     │    │
│  │   │                    │     │    │
│  │   └────────────────────┘     │    │
│  │   Нажмите на эллипс или      │    │
│  │   тег ниже, чтобы прочитать  │    │
│  │   разбор зоны ↓              │    │
│  ╰──────────────────────────────╯    │
│                                      │
├──────────────────────────────────────┤
│  Зоны на вашем лице                  │  Section title
│                                      │
│  [Лоб] [Брови] [Глаза]               │  Chip grid (8 цветных
│  [Носогубная] [Овал]                 │  чипов, color-matched
│  [Губы] [Подбородок] [Шея]           │  with ellipses)
│                                      │
├──────────────────────────────────────┤
│  ╭──────────────────────────────╮    │
│  │ 🌊 Главная вероятная причина │    │  Primary cause card
│  │                              │    │  (bg sage-soft, rounded-3xl)
│  │ Застой лимфатической системы │    │  (24px Cormorant)
│  │ ──                           │    │
│  │ Лимфатическая система — это  │    │  (17px Manrope, relaxed)
│  │ дренаж организма. Когда её   │    │
│  │ ток замедляется, жидкость    │    │
│  │ задерживается в тканях...    │    │
│  │                              │    │
│  │ Уверенность: ●●●●○ 78%       │    │  Confidence indicator
│  ╰──────────────────────────────╯    │
│                                      │
│  + Сопутствующая причина:            │  Secondary cause (компактнее)
│  ╭──────────────────────────────╮    │
│  │ 💧 Водно-солевой обмен       │    │
│  │ Краткое объяснение в 1-2     │    │
│  │ предложения...               │    │
│  ╰──────────────────────────────╯    │
│                                      │
├──────────────────────────────────────┤
│  Разбор по зонам                     │
│                                      │
│  ╭──────────────────────────────╮    │
│  │ ● Лоб                        │←─── id="zone-forehead"
│  │   intensity: mild            │    │  Цветовая точка слева =
│  │   Лёгкая тяжесть в           │    │  цвет зоны
│  │   межбровье                  │    │  (только visible: true)
│  ╰──────────────────────────────╯    │
│  ╭──────────────────────────────╮    │
│  │ ● Периорбитальная зона       │←─── id="zone-periorbital"
│  │   intensity: moderate        │    │
│  │   Мешки под нижним веком     │    │
│  ╰──────────────────────────────╯    │
│  ╭──────────────────────────────╮    │
│  │ ● Овал лица                  │    │
│  │   intensity: moderate        │    │
│  │   Контур нижней челюсти      │    │
│  │   размыт                     │    │
│  ╰──────────────────────────────╯    │
│  ...                                 │
│                                      │
├──────────────────────────────────────┤
│  Ваш стартовый план на 7 дней        │
│                                      │
│  ╭──────────────────────────────╮    │
│  │ ① Питьевой режим              │    │  Step card
│  │                               │    │  (numbered circle бренд-color)
│  │ 200 мл тёплой воды сразу      │    │
│  │ после пробуждения, далее      │    │
│  │ 30 мл × вес в кг в течение    │    │
│  │ дня. При 65 кг = 1 950 мл.    │    │
│  │                               │    │
│  │ ─── Почему ───                │    │
│  │ Запускает лимфоток и снимает  │    │
│  │ ночной застой жидкости.       │    │
│  ╰──────────────────────────────╯    │
│  ╭──────────────────────────────╮    │
│  │ ② Лимфодренажная гимнастика  │    │
│  │ 5 минут утром: ...           │    │
│  ╰──────────────────────────────╯    │
│  ...пять шагов...                    │
│                                      │
├──────────────────────────────────────┤
│  Чего избегать на этой неделе        │
│                                      │
│  ✗ Мочегонные средства без врача     │  Plain list, иконка X
│  ✗ Жёсткие диеты и голодание         │  цветом text-error
│  ✗ Резкий агрессивный массаж         │
│                                      │
├──────────────────────────────────────┤
│  ╭──────────────────────────────╮    │
│  │  ⏱ Специальная цена          │    │  Timer banner
│  │     действует ещё            │    │  (bg accent-soft, rounded-2xl)
│  │                              │    │
│  │     47 : 59 : 23             │    │  Большие tabular-nums
│  │     часы  мин  сек           │    │
│  ╰──────────────────────────────╯    │
│                                      │
├──────────────────────────────────────┤
│                                      │
│  Что мы рекомендуем именно вам       │
│                                      │
│  ╭──────────────────────────────╮    │
│  │ ⭐ РЕКОМЕНДУЕМ                │    │  Primary program (highlighted
│  │                              │    │  с border-2 border-primary,
│  │ Программа по лимфатической   │    │  bg-bg-card, rounded-3xl)
│  │ системе                      │    │
│  │                              │    │
│  │ Базовая программа УПДН по    │    │
│  │ методологии Синицыной С. В.  │    │
│  │                              │    │
│  │ ~~18 500 ₽~~ → скидка 49%   │    │
│  │                              │    │
│  │     9 400 ₽                  │    │  Огромная цена (36px)
│  │                              │    │
│  │ [ Выбрать программу → ]      │    │  CTA full-width, coral
│  ╰──────────────────────────────╯    │
│                                      │
│  ╭──────────────────────────────╮    │  Alternative program
│  │ Расширенная программа        │    │  (компактнее, без highlight)
│  │ Лимфа + Антипаразитарка +    │    │
│  │ Железодефицит                │    │
│  │                              │    │
│  │ ~~57 500 ₽~~  14 900 ₽       │    │
│  │ Скидка 74%                   │    │
│  │                              │    │
│  │ [ Подробнее → ]              │    │  CTA outline, не coral
│  ╰──────────────────────────────╯    │
│                                      │
├──────────────────────────────────────┤
│                                      │
│  Это не медицинская диагностика.     │  Disclaimer (text-soft, 12px)
│  Edemaskan — образовательный сервис  │
│  УПДН. При выраженных или продол-    │
│  жительных отёках рекомендуем        │
│  очную консультацию врача.           │
│                                      │
│  ✓ Мы не сохраняем ваши фотографии   │  Trust line (sage)
│                                      │
└──────────────────────────────────────┘

⬇ Sticky bottom bar (появляется при скролле вниз от секции программ):
┌──────────────────────────────────────┐
│  [ Применить скидку 49% — 9 400 ₽ ]  │  Full-width CTA, всегда видна
└──────────────────────────────────────┘
```

### Sticky bottom CTA (важная деталь конверсии)

- Высота: 72px, фон `bg-card`, тень `shadow-cta` сверху, `border-t border-border`
- Появляется через `IntersectionObserver`: когда пользователь проскроллил мимо первого блока программы и НЕ дошёл до футера
- Текст кнопки динамический: показывает рекомендуемый тариф из `primary_cause`
- Tap → плавный scroll к карточке программы + лёгкая подсветка `ring-2 ring-primary` на 1 сек

### Desktop fallback

- Контент в центральной колонке `max-w-[480px]` с горизонтальным паддингом
- По бокам — кремовый фон (`bg-bg`)
- На desktop под фото лица показываем уменьшенную миниатюру 280×280px (вместо ~360×360 на мобиле)
- Sticky bottom CTA на desktop НЕ нужен — справа от колонки floating-CTA card (sticky, `top-24`)

---

## 5. Список экранов (с уклоном в результат)

| # | Экран | Путь | Главные компоненты | Состояния |
|---|---|---|---|---|
| 1 | **Лендинг (5 вариантов)** | `/morning-face`, `/eye-bags`, `/face-oval`, `/legs`, `/rings` | `LandingHero`, `PainBlock`, `HowItWorks`, `TrustBlock`, `CTAButton`, `FAQAccordion` | default, scrolled |
| 2 | **Онбординг согласий** | `/scan/start` | `ConsentCheckbox`×2, `OnboardingFacts` (карусель с фактами УПДН), `PhotoHint`, `CameraButton` | default, consents-needed, ready |
| 3 | **Захват фото** | `/scan/photo/[step]` (step 1-4) | `CameraView`, `AngleGuide` (контур лица-подсказка), `RetakeButton`, `ProgressBar` (4 шага) | camera-active, captured, retake |
| 4 | **Опросник** | `/scan/quiz/[step]` (5 шагов) | `RadioGroupCard`, `ProgressDots`, `NextButton` | default, answered, validation-error |
| 5 | **Подготовка AI** | `/scan/processing` | `ProcessingAnimation` (мягкие пульсирующие круги в sage), `StatusText` (меняется: "Анализируем зоны..." → "Сопоставляем с базой...") | analyzing, error-retry |
| 6 | **Email-гейт** | `/scan/email` | `NameInput`, `EmailInput`, `SubmitButton`, `PrivacyHint` | default, validating, submitting, error |
| 7 | **🎯 РЕЗУЛЬТАТ** (главный) | `/result/[scanId]` | См. отдельный раздел ниже | loading, red-flag, full-result, error |
| 8 | **Red flag / к врачу** | (вшит в /result как состояние) | `RedFlagCard` (тёплая бежевая, не алая), `DoctorRecommendation` | shown when red_flag: true |
| 9 | **Политика обработки фото** | `/policy/face-analysis` | `LegalDocument` (markdown render) | default |
| 10 | **Политика конфиденциальности** | `/policy/privacy` | `LegalDocument` | default |

---

## 6. Детальная спецификация экрана `/result/[scanId]`

> Это главный экран продукта. Описывается отдельно, в максимальной детализации, чтобы Claude Code собрал его без догадок.

### 6.1. Кастомные компоненты экрана результата

| Компонент | Файл | Что делает |
|---|---|---|
| `ResultHero` | `src/components/result/ResultHero.tsx` | Заголовок "{name}, ваш разбор готов" + подзаголовок |
| `FacePhotoWithZones` | `src/components/result/FacePhotoWithZones.tsx` | Фото лица + SVG-overlay с 8 эллипсами + tooltip на тап |
| `ZoneChipGrid` | `src/components/result/ZoneChipGrid.tsx` | 8 цветных чипов зон, tap → smooth scroll к разбору зоны |
| `PrimaryCauseCard` | `src/components/result/PrimaryCauseCard.tsx` | Главная причина с иконкой, объяснением и confidence-индикатором |
| `SecondaryCauseCard` | `src/components/result/SecondaryCauseCard.tsx` | Компактная карточка сопутствующей причины |
| `ZoneAnalysisList` | `src/components/result/ZoneAnalysisList.tsx` | Список разборов по зонам с якорями `#zone-{key}` |
| `SevenDayPlan` | `src/components/result/SevenDayPlan.tsx` | 5 пронумерованных карточек шагов плана |
| `AvoidList` | `src/components/result/AvoidList.tsx` | Список "чего избегать" с иконками X |
| `OfferTimer` | `src/components/result/OfferTimer.tsx` | Таймер 48 часов, отсчёт реального времени |
| `ProgramCard` | `src/components/result/ProgramCard.tsx` | Карточка программы (используется 2×: primary + alternative) |
| `StickyBottomCTA` | `src/components/result/StickyBottomCTA.tsx` | Закреплённая снизу CTA-кнопка |
| `RedFlagCard` | `src/components/result/RedFlagCard.tsx` | Альтернативное состояние при `red_flag: true` |
| `ResultDisclaimer` | `src/components/result/ResultDisclaimer.tsx` | Дисклеймер + плашка "Не сохраняем фото" |

### 6.2. Поведение `FacePhotoWithZones`

**Главный визуальный элемент страницы.** Делается на SVG поверх изображения.

```
HTML-структура:
<div class="relative rounded-3xl overflow-hidden">
  <img src={faceImageBase64} class="w-full" />
  <svg class="absolute inset-0" viewBox="0 0 100 100" preserveAspectRatio="none">
    <!-- 8 эллипсов с цветами зон, opacity-30, stroke-2 -->
    <ellipse cx="50" cy="15" rx="20" ry="6" fill="var(--zone-forehead)" opacity="0.3" stroke="var(--zone-forehead)" />
    ...
  </svg>
</div>
```

- Эллипсы позиционируются в **относительных координатах viewBox 0-100** (нормализованы AI или константы по зоне). MVP: фиксированные координаты в config-файле `src/config/zone-coords.ts`, потому что AI возвращает intensity, а не точную геометрию.
- Показываются **только эллипсы зон с `visible: true && intensity !== 'none'`**.
- Цвет эллипса = `--zone-{key}`, заливка `opacity-30`, обводка `stroke-2` тем же цветом без прозрачности.
- **Tap на эллипс:** open tooltip-pill с названием зоны и intensity (например, "Периорбитальная · умеренно"). Tooltip позиционируется над эллипсом, исчезает по тапу вне/через 3 сек.
- **Tap на эллипс с длительным нажатием (>500ms):** scroll к секции разбора этой зоны (как и tap на чипе ниже).
- Под фото — мелкая подпись `text-sm text-text-muted`: «Нажмите на эллипс или тег ниже, чтобы прочитать разбор зоны».

### 6.3. Поведение `ZoneChipGrid`

- 8 чипов в flex-wrap, gap 8px, padding `px-4 py-2`, `rounded-full`.
- **Фон чипа:** `--zone-{key}` с opacity 30% (через background-color rgb + alpha).
- **Бордер:** `border border-zone-{key}` (полный alpha).
- **Текст:** `text-text` (тёмный графит), `font-medium`, размер 15px.
- Чип показывается **только если зона visible: true**.
- Если `intensity: 'none'` — чип чуть приглушённый (`opacity-60`), но тоже кликабельный.
- **Tap → `scrollIntoView({ behavior: 'smooth', block: 'start' })`** к якорю `#zone-{key}`. После скролла — короткая анимация `animate-pulse` на 800ms на карточке разбора зоны.

### 6.4. Поведение `PrimaryCauseCard`

- Фон: `bg-bg-sage-soft`, `rounded-3xl`, `p-6`, `shadow-card`.
- Сверху: иконка (Lucide) + бейдж `Главная вероятная причина` (`bg-primary text-text-inverse rounded-full px-3 py-1 text-xs`).
- Иконки причин:
  - `lymph_stasis` → `Waves` (волны)
  - `parasitic_intoxication` → `ShieldAlert`
  - `iron_deficiency` → `Droplet`
  - `water_salt_imbalance` → `GlassWater`
  - `hormonal_imbalance` → `Sparkles`
- Название причины: 24px Cormorant 600.
- Объяснение: 17px Manrope, leading-relaxed.
- Confidence indicator: ряд из 5 кружков, заполненных по `round(confidence * 5)`, цвет `text-primary`. Рядом текст `78%`.

### 6.5. Поведение `SevenDayPlan`

- 5 карточек-шагов, `rounded-2xl bg-bg-card border border-border p-5`.
- Слева наверху: круг 40×40px с номером шага, фон `bg-primary text-text-inverse`, шрифт Cormorant 600 20px.
- Заголовок шага (например "Питьевой режим") — 18px Manrope 600.
- Текст действия — 17px, leading-relaxed.
- Разделитель `─── Почему ───` — тонкая линия с центральным текстом, `text-text-muted text-sm`.
- Текст "почему" — 15px italic, `text-text-muted`.

### 6.6. Поведение `OfferTimer`

- Карточка `bg-accent-soft`, `rounded-2xl`, `p-5`, `text-center`.
- Иконка `Clock` Lucide 24px, цвет `text-accent`.
- Заголовок: «Специальная цена действует ещё» — 16px Manrope 500.
- Таймер: формат `47 : 59 : 23`, 30px Manrope 700, tabular-nums, цвет `text-accent`.
- Подписи под цифрами: `часы  мин  сек` — 12px text-muted.
- Логика времени:
  - При первом рендере страницы — записываем `localStorage['edemaskan_offer_expires_at']` = `Date.now() + 48*60*60*1000` (только если ключа ещё нет).
  - useEffect с `setInterval(..., 1000)` обновляет отображение.
  - Когда `< 0`: таймер показывает `00 : 00 : 00`, но кнопки CTA остаются активны (бизнес-решение: не закрываем продажу полностью).
- **БЕЗ "красного мигания" и "срочно срочно".** Дизайн остаётся спокойным, доверительным. Это отличает от revitonica.ru.

### 6.7. Поведение `ProgramCard` (highlighted vs alternative)

**Primary (highlighted):**
- `bg-bg-card`, `rounded-3xl`, `border-2 border-primary`, `shadow-card`, `p-6`
- Сверху бейдж: `⭐ РЕКОМЕНДУЕМ ВАМ` — 12px text-inverse, фон `bg-primary`, `rounded-full px-3 py-1`, позиционирован absolute со сдвигом `-top-3 left-6`.
- Название программы: 22px Cormorant 600.
- Подзаголовок «Базовая программа УПДН по методологии Синицыной С. В.» — 15px text-muted.
- Цена-старая: 18px line-through, text-muted.
- Скидка badge: «-49%», `bg-accent-soft text-accent rounded-full px-3 py-1 text-sm font-semibold`.
- Цена-новая: 40px Manrope 700, `text-text`.
- CTA-кнопка: full-width, height 56px, `bg-accent text-text-inverse rounded-full text-lg font-semibold shadow-cta`. На hover/active: `bg-accent-hover`, лёгкий `scale-[0.98]`.

**Alternative:**
- Тот же layout, но `border border-border` (без `border-2 border-primary`), без бейджа «РЕКОМЕНДУЕМ».
- CTA-кнопка outline: `bg-transparent border-2 border-primary text-primary rounded-full`. На hover: `bg-primary text-text-inverse`.

### 6.8. Поведение `StickyBottomCTA`

- Появляется через IntersectionObserver, когда блок программ покидает viewport СВЕРХУ (т.е. пользователь проскроллил мимо).
- Скрывается, когда пользователь снова видит блок программ.
- Анимация: `slide-up + fade-in 300ms`.
- Кликабельна — скроллит к карточке primary-программы + подсветка.

### 6.9. Поведение состояния Red Flag

Когда AI возвращает `red_flag: true`:

- НЕ показываем: причины, план на 7 дней, чего избегать, таймер, карточки программ.
- ПОКАЗЫВАЕМ:
  - Hero без изменений
  - Фото лица БЕЗ цветных эллипсов (только фото в `rounded-3xl`)
  - `RedFlagCard`: тёплая бежевая `bg-elevated`, `rounded-3xl`, `p-6`, иконка `Stethoscope` (Lucide) 32px цвет `text-primary`.
  - Заголовок: «{Имя}, рекомендуем сначала очно показаться врачу» — 24px Cormorant.
  - Тело: `red_flag_reason` из AI-ответа.
  - Кнопка: «Понятно» (`bg-primary text-text-inverse rounded-full`).
- ВНИЗУ: дисклеймер БЕЗ упоминания скидок и продаж.

### 6.10. Состояния экрана `/result/[scanId]`

| Состояние | Триггер | Что показываем |
|---|---|---|
| `loading` | Первый рендер, fetch результата | Skeleton: серые блоки на местах Hero/Photo/Cause/Plan, `animate-pulse`. Фон bg-bg. |
| `red-flag` | `result.red_flag === true` | Только секции 6.9 |
| `full-result` | Все поля заполнены, red_flag false | Полный layout |
| `error` | API вернул ошибку или fetch упал | Карточка в центре: «Не получилось получить результат. Попробуйте обновить страницу или напишите нам в Telegram-бот @edemaskan_help». Кнопка «Обновить». |
| `expired` | scanId не найден или результат старше 30 дней | «Этот разбор больше недоступен. Получите новый бесплатный разбор.» + ссылка на /morning-face |

---

## 7. Адаптивные точки (breakpoints)

Tailwind v4 дефолтные:
- `sm: 640px`
- `md: 768px`
- `lg: 1024px`
- `xl: 1280px`

### Поведение Edemaskan по breakpoints:

| Breakpoint | Поведение |
|---|---|
| `< sm` (мобайл, <640px) | Базовый дизайн. Padding страницы `px-4`. Колонка full-width. Sticky bottom CTA активен. |
| `sm – md` (640-768px) | Padding `px-6`. Колонка max-w-[440px] center. Карточки чуть шире. |
| `md – lg` (768-1024px) | Колонка max-w-[480px] center. Плашка таймера и программ растягиваются до колонки. Sticky bottom CTA скрыт, появляется sticky sidebar справа с CTA-card. |
| `≥ lg` (1024px+) | Двухколоночный layout: основной контент в центре (max-w-[480px]), справа sticky sidebar 320px с миниатюрой результата + CTA. Фон по бокам — `bg-bg` с лёгким декоративным кремовым шумом (SVG noise) для премиальности. |

### Мобильная навигация

- Header sticky, всегда виден (56px высоты).
- НЕТ бургер-меню, НЕТ bottom tab bar — это страница-воронка, не приложение.
- На странице результата `BackButton` (Lucide `ChevronLeft`) ВЫРУБЛЕН — нет возврата к экрану скана, чтобы не сбросить состояние.

---

## 8. Анимации и переходы

### Общие принципы

- Длительность: **200-400ms** (чуть медленнее обычного, чтобы ощущалось «спокойно»)
- Easing: `cubic-bezier(0.4, 0, 0.2, 1)` (Material standard) для большинства; `cubic-bezier(0.34, 1.56, 0.64, 1)` (spring back) для появления карточек
- Уважаем `prefers-reduced-motion`: все `transition` и `animation` отключаются через media-query
- Используем **Framer Motion** для сложных композиций (page reveal), CSS-transitions для микро-взаимодействий

### Конкретные анимации

| Элемент | Анимация | Длительность | Easing |
|---|---|---|---|
| **Реveal страницы результата** | Stagger: каждая секция fade-in + translate-y-2 с задержкой 100ms | 400ms на секцию | spring |
| Эллипсы на фото лица | На первом appear — pulse 2 раза (`animate-ping` only first cycle) | 1600ms | ease-out |
| Tap на чип зоны | Scale 0.95 на press, обратно 1.0 | 150ms | ease-out |
| Smooth scroll к зоне | `behavior: 'smooth'`, потом подсветка карточки `ring-2 ring-primary` 800ms | 800ms | linear |
| Сheckbox tick (consent) | Scale-in галочки + лёгкая sage-вспышка фона | 250ms | spring |
| OfferTimer цифры | Tabular-nums, БЕЗ flip-анимации (она здесь раздражает) | — | — |
| ProgramCard CTA tap | Scale-[0.98] + лёгкая sage-волна (ripple через CSS) | 300ms | ease-out |
| StickyBottomCTA появление | Slide-up + fade-in | 300ms | ease-out |
| Tooltip на эллипсе | Fade-in + translate-y-2 | 200ms | ease-out |
| Page transitions (между шагами скана) | Fade + slide horizontal | 350ms | ease-in-out |
| Skeleton loader | Pulse (`animate-pulse`) | — | — |

### Декоративная атмосфера

- На фоне страницы результата, между секциями — лёгкие **декоративные SVG-точки/пунктиры** в цвете `--zone-{}` с opacity 10%. Не отвлекают, но добавляют редакционности.
- Над hero-блоком — лёгкое декоративное серифное `*` цвета primary (Cormorant Garamond) или маленький значок капли.

---

## 9. Состояния UI

### Глобальные состояния

| Состояние | Реализация |
|---|---|
| **Loading** | Skeleton на местах контента (`bg-border animate-pulse rounded-2xl h-{X}`). НЕ спиннер-в-центре — это «дешевит». |
| **Empty** (не применимо к результату, но для админки) | Иллюстрация в линиях (тонкая, sage-color) + CTA |
| **Error** | Inline-карточка `bg-bg-elevated border border-error/30`, иконка `AlertCircle text-error`, текст + кнопка повтора |
| **Success toast** | Используем shadcn/ui `sonner`: правый верх, фон `bg-primary text-text-inverse`, `rounded-full px-4 py-3`, авто-скрытие 3 сек |
| **Validation error в форме** | Inline под полем: `text-error text-sm mt-1`, иконка `AlertCircle` 14px слева |

### Формы (онбординг, email-гейт, опросник)

- Валидация **на blur** (не на каждый keystroke — раздражает 40+)
- Кнопка отправки `disabled:opacity-50 disabled:cursor-not-allowed`
- При loading — текст кнопки меняется (например, `Получить результат →` → `Готовим разбор...`) + Lucide-иконка `Loader2 animate-spin` слева
- Email-валидация: regex стандартный + проверка на blur. Текст ошибки: «Похоже, в адресе ошибка — проверьте, есть ли @ и точка»

---

## 10. Библиотека компонентов

### shadcn/ui — установка

```bash
npx shadcn@latest add button input label card dialog sheet
npx shadcn@latest add checkbox separator badge
npx shadcn@latest add toast skeleton tabs sonner
npx shadcn@latest add accordion alert tooltip
```

> Для shadcn/ui придётся кастомизировать `tailwind.config` или `globals.css` чтобы он использовал наши `@theme` переменные, а не дефолтные. В частности — переопределить `Button` primary вариант чтобы это был `bg-accent`, а не дефолтный синий.

### Сторонние библиотеки

| Библиотека | Назначение |
|---|---|
| `framer-motion` | Reveal-анимации, page transitions |
| `lucide-react` | Иконки (Droplet, Waves, ShieldAlert, GlassWater, Sparkles, Clock, AlertCircle, Stethoscope, ChevronLeft, HelpCircle, Loader2, Check, X) |
| `next/font/google` | Cormorant Garamond + Manrope с preload |
| `sonner` | Toast-уведомления |
| `react-intersection-observer` | Для появления StickyBottomCTA |

### Кастомные компоненты — полный реестр

| Категория | Файл | Описание |
|---|---|---|
| **Layout** | `src/components/layout/Header.tsx` | Лого + опциональная кнопка помощи |
| **Layout** | `src/components/layout/PageContainer.tsx` | Wrapper с max-w + paddings |
| **Common** | `src/components/common/ZoneChip.tsx` | Один цветной чип зоны |
| **Common** | `src/components/common/ConfidenceIndicator.tsx` | 5 кружков + % |
| **Common** | `src/components/common/StepCard.tsx` | Карточка с номером (используется в плане и в "Как работает") |
| **Common** | `src/components/common/Disclaimer.tsx` | Универсальная плашка дисклеймера |
| **Onboarding** | `src/components/onboarding/ConsentCheckbox.tsx` | Чекбокс согласия с ссылкой на политику |
| **Onboarding** | `src/components/onboarding/FactsCarousel.tsx` | Карусель фактов УПДН, смена каждые 3 сек |
| **Scan** | `src/components/scan/CameraView.tsx` | Обёртка над getUserMedia |
| **Scan** | `src/components/scan/AngleGuide.tsx` | Контурная подсказка позиции лица |
| **Quiz** | `src/components/quiz/RadioGroupCard.tsx` | Карточка вопроса с радио-вариантами |
| **Result** | См. раздел 6.1 | 13 компонентов экрана результата |

---

## 11. Иконки (Lucide React, конкретный список)

| Назначение | Иконка |
|---|---|
| Лого (рядом с edemaskan) | `Droplet` 16px |
| Помощь в header | `HelpCircle` |
| Назад | `ChevronLeft` |
| Камера | `Camera` |
| Загрузить файл | `Upload` |
| Согласие — галочка | `Check` |
| Ошибка | `AlertCircle` |
| Loading | `Loader2 animate-spin` |
| `lymph_stasis` | `Waves` |
| `parasitic_intoxication` | `ShieldAlert` |
| `iron_deficiency` | `Droplet` |
| `water_salt_imbalance` | `GlassWater` |
| `hormonal_imbalance` | `Sparkles` |
| Red flag | `Stethoscope` |
| Таймер | `Clock` |
| "Не сохраняем фото" | `ShieldCheck` |
| Чего избегать | `X` |
| Шаг плана выполнен (для будущей версии) | `CheckCircle2` |

---

## 12. Содержимое примера результата (для верификации вёрстки)

Когда будете верстать страницу `/result/[scanId]`, используйте этот mock как fixture:

```typescript
// src/lib/mock-result.ts
export const MOCK_RESULT = {
  red_flag: false,
  red_flag_reason: null,
  user_name: "Анна",
  entry_scenario: "morning-face",
  scan_image_url: "/mock/face-front.jpg",  // фото фронт-ракурс для overlay
  zone_analysis: {
    forehead:     { visible: true,  intensity: "mild",      note: "Лёгкая тяжесть в межбровье" },
    brows:        { visible: true,  intensity: "none",      note: null },
    periorbital:  { visible: true,  intensity: "moderate",  note: "Мешки под нижним веком" },
    nasolabial:   { visible: true,  intensity: "mild",      note: "Носогубные складки углублены" },
    face_oval:    { visible: true,  intensity: "moderate",  note: "Контур нижней челюсти размыт" },
    lips_purse:   { visible: true,  intensity: "none",      note: null },
    chin:         { visible: true,  intensity: "mild",      note: "Лёгкая припухлость" },
    neck:         { visible: false, intensity: null,        note: null }
  },
  primary_cause: {
    key: "lymph_stasis",
    title: "Застой лимфатической системы",
    explanation_for_user: "Лимфатическая система — это дренаж организма. Когда её ток замедляется (малоподвижность, обезвоживание, стресс), жидкость задерживается в тканях: утром лицо «не как моё», вечером тяжелеют ноги. Именно этот механизм стоит за системной отёчностью у большинства женщин после 40.",
    confidence: 0.78
  },
  secondary_cause: {
    key: "water_salt_imbalance",
    title: "Нарушение водно-солевого обмена",
    explanation_for_user: "По вашему ответу — вы пьёте менее 1,5 л воды в день. Это усиливает задержку жидкости: организм запасает то, что есть."
  },
  personal_comment: "Анна, по фото и ответам видим классический паттерн утреннего лимфостаза в сочетании с недостаточным питьевым режимом. Хорошая новость — это обратимо без жёстких мер.",
  seven_day_plan: [
    { step: 1, action: "200 мл тёплой воды сразу после пробуждения, далее 30 мл × вес в кг в течение дня. При 65 кг = 1 950 мл.", why: "Запускает лимфоток и снимает ночной застой жидкости." },
    { step: 2, action: "Лимфодренажная утренняя гимнастика 5 минут: 10 наклонов и поворотов головы, 20 мелких прыжков на носках, 10 циклов диафрагмального дыхания.", why: "Активирует отток лимфы от лица и из конечностей." },
    { step: 3, action: "Не сидеть больше 60 минут подряд. Встать, пройтись 3–5 минут.", why: "Лимфа не имеет своего «сердца» — её движет мышечный насос." },
    { step: 4, action: "Спать на спине или с приподнятым изголовьем. Сон лицом в подушку — одна из причин утренних «мешков».", why: "Гравитация работает на отток от лица." },
    { step: 5, action: "Самомассаж лица 2 минуты утром: от центра к вискам и к ушам, от подбородка к ключицам. Без давления.", why: "Стимулирует поверхностные лимфатические сосуды." }
  ],
  avoid: [
    "Мочегонные средства без назначения врача",
    "Жёсткие диеты и голодание",
    "Резкий агрессивный дренажный массаж без подготовки"
  ],
  recommended_program: {
    key: "base",
    title: "Программа по лимфатической системе",
    subtitle: "Базовая программа УПДН по методологии Синицыной С.В.",
    price_original: 18500,
    price_discounted: 9400,
    discount_percent: 49,
    url: "https://lid.nutritionist4day.ru/lymphatic-system_avto",
    why_this_program: "При выявленном лимфостазе — базовая программа разбирает работу лимфатической системы шаг за шагом."
  },
  alternative_program: {
    key: "advanced",
    title: "Расширенная программа",
    subtitle: "Лимфа + Антипаразитарка + Железодефицит",
    price_original: 57500,
    price_discounted: 14900,
    discount_percent: 74,
    url: "https://lid.nutritionist4day.ru/lymphatic-system_avto"
  }
};
```

Координаты эллипсов на фото (mock, относительные 0-100):

```typescript
// src/config/zone-coords.ts
export const ZONE_COORDS = {
  forehead:     { cx: 50, cy: 15, rx: 22, ry: 6 },
  brows:        { cx: 50, cy: 25, rx: 24, ry: 4 },
  periorbital:  { cx: 50, cy: 32, rx: 26, ry: 5 },
  nasolabial:   { cx: 50, cy: 50, rx: 18, ry: 7 },
  face_oval:    { cx: 50, cy: 70, rx: 30, ry: 10 },
  lips_purse:   { cx: 50, cy: 62, rx: 12, ry: 5 },
  chin:         { cx: 50, cy: 80, rx: 14, ry: 5 },
  neck:         { cx: 50, cy: 92, rx: 24, ry: 5 }
};
```

> Эти координаты — для **фронтального ракурса** (frontal). Тот ракурс, который показываем в результате. В MVP не подстраиваемся под индивидуальные пропорции лица — фикс-координаты для всех. После запуска (v2) — добавим landmark-detection.

---

## 13. Чек-лист валидации после реализации

После того, как Claude Code соберёт страницу `/result/[scanId]` — пройти по этому списку:

```
[ ] 1. Шрифты загружаются: Cormorant Garamond (заголовки) и Manrope (тело)
[ ] 2. Базовый размер тела = 17px (НЕ 14, НЕ 16)
[ ] 3. Фон страницы = #FBF7F0, НЕ белый
[ ] 4. На iPhone SE (375px) контент не ломается, ничего не вылезает за viewport
[ ] 5. На iPhone Pro Max (430px) контент центрирован, paddings правильные
[ ] 6. 8 эллипсов отрисовываются поверх фото правильными цветами
[ ] 7. Эллипсы НЕ показываются для зон с intensity: 'none' или visible: false
[ ] 8. Tap на чип зоны → плавный скролл к разделу зоны + 800ms подсветка
[ ] 9. Tap на эллипс → tooltip с названием зоны и intensity
[ ] 10. Confidence-индикатор показывает 4 заполненных кружка из 5 при 0.78
[ ] 11. Таймер реально тикает (записан в localStorage, переживает перезагрузку)
[ ] 12. Таймер не "красно мигает", остаётся в coral-цвете спокойно
[ ] 13. ProgramCard primary имеет border-2 border-primary и badge "РЕКОМЕНДУЕМ"
[ ] 14. CTA-кнопки имеют height 56px, rounded-full, shadow-cta
[ ] 15. Sticky bottom CTA появляется при скролле мимо блока программ, исчезает в футере
[ ] 16. На red_flag: true показывается только Hero + фото без эллипсов + RedFlagCard
[ ] 17. Дисклеймер внизу всегда виден, цвет text-soft (приглушённый)
[ ] 18. "Мы не сохраняем ваши фотографии" — sage-цвет, иконка ShieldCheck
[ ] 19. prefers-reduced-motion отключает все анимации
[ ] 20. Контраст текста к фону минимум 7:1 (проверить через axe DevTools)
[ ] 21. Все кнопки имеют focus-visible-ring (для клавиатурной навигации)
[ ] 22. Alt-text на фото лица: "Ваше фото для анализа зон"
[ ] 23. Lighthouse Accessibility ≥ 95
```

---

## 14. Что точно НЕ делать

Список явных запретов, чтобы Claude Code не ушёл в "AI-slop"-эстетику:

- ❌ **НЕ использовать Inter, Roboto, Arial** — это AI-default, дешёвый вид
- ❌ **НЕ использовать фиолетовые градиенты** на белом фоне
- ❌ **НЕ использовать чистый белый фон** (`#FFFFFF`) для страницы — это медицинский/клинический вид
- ❌ **НЕ использовать неоновые цвета**, кричащие красные таймеры, мигающие элементы
- ❌ **НЕ ставить эмодзи в ключевые места UI** (только в FAQ-вопросах допустимо)
- ❌ **НЕ использовать "card-with-shadow-on-white"** — стандартный AI-dashboard вид. У нас тёплые скругления + soft shadows на cream-фоне
- ❌ **НЕ делать таймер мигающим/красным**, даже на последних 10 секундах
- ❌ **НЕ использовать "стресс-копи"**: «Срочно!», «Осталось всего!», «Не упустите!»
- ❌ **НЕ показывать BMI, вес, цифры здоровья** — это не медицинский продукт
- ❌ **НЕ перегружать страницу gradients и blur-эффектами** — это путь к "techno-vibe", который аудитория 40+ не любит
- ❌ **НЕ использовать "тёмную тему" даже как опцию** в MVP

---

## 15. Что точно ДА

- ✅ Тёплый кремовый фон везде, белый только в карточках
- ✅ Cormorant Garamond для заголовков (редакционный wellness-вид)
- ✅ Manrope для тела (тёплый sans, читаемость)
- ✅ Базовый размер тела 17px, leading-relaxed
- ✅ Sage Teal как primary, Warm Coral как accent (одна основная + одна акцентная)
- ✅ Скругления `rounded-full` для кнопок, `rounded-3xl` для главных карточек
- ✅ Soft shadows вместо контрастных
- ✅ Личное обращение по имени везде, где есть имя
- ✅ Discrete confidence-indicator (5 кружков), а не процент-as-progress-bar
- ✅ Дисклеймер всегда виден внизу, но не выделен
- ✅ Плашка "Не сохраняем фото" — sage, доверительная

---

## 16. Финальные напоминания для Claude Code

1. **`@theme` в Tailwind v4** — все цвета только оттуда. НЕТ хардкоду hex в компонентах.
2. **TypeScript strict** — все props типизированы, никаких `any`.
3. **shadcn/ui Button перекрашиваем** через `variant: "default"` → `bg-accent`. Создаём кастомный `variant: "primary"` → `bg-primary` для второстепенных действий.
4. **Все тексты на русском**, плейсхолдеры в UI тоже на русском.
5. **Mobile-first**: сначала верстаем под 375px, потом scaling-up.
6. **Lazy-loading**: фото-сравнения в FAQ загружаем через `next/image` с `loading="lazy"`. На результате — фото лица eager.
7. **Никаких блокирующих модалок** на странице результата. Все вторичные действия — Sheet (выезжающая снизу панель).
8. **localStorage только для таймера** (`edemaskan_offer_expires_at`). НЕ хранить там персональные данные.
9. **Тест на старом iPhone (SE 2020 / 5.4")**: страница должна работать без лагов. Если Framer Motion тормозит — отключить декоративные reveal-анимации на устройствах с `slow-2g` / низкой памятью.
10. **Перед коммитом**: пройти чек-лист из раздела 13.

---

*UI/UX Brief v1.0 | Edemaskan | УПДН (updn.pro)*
*Готово к передаче в Claude Code Setup Generator вместе со SPEC.md*
