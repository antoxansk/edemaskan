# Edemaskan — Техническая спецификация

> Версия: 1.0 | Дата: 2026-05-13 | Статус: Production-ready
>
> Источник истины: `PROJECT_IDEA.md` v4.0, `scan-agent-prompt.md` v1.1, `LANDING_TEXTS.md` v1.0, `LEGAL_TZ.md` v1.0.
> Этот документ — единственный вход для автономной сборки через Claude Code.

---

## БЛОК 0: Обзор проекта

### 0.1 Что это

**Edemaskan** — бесплатный веб-сервис УПДН (updn.pro), который по 4 фотографиям лица + 5 ответам на вопросы об образе жизни возвращает нутрициологический разбор 8 зон отёчности, главную вероятную причину из 5 категорий по методологии УПДН и стартовый план на 7 дней. На странице результата — таймер 48 часов и CTA на Базовую/Продвинутую программу (внешний Геткурс-лендинг). Платежи внутри сервиса не принимаются: сервис — лид-магнит верха воронки.

### 0.2 Стек (фиксированный)

| Слой | Технология | Версия / нота |
|------|-----------|--------------|
| Framework | Next.js | 16 (App Router, React Server Components где возможно) |
| Язык | TypeScript | 5.5+, `"strict": true` |
| Стилизация | Tailwind CSS | v4 (CSS-first config через `@theme`) |
| UI-компоненты | shadcn/ui | latest, на Radix UI |
| Иконки | lucide-react | latest |
| Формы | react-hook-form + zod | latest |
| Сжатие фото | browser-image-compression | latest (клиент) |
| База данных | Supabase PostgreSQL | 15 |
| Хранение фото | **НЕТ** | фото живут только в памяти Node.js до ответа OpenRouter |
| AI-провайдер | OpenRouter | модель `anthropic/claude-sonnet-4` |
| CRM / email | Геткурс API | внешний |
| Алерты | Telegram Bot API | внутренний |
| Аналитика | Яндекс.Метрика | счётчик через env |
| Деплой | Vercel Hobby | работает в РФ без VPN |
| Cron | Vercel Cron Jobs | для retry-очереди и cleanup |
| Rate limit | Postgres-based | таблица `rate_limit_buckets` |

**Запрещено:** Cursor, Lovable, n8n, Supabase Edge Functions, Stripe, OpenAI, ЮKassa (в этом проекте платежей нет вообще), любое хранение фотографий в БД или Storage.

### 0.3 Денежные значения

Все цены хранятся в **копейках (INTEGER)**, отображаются с форматированием.

| Тариф | Original | Discounted | Скидка |
|-------|---------|-----------|--------|
| Базовый | `1850000` копеек (18 500 ₽) | `940000` копеек (9 400 ₽) | 49% |
| Продвинутый | `5750000` копеек (57 500 ₽) | `1490000` копеек (14 900 ₽) | 74% |

Эти значения хранятся как константы в `lib/pricing.ts`, **не** в БД (статичны на момент MVP).

### 0.4 Роли пользователей

| Роль | Описание | Доступ |
|------|---------|--------|
| `anonymous` | Посетитель (Марина) | Лендинги, флоу скана, своя страница результата по токену из email |
| `methodologist` | Методолог УПДН | Read-only через Supabase Studio (личный аккаунт в Supabase Auth + RLS-роль) |

Авторизации пользователей-Марин **нет** — флоу полностью анонимный. Все мутации в БД делает **service role** изнутри API routes. Прямых запросов с фронта в Supabase нет.

### 0.5 Маршруты приложения

| URL | Назначение | Источник |
|-----|-----------|----------|
| `/` | 301-редирект на `/morning-face` | server |
| `/morning-face` | Лендинг "утренний отёк" | static |
| `/eye-bags` | Лендинг "мешки под глазами" | static |
| `/face-oval` | Лендинг "опухший овал" | static |
| `/legs` | Лендинг "тяжёлые ноги" | static |
| `/rings` | Лендинг "кольца не снимаются" | static |
| `/scan` | Шаг 1: онбординг (согласия + факты УПДН) | client |
| `/scan/photos` | Шаг 2: загрузка 4 фото | client |
| `/scan/questionnaire` | Шаг 3: 5 вопросов | client |
| `/scan/analyzing` | Шаг 4: лоадинг с AI-вызовом | client |
| `/scan/email` | Шаг 5: email-гейт | client |
| `/scan/result` | Шаг 6: результат текущей сессии (по cookie) | server+client |
| `/r/[token]` | Результат по постоянной ссылке из email | server+client |
| `/scan/desktop-fallback` | QR-код для десктопа | server |
| `/legal/privacy` | Политика конфиденциальности | static MDX |
| `/legal/scan-policy` | Политика использования сервиса анализа лица | static MDX |
| `/api/scan/start` | POST — создать `scan_session` | API route |
| `/api/scan/analyze` | POST — фото + опросник → AI → результат | API route |
| `/api/scan/submit-email` | POST — name + email → постановка в Геткурс-очередь | API route |
| `/api/result/[token]` | GET — получить результат по токену | API route |
| `/api/cron/getcourse-retry` | GET — Vercel Cron, retry синков | API route (защищён `CRON_SECRET`) |
| `/api/cron/cleanup` | GET — Vercel Cron, удаление мусора | API route (защищён `CRON_SECRET`) |

### 0.6 .env переменные (полный список)

```bash
# Публичные (доступны на клиенте, prefix NEXT_PUBLIC_)
NEXT_PUBLIC_SITE_URL=https://edemaskan.lid.nutritionist4day.ru
NEXT_PUBLIC_YANDEX_METRIKA_ID=12345678
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi...

# Серверные (НЕ префикс NEXT_PUBLIC_)
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOi...

OPENROUTER_API_KEY=sk-or-v1-...
OPENROUTER_MODEL=anthropic/claude-sonnet-4
OPENROUTER_REFERER_URL=https://edemaskan.lid.nutritionist4day.ru
OPENROUTER_APP_NAME=Edemaskan

GETCOURSE_SCHOOL_DOMAIN=updn
GETCOURSE_API_KEY=...

TELEGRAM_BOT_TOKEN=...
TELEGRAM_CHAT_ID_LEADS=-1001234567890
TELEGRAM_CHAT_ID_ERRORS=-1009876543210

CRON_SECRET=randomly-generated-32-char-string

UPSELL_LANDING_URL=https://lid.nutritionist4day.ru/lymphatic-system_avto

# Сценарии (для валидации в API)
NEXT_PUBLIC_SCAN_SCENARIOS=morning-face,eye-bags,face-oval,legs,rings
```

### 0.7 Структура проекта

```
edemaskan/
├── app/
│   ├── (landings)/
│   │   ├── morning-face/page.tsx
│   │   ├── eye-bags/page.tsx
│   │   ├── face-oval/page.tsx
│   │   ├── legs/page.tsx
│   │   └── rings/page.tsx
│   ├── scan/
│   │   ├── layout.tsx                # обёртка с прогресс-баром
│   │   ├── page.tsx                  # онбординг (шаг 1)
│   │   ├── photos/page.tsx           # шаг 2
│   │   ├── questionnaire/page.tsx    # шаг 3
│   │   ├── analyzing/page.tsx        # шаг 4
│   │   ├── email/page.tsx            # шаг 5
│   │   ├── result/page.tsx           # шаг 6
│   │   └── desktop-fallback/page.tsx
│   ├── r/[token]/page.tsx            # результат по ссылке
│   ├── legal/
│   │   ├── privacy/page.mdx
│   │   └── scan-policy/page.mdx
│   ├── api/
│   │   ├── scan/
│   │   │   ├── start/route.ts
│   │   │   ├── analyze/route.ts
│   │   │   └── submit-email/route.ts
│   │   ├── result/[token]/route.ts
│   │   └── cron/
│   │       ├── getcourse-retry/route.ts
│   │       └── cleanup/route.ts
│   ├── layout.tsx
│   ├── globals.css
│   └── page.tsx                       # редирект на /morning-face
├── components/
│   ├── ui/                            # shadcn/ui
│   ├── scan/
│   │   ├── consent-form.tsx
│   │   ├── facts-carousel.tsx
│   │   ├── photo-uploader.tsx
│   │   ├── question-card.tsx
│   │   ├── zone-tags.tsx
│   │   ├── countdown-timer.tsx
│   │   ├── pricing-card.tsx
│   │   └── result-view.tsx
│   ├── landing/
│   │   ├── hero.tsx
│   │   ├── pain-block.tsx
│   │   ├── how-it-works.tsx
│   │   ├── trust-block.tsx
│   │   └── faq.tsx
│   └── shared/
│       ├── yandex-metrika.tsx
│       └── footer-disclaimer.tsx
├── lib/
│   ├── supabase/
│   │   ├── server.ts                  # service-role клиент
│   │   └── methodologist.ts           # с RLS (read-only)
│   ├── openrouter.ts
│   ├── getcourse.ts
│   ├── telegram.ts
│   ├── pricing.ts                     # константы цен
│   ├── scenarios.ts                   # 5 сценариев входа
│   ├── rate-limit.ts
│   ├── photo-compression.ts           # клиент
│   ├── validation.ts                  # zod-схемы
│   └── ai-result-cache.ts             # in-memory кэш сессий (cookie+memory)
├── prompts/
│   └── scan-agent.md                  # промпт из scan-agent-prompt.md
├── supabase/
│   └── migrations/
│       └── 20260513120000_init.sql
├── public/
│   └── ...
├── middleware.ts                       # rate limiting + UTM capture
├── next.config.ts
├── tsconfig.json
├── package.json
├── vercel.json                         # cron jobs
└── .env.example
```

### 0.8 Vercel cron-задачи (`vercel.json`)

```json
{
  "crons": [
    { "path": "/api/cron/getcourse-retry", "schedule": "*/5 * * * *" },
    { "path": "/api/cron/cleanup",         "schedule": "0 3 * * *" }
  ]
}
```

---

## БЛОК 1: User Stories

### US-001 — Заход с рекламы на лендинг

**Как** Марина 47 лет, которая увидела в Telegram объявление "лицо опухает по утрам",
**я хочу** за 5 секунд понять, помогут ли мне здесь и что от меня хотят,
**чтобы** решить — кликать кнопку или закрыть вкладку.

**Сценарий:**
1. Marina кликает по ссылке → попадает на `/morning-face?utm_source=tg&utm_campaign=morning_v1`.
2. Middleware фиксирует UTM-метки в cookie `edm_utm` (TTL = 30 дней).
3. Server-component рендерит лендинг (FCP ≤ 1.5 сек на 4G, LCP ≤ 2.5 сек).
4. Marina видит Hero-блок: заголовок, подзаголовок, кнопку CTA, дисклеймер о немедицинском характере.
5. Скроллит вниз — блок боли, блок "как работает", блок доверия, финальный CTA, FAQ.
6. Кликает CTA → редирект на `/scan?from=morning-face` с сохранением UTM.

**Критерии приёмки:**
- [ ] Каждый из 5 лендингов отдаёт SSR-страницу без JS-ошибок в консоли.
- [ ] UTM-метки сохраняются в cookie `edm_utm` (path=/, sameSite=lax, secure).
- [ ] Yandex.Metrika событие `landing_view` отправляется с параметром `scenario`.
- [ ] Кнопка CTA имеет атрибут `data-event="cta_click"` и шлёт событие в Метрику.
- [ ] Дисклеймер "Это не медицинская диагностика" виден без скролла на mobile (375×667).

---

### US-002 — Прохождение онбординга с согласиями

**Как** Марина, нажавшая на лендинге "Узнать причину",
**я хочу** быстро понять, что меня ждёт, и согласиться с двумя политиками одним движением,
**чтобы** перейти к делу без бюрократии.

**Сценарий:**
1. Marina на `/scan`. Видит: заголовок ("За 60 секунд узнайте..."), кругляшок-прогресс, два чекбокса согласий, кнопку "Начать".
2. Кругляшок-прогресс в центре — крутится по часовой, внутри сменяются 4 факта УПДН (раз в 3 сек): "На платформе занимаются более 500 000 человек", "Совместно с Первым МГМУ им. Сеченова", "Методика подтверждена научными исследованиями", "Европейская аккредитация".
3. Под прогрессом — подсказка: "Подготовьте телефон с хорошим освещением. Без очков и фильтров."
4. Чекбокс 1: "Я ознакомлен(а) с [Политикой обработки персональных данных]" — ссылка открывается в новой вкладке.
5. Чекбокс 2: "Я ознакомлен(а) с [Политикой использования сервиса анализа лица]. Фото не сохраняются и не используются для идентификации."
6. Кнопка "Начать" неактивна, пока оба чекбокса не отмечены.
7. Marina ставит галочки → нажимает "Начать".
8. Клиент шлёт `POST /api/scan/start` с `{ entry_scenario, utm_*, consent_pdn: true, consent_scan: true }`.
9. API создаёт строку в `scan_sessions`, возвращает `{ session_id, session_token }`.
10. Клиент сохраняет `session_id` и `session_token` в **sessionStorage** (имена: `edm_session_id`, `edm_session_token`).
11. Редирект на `/scan/photos`.

**Критерии приёмки:**
- [ ] Кнопка "Начать" имеет состояние disabled до отметки обоих чекбоксов.
- [ ] Попытка нажать disabled-кнопку показывает aria-hint "Подтвердите согласие с обеими политиками".
- [ ] Ссылки в чекбоксах ведут на `/legal/privacy` и `/legal/scan-policy` в новой вкладке (`target="_blank" rel="noopener"`).
- [ ] При попытке нажать "Начать" в обход (через DevTools) — API возвращает 400 с `{ error: { code: "CONSENT_REQUIRED" } }`.
- [ ] `session_token` — криптографически случайная строка 32 символа base64url, генерируется на сервере.
- [ ] Если sessionStorage недоступен (Safari Private Mode) — `edm_session_id` ставится в cookie с тем же ключом.

---

### US-003 — Загрузка 4 фотографий лица

**Как** Марина, прошедшая онбординг,
**я хочу** сделать 4 фото с подсказками о ракурсе,
**чтобы** AI получил всё нужное и я не запуталась.

**Сценарий:**
1. Marina на `/scan/photos`. Прогресс-бар: 2/6.
2. Заголовок: "Сделайте 4 фото лица — подскажу ракурсы".
3. Текст-подсказка: "При хорошем освещении, без теней, без фильтров и очков".
4. 4 слота-карточки (вертикально на mobile, сеткой 2×2 на desktop ≥768px) с иконкой 📷 и подписями:
   - Слот 1: "Лицо анфас (смотрите прямо в камеру)"
   - Слот 2: "Поворот ¾ слева"
   - Слот 3: "Поворот ¾ справа"
   - Слот 4: "Наклон головы вниз"
5. Тап по слоту → `<input type="file" accept="image/*" capture="user">` (на mobile открывает фронтальную камеру).
6. После съёмки — фото обрабатывается на клиенте через `browser-image-compression`: max-width 1024px, JPEG quality 0.85, max-size 500 KB.
7. Сжатый blob сохраняется в `useState` массиве `photos: Array<{ slot: 'frontal'|'three_quarter_left'|'three_quarter_right'|'tilted_down', blob: Blob, preview_url: string }>`.
8. Превью отображается в слоте; кнопка "Переснять" появляется в углу.
9. Когда все 4 слота заполнены — кнопка "Продолжить" становится активной.
10. Marina нажимает "Продолжить" → редирект на `/scan/questionnaire`.

**Критерии приёмки:**
- [ ] Принимаются только `image/jpeg`, `image/png`, `image/webp`, `image/heic`/`image/heif`.
- [ ] Файлы HEIC конвертируются в JPEG на клиенте (через `heic2any` или fallback "пожалуйста, перешлите как JPEG").
- [ ] Файл больше 15 MB до сжатия — показ toast "Файл слишком большой, попробуйте другой".
- [ ] После сжатия каждое фото ≤ 500 KB (это страховка для body API ≤ 2 MB).
- [ ] Каждый слот можно переснять до отправки.
- [ ] При отсутствии Camera API (десктоп без вебкамеры) — `<input>` без `capture` показывает выбор файла.
- [ ] Если пользователь зашёл с desktop без вебкамеры — на `/scan/photos` отображается баннер "Удобнее с телефона: отсканируйте QR" со ссылкой на `/scan/desktop-fallback`.
- [ ] Состояние `photos[]` сохраняется в sessionStorage **только метаданные** (slot + размер), сами blob — нет (приватность).

---

### US-004 — Прохождение опросника из 5 вопросов

**Как** Марина с готовыми фото,
**я хочу** быстро ответить на 5 коротких вопросов,
**чтобы** AI учёл мой контекст.

**Сценарий:**
1. Marina на `/scan/questionnaire`. Прогресс-бар: 3/6.
2. Карточка вопроса 1: "Когда отёки сильнее?" Варианты как радиокнопки-плитки: "Утром" / "Вечером" / "Постоянно" / "Циклично с месячным циклом".
3. Тап по варианту → подсветка + автопереход к следующему вопросу через 300 мс (анимация скролла).
4. Вопрос 2: "Сколько воды в день?" — "Меньше 1 л" / "1–1,5 л" / "1,5–2 л" / "Больше 2 л".
5. Вопрос 3: "Солёное/полуфабрикаты?" — "Редко" / "Иногда" / "Часто" / "Ежедневно".
6. Вопрос 4: "Качество сна?" — "Хорошо, 7+ часов" / "Прерывистый" / "Меньше 6 часов" / "Не могу заснуть".
7. Вопрос 5: "Гормональный фон?" — "Регулярный цикл" / "Нерегулярный" / "Перименопауза" / "Менопауза" / "Не отвечу".
8. После пятого ответа — кнопка "Получить разбор".
9. Можно вернуться к любому предыдущему вопросу (карточки выше остаются с выбранным вариантом и кнопкой "Изменить").
10. Marina нажимает "Получить разбор" → редирект на `/scan/analyzing`.

**Критерии приёмки:**
- [ ] На mobile вопросы рендерятся вертикально, по одному на экран.
- [ ] На desktop — 5 карточек на одной странице со скроллом.
- [ ] Все 5 ответов обязательны, кнопка "Получить разбор" disabled пока хоть один пустой.
- [ ] Ответы сохраняются в sessionStorage `edm_answers` как `{ swelling_time, water_intake, salt_processed_food, sleep_quality, hormonal_phase }`.
- [ ] Кнопка "Назад" в каждом вопросе возвращает на предыдущий ответ без потери данных.
- [ ] Yandex.Metrika событие `questionnaire_completed` шлётся при переходе на `/scan/analyzing`.

---

### US-005 — Получение AI-разбора (happy path)

**Как** Марина с заполненным опросником,
**я хочу** увидеть результат за разумное время и не тревожиться,
**чтобы** перейти к чтению разбора.

**Сценарий:**
1. Marina на `/scan/analyzing`. Экран: крупный кругляшок-прогресс + текст, сменяющийся каждые 4 сек:
   - "Анализирую зоны лица..."
   - "Сопоставляю с ответами опросника..."
   - "Подбираю стартовый план..."
   - "Готовлю персональный разбор..."
2. На фоне идёт `POST /api/scan/analyze`:
   - Body (multipart/form-data): 4 файла (`frontal`, `three_quarter_left`, `three_quarter_right`, `tilted_down`) + поле `session_token` + JSON-поле `answers`.
   - На сервере: проверка токена, проверка rate-limit, конвертация фото в base64, вызов OpenRouter (`anthropic/claude-sonnet-4`) с системным промптом из `prompts/scan-agent.md`.
   - OpenRouter возвращает JSON с разбором (см. формат в `scan-agent-prompt.md`).
   - Сервер парсит JSON, валидирует через zod-схему, сохраняет в `scan_sessions.ai_result` (jsonb).
   - Сервер генерирует `result_token` (24 base64url-символа), сохраняет в `scan_sessions.result_token`.
   - **Все фото удаляются из памяти** (`buffer.fill(0)`, переменные = null).
   - Сервер возвращает `{ success: true, result_token, ai_result: {...} }`.
3. Клиент получает ответ, сохраняет `result_token` в sessionStorage `edm_result_token`.
4. Редирект на `/scan/email`.

**Критерии приёмки:**
- [ ] Средняя длительность шага (P50) ≤ 20 сек, P95 ≤ 40 сек.
- [ ] Если AI-вызов длится > 60 сек — клиент показывает кнопку "Что-то долго... Попробовать снова" (но запрос не отменяет; на сервере timeout = 90 сек).
- [ ] Все 4 фото-буфера зануляются на сервере **до** отправки ответа клиенту (логировать факт "photos_purged: true").
- [ ] Если OpenRouter вернул невалидный JSON или ошибку — см. US-009.
- [ ] Если в `ai_result.red_flag === true` — клиент редиректит сразу на `/scan/email` (см. US-008), но на странице email-гейта дополнительно показывает дисклеймер "Важная информация о здоровье".

---

### US-006 — Email-гейт и получение результата

**Как** Марина, дождавшаяся разбора,
**я хочу** ввести имя и email и получить результат на экране и на почту,
**чтобы** не потерять его и подумать.

**Сценарий:**
1. Marina на `/scan/email`. Текст: "Готово! Введите имя и email, чтобы открыть разбор".
2. Карточка с 2 полями (имя, email) и кнопкой "Получить разбор".
3. Под кнопкой мелким шрифтом: "Мы продублируем разбор на вашу почту. Email не передаём третьим лицам, отписаться можно в один клик."
4. Marina вводит "Марина" и `marina@example.ru`.
5. Кнопка активна когда: имя 1–60 символов, email прошёл regex-проверку.
6. Тап "Получить разбор" → клиент шлёт `POST /api/scan/submit-email` с `{ session_token, result_token, name, email }`.
7. API проверяет токены, обновляет `scan_sessions` (`name`, `email`, `email_submitted_at = now()`, `special_price_expires_at = now() + 48h`).
8. API ставит задачу в очередь `getcourse_sync_queue` (отдельная запись, статус `pending`).
9. API шлёт Telegram-алерт в `TELEGRAM_CHAT_ID_LEADS`: "Новый лид: Марина (entry: morning-face, cause: lymph_stasis)".
10. API возвращает `{ success: true, result_token }`.
11. Клиент редиректит на `/scan/result`.

**Критерии приёмки:**
- [ ] Валидация имени: `/^[a-zA-Zа-яА-ЯёЁ\s\-]{1,60}$/` (буквы, пробел, дефис).
- [ ] Валидация email: regex `/^[^\s@]+@[^\s@]+\.[^\s@]+$/` + дополнительная проверка длины ≤ 254.
- [ ] Дубль email + session_token — идемпотентно (повторный POST возвращает тот же result_token, не плодит лидов в Геткурсе).
- [ ] Если в БД уже есть `email` с тем же значением за последние 30 дней — лид всё равно создаётся, но в Геткурс отправляется обновление, а не создание (тег `edm_repeat_lead`).
- [ ] Cookie `edm_special_price_expires_at` устанавливается с серверной datetime для отображения таймера на странице результата (защита от подмены).

---

### US-007 — Просмотр страницы результата с CTA

**Как** Марина с свежим разбором,
**я хочу** увидеть мой результат с пометками на лице, понятным текстом и понять, что купить,
**чтобы** принять решение здесь и сейчас (пока скидка).

**Сценарий:**
1. Marina на `/scan/result`. Страница тянет данные из `GET /api/result/[token]` (token из sessionStorage или из URL `/r/[token]`).
2. Структура страницы (порядок сверху вниз):
   - **Шапка**: "Марина, разбор готов" + аватарка-иконка.
   - **Блок 1: Фронтальное фото с зонами** — оригинал фото? Нет, фото мы НЕ храним. Вместо фото — **стилизованная SVG-иллюстрация лица** с цветовыми эллипсами в зонах, где `intensity !== "none"`. Под иллюстрацией — таблица из 8 зон с галочкой/прочерком и уровнем (Лёгкая / Умеренная / Выраженная).
   - **Блок 2: Кликабельные теги зон** — 8 чипов сверху вниз: лоб, брови, периорбитальная, носогубная, овал лица, губы, подбородок, шея. Чипы с непустыми зонами цветные, остальные серые. Тап → плавный скролл к разбору зоны.
   - **Блок 3: Главная вероятная причина** — крупный заголовок (название из 5 категорий), под ним `explanation_for_user` 2-3 предложения, конфиденс-индикатор: "Уверенность анализа: 78%".
   - **Блок 4: Сопутствующая причина** (если есть) — компактнее, в виде свёрнутой карточки.
   - **Блок 5: Персональный комментарий** — `personal_comment` 2-3 предложения, с обращением по имени.
   - **Блок 6: Стартовый план на 7 дней** — 5 шагов в виде нумерованных карточек (`action` + `why`).
   - **Блок 7: Чего избегать** — список с иконками крестиков.
   - **Блок 8: Таймер** — "Специальная цена действует ещё: 47:59:23". Тикает каждую секунду на клиенте. Источник истины — `special_price_expires_at` с сервера.
   - **Блок 9: CTA-карточки тарифов** — 2 карточки рядом (на mobile — стек):
     - Карточка Базовый (рекомендованная по AI, выделена бордером accent если `recommended_program.key === 'base'`): зачёркнутая цена 18 500 ₽, новая 9 400 ₽, бейдж "Скидка 49%". Кнопка "Выбрать →".
     - Карточка Продвинутый (аналогично, рекомендованная если `recommended_program.key === 'advanced'`): 57 500 ₽ → 14 900 ₽, "Скидка 74%". Кнопка "Выбрать →".
     - Обе кнопки → `UPSELL_LANDING_URL` в новой вкладке.
   - **Блок 10: Объяснение "почему эта программа"** — `recommended_program.why_this_program`.
   - **Блок 11: Дисклеймер** — `ai_result.disclaimer`.
3. Прокрутка вниз — sticky-CTA снизу на mobile с кнопкой "Перейти к программе" (тоже на `UPSELL_LANDING_URL`).
4. Marina кликает "Выбрать" → новая вкладка → Геткурс-лендинг. На странице результата отправляется Yandex.Metrika событие `cta_to_upsell` с параметром `tariff: base|advanced`.

**Критерии приёмки:**
- [ ] При истечении таймера (`now() > special_price_expires_at`) — таймер заменяется на "Специальная цена недавно завершилась", цена остаётся (мы не хотим терять Марину; маркетолог по факту, скорее всего, продлит цены, но визуально таймер уходит).
- [ ] Все CTA-кнопки имеют атрибут `data-tariff` и `data-event="cta_to_upsell"`.
- [ ] При `red_flag === true` — блоки 6, 7, 8, 9, 10 **скрыты**, вместо них — единый блок "К врачу" с текстом из `ai_result` (см. US-008).
- [ ] Страница рендерится за ≤ 2 сек после получения данных от API.
- [ ] При прямом заходе на `/r/[token]` (например, из email через сутки) — таймер уже может быть истёкшим; страница корректно это показывает.

---

### US-008 — Red flag: AI обнаружил признаки для очной консультации

**Как** Марина, на чьём фото есть признаки, требующие врача,
**я хочу** получить корректное предупреждение без паники,
**чтобы** обратиться к специалисту, а не закрыть страницу с обидой.

**Сценарий:**
1. AI вернул JSON с `red_flag: true` и `red_flag_reason` (текст из промпта).
2. Сервер сохраняет результат, ставит флаг `red_flag = true` в `scan_sessions`.
3. На `/scan/email` под кнопкой добавляется бейдж: "На фото есть признаки, которые требуют внимания врача. Подробности — после ввода email."
4. На `/scan/result` страница построена иначе:
   - Шапка с именем.
   - Карточка "Важная информация" с иконкой стетоскопа (lucide `stethoscope`).
   - Текст из промпта (deликатно сформулированное направление к врачу).
   - Список зон без рекомендаций.
   - **Нет** стартового плана.
   - **Нет** таймера и CTA на программу.
   - Внизу: "Когда врач даст 'зелёный свет' — программы УПДН по лимфе могут стать частью комплексной поддержки" + одна нейтральная кнопка-ссылка "Узнать о программах УПДН" (без скидки, на тот же `UPSELL_LANDING_URL`).
5. В Telegram-алерт `TELEGRAM_CHAT_ID_LEADS` уходит сообщение с тегом `🚨 RED_FLAG` и `red_flag_reason` для контроля методологом.
6. В Геткурс отправляется лид с тегами: `entry:{сценарий}`, `red_flag:true`, `cause:{causeKey или 'none'}`. Welcome-цепочка для red flag — отдельная (настраивается на стороне Геткурса методологом).

**Критерии приёмки:**
- [ ] При `red_flag === true` структура страницы результата отличается, как описано.
- [ ] Telegram-алерт с тегом `🚨 RED_FLAG` всегда уходит дополнительно к стандартному.
- [ ] В Геткурсе тег `red_flag:true` всегда прокидывается.
- [ ] Тон страницы — поддерживающий, без алармизма.

---

### US-009 — Ошибка AI-провайдера (graceful fallback)

**Как** Марина, попавшая в момент сбоя OpenRouter,
**я хочу** не потерять время и понять, что делать,
**чтобы** вернуться позже или попробовать снова.

**Сценарий:**
1. На `/scan/analyzing` запрос `POST /api/scan/analyze` упал с ошибкой (timeout 90 сек / 5xx от OpenRouter / невалидный JSON в ответе).
2. Сервер логирует в `ai_errors` (session_id, error_type, error_message, raw_response), фото зануляются.
3. Telegram-алерт `TELEGRAM_CHAT_ID_ERRORS`: "❌ AI-error: TIMEOUT, session abc123, scenario morning-face".
4. API возвращает `400` с `{ error: { code: "AI_TEMPORARY_FAILURE", message: "Анализ временно недоступен. Попробуйте через 1-2 минуты." } }`.
5. Клиент на `/scan/analyzing` ловит ошибку, показывает блок:
   - Иконка предупреждения.
   - Текст ошибки.
   - Кнопка "Попробовать снова" — повторяет POST `/api/scan/analyze` с теми же фото (из памяти клиента) и токеном.
   - Ссылка "Связаться с поддержкой" — `mailto:support@updn.pro` с темой "Edemaskan: ошибка анализа, session {id}".
6. До 3 retry. После 3-го отказа кнопка retry скрывается, остаётся только mailto-ссылка.

**Критерии приёмки:**
- [ ] Каждая попытка retry создаёт **новую запись** в `ai_errors`, но НЕ создаёт новую `scan_session` (используется тот же session_id).
- [ ] Photos на клиенте не выкидываются после первой неудачи — хранятся в `useState`, пока пользователь не закроет вкладку или не выйдет с `/scan/analyzing`.
- [ ] Yandex.Metrika событие `ai_error` с параметром `attempt: 1|2|3`.
- [ ] Если за час набирается ≥ 5 ошибок одного типа — Telegram-алерт повышается до `🔴 CRITICAL`.

---

### US-010 — Desktop fallback (QR-код)

**Как** Марина, открывшая лендинг с ноутбука,
**я хочу** легко перейти на телефон, не теряя сценарий входа,
**чтобы** воспользоваться камерой.

**Сценарий:**
1. Marina на десктопе (viewport ≥ 1024px), кликает CTA на лендинге.
2. На `/scan` есть детектор: если `navigator.userAgent` не mobile **и** `navigator.mediaDevices.getUserMedia` недоступен → показ модалки с предложением.
3. Модалка: заголовок "Удобнее с телефона", QR-код в центре (data: `https://edemaskan.lid.nutritionist4day.ru/scan?from=morning-face&desktop=1` через библиотеку `qrcode.react`), подпись "Наведите камеру телефона", две кнопки внизу: "Продолжить на компьютере (загрузить файлы)" / "Я на телефоне".
4. Если "Продолжить на компьютере" — флоу обычный, но `/scan/photos` использует `<input type="file">` без `capture` (выбор файла, не камера). 4 раздельных input-а.
5. Если "Я на телефоне" — модалка закрывается, флоу продолжается как обычно.
6. QR ведёт на тот же `/scan` с сохранённым UTM и сценарием.

**Критерии приёмки:**
- [ ] QR-код корректно работает, открывается в браузере телефона.
- [ ] UTM-метки и сценарий сохраняются в URL QR-кода.
- [ ] Десктоп-флоу с загрузкой файлов проходит до результата без ошибок.

---

### US-011 — Возврат к результату по ссылке из письма

**Как** Марина, получившая разбор на email и открывшая ссылку через сутки,
**я хочу** снова увидеть свой разбор,
**чтобы** перечитать и, возможно, купить программу.

**Сценарий:**
1. Marina кликает ссылку из письма: `https://edemaskan.lid.nutritionist4day.ru/r/abc24chars`.
2. Server-component тянет `GET /api/result/abc24chars`.
3. API проверяет токен в `scan_sessions.result_token`, возвращает `ai_result` и `special_price_expires_at`.
4. Страница рендерится как `/scan/result`, но:
   - Если таймер уже истёк — показывается "Специальная цена недавно завершилась", цены остаются.
   - Yandex.Metrika событие `result_revisit` с параметром `hours_since_creation`.

**Критерии приёмки:**
- [ ] Токен из 24+ символов, не угадывается перебором (>10^14 вариантов).
- [ ] Невалидный токен → 404-страница с ссылкой "Начать заново".
- [ ] Доступ к результату не требует авторизации, токен — секрет.

---

## БЛОК 2: Data Model

### 2.1 Диаграмма связей

```
scan_sessions  1──N  ai_errors           (session_id)
scan_sessions  1──N  getcourse_sync_queue (session_id)
[нет таблицы users — флоу анонимный]

rate_limit_buckets  — изолированная служебная таблица
methodologist_users — Supabase Auth (для read-only доступа)
```

### 2.2 Расширения и общие функции

```sql
-- Включаем расширения
CREATE EXTENSION IF NOT EXISTS "pgcrypto";  -- для gen_random_uuid()

-- Функция автообновления updated_at
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Функция для генерации url-safe токена
CREATE OR REPLACE FUNCTION public.generate_url_token(length INTEGER DEFAULT 24)
RETURNS TEXT AS $$
DECLARE
  chars TEXT := 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';
  result TEXT := '';
  i INTEGER := 0;
BEGIN
  FOR i IN 1..length LOOP
    result := result || substr(chars, 1 + floor(random() * length(chars))::int, 1);
  END LOOP;
  RETURN result;
END;
$$ LANGUAGE plpgsql;
```

### 2.3 Таблица `scan_sessions`

Главная таблица: одна строка = одна сессия Марины. Создаётся при нажатии "Начать", обновляется на каждом шаге.

```sql
CREATE TABLE public.scan_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Токены доступа
  session_token TEXT NOT NULL UNIQUE,           -- для последующих API-вызовов в той же сессии
  result_token  TEXT UNIQUE,                    -- генерируется при успешном AI-анализе, для /r/[token]

  -- Сценарий входа и атрибуция
  entry_scenario TEXT NOT NULL CHECK (
    entry_scenario IN ('morning-face','eye-bags','face-oval','legs','rings')
  ),
  utm_source     TEXT,
  utm_medium     TEXT,
  utm_campaign   TEXT,
  utm_content    TEXT,
  utm_term       TEXT,
  referer        TEXT,

  -- Согласия (закон)
  consent_pdn       BOOLEAN NOT NULL DEFAULT FALSE,
  consent_scan      BOOLEAN NOT NULL DEFAULT FALSE,
  consent_timestamp TIMESTAMPTZ,

  -- Ответы опросника
  questionnaire JSONB,
  -- структура:
  -- {
  --   "swelling_time": "morning"|"evening"|"constant"|"cyclic",
  --   "water_intake": "under_1l"|"1_to_1_5l"|"1_5_to_2l"|"over_2l",
  --   "salt_processed_food": "rarely"|"sometimes"|"often"|"daily",
  --   "sleep_quality": "good_7plus"|"interrupted"|"under_6h"|"cant_sleep",
  --   "hormonal_phase": "regular"|"irregular"|"perimenopause"|"menopause"|"skip"
  -- }

  -- Результат AI
  ai_result          JSONB,                     -- полный JSON из scan-agent-prompt
  ai_model           TEXT,                      -- e.g. "anthropic/claude-sonnet-4"
  ai_call_started_at TIMESTAMPTZ,
  ai_call_duration_ms INTEGER,
  ai_input_tokens    INTEGER,
  ai_output_tokens   INTEGER,
  ai_cost_usd_microcents INTEGER,               -- 1 USD = 100_000_000 microcents (для точности)
  primary_cause_key  TEXT,                      -- денормализация для аналитики
  red_flag           BOOLEAN NOT NULL DEFAULT FALSE,
  red_flag_reason    TEXT,

  -- Email-гейт
  name               TEXT,
  email              TEXT,
  email_submitted_at TIMESTAMPTZ,

  -- Таймер 48 ч
  special_price_expires_at TIMESTAMPTZ,

  -- Геткурс
  getcourse_status TEXT NOT NULL DEFAULT 'not_required' CHECK (
    getcourse_status IN ('not_required','pending','synced','failed')
  ),
  getcourse_lead_id   TEXT,
  getcourse_synced_at TIMESTAMPTZ,

  -- Технические
  ip_address INET,
  user_agent TEXT,

  -- Аудит
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Денормализация для аналитики (computed на стороне приложения):
  funnel_stage TEXT NOT NULL DEFAULT 'started' CHECK (
    funnel_stage IN ('started','photos_uploaded','questionnaire_done','ai_analyzed','email_submitted','red_flagged')
  )
);

-- Индексы
CREATE INDEX idx_scan_sessions_created_at         ON public.scan_sessions (created_at DESC);
CREATE INDEX idx_scan_sessions_entry_scenario     ON public.scan_sessions (entry_scenario);
CREATE INDEX idx_scan_sessions_funnel_stage       ON public.scan_sessions (funnel_stage);
CREATE INDEX idx_scan_sessions_primary_cause_key  ON public.scan_sessions (primary_cause_key)
  WHERE primary_cause_key IS NOT NULL;
CREATE INDEX idx_scan_sessions_email              ON public.scan_sessions (lower(email))
  WHERE email IS NOT NULL;
CREATE INDEX idx_scan_sessions_getcourse_status   ON public.scan_sessions (getcourse_status)
  WHERE getcourse_status IN ('pending','failed');
CREATE INDEX idx_scan_sessions_red_flag           ON public.scan_sessions (red_flag) WHERE red_flag = TRUE;

-- Триггер updated_at
CREATE TRIGGER trg_scan_sessions_updated_at
  BEFORE UPDATE ON public.scan_sessions
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- RLS: всё через service role
ALTER TABLE public.scan_sessions ENABLE ROW LEVEL SECURITY;

-- Methodologist (read-only через Auth): создаём роль и политику
CREATE POLICY scan_sessions_methodologist_select
  ON public.scan_sessions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.methodologist_users mu
      WHERE mu.user_id = auth.uid()
    )
  );

-- Anonymous (anon-роль): доступ запрещён полностью (никаких политик не создаём)
-- Все мутации идут через service_role в API routes — RLS не применяется к service_role по умолчанию.
```

### 2.4 Таблица `ai_errors`

Лог ошибок AI-вызовов для отладки и алертов.

```sql
CREATE TABLE public.ai_errors (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id    UUID REFERENCES public.scan_sessions(id) ON DELETE CASCADE,
  attempt       INTEGER NOT NULL DEFAULT 1,
  error_code    TEXT NOT NULL CHECK (error_code IN (
    'OPENROUTER_TIMEOUT','OPENROUTER_5XX','OPENROUTER_4XX',
    'OPENROUTER_INVALID_JSON','ZOD_VALIDATION_FAILED','UNKNOWN'
  )),
  error_message TEXT,
  raw_response  TEXT,                 -- первые 4096 символов ответа OpenRouter (для отладки)
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_ai_errors_session_id  ON public.ai_errors (session_id);
CREATE INDEX idx_ai_errors_created_at  ON public.ai_errors (created_at DESC);
CREATE INDEX idx_ai_errors_error_code  ON public.ai_errors (error_code);

ALTER TABLE public.ai_errors ENABLE ROW LEVEL SECURITY;

CREATE POLICY ai_errors_methodologist_select
  ON public.ai_errors FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.methodologist_users mu
      WHERE mu.user_id = auth.uid()
    )
  );
```

### 2.5 Таблица `getcourse_sync_queue`

Очередь для отправки лидов в Геткурс с retry-логикой.

```sql
CREATE TABLE public.getcourse_sync_queue (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id    UUID NOT NULL REFERENCES public.scan_sessions(id) ON DELETE CASCADE,

  status TEXT NOT NULL DEFAULT 'pending' CHECK (
    status IN ('pending','in_progress','synced','failed_temporary','failed_permanent')
  ),

  attempts        INTEGER NOT NULL DEFAULT 0,
  max_attempts    INTEGER NOT NULL DEFAULT 5,
  next_retry_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Payload, который собираем для Геткурса (snapshot на момент создания)
  payload         JSONB NOT NULL,

  last_error      TEXT,
  last_attempted_at TIMESTAMPTZ,
  synced_at       TIMESTAMPTZ,
  getcourse_lead_id TEXT,

  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_getcourse_queue_status_next_retry
  ON public.getcourse_sync_queue (status, next_retry_at)
  WHERE status IN ('pending','failed_temporary');

CREATE INDEX idx_getcourse_queue_session_id
  ON public.getcourse_sync_queue (session_id);

CREATE TRIGGER trg_getcourse_queue_updated_at
  BEFORE UPDATE ON public.getcourse_sync_queue
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.getcourse_sync_queue ENABLE ROW LEVEL SECURITY;

CREATE POLICY getcourse_queue_methodologist_select
  ON public.getcourse_sync_queue FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.methodologist_users mu
      WHERE mu.user_id = auth.uid()
    )
  );
```

### 2.6 Таблица `rate_limit_buckets`

Простой Postgres rate-limiter (для MVP без Redis/Upstash).

```sql
CREATE TABLE public.rate_limit_buckets (
  bucket_key    TEXT PRIMARY KEY,                 -- e.g. "ip:1.2.3.4:scan_analyze"
  request_count INTEGER NOT NULL DEFAULT 0,
  window_start  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_rate_limit_window_start
  ON public.rate_limit_buckets (window_start);

CREATE TRIGGER trg_rate_limit_updated_at
  BEFORE UPDATE ON public.rate_limit_buckets
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.rate_limit_buckets ENABLE ROW LEVEL SECURITY;
-- никаких политик: только service_role
```

### 2.7 Таблица `methodologist_users`

Список методологов УПДН, у которых есть read-only доступ через Supabase Auth.

```sql
CREATE TABLE public.methodologist_users (
  user_id    UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name  TEXT NOT NULL,
  added_by   TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.methodologist_users ENABLE ROW LEVEL SECURITY;

CREATE POLICY methodologist_users_self_select
  ON public.methodologist_users FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());
-- Добавление новых методологов — вручную через Supabase Studio service_role.
```

### 2.8 Полная миграция (файл `supabase/migrations/20260513120000_init.sql`)

Все CREATE TABLE / INDEX / TRIGGER / POLICY из 2.2–2.7 в одном файле, в указанном порядке. Готов к выполнению в Supabase SQL Editor единым прогоном.

---

## БЛОК 3: API Endpoints

Базовые правила:
- Все API routes — Next.js App Router `app/api/.../route.ts`.
- Ошибки в формате: `{ "error": { "code": "ERROR_CODE", "message": "Человекочитаемое описание" } }`.
- HTTP-коды: 200 (успех), 400 (валидация), 401 (rate limit / неверный токен), 404 (не найдено), 500 (внутренняя ошибка), 503 (внешний сервис недоступен).
- Все Zod-схемы лежат в `lib/validation.ts`.

### 3.1 `POST /api/scan/start`

Создаёт новую сессию.

**Zod-схема (`StartScanRequest`):**
```ts
import { z } from "zod";

export const StartScanRequest = z.object({
  entry_scenario: z.enum(["morning-face","eye-bags","face-oval","legs","rings"]),
  consent_pdn:    z.literal(true),
  consent_scan:   z.literal(true),
  utm: z.object({
    utm_source:   z.string().max(255).optional().nullable(),
    utm_medium:   z.string().max(255).optional().nullable(),
    utm_campaign: z.string().max(255).optional().nullable(),
    utm_content:  z.string().max(255).optional().nullable(),
    utm_term:     z.string().max(255).optional().nullable(),
  }).optional(),
  referer: z.string().max(2048).optional().nullable(),
});
```

**Request body (пример):**
```json
{
  "entry_scenario": "morning-face",
  "consent_pdn": true,
  "consent_scan": true,
  "utm": {
    "utm_source": "telegram",
    "utm_medium": "cpc",
    "utm_campaign": "morning_face_v1",
    "utm_content": "ad_blue_woman",
    "utm_term": null
  },
  "referer": "https://t.me/some_channel"
}
```

**Response 200:**
```json
{
  "success": true,
  "session_id": "8e1b2f3a-4c5d-4e6f-8a9b-0c1d2e3f4a5b",
  "session_token": "yK3jZ8mN2pQ7rL5wX1vH9aB4dF6gT0sE"
}
```

**Response 400 (валидация):**
```json
{ "error": { "code": "VALIDATION_FAILED", "message": "Поле entry_scenario обязательно" } }
```

**Response 400 (нет согласий):**
```json
{ "error": { "code": "CONSENT_REQUIRED", "message": "Необходимо подтвердить обе политики" } }
```

**Response 429 (rate limit):**
```json
{ "error": { "code": "RATE_LIMIT_EXCEEDED", "message": "Слишком много запросов. Попробуйте через 5 минут." } }
```

**Логика на сервере:**
1. Чтение IP из заголовка `x-forwarded-for` (первый IP) или `request.ip`.
2. Rate-limit check: `ip:<ip>:scan_start` — не более 10 за час.
3. Парсинг и валидация Zod.
4. Генерация `session_token` (crypto.randomBytes(24).toString('base64url')).
5. INSERT в `scan_sessions` с `funnel_stage='started'`, `consent_timestamp=now()`.
6. Возврат `{ session_id, session_token }`.

### 3.2 `POST /api/scan/analyze`

Принимает 4 фото + опросник, вызывает AI, возвращает результат.

**Запрос:** `multipart/form-data`
- `session_token` (string)
- `answers` (string — JSON, см. ниже)
- `photo_frontal` (file, image/*, ≤ 800 KB)
- `photo_three_quarter_left` (file)
- `photo_three_quarter_right` (file)
- `photo_tilted_down` (file)

**Zod-схема для `answers`:**
```ts
export const QuestionnaireSchema = z.object({
  swelling_time:       z.enum(["morning","evening","constant","cyclic"]),
  water_intake:        z.enum(["under_1l","1_to_1_5l","1_5_to_2l","over_2l"]),
  salt_processed_food: z.enum(["rarely","sometimes","often","daily"]),
  sleep_quality:       z.enum(["good_7plus","interrupted","under_6h","cant_sleep"]),
  hormonal_phase:      z.enum(["regular","irregular","perimenopause","menopause","skip"]),
});
```

**Zod-схема ответа AI (для валидации того, что вернул OpenRouter):**
```ts
const ZoneAnalysis = z.object({
  visible:   z.boolean(),
  intensity: z.enum(["none","mild","moderate","pronounced"]).nullable(),
  note:      z.string().nullable(),
});

const ProgramRef = z.object({
  key:               z.enum(["base","advanced"]),
  title:             z.string(),
  price_original:    z.number().int(),
  price_discounted:  z.number().int(),
  discount_percent:  z.number().int(),
  url:               z.string().url(),
  why_this_program:  z.string().optional(),
});

export const AiResultSchema = z.object({
  red_flag:        z.boolean(),
  red_flag_reason: z.string().nullable(),
  user_name:       z.string(),
  entry_scenario:  z.enum(["morning-face","eye-bags","face-oval","legs","rings"]),
  zone_analysis: z.object({
    forehead:    ZoneAnalysis,
    brows:       ZoneAnalysis,
    periorbital: ZoneAnalysis,
    nasolabial:  ZoneAnalysis,
    face_oval:   ZoneAnalysis,
    lips_purse:  ZoneAnalysis,
    chin:        ZoneAnalysis,
    neck:        ZoneAnalysis,
  }),
  primary_cause: z.object({
    key: z.enum(["lymph_stasis","parasitic_intoxication","iron_deficiency","water_salt_imbalance","hormonal_imbalance"]),
    title: z.string(),
    explanation_for_user: z.string(),
    confidence: z.number().min(0).max(1),
  }).nullable(),
  secondary_cause: z.object({
    key: z.enum(["lymph_stasis","parasitic_intoxication","iron_deficiency","water_salt_imbalance","hormonal_imbalance"]),
    title: z.string(),
    explanation_for_user: z.string(),
  }).nullable(),
  personal_comment: z.string().nullable(),
  seven_day_plan: z.array(z.object({
    step:   z.number().int(),
    action: z.string(),
    why:    z.string(),
  })).nullable(),
  avoid: z.array(z.string()).nullable(),
  recommended_program: ProgramRef.nullable(),
  alternative_program: ProgramRef.nullable(),
  disclaimer: z.string(),
});
```

**Response 200 (пример с happy path):**
```json
{
  "success": true,
  "result_token": "abc24CharsXyzMnp7QzRf2D",
  "ai_result": {
    "red_flag": false,
    "red_flag_reason": null,
    "user_name": "Марина",
    "entry_scenario": "morning-face",
    "zone_analysis": {
      "forehead":    { "visible": true,  "intensity": "mild",     "note": "Лёгкая тяжесть в межбровье" },
      "brows":       { "visible": true,  "intensity": "none",     "note": null },
      "periorbital": { "visible": true,  "intensity": "moderate", "note": "Мешки под нижним веком" },
      "nasolabial":  { "visible": true,  "intensity": "mild",     "note": "Носогубные складки углублены" },
      "face_oval":   { "visible": true,  "intensity": "moderate", "note": "Контур нижней челюсти размыт" },
      "lips_purse":  { "visible": true,  "intensity": "none",     "note": null },
      "chin":        { "visible": true,  "intensity": "mild",     "note": "Лёгкая припухлость" },
      "neck":        { "visible": false, "intensity": null,       "note": null }
    },
    "primary_cause": {
      "key": "lymph_stasis",
      "title": "Застой лимфатической системы",
      "explanation_for_user": "Ваше лицо утром реагирует на ночной застой лимфы — это типичная картина для женщин 40+ с малоподвижной работой. Лимфа не успевает уносить жидкость, и она оседает в периорбитальной зоне и по нижней челюсти.",
      "confidence": 0.78
    },
    "secondary_cause": {
      "key": "water_salt_imbalance",
      "title": "Нарушение водно-солевого обмена",
      "explanation_for_user": "По ответам видно: воды меньше нормы, обработанной еды достаточно — это усиливает основной механизм."
    },
    "personal_comment": "Марина, картина у вас целостная: лицо реагирует на то, что происходит системно. Это лимфостаз с подложкой из водно-солевого дисбаланса — и его можно мягко развернуть за 7 дней.",
    "seven_day_plan": [
      { "step": 1, "action": "Утром натощак — 200 мл тёплой воды. В течение дня — 30 мл воды на кг веса (при 65 кг это ~1 950 мл).", "why": "Включает лимфоток с утра, обеспечивает нужный объём." },
      { "step": 2, "action": "Утренняя гимнастика 5 минут: 10 наклонов и поворотов головы, 20 мелких прыжков на носках, 10 циклов диафрагмального дыхания лёжа.", "why": "Запускает лимфатический отток механически." },
      { "step": 3, "action": "Не сидеть подряд больше 60 минут. Вставать, ходить 3-5 минут, можно потанцевать.", "why": "Лимфа в ногах двигается только при работе мышц." },
      { "step": 4, "action": "Спать на спине или с приподнятым изголовьем. Не лицом в подушку.", "why": "Уменьшает утренний застой жидкости в лице." },
      { "step": 5, "action": "Самомассаж лица 2 минуты утром: лёгкие движения от центра к вискам и от подбородка к ключицам.", "why": "Стимулирует поверхностный лимфоток без агрессии." }
    ],
    "avoid": [
      "Мочегонные средства без назначения врача",
      "Жёсткие диеты и голодание",
      "Резкий агрессивный дренажный массаж без подготовки"
    ],
    "recommended_program": {
      "key": "base",
      "title": "Программа по лимфатической системе (Базовый)",
      "price_original": 18500,
      "price_discounted": 9400,
      "discount_percent": 49,
      "url": "https://lid.nutritionist4day.ru/lymphatic-system_avto",
      "why_this_program": "Базовая программа подробно разбирает именно тот механизм, что у вас в основе — лимфатический застой. Внутри — пошаговый план питания и активности по методологии Синицыной."
    },
    "alternative_program": {
      "key": "advanced",
      "title": "Программа (Продвинутый): Лимфа + Антипаразитарка + Железодефицит",
      "price_original": 57500,
      "price_discounted": 14900,
      "discount_percent": 74,
      "url": "https://lid.nutritionist4day.ru/lymphatic-system_avto"
    },
    "disclaimer": "Это не медицинская диагностика. Edemaskan анализирует визуальные признаки и предлагает образовательный нутрициологический план. При выраженных или продолжительных отёках рекомендуем очную консультацию врача."
  }
}
```

**Response 400 (валидация):**
```json
{ "error": { "code": "VALIDATION_FAILED", "message": "Не все фото загружены" } }
```

**Response 401 (плохой токен):**
```json
{ "error": { "code": "INVALID_SESSION_TOKEN", "message": "Сессия не найдена или истекла" } }
```

**Response 429 (rate limit):**
```json
{ "error": { "code": "RATE_LIMIT_EXCEEDED", "message": "Слишком много попыток. Попробуйте через час." } }
```

**Response 503 (AI недоступен):**
```json
{ "error": { "code": "AI_TEMPORARY_FAILURE", "message": "Анализ временно недоступен. Попробуйте через 1-2 минуты." } }
```

**Логика на сервере (псевдокод):**
```
1. parse multipart, extract photos as Buffers and answers as JSON
2. validate session_token → lookup scan_sessions (id, photo_count_limit check)
3. rate-limit: ip:<ip>:scan_analyze ≤ 5/hour, session:<id>:scan_analyze ≤ 4/lifetime
4. validate answers via QuestionnaireSchema
5. validate each photo: mime ∈ allowed, size ≤ 800KB
6. update scan_sessions: funnel_stage='questionnaire_done', questionnaire=answers, ai_call_started_at=now()
7. convert photos to base64 (data URLs)
8. build OpenRouter request (см. БЛОК 5 интеграции)
9. fetch with timeout 90s, retry once on 5xx (см. retry-стратегию в БЛОК 5)
10. parse response, extract content[0].text (JSON-строка), JSON.parse
11. validate via AiResultSchema
12. generate result_token (24 base64url chars), ensure unique
13. update scan_sessions: ai_result, ai_model, ai_call_duration_ms, primary_cause_key,
     red_flag, red_flag_reason, result_token, funnel_stage='ai_analyzed' (или 'red_flagged' если red_flag)
14. **purge photos from memory** (buffer.fill(0), reset variables, force GC если возможно)
15. return { success: true, result_token, ai_result }

При ошибках:
- timeout/5xx → insert into ai_errors, telegram alert, return 503
- invalid JSON → insert into ai_errors с raw_response, telegram alert, return 503
- zod-validation fail → insert into ai_errors, return 503
```

### 3.3 `POST /api/scan/submit-email`

Принимает имя и email, ставит задачу в Геткурс-очередь.

**Zod-схема:**
```ts
export const SubmitEmailRequest = z.object({
  session_token: z.string().length(32),
  result_token:  z.string().min(24).max(48),
  name:  z.string().regex(/^[a-zA-Zа-яА-ЯёЁ\s\-]{1,60}$/, "Имя содержит недопустимые символы"),
  email: z.string().email().max(254),
});
```

**Request body:**
```json
{
  "session_token": "yK3jZ8mN2pQ7rL5wX1vH9aB4dF6gT0sE",
  "result_token":  "abc24CharsXyzMnp7QzRf2D",
  "name":  "Марина",
  "email": "marina@example.ru"
}
```

**Response 200:**
```json
{
  "success": true,
  "result_token": "abc24CharsXyzMnp7QzRf2D",
  "special_price_expires_at": "2026-05-15T14:32:00.000Z"
}
```

**Response 400:**
```json
{ "error": { "code": "VALIDATION_FAILED", "message": "Email невалидный" } }
```

**Response 404:**
```json
{ "error": { "code": "SESSION_NOT_FOUND", "message": "Сессия не найдена" } }
```

**Логика на сервере:**
```
1. validate body via SubmitEmailRequest
2. lookup scan_sessions by (session_token, result_token, ai_result IS NOT NULL)
3. if already has email_submitted_at — return 200 with existing data (идемпотентность)
4. update scan_sessions: name, email, email_submitted_at=now(),
     special_price_expires_at = now() + interval '48 hours',
     funnel_stage='email_submitted'
5. build getcourse payload (см. БЛОК 5)
6. INSERT into getcourse_sync_queue (session_id, payload, status='pending', next_retry_at=now())
7. fire-and-forget: send telegram alert "новый лид"
8. return { success: true, result_token, special_price_expires_at }
```

### 3.4 `GET /api/result/[token]`

Получает результат по постоянной ссылке.

**Параметры пути:** `token` — `result_token` из БД.

**Response 200:**
```json
{
  "success": true,
  "ai_result": { ... },
  "name": "Марина",
  "special_price_expires_at": "2026-05-15T14:32:00.000Z",
  "created_at": "2026-05-13T14:32:00.000Z"
}
```

**Response 404:**
```json
{ "error": { "code": "RESULT_NOT_FOUND", "message": "Результат не найден" } }
```

**Логика:**
```
1. validate token format (24-48 chars, base64url)
2. rate-limit ip:<ip>:result_view ≤ 60/hour
3. SELECT from scan_sessions WHERE result_token=token AND ai_result IS NOT NULL
4. if not found → 404
5. return data
```

### 3.5 `GET /api/cron/getcourse-retry`

Vercel Cron, запускается каждые 5 минут. Защищён `CRON_SECRET`.

**Заголовок:** `Authorization: Bearer <CRON_SECRET>`.

**Response 200:**
```json
{
  "processed": 12,
  "synced": 10,
  "failed_temporary": 2,
  "failed_permanent": 0
}
```

**Response 401:**
```json
{ "error": { "code": "UNAUTHORIZED", "message": "Missing or invalid CRON_SECRET" } }
```

**Логика:**
```
1. verify Authorization header == "Bearer " + CRON_SECRET
2. SELECT * FROM getcourse_sync_queue
   WHERE status IN ('pending','failed_temporary')
     AND next_retry_at <= NOW()
   ORDER BY next_retry_at ASC LIMIT 20
3. for each row:
   a. set status='in_progress', attempts=attempts+1, last_attempted_at=NOW()
   b. try to POST to Getcourse API (см. БЛОК 5)
   c. on success: status='synced', synced_at=NOW(), getcourse_lead_id=..., update scan_sessions.getcourse_status='synced'
   d. on temporary fail (5xx, network):
        if attempts < max_attempts:
          status='failed_temporary',
          next_retry_at = NOW() + (attempts^2 * interval '1 minute')  -- backoff: 1, 4, 9, 16, 25 min
          last_error = ...
        else:
          status='failed_permanent', update scan_sessions.getcourse_status='failed',
          telegram alert
   e. on permanent fail (4xx, не auth): status='failed_permanent', telegram alert
4. return counters
```

### 3.6 `GET /api/cron/cleanup`

Vercel Cron, ежедневно в 03:00 UTC. Защищён `CRON_SECRET`.

**Логика:**
```
1. verify auth
2. DELETE FROM scan_sessions
   WHERE email_submitted_at IS NULL
     AND created_at < NOW() - INTERVAL '7 days'
   -- удаляем неполные сессии старше 7 дней (нет email = не лид, GDPR-friendly)
3. DELETE FROM rate_limit_buckets WHERE window_start < NOW() - INTERVAL '24 hours'
4. DELETE FROM ai_errors WHERE created_at < NOW() - INTERVAL '90 days'
5. return { deleted_sessions: N, deleted_buckets: N, deleted_errors: N }
```

---

## БЛОК 4: UI/UX

### 4.1 Дизайн-система (Tailwind v4 + shadcn/ui)

**Палитра (в `app/globals.css` через `@theme`):**
```css
@theme {
  --color-background: oklch(0.99 0 0);          /* почти белый */
  --color-foreground: oklch(0.20 0.02 270);     /* тёмно-сине-серый */
  --color-muted:      oklch(0.96 0.01 270);
  --color-muted-foreground: oklch(0.45 0.02 270);
  --color-primary:    oklch(0.55 0.15 200);     /* спокойный teal */
  --color-primary-foreground: oklch(0.99 0 0);
  --color-accent:     oklch(0.70 0.13 60);      /* мягкий персиковый */
  --color-accent-foreground: oklch(0.20 0.02 270);
  --color-destructive: oklch(0.58 0.20 25);
  --color-success:    oklch(0.65 0.15 145);
  --color-border:     oklch(0.92 0.01 270);
  --color-ring:       oklch(0.55 0.15 200);

  --radius: 0.75rem;
  --font-display: "Inter", system-ui, sans-serif;
  --font-body:    "Inter", system-ui, sans-serif;
}
```

**Принципы:**
- Скруглённые карточки (`rounded-2xl`).
- Мягкие тени (`shadow-sm`, `shadow-lg` для модалок).
- Большие тапаемые зоны (≥ 48×48 px на mobile).
- Контраст текст/фон ≥ 4.5:1 (WCAG AA).

### 4.2 Лендинги (5 шт., унифицированная структура)

**URL:** `/morning-face`, `/eye-bags`, `/face-oval`, `/legs`, `/rings`.

**Layout:** `app/(landings)/layout.tsx` — обычный header (логотип УПДН + текст "Edemaskan") и footer с дисклеймером.

**Структура страницы (порядок):**
1. **Hero**: заголовок (h1, text-4xl на mobile, text-6xl на desktop), подзаголовок (text-lg), CTA-кнопка (size="lg"), мелкий дисклеймер.
2. **Pain-block**: текст из `LANDING_TEXTS.md` (для конкретного сценария).
3. **How-it-works**: 4 шага в виде нумерованных карточек (Card из shadcn/ui).
4. **Trust-block**: 4 буллета об УПДН с галочкой.
5. **Final CTA**: повтор кнопки + текст "Бесплатно. Без регистрации. 60 секунд."
6. **FAQ**: Accordion из shadcn/ui с 4 вопросами.
7. **Footer**: дисклеймер о немедицинском характере + ссылки на политики.

**Компоненты shadcn/ui:** `Button`, `Card`, `Accordion`, `Separator`.

**Иконки (lucide):** `Camera`, `ClipboardList`, `Sparkles`, `Mail`, `CheckCircle2`, `ShieldCheck`.

**Тексты:** из `LANDING_TEXTS.md` (на лендинге `/morning-face` — тексты сценария 1 и т. д.).

**Состояния:**
- **Loading**: SSR, поэтому состояний загрузки нет. На переходе на `/scan` — стандартный Next.js loading.tsx со скелетоном.
- **Empty**: нет (статическая страница).
- **Error**: error.tsx с текстом "Что-то пошло не так. Попробуйте обновить страницу." и кнопкой reset.

**Responsive:**
- Mobile (< 768px): hero — текст 4xl, кнопка full-width, all blocks вертикально.
- Tablet (768–1024px): hero — 5xl, кнопка inline.
- Desktop (≥ 1024px): hero — 6xl, max-width 1200px, 2 колонки в "Как работает".

### 4.3 Экран `/scan` (онбординг)

**Layout:** `app/scan/layout.tsx` — sticky header с прогресс-баром (1/6), кнопка "Назад" (на шагах 2+).

**Компоненты на странице:**
- Заголовок "За 60 секунд узнайте причину своего отёка".
- `FactsCarousel` — кругляшок-прогресс в центре (SVG circle с анимацией), внутри текст. Меняется каждые 3 сек через `setInterval`. 4 факта (массив в `lib/scenarios.ts`).
- Подсказка про освещение.
- `ConsentForm` — 2 чекбокса с ссылками на политики.
- `Button` "Начать" (disabled, пока не оба true).

**Иконки:** `Lightbulb` (для подсказки), `ShieldCheck` (для согласия).

**Состояния:**
- **Loading**: при сабмите — кнопка показывает `<Loader2 className="animate-spin" />` и disabled.
- **Empty**: нет.
- **Error**: toast (sonner) "Не удалось начать. Попробуйте обновить страницу."

**Responsive:** Один колоночный layout, max-width 480px.

### 4.4 Экран `/scan/photos`

**Layout:** прогресс 2/6.

**Компоненты:**
- Заголовок "Сделайте 4 фото лица".
- Подсказка про освещение и фильтры.
- `PhotoUploader` × 4 — каждый слот: иконка `Camera`, подпись, при пустом — placeholder с пунктирным бордером, при заполненном — превью + кнопка "Переснять".
- На desktop с детектом отсутствия камеры — баннер с CTA на `/scan/desktop-fallback`.
- Кнопка "Продолжить" (disabled пока не все 4 загружены).

**shadcn/ui:** `Card`, `Button`, `Alert`.

**Иконки:** `Camera`, `RefreshCw`, `Smartphone` (для баннера desktop).

**Состояния:**
- **Loading (сжатие фото)**: на слоте показывается `<Loader2 className="animate-spin" />`.
- **Empty**: пунктирный бордер + иконка.
- **Error**: inline-сообщение под слотом красным: "Файл слишком большой" / "Неподдерживаемый формат".

**Responsive:**
- Mobile: 1 колонка, слоты вертикально.
- Desktop: сетка 2×2.

### 4.5 Экран `/scan/questionnaire`

**Layout:** прогресс 3/6.

**Компоненты:**
- На mobile: `QuestionCard` рендерится по одному, после выбора — auto-scroll вниз на следующий через `scrollIntoView({ behavior: 'smooth', block: 'start' })`.
- На desktop: все 5 карточек на одном экране, без скролла.
- Каждая карточка: вопрос (h2), 4-5 кнопок-плиток в одну/две колонки.
- Кнопка "Получить разбор" — фиксирована внизу экрана (sticky) на mobile.

**shadcn/ui:** `RadioGroup`, `Card`, `Button`, `Label`.

**Иконки:** для вариантов опционально (например, `Sun`/`Moon` для swelling_time).

**Состояния:**
- **Loading**: нет (пока не сабмит).
- **Empty**: невыбранные вопросы — нейтральный стиль.
- **Error**: нет (вопросы локальные, без сети).

### 4.6 Экран `/scan/analyzing`

**Layout:** прогресс 4/6.

**Компоненты:**
- Большой кругляшок-прогресс (SVG, бесконечная анимация).
- Сменяющийся текст (каждые 4 сек):
  - "Анализирую зоны лица..."
  - "Сопоставляю с ответами опросника..."
  - "Подбираю стартовый план..."
  - "Готовлю персональный разбор..."
- Под прогрессом — мелкое "Обычно занимает 20-30 секунд".
- Если ≥ 60 сек прошло — появляется кнопка "Что-то долго... Попробовать снова".

**Состояния:**
- **Loading**: основное состояние.
- **Error (AI-сбой)**: страница заменяется на блок с иконкой `AlertTriangle`, текстом ошибки и кнопкой "Попробовать снова" (до 3 раз).
- **Empty**: нет.

### 4.7 Экран `/scan/email`

**Layout:** прогресс 5/6.

**Компоненты:**
- Заголовок "Готово! Введите имя и email, чтобы открыть разбор".
- При `red_flag === true` — дополнительный alert-баннер "На фото есть признаки, которые требуют внимания врача. Подробности — после email."
- Форма: 2 поля (`Input` shadcn/ui), `Button` "Получить разбор".
- Дисклеймер про "не передаём третьим лицам".

**shadcn/ui:** `Input`, `Label`, `Button`, `Alert` (для red_flag).

**Состояния:**
- **Loading**: на сабмите кнопка spinner + disabled.
- **Empty**: пустые поля с placeholder.
- **Error**: inline под полем красным (например, "Email невалидный") + toast при серверной ошибке.

### 4.8 Экран `/scan/result` и `/r/[token]`

**Layout:** прогресс 6/6 (или без него на `/r/[token]`).

**Компоненты:**
- `ResultView` — главный, рендерит все 11 блоков из US-007 на основе `ai_result` и `special_price_expires_at`.
- `ZoneTags` — кликабельные чипы (8 шт.), цветные/серые в зависимости от `zone_analysis[zone].visible && intensity !== 'none'`.
- `CountdownTimer` — отображает `48:00:00`, тикает каждую секунду. На сервере (RSC) расчёт `remaining_seconds`, на клиенте — `useEffect` с `setInterval`.
- `PricingCard` × 2 — карточки тарифов (Базовый, Продвинутый), один помечен бейджем "Рекомендовано вам".
- Sticky-CTA на mobile.
- Footer-дисклеймер.

**Иконки:** `Sparkles` (главная причина), `ListChecks` (план), `XCircle` (избегать), `Clock` (таймер), `Stethoscope` (red flag), `ArrowRight` (CTA).

**При `red_flag === true`** — `ResultView` рендерит вариант без плана/таймера/PricingCard, с одной карточкой "Важная информация" и нейтральной ссылкой на программы.

**Состояния:**
- **Loading**: при заходе на `/r/[token]` — Suspense + skeleton.
- **Empty (404)**: страница "Результат не найден" + кнопка "Начать заново" → `/morning-face`.
- **Error**: error.tsx с reset.

**Responsive:**
- Mobile: вертикальный стек, sticky-CTA снизу.
- Desktop: max-width 800px, без sticky.

### 4.9 Экран `/scan/desktop-fallback`

**Компоненты:**
- Заголовок "Удобнее с телефона".
- QR-код (через `qrcode.react`) с URL, содержащим текущий сценарий и UTM.
- Подпись "Наведите камеру телефона на QR-код".
- Кнопка "Продолжить на компьютере" → возврат на `/scan` с флагом, чтобы пропустить детект.
- Кнопка "Я уже на телефоне" (на случай если детект сработал ложно).

### 4.10 Юридические страницы

**`/legal/privacy`** — статический MDX, содержание готовит юрист (см. `LEGAL_TZ.md` Задача 2).

**`/legal/scan-policy`** — статический MDX, содержание из `LEGAL_TZ.md` Задача 1. До получения от юриста — placeholder с пометкой "Документ в процессе подготовки".

### 4.11 Глобальные элементы

**Header (на всех страницах кроме `/scan/analyzing`):**
- Слева: текстовый логотип "Edemaskan" + сабтекст "от УПДН".
- Справа: ссылка "Помощь" → `mailto:support@updn.pro`.

**Footer (на всех страницах):**
- Дисклеймер: "Edemaskan — образовательный сервис УПДН. Не является медицинским. Не ставит диагнозов. Не заменяет консультацию врача."
- Ссылки: "Политика конфиденциальности" / "Политика анализа лица" / "Контакты".

**Toast-уведомления:** через `sonner` (рекомендуемая интеграция shadcn/ui).

---

## БЛОК 5: Business Logic

### 5.1 Валидация форм

| Поле | Тип | Правила | Сообщение при ошибке |
|------|-----|--------|---------------------|
| `entry_scenario` | enum | один из 5 значений | "Неизвестный сценарий" |
| `consent_pdn`, `consent_scan` | boolean | оба должны быть `true` | "Подтвердите согласие" |
| `swelling_time` | enum | один из 4 | "Выберите вариант" |
| `water_intake` | enum | один из 4 | "Выберите вариант" |
| `salt_processed_food` | enum | один из 4 | "Выберите вариант" |
| `sleep_quality` | enum | один из 4 | "Выберите вариант" |
| `hormonal_phase` | enum | один из 5 (включая "skip") | "Выберите вариант" |
| фото | File | mime в {jpeg,png,webp,heic,heif}, size ≤ 800 KB после сжатия | "Файл слишком большой" / "Формат не поддерживается" |
| `name` | string | regex `/^[a-zA-Zа-яА-ЯёЁ\s\-]{1,60}$/` | "Имя содержит недопустимые символы" |
| `email` | string | regex + ≤ 254 chars | "Email невалидный" |

### 5.2 Бизнес-правила

1. **Лимит сессий с одного IP**: не более 10 успешных AI-анализов в сутки. Превышение → 429 на `/api/scan/analyze`.
2. **Лимит retry AI-анализа**: 3 попытки на одну сессию (счётчик `attempts` в `ai_errors`). После 3-го — кнопка retry скрывается.
3. **Идемпотентность submit-email**: повторный POST с теми же `session_token` + `result_token` возвращает существующие данные, не создаёт дублей в Геткурсе.
4. **TTL `session_token`**: 2 часа от `created_at`. По истечении — `INVALID_SESSION_TOKEN`.
5. **TTL `result_token`**: бессрочно (для постоянной ссылки в email). Удаляется только при cleanup для сессий без email > 7 дней.
6. **Таймер 48 ч**: устанавливается на `email_submitted_at + 48h`, не продляется. По истечении на UI — таймер скрывается, цены остаются.
7. **AI-вызов timeout**: 90 сек. После — return 503 с retry-кнопкой.
8. **Только пропорция фото**: фото с aspect ratio ≤ 0.5 или ≥ 2.0 (слишком узкие/широкие) — отклоняем с сообщением "Фото должно быть приближено к квадрату или вертикальному".

### 5.3 Аутентификация

**Для пользователей-Марин:** нет. Флоу анонимный, доступ к результату — через секретный `result_token`.

**Для методологов УПДН:**
1. Методолог получает приглашение через Supabase Studio (Auth → Invite User).
2. Создаёт пароль через email-ссылку.
3. После регистрации админ (вручную через SQL) добавляет `user_id` в `methodologist_users`.
4. Методолог логинится в Supabase Studio и видит таблицы read-only по RLS.

### 5.4 Интеграция с OpenRouter

**Endpoint:** `POST https://openrouter.ai/api/v1/chat/completions`

**Headers:**
```
Authorization: Bearer ${OPENROUTER_API_KEY}
HTTP-Referer: ${OPENROUTER_REFERER_URL}
X-Title: ${OPENROUTER_APP_NAME}
Content-Type: application/json
```

**Body (формат Anthropic-совместимых сообщений через OpenRouter):**
```json
{
  "model": "anthropic/claude-sonnet-4",
  "max_tokens": 4096,
  "temperature": 0.4,
  "messages": [
    {
      "role": "system",
      "content": [
        {
          "type": "text",
          "text": "<содержимое prompts/scan-agent.md>",
          "cache_control": { "type": "ephemeral" }
        }
      ]
    },
    {
      "role": "user",
      "content": [
        { "type": "text", "text": "Сценарий входа: morning-face\nИмя пользователя: Марина\nОтветы опросника: {...}\n\nФотографии:" },
        { "type": "image_url", "image_url": { "url": "data:image/jpeg;base64,..." } },
        { "type": "image_url", "image_url": { "url": "data:image/jpeg;base64,..." } },
        { "type": "image_url", "image_url": { "url": "data:image/jpeg;base64,..." } },
        { "type": "image_url", "image_url": { "url": "data:image/jpeg;base64,..." } },
        { "type": "text", "text": "Верни только JSON по описанному формату." }
      ]
    }
  ],
  "response_format": { "type": "json_object" }
}
```

**Prompt Caching:** включается через `cache_control: { type: "ephemeral" }` на системном сообщении. Кеш OpenRouter держит до 5 минут — для нашей нагрузки этого мало, но всё равно даёт экономию ~30% на массовых запусках.

**Что делаем с ответом:**
- `response.choices[0].message.content` — строка JSON.
- `JSON.parse` → валидация через `AiResultSchema`.
- Метрики: `response.usage.prompt_tokens`, `completion_tokens`, OpenRouter возвращает также cost в `response.usage.total_cost` (USD как float). Конвертируем в microcents: `Math.round(total_cost * 100_000_000)`.

**Retry-стратегия:**
- 1 retry при HTTP 5xx или timeout, с задержкой 2 сек.
- Не retry при 4xx, кроме 429 (там retry с задержкой 10 сек, тоже один раз).
- После всех retry — return 503 пользователю, лог в `ai_errors`, telegram-алерт.

**Fallback при недоступности:** нет. Сервис не работает без OpenRouter — пользователь видит graceful error с предложением попробовать через минуту.

### 5.5 Интеграция с Геткурс

**Документация:** Геткурс предоставляет endpoint `https://${GETCOURSE_SCHOOL_DOMAIN}.getcourse.ru/pl/api/users` для импорта пользователей.

**Endpoint:** `POST https://updn.getcourse.ru/pl/api/users`

**Body (form-encoded):**
- `action=add`
- `key=${GETCOURSE_API_KEY}`
- `params={base64(JSON)}`

**Структура `params` (JSON до base64):**
```json
{
  "user": {
    "email": "marina@example.ru",
    "first_name": "Марина",
    "addfields": {
      "edm_entry_scenario": "morning-face",
      "edm_primary_cause": "lymph_stasis",
      "edm_secondary_cause": "water_salt_imbalance",
      "edm_recommended_program": "base",
      "edm_red_flag": "false",
      "edm_result_url": "https://edemaskan.lid.nutritionist4day.ru/r/abc24CharsXyzMnp7QzRf2D",
      "edm_special_price_expires_at": "2026-05-15T14:32:00Z",
      "edm_utm_source": "telegram",
      "edm_utm_campaign": "morning_face_v1"
    }
  },
  "system": {
    "refresh_if_exists": 1
  },
  "session": {
    "user_groups": ["edemaskan_leads", "scenario_morning-face", "cause_lymph_stasis"]
  }
}
```

**Ответ Геткурса (пример):**
```
HTTP 200
success=1&user_id=12345678
```

**Парсинг:** разбираем `application/x-www-form-urlencoded` или `text/plain`, извлекаем `success` и `user_id`.

**Retry-стратегия:**
- Поскольку синк происходит в фоне через `getcourse_sync_queue`, retry-логика в cron-обработчике (см. 3.5).
- Backoff: `attempts^2` минут (1, 4, 9, 16, 25).
- После 5 попыток — `failed_permanent`, ручной разбор через Telegram-алерт.

**Fallback:** если Геткурс не отвечает несколько часов — лид всё равно в нашей БД, методолог может выгрузить вручную и загрузить в Геткурс CSV-импортом.

### 5.6 Интеграция с Telegram Bot

**Endpoint:** `POST https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`

**Body:**
```json
{
  "chat_id": "${TELEGRAM_CHAT_ID_LEADS}",
  "text": "✅ Новый лид Edemaskan\nИмя: Марина\nEmail: m***a@example.ru\nСценарий: morning-face\nПричина: lymph_stasis\nПрограмма: base\nRed flag: нет\n\n🔗 https://edemaskan.lid.nutritionist4day.ru/r/abc...",
  "parse_mode": "Markdown",
  "disable_web_page_preview": true
}
```

**Маскировка email:** показываем первую и последнюю букву, остальное звёздочки.

**Каналы:**
- `TELEGRAM_CHAT_ID_LEADS` — каждый новый лид + red-flag-алерты.
- `TELEGRAM_CHAT_ID_ERRORS` — AI-ошибки, Геткурс failed_permanent, критические алерты.

**Rate-limit Telegram:** 30 сообщений/сек на бот, у нас далеко до этого.

**Fallback:** при недоступности Telegram — лог в консоль Vercel, никакого retry (не критично).

### 5.7 Интеграция с Яндекс.Метрикой

**Подключение:** `components/shared/yandex-metrika.tsx` с использованием `next/script`.

```tsx
<Script
  id="ym"
  strategy="afterInteractive"
  dangerouslySetInnerHTML={{
    __html: `
      (function(m,e,t,r,i,k,a){...})(window, document, "script", "https://mc.yandex.ru/metrika/tag.js", "ym");
      ym(${process.env.NEXT_PUBLIC_YANDEX_METRIKA_ID}, "init", { clickmap:true, trackLinks:true, accurateTrackBounce:true, webvisor:true });
    `,
  }}
/>
```

**События:**
| Событие | Где | Параметры |
|---------|-----|----------|
| `landing_view` | mount лендинга | `scenario` |
| `cta_click` | клик "Узнать причину" | `scenario` |
| `scan_started` | сабмит на `/scan` | `scenario` |
| `photos_uploaded` | переход на questionnaire | — |
| `questionnaire_completed` | переход на analyzing | — |
| `ai_completed` | успех `/api/scan/analyze` | `cause_key`, `red_flag` |
| `ai_error` | ошибка AI | `attempt` |
| `email_submitted` | успех submit-email | `cause_key` |
| `result_revisit` | заход на `/r/[token]` | `hours_since_creation` |
| `cta_to_upsell` | клик на программу | `tariff: base|advanced` |

### 5.8 Rate Limiting (Postgres-based)

**Функция `lib/rate-limit.ts` (псевдокод):**
```ts
export async function checkRateLimit({
  key,           // e.g. "ip:1.2.3.4:scan_analyze"
  limit,         // e.g. 5
  windowSec,     // e.g. 3600
}: { key: string; limit: number; windowSec: number }): Promise<{ allowed: boolean; remaining: number; retryAfter: number }>

// внутри:
// 1. SELECT * FROM rate_limit_buckets WHERE bucket_key = $1
// 2. if not found OR window_start + windowSec < now() → INSERT/UPDATE with count=1, window_start=now()
// 3. else if count >= limit → return { allowed: false, retryAfter: ... }
// 4. else → UPDATE count = count+1, return { allowed: true, remaining: limit - count }
```

**Лимиты:**
| Endpoint | Ключ | Лимит | Окно |
|----------|------|-------|------|
| `/api/scan/start` | `ip:<ip>:scan_start` | 10 | 1 час |
| `/api/scan/analyze` | `ip:<ip>:scan_analyze` | 5 | 1 час |
| `/api/scan/analyze` | `session:<id>:scan_analyze` | 4 | lifetime |
| `/api/scan/submit-email` | `ip:<ip>:scan_submit` | 10 | 1 час |
| `/api/result/[token]` | `ip:<ip>:result_view` | 60 | 1 час |

### 5.9 CORS и безопасность

- **CORS:** все API routes отдают `Access-Control-Allow-Origin: ${NEXT_PUBLIC_SITE_URL}` (наш домен). Preflight `OPTIONS` — 204.
- **CSP** (через middleware, заголовок `Content-Security-Policy`): `default-src 'self'; img-src 'self' data: blob:; script-src 'self' https://mc.yandex.ru 'unsafe-inline'; connect-src 'self' https://mc.yandex.ru https://${NEXT_PUBLIC_SUPABASE_URL hostname}; frame-ancestors 'none';`
- **Input sanitization:** все строки — через Zod. Никаких raw SQL — только parameterized queries через `@supabase/supabase-js`.
- **SQL injection:** невозможен — Supabase JS SDK всё параметризует.
- **XSS:** Next.js по умолчанию экранирует. MDX-документы политик — статичны, без user input.
- **Подмена `session_token` / `result_token`:** оба — криптостойкие случайные строки, угадывание невозможно.
- **Подмена цены в URL:** цены хранятся в `lib/pricing.ts` (константы), не передаются с фронта.

### 5.10 Cookie

| Cookie | Назначение | TTL | Атрибуты |
|--------|-----------|-----|----------|
| `edm_utm` | UTM-параметры | 30 дней | `path=/; sameSite=lax; secure` |
| `edm_session_token` | если sessionStorage недоступен | 2 часа | `path=/; sameSite=lax; secure; httpOnly` (если ставится сервером) |
| `edm_result_token` | для авто-возврата на свой результат | 30 дней | `path=/; sameSite=lax; secure` |

---

## БЛОК 6: Edge Cases

### Категория 1: Сеть

**EC-01. Потеря соединения во время загрузки фото**
- *Триггер:* пользователь жмёт "Продолжить" на `/scan/photos`, но в момент перехода интернет пропал.
- *Поведение:* sessionStorage уже содержит slot-метаданные. Photos лежат в client-state. При повторном подключении кнопка "Продолжить" остаётся активной, переход на `/scan/questionnaire` сработает.

**EC-02. Timeout AI-вызова (60+ сек)**
- *Триггер:* OpenRouter перегружен.
- *Поведение:* через 60 сек на `/scan/analyzing` появляется кнопка "Что-то долго...". Запрос на сервере имеет timeout 90 сек — после возврата `AI_TEMPORARY_FAILURE` и UI переходит в error-режим с retry.

**EC-03. Медленный мобильный интернет (3G)**
- *Триггер:* пользователь на 3G в области с плохим покрытием.
- *Поведение:* сжатые фото (4×500 KB = 2 MB) загружаются 30-60 сек. Прогресс-бар upload показывается через `fetch` + `ReadableStream` (или просто индетерминированный спиннер для MVP). Если upload занимает > 120 сек — клиент сам отменяет (`AbortController`) и показывает retry.

**EC-04. Геткурс API недоступен**
- *Триггер:* DNS-сбой / 503 от Геткурса в момент `submit-email`.
- *Поведение:* лид всё равно сохранён в БД. `getcourse_sync_queue.status = 'pending'`. Cron retry через 5 минут. Пользователь видит свой результат на `/scan/result` сразу — Геткурс не блокирует UI.

### Категория 2: Данные

**EC-05. Пустой результат от AI (модель вернула невалидный JSON)**
- *Триггер:* OpenRouter вернул текст без JSON-структуры.
- *Поведение:* zod-валидация падает → запись в `ai_errors` с raw_response → telegram-алерт → пользователь получает 503 с retry-кнопкой.

**EC-06. AI вернул valid JSON, но `primary_cause === null` и `red_flag === false`**
- *Триггер:* AI не смог определить причину (пограничный кейс).
- *Поведение:* zod-схема допускает `primary_cause: null`. UI на `/scan/result` показывает блок: "Мы не смогли уверенно определить главную причину. Рекомендуем пройти консультацию у нутрициолога УПДН для персонального разбора." + ссылка на upsell, без таймера.

**EC-07. Повторный сабмит email с тем же `session_token`**
- *Триггер:* пользователь нажал кнопку дважды.
- *Поведение:* идемпотентность — второй запрос возвращает `{ success: true, result_token, ... }` без создания дубля в Геткурсе.

**EC-08. Пользователь пытается зайти на `/scan/result` без session_token в storage**
- *Триггер:* открыл вкладку с `/scan/result` напрямую (закладка).
- *Поведение:* клиент проверяет sessionStorage → пусто → редирект на `/` с toast "Откройте свой разбор по ссылке из письма".

**EC-09. Невалидный `result_token` в `/r/[token]` (404)**
- *Триггер:* пользователь скопировал ссылку с обрезанным концом.
- *Поведение:* `GET /api/result/[token]` возвращает 404 → server-component рендерит страницу "Результат не найден" + кнопку "Начать заново" → `/morning-face`.

**EC-10. Конкурентное редактирование `scan_sessions` (race condition)**
- *Триггер:* пользователь нажал retry на AI-анализ дважды быстро.
- *Поведение:* при `UPDATE scan_sessions ... WHERE id=... AND ai_result IS NULL` второй запрос увидит, что `ai_result` уже заполнен, и вернёт существующий `result_token`. Используем `UPDATE ... RETURNING` с условием.

### Категория 3: Безопасность

**EC-11. Попытка bypass согласий через DevTools**
- *Триггер:* пользователь меняет `disabled` атрибут кнопки и шлёт `consent_pdn: false`.
- *Поведение:* серверная zod-схема требует `z.literal(true)` → 400 `CONSENT_REQUIRED`.

**EC-12. SQL injection в любом поле**
- *Триггер:* пользователь вводит `'; DROP TABLE scan_sessions; --` в имя.
- *Поведение:* поле сначала валидируется regex (только буквы, пробел, дефис) → отклоняется. Если бы прошло — Supabase JS SDK parametrize-ит, инъекция невозможна.

**EC-13. Перебор `result_token` (brute-force)**
- *Триггер:* злоумышленник перебирает токены.
- *Поведение:* токен 24 base64url-символа = 64^24 ≈ 10^43 вариантов. Rate-limit на `/api/result/[token]` 60/час с одного IP — за разумное время не подберётся.

**EC-14. XSS через ввод имени**
- *Триггер:* пользователь вводит `<script>alert(1)</script>` в имя.
- *Поведение:* regex отклоняет. Даже если прошло бы — React всегда экранирует строковые значения в JSX.

**EC-15. Подмена `entry_scenario` на любую строку**
- *Триггер:* пользователь шлёт `entry_scenario: "evil-payload"`.
- *Поведение:* zod-enum + CHECK constraint в БД отклоняют. 400.

### Категория 4: Лимиты

**EC-16. Файл фото 50 MB (большой raw из камеры)**
- *Триггер:* iPhone снимает 4K фото 12 MB.
- *Поведение:* клиентский `browser-image-compression` сжимает до ≤ 500 KB перед отправкой. Если файл изначально > 15 MB — toast "Файл слишком большой, попробуйте другой".

**EC-17. Имя длиной 1000 символов**
- *Триггер:* пользователь вставил большой текст в поле имени.
- *Поведение:* regex `{1,60}` отклоняет → "Имя содержит недопустимые символы" (на клиенте дополнительно `maxLength={60}` на input).

**EC-18. 10K сессий в день (load spike после рекламной кампании)**
- *Триггер:* успешный запуск трафика.
- *Поведение:* Vercel Hobby даёт 100k invocations/мес — упрёмся за неделю при 10k/день. **Решение:** перейти на Vercel Pro ($20/мес) до запуска массового трафика. AI-стоимость: 10k × ~$0.05 = $500/день — отдельный pre-flight чек бюджета OpenRouter.

**EC-19. 100 одновременных AI-вызовов (peak)**
- *Триггер:* реклама запустилась в пиковое время.
- *Поведение:* Vercel auto-scales serverless. OpenRouter rate-limit на API key — нужно заранее проверить лимиты (по умолчанию ~50 RPM, можно повысить через support). При 429 от OpenRouter — наш retry с backoff, иначе пользователь видит ошибку.

### Категория 5: Юридические / контентные

**EC-20. Беременная пользовательница (red flag из опросника)**
- *Триггер:* в опроснике добавляем не "беременность", но AI может определить по фото или контексту.
- *Поведение:* промпт `scan-agent.md` обрабатывает red flag из изображения. Для опросника — добавляем дополнительный текст в самом начале `/scan`: "Сервис не предназначен для беременных и людей с диагностированными заболеваниями почек/сердца/щитовидной железы. Если это вы — пожалуйста, не используйте этот сервис, обратитесь к врачу." (NB: дополнить в финальной версии онбординга после ревью юриста).

**EC-21. Пользователь требует удаления данных (GDPR-like запрос)**
- *Триггер:* email на `support@updn.pro` с запросом удаления.
- *Поведение:* методолог через Supabase SQL: `DELETE FROM scan_sessions WHERE email = '...' OR id = '...'`. CASCADE удалит связанные `ai_errors`, `getcourse_sync_queue`. Дополнительно — запрос на удаление в Геткурс (вручную через UI).

**EC-22. AI выдал содержательно вредную рекомендацию (например, "пейте только дистиллированную воду")**
- *Триггер:* галлюцинация модели.
- *Поведение:* промпт строго ограничивает 5 категорий причин + фиксированные стартовые планы из методологии. Дополнительно: методолог УПДН проверяет 50 случайных результатов в первые 2 недели (read-only через Supabase Studio). При обнаружении проблем — корректируем `prompts/scan-agent.md`.

### Категория 6: Время

**EC-23. Часовые пояса**
- *Триггер:* пользователь в Новосибирске, сервер в Frankfurt.
- *Поведение:* все timestamp в БД — `TIMESTAMPTZ` (UTC). Таймер на клиенте считается от `special_price_expires_at` (UTC) → разница с `Date.now()` — корректно во всех TZ.

**EC-24. Переход на летнее время в момент 48-ч таймера**
- *Триггер:* пользователь получил результат за час до перевода времени.
- *Поведение:* поскольку всё в UTC и считаем в секундах от epoch — DST не влияет.

**EC-25. Сессия истекла (>2 часа) пока пользователь не сабмитил email**
- *Триггер:* пользователь оставил вкладку открытой на ночь.
- *Поведение:* при попытке `submit-email` API проверит `created_at + 2h > NOW()`. Если истекло — 401 `SESSION_EXPIRED`. UI редиректит на `/morning-face` с toast "Сессия истекла, начните заново".

**EC-26. AI-вызов завершился, но пользователь закрыл вкладку до перехода на email**
- *Триггер:* пользователь увидел спиннер на `/scan/analyzing`, ушёл.
- *Поведение:* `result_token` уже в БД. Без `email` — лид не уйдёт в Геткурс. Через 7 дней cron удалит сессию.

### Категория 7: Браузерная совместимость

**EC-27. Safari Private Mode — sessionStorage недоступен**
- *Триггер:* пользователь iPhone Private.
- *Поведение:* код пытается записать в sessionStorage в try/catch. При неудаче — fallback на cookie (для `session_token`, `result_token`, флагов прогресса).

**EC-28. Старый Android Chrome без Camera API**
- *Триггер:* устройство 2018 года.
- *Поведение:* `<input type="file" capture="user">` отдаёт стандартное "выбрать файл / открыть камеру" — работает на всех Android от 7+.

---

## Приложение A: Готовые сниппеты

### A.1 `lib/openrouter.ts` (скелет)

```ts
import { AiResultSchema, type AiResult } from "@/lib/validation";

export async function callOpenRouter({
  systemPrompt,
  userText,
  photoDataUrls,
  timeoutMs = 90_000,
}: {
  systemPrompt: string;
  userText: string;
  photoDataUrls: string[];   // 4 шт, "data:image/jpeg;base64,..."
  timeoutMs?: number;
}): Promise<{ result: AiResult; usage: { prompt_tokens: number; completion_tokens: number; cost_usd: number } }> {
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      signal: controller.signal,
      headers: {
        "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "HTTP-Referer":  process.env.OPENROUTER_REFERER_URL!,
        "X-Title":       process.env.OPENROUTER_APP_NAME!,
        "Content-Type":  "application/json",
      },
      body: JSON.stringify({
        model: process.env.OPENROUTER_MODEL,
        max_tokens: 4096,
        temperature: 0.4,
        messages: [
          {
            role: "system",
            content: [{ type: "text", text: systemPrompt, cache_control: { type: "ephemeral" } }],
          },
          {
            role: "user",
            content: [
              { type: "text", text: userText },
              ...photoDataUrls.map((url) => ({ type: "image_url" as const, image_url: { url } })),
              { type: "text", text: "Верни только валидный JSON по описанному формату. Без markdown-обёрток." },
            ],
          },
        ],
        response_format: { type: "json_object" },
      }),
    });

    if (!res.ok) throw new Error(`OPENROUTER_${res.status >= 500 ? "5XX" : "4XX"}:${res.status}`);

    const data = await res.json();
    const raw = data.choices?.[0]?.message?.content;
    if (typeof raw !== "string") throw new Error("OPENROUTER_INVALID_JSON:no-content");

    let parsed: unknown;
    try { parsed = JSON.parse(raw); } catch { throw new Error("OPENROUTER_INVALID_JSON:parse-failed"); }

    const result = AiResultSchema.parse(parsed);

    return {
      result,
      usage: {
        prompt_tokens:     data.usage?.prompt_tokens     ?? 0,
        completion_tokens: data.usage?.completion_tokens ?? 0,
        cost_usd:          data.usage?.total_cost        ?? 0,
      },
    };
  } finally {
    clearTimeout(t);
  }
}
```

### A.2 `lib/getcourse.ts` (скелет)

```ts
export async function sendToGetcourse(payload: object): Promise<{ ok: true; lead_id: string } | { ok: false; retriable: boolean; error: string }> {
  const url = `https://${process.env.GETCOURSE_SCHOOL_DOMAIN}.getcourse.ru/pl/api/users`;
  const params = Buffer.from(JSON.stringify(payload)).toString("base64");
  const body = new URLSearchParams({
    action: "add",
    key:    process.env.GETCOURSE_API_KEY!,
    params,
  });

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: body.toString(),
    });
    const text = await res.text();
    const parsed = new URLSearchParams(text);
    const success = parsed.get("success");
    if (success === "1") {
      return { ok: true, lead_id: parsed.get("user_id") ?? "unknown" };
    }
    const errorMsg = parsed.get("error_message") ?? text.slice(0, 500);
    const retriable = res.status >= 500;
    return { ok: false, retriable, error: errorMsg };
  } catch (e) {
    return { ok: false, retriable: true, error: String(e) };
  }
}
```

### A.3 `lib/telegram.ts` (скелет)

```ts
export async function sendTelegram(channel: "leads" | "errors", text: string): Promise<void> {
  const chatId = channel === "leads"
    ? process.env.TELEGRAM_CHAT_ID_LEADS
    : process.env.TELEGRAM_CHAT_ID_ERRORS;
  try {
    await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text, parse_mode: "Markdown", disable_web_page_preview: true }),
    });
  } catch {
    // fire-and-forget
  }
}
```

### A.4 `lib/pricing.ts`

```ts
export const PROGRAMS = {
  base: {
    key: "base" as const,
    title: "Программа по лимфатической системе (Базовый)",
    price_original_kopecks:   1_850_000,
    price_discounted_kopecks:   940_000,
    discount_percent: 49,
    url: process.env.UPSELL_LANDING_URL!,
  },
  advanced: {
    key: "advanced" as const,
    title: "Программа (Продвинутый): Лимфа + Антипаразитарка + Железодефицит",
    price_original_kopecks:   5_750_000,
    price_discounted_kopecks: 1_490_000,
    discount_percent: 74,
    url: process.env.UPSELL_LANDING_URL!,
  },
} as const;

export const CAUSE_TO_PROGRAM = {
  lymph_stasis:           "base",
  water_salt_imbalance:   "base",
  hormonal_imbalance:     "base",
  parasitic_intoxication: "advanced",
  iron_deficiency:        "advanced",
} as const;

export function formatRub(kopecks: number): string {
  const rub = Math.floor(kopecks / 100);
  return `${rub.toLocaleString("ru-RU")} ₽`;
}
```

### A.5 `lib/scenarios.ts`

```ts
export const SCENARIOS = {
  "morning-face": {
    title: "Лицо опухает по утрам?",
    subtitle: "Узнайте причину — не косметологическую, а настоящую.",
    cta: "Узнать причину своего отёка",
  },
  "eye-bags": {
    title: "Мешки под глазами не уходят?",
    subtitle: "Тональный крем скрывает, но не решает.",
    cta: "Узнать причину",
  },
  "face-oval": {
    title: "Овал лица поплыл после 40?",
    subtitle: "Прежде чем идти к косметологу — узнайте, не задержка ли это жидкости.",
    cta: "Проверить бесплатно",
  },
  "legs": {
    title: "Ноги тяжелеют к вечеру?",
    subtitle: "Лицо по утрам + ноги к вечеру = системный сигнал.",
    cta: "Определить причину бесплатно",
  },
  "rings": {
    title: "Кольца перестали сниматься?",
    subtitle: "Опухание рук, пальцев, лица и ног одновременно — это системный сигнал.",
    cta: "Узнать причину своего отёка",
  },
} as const;

export const UPDN_FACTS = [
  "На платформе занимаются более 500 000 человек",
  "Совместно с Первым МГМУ им. И.М. Сеченова",
  "Методика подтверждена научными исследованиями",
  "Европейская аккредитация",
] as const;

export type ScenarioKey = keyof typeof SCENARIOS;
```

---

## Приложение B: Чеклист готовности к деплою

- [ ] Создан Supabase проект, миграция применена.
- [ ] Все env-переменные заполнены в Vercel Project Settings (Production + Preview).
- [ ] `vercel.json` с cron-задачами закоммичен.
- [ ] OpenRouter API key проверен (тестовый вызов с фейк-фото).
- [ ] Геткурс API key получен от IT-отдела УПДН, проверен тестовым вызовом.
- [ ] Telegram bot создан, ID каналов добавлены.
- [ ] Yandex.Metrika счётчик создан, ID добавлен.
- [ ] CNAME `edemaskan.lid.nutritionist4day.ru` → Vercel настроен.
- [ ] SSL-сертификат активирован Vercel автоматически.
- [ ] `/legal/privacy` и `/legal/scan-policy` заполнены текстами от юриста (см. `LEGAL_TZ.md`).
- [ ] Промпт `prompts/scan-agent.md` синхронизирован с одобренной версией от методолога.
- [ ] Протестирован happy-path на 3 устройствах: iPhone Safari, Android Chrome, Desktop Chrome.
- [ ] Протестирован сценарий red flag (специально подобранные фото, если возможно).
- [ ] Протестирован retry-flow при отключении OpenRouter (mock-режим).
- [ ] Методолог УПДН добавлен в `methodologist_users`, проверен read-only доступ.

---

*Edemaskan Technical Specification v1.0 — финальный документ для Claude Code. Источники: PROJECT_IDEA.md v4.0, scan-agent-prompt.md v1.1, LANDING_TEXTS.md v1.0, LEGAL_TZ.md v1.0.*
