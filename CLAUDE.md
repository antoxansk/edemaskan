# CLAUDE.md — Edemaskan Project Instructions

> Это главный файл для Claude Code. Читается **всегда** при старте сессии.
> Источник истины по фичам — `SPEC.md` в корне проекта.

---

## 1. Что такое Edemaskan (за 30 секунд)

Edemaskan — бесплатный веб-сервис УПДН: пользователь (Марина, 40–55 лет) загружает 4 фото лица + отвечает на 5 вопросов → AI-агент через OpenRouter анализирует зоны отёчности → возвращает причину + стартовый план + CTA на платную программу через Геткурс. Лид-магнит верха воронки. Платежей внутри сервиса **нет**.

Домен: `edemaskan.lid.nutritionist4day.ru`.

---

## 2. Порядок чтения при старте новой сессии

1. **`SPEC.md`** — техническая спецификация, единственный источник истины. Читать полностью.
2. **`PROJECT_IDEA.md`** — продуктовый контекст, аватар, монетизация.
3. **`prompts/scan-agent.md`** — системный промпт AI. **Не изменять** без явного указания пользователя.
4. **Этот файл (CLAUDE.md)** — правила, инварианты, workflow.

Если в задаче что-то не покрыто SPEC.md — спросить пользователя, а не выдумывать. **Запрещено** додумывать бизнес-логику.

---

## 3. Технологический стек (фиксированный, не отклоняться)

| Слой | Технология |
|------|-----------|
| Framework | Next.js 16 (App Router) |
| Язык | TypeScript 5.5+, `"strict": true` |
| Стили | Tailwind CSS v4 (CSS-first config через `@theme`) |
| UI-kit | shadcn/ui (Radix UI под капотом) |
| Иконки | lucide-react |
| Формы | react-hook-form + zod |
| БД | Supabase PostgreSQL 15 |
| AI | OpenRouter → `anthropic/claude-sonnet-4` |
| Email-CRM | Геткурс API (внешний) |
| Алерты | Telegram Bot API |
| Аналитика | Яндекс.Метрика |
| Деплой | Vercel |

**Запрещено:** Stripe, ЮKassa (платежей нет), OpenAI напрямую, Supabase Edge Functions, n8n, Cursor-специфичные конструкции, axios (используем нативный `fetch`).

---

## 4. Критические инварианты — НИКОГДА не нарушать

### И-1. Фото никогда не сохраняются
- Фото проходят через память Node.js → base64 → OpenRouter → ответ → **зануление буферов**.
- Никакого Supabase Storage. Никаких локальных файлов. Никакого blob-хранилища.
- В коде API route `/api/scan/analyze` после получения ответа от OpenRouter — обязательно `buffer.fill(0)` + переменные = `null`.
- Любая попытка ввести промежуточное хранилище фото — стоп, спросить пользователя.

### И-2. Никаких платежей внутри сервиса
- Все CTA-кнопки ведут на внешний URL: `process.env.UPSELL_LANDING_URL` (Геткурс-лендинг).
- Никаких форм оплаты, никаких интеграций с платёжными провайдерами.

### И-3. Анонимные пользователи
- У Марин **нет** регистрации, входа, аккаунта.
- Доступ к результату — через секретный `result_token` (24 base64url-символа).
- Никаких Supabase Auth для конечных пользователей. Supabase Auth — только для методологов УПДН (read-only через Studio).

### И-4. RLS включён на всех таблицах, фронт не ходит в Supabase напрямую
- Все мутации делает `service_role` изнутри API routes.
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` существует только потому что нужен формальный клиент — но прав у анона нет.
- Любой запрос с фронта в Supabase минуя API route — баг.

### И-5. Цены — константы в коде, не в БД
- Источник: `lib/pricing.ts` (см. SPEC.md приложение A.4).
- Хранятся в копейках (INTEGER).
- Не передавать с фронта в API.

### И-6. Согласия проверяются и на клиенте, и на сервере
- Zod-схема в `/api/scan/start` требует `consent_pdn: z.literal(true)` и `consent_scan: z.literal(true)`.
- Обход через DevTools → 400 `CONSENT_REQUIRED`.

### И-7. AI-промпт не редактировать без указания
- `prompts/scan-agent.md` — одобрен методологом УПДН.
- Любые изменения требуют явного запроса пользователя.
- При вызове OpenRouter промпт идёт как системное сообщение с `cache_control: { type: "ephemeral" }`.

### И-8. PII не логируется
- В `console.log`/Telegram-алертах никогда не выводить полный email или имя.
- Email маскировать как `m***a@example.ru` (первая+последняя+домен).
- Сырые ответы OpenRouter в `ai_errors.raw_response` — обрезать до 4096 символов.

---

## 5. Конвенции кода

### TypeScript
- `"strict": true`, `"noUncheckedIndexedAccess": true`.
- **Запрещено** `any`. Если нужно — `unknown` + явная проверка.
- Все API-граничные типы — Zod-схемы из `lib/validation.ts`, типы выводятся через `z.infer<typeof X>`.
- Никаких enum-классов TS — только `as const` объекты и `z.enum([...])`.

### React / Next.js
- App Router. Прямое использование Server Components везде, где не нужен интерактив.
- Никаких `"use client"` без необходимости. Если ставится — комментарий-обоснование первой строкой.
- Никаких `useEffect` для data fetching — это делает либо RSC, либо server action, либо `route handler`.
- Формы — `react-hook-form` + `zodResolver`.
- Тосты — `sonner` (через shadcn/ui интеграцию).

### Стили
- Только Tailwind v4 utility-классы. Никаких inline-стилей (кроме крайних случаев типа `style={{ transform: ... }}` для динамических трансформов).
- Цвета — только через CSS-переменные из `@theme` в `globals.css` (см. SPEC.md §4.1).
- Mobile-first. Базовый layout — для viewport 375×667.

### Файловая организация (см. SPEC.md §0.7)
- Компоненты shadcn/ui — `components/ui/*`.
- Доменные компоненты — `components/scan/*`, `components/landing/*`.
- Утилиты и интеграции — `lib/*`.
- API routes — `app/api/.../route.ts`.

### Импорты
- Алиас `@/*` для корня (`tsconfig.json` paths).
- Server-only утилиты — в `lib/` с пометкой `import "server-only"` в первой строке файла (для `lib/supabase/server.ts`, `lib/openrouter.ts`, `lib/getcourse.ts`, `lib/telegram.ts`).

### Ошибки
- API routes возвращают `{ error: { code: "ERROR_CODE", message: "..." } }` с HTTP-кодами по SPEC.md §3.
- Внутренние ошибки логируются в `console.error` + Telegram (через `lib/telegram.ts`) в канал `errors`.
- Никаких `throw new Error("...")` без обработки на уровне route.ts.

### Безопасность
- Никаких raw SQL. Все запросы — через `@supabase/supabase-js`.
- Никакого `dangerouslySetInnerHTML` кроме счётчика Яндекс.Метрики.
- Rate-limit на каждом public API — см. SPEC.md §5.8.

---

## 6. Workflow

### Перед написанием кода
1. Прочитать соответствующий блок SPEC.md.
2. Если задача затрагивает несколько блоков — план в 3-5 строк, показать пользователю, дождаться "ок".
3. Если SPEC.md противоречит запросу пользователя — следовать SPEC.md, обозначить конфликт.

### После каждого логического шага
1. `pnpm tsc --noEmit` — должно быть зелёным.
2. `pnpm lint` — должно быть зелёным.
3. Если меняли БД — миграция применена через `supabase db push` (или MCP).
4. Если можно — `pnpm dev` + смок-тест ручной (через curl или браузер).

### Коммиты
- Conventional Commits: `feat:`, `fix:`, `chore:`, `docs:`, `refactor:`.
- Одна логическая единица = один коммит.
- В описании коммита — ссылка на блок SPEC.md (например, "implements SPEC §3.2").

### Когда призывать субагента
- **`supabase-architect`** — миграции, RLS, индексы, схема БД (SPEC §2).
- **`api-builder`** — API routes (SPEC §3) и серверная валидация.
- **`ui-builder`** — экраны, компоненты, UI-state (SPEC §4).
- **`integration-engineer`** — OpenRouter / Геткурс / Telegram / Яндекс.Метрика (SPEC §5.4–5.7 + `docs/`).
- **`qa-reviewer`** — финальная проверка готовой фичи на соответствие SPEC + acceptance criteria.

---

## 7. План сборки MVP (этапы)

Сборку вести в этом порядке. Не прыгать вперёд — каждый этап даёт фундамент для следующего.

| Этап | Что делаем | Главный субагент |
|------|-----------|-----------------|
| 1 | Инициализация: Next.js 16, Tailwind v4, shadcn/ui, ESLint, прет-тиер, базовый layout. `pnpm tsc` зелёный. | — (вручную) |
| 2 | Supabase: миграция из SPEC §2, RLS, проверка через service-role клиент. | supabase-architect |
| 3 | `lib/`: validation (Zod-схемы), pricing, scenarios, supabase-клиенты, rate-limit, openrouter, getcourse, telegram. | integration-engineer |
| 4 | API routes: `/api/scan/start`, `/api/scan/analyze`, `/api/scan/submit-email`, `/api/result/[token]`. Тестируем curl-ом или REST-клиентом. | api-builder |
| 5 | Юридические страницы: `/legal/privacy`, `/legal/scan-policy` (с placeholder-текстом, готовый текст придёт от юриста). | ui-builder |
| 6 | 5 лендингов (`/morning-face` и т.д.) + общие лендинговые компоненты. | ui-builder |
| 7 | Флоу скана: `/scan` (онбординг), `/scan/photos`, `/scan/questionnaire`, `/scan/analyzing`, `/scan/email`, `/scan/result`. | ui-builder |
| 8 | Страница `/r/[token]` + desktop fallback + 404. | ui-builder |
| 9 | Cron routes (`getcourse-retry`, `cleanup`) + `vercel.json`. | api-builder |
| 10 | Яндекс.Метрика + аналитические события. | integration-engineer |
| 11 | Финальный QA-прогон по acceptance criteria из SPEC §1 (US-001..US-011). | qa-reviewer |
| 12 | Деплой на Vercel, прод-смок-тест. | — (вручную) |

**Между этапами** — пауза. Показать пользователю что сделано, дождаться "следующий этап".

---

## 8. Что делать, если…

**…не хватает `.env` переменной.**
Не ставить placeholder типа `"your-key-here"`. Остановиться, попросить пользователя добавить в `.env.local` и в Vercel.

**…SPEC.md не покрывает кейс.**
Не выдумывать. Сформулировать 1-2 варианта решения, спросить пользователя.

**…shadcn-компонента ещё нет.**
Поставить через `pnpm dlx shadcn@latest add <component>`. Закоммитить в `components/ui/`.

**…тест провалился.**
Не пытаться "подправить тест чтобы прошёл". Понять, что сломалось, починить либо код, либо ожидание (если ожидание было неправильным изначально).

**…пользователь просит изменить промпт `scan-agent.md`.**
Сделать, но в коммите явно отметить: "WARNING: modifies methodologist-approved prompt — needs re-review".

**…пользователь просит ускорить и пропустить шаги.**
Можно сократить, но: миграции, RLS, валидация на сервере, инвaрианты §4 — пропускать запрещено.

---

## 9. Ссылки на внешние документы в проекте

- `SPEC.md` — техническая спецификация (1500 строк, читать всё).
- `PROJECT_IDEA.md` — продуктовый контекст.
- `LANDING_TEXTS.md` — финальные тексты 5 лендингов (брать дословно).
- `LEGAL_TZ.md` — ТЗ юристу (НЕ исполнитель этого ТЗ, но видно что готовится).
- `prompts/scan-agent.md` — системный промпт AI (НЕ ИЗМЕНЯТЬ).
- `docs/openrouter-vision-howto.md` — паттерн вызова OpenRouter с изображениями.
- `docs/getcourse-api-howto.md` — паттерн вызова Геткурс API.
- `docs/photo-pipeline-zero-retention.md` — pipeline обработки фото с нулевым хранением.

---

## 10. Финальное правило

Лучше **спросить** пользователя, чем угадать. Лучше **не написать строку кода**, чем написать строку, которая нарушает инвариант §4.

Удачной сборки.
