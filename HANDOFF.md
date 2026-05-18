# HANDOFF.md — Edemaskan

> Сгенерировано: 2026-05-18
> Проект: Edemaskan — AI-сканер отёчности лица (лид-магнит УПДН)
> Деплой: https://edemaskan.lid.nutritionist4day.ru
> Репозиторий: github.com/antoxansk/edemaskan

---

## 1. Статус проекта

- **Этап:** Deploy (продакшн, принимает трафик)
- **Готовность:** ~97% — все фичи v5 реализованы, живой счётчик работает
- **Последний коммит:** `6d3a105 feat: live scan counter — increments on every completed scan`
- **Ветка:** main
- **Хостинг:** Render.com (free tier, keep-alive через cron-job.org)

---

## 2. Что сделано в этой сессии

| Задача | Статус | Файлы |
|--------|--------|-------|
| Дизайн-правки v5: Emerald shimmer-кнопки | Завершено | `app/globals.css`, `components/landing/hero.tsx`, `components/landing/final-cta.tsx` |
| Иконки шагов «Как работает» → Emerald | Завершено | `components/landing/how-it-works.tsx` |
| TrustBlock: 3 источника, CAPS заголовок, emerald чекмарки | Завершено | `components/landing/trust-block.tsx` |
| Счётчик «327 человек» в Hero | Завершено | `components/landing/hero.tsx` |
| Stats Strip (полоса цифр: 327+, 3 000+, 30 000+, Сеченова) | Завершено | `components/landing/stats-strip.tsx` (новый) |
| Count-up анимация цифр (IntersectionObserver + rAF) | Завершено | `components/landing/stats-strip.tsx` |
| Sticky Bottom CTA на мобайле | Завершено | `components/landing/sticky-bottom-cta.tsx` (новый) |
| Social Proof Toasts (Live-уведомления) | Завершено | `components/landing/social-proof-toast.tsx` (новый), `lib/social-proof/data.ts` (новый) |
| Копирайт v5 Экран 1: новый подзаголовок + микро-доверие | Завершено | `app/(landings)/morning-face/page.tsx` |
| Копирайт v5 Экран 2: полный текст боли (5 абзацев) | Завершено | `app/(landings)/morning-face/page.tsx` |
| Копирайт v5 Экран 3: отзывы (3 карточки) | Завершено | `components/landing/reviews.tsx` (новый) |
| Копирайт v5 Экран 4: финальная CTA «— бесплатно» | Завершено | `app/(landings)/morning-face/page.tsx` |
| Живой счётчик: GET /api/counter + useCounter hook | Завершено | `app/api/counter/route.ts` (новый), `hooks/useCounter.ts` (новый), `components/landing/live-counter.tsx` (новый) |

---

## 3. Архитектурные решения

### Фото никогда не хранятся (И-1)
- **Почему:** юридическое и этическое требование УПДН
- **Как работает:** фото → base64 → OpenRouter → ответ → buffer.fill(0) → null
- **Не менять:** любое промежуточное хранение фото — критический нарушитель

### Анонимные пользователи без регистрации (И-3)
- **Почему:** снижение барьера входа, лид-магнит не требует аккаунта
- **Доступ к результату:** через `result_token` (24 символа base64url) в URL `/r/[token]`

### Живой счётчик — считает из scan_sessions, не отдельная таблица
- **Почему:** данные уже пишутся в submit-email; отдельная таблица-счётчик — лишняя сложность
- **Как работает:** `COUNT(*) FROM scan_sessions WHERE email_submitted_at IS NOT NULL` + база 327
- **Файл:** `app/api/counter/route.ts`
- **Не менять:** база 327 — это «досессионные» прохождения; убирать нельзя, иначе счётчик начнётся с 0

### StatsStrip: анимация ждёт загрузки счётчика
- **Почему:** count-up должен анимировать до актуального числа, не до захардкоженного 327
- **Как работает:** `started = inView && liveCount !== null` — оба условия должны быть выполнены
- **Файл:** `components/landing/stats-strip.tsx`, строки с `inView` и `liveCount`
- **Не менять:** если убрать проверку `liveCount !== null`, анимация сыграет до fallback-значения, а не до реального

### Sticky CTA и Social Proof Toast — самодостаточные клиентские компоненты
- **Почему:** страница `/morning-face` — Server Component; refs не передаём, используем data-атрибуты
- **Как работает:** `document.querySelector("[data-hero-section]")` и `[data-landing-footer]`
- **Файлы:** `components/landing/sticky-bottom-cta.tsx`, `components/landing/social-proof-toast.tsx`
- **Не менять:** атрибуты `data-hero-section` в `hero.tsx` и `data-landing-footer` в `footer-disclaimer.tsx` — без них оба компонента не найдут точки наблюдения

### QR-код использует window.location.origin
- **Почему:** `NEXT_PUBLIC_SITE_URL` статична и может указывать на нерабочий домен при смене хостинга
- **Файл:** `app/scan/desktop-fallback/page.tsx`
- **Не менять:** возврат к env var сломает QR при смене домена

### zone_analysis nullable в Zod-схеме
- **Почему:** AI возвращает null когда на фото не женщина (red_flag случай)
- **Файл:** `lib/validation.ts` — `zone_analysis: z.object({...}).nullable()`
- **Не менять:** без nullable() ZOD_VALIDATION_FAILED на ~10% запросов

### Render free tier + cron-job.org Keep Alive
- **Почему:** free tier засыпает через 15 мин без запросов
- **Решение:** cron-job.org пингует `/api/health` каждые 10 мин

---

## 4. Известные проблемы

| Проблема | Severity | Workaround |
|----------|----------|------------|
| `NEXT_PUBLIC_YANDEX_METRIKA_ID` не задан в Render | High | Метрика не работает, данные не собираются. Получить ID у техотдела, добавить в Render Environment |
| GetCourse автоматизация не настроена | High | Лиды попадают в GetCourse, но письмо с result_url пользователю не приходит. IT УПДН должны настроить воронку |
| Счётчик на лендинге кэшируется 30с | Low | `/api/counter` возвращает `Cache-Control: s-maxage=30`. Число обновится с задержкой до 30с после прохождения — это ожидаемо |

---

## 5. Gotchas (подводные камни)

1. **`data-hero-section` в `components/landing/hero.tsx`** — атрибут на `<section>`. Без него `StickyBottomCTA` и `SocialProofToast` не найдут якорь для IntersectionObserver и не будут работать корректно.

2. **`data-landing-footer` в `components/shared/footer-disclaimer.tsx`** — атрибут на `<footer>`. Нужен обоим компонентам для определения, что страница прочитана до конца (прекращают работу).

3. **`lib/photo-compression.ts`** — функция `compressPhoto` возвращает `{file, dataUrl, sizeBytes}`. В `app/scan/photos/page.tsx` нужно передавать `compressed.file`, не оригинальный файл.

4. **`lib/validation.ts`** — `AiResultSchema` имеет `zone_analysis: nullable`. Обязательны null-чеки в `zone-tags.tsx` и `result-view.tsx`.

5. **`components/landing/stats-strip.tsx`** — `sessionStorage` флаг `edm_stats_animated` предотвращает повторную анимацию при скролле вверх/вниз. Если нужно тестировать анимацию повторно — удалить ключ вручную в DevTools.

6. **`app/api/counter/route.ts`** — при ошибке Supabase возвращает base 327, не 500. Это намеренно — счётчик никогда не должен показывать 0 или сломанный UI.

7. **`app/api/cron/getcourse-retry/route.ts`** и **`cleanup/route.ts`** — требуют заголовок `Authorization: Bearer <CRON_SECRET>`. Без него возвращают 401.

8. **`components/landing/social-proof-toast.tsx`** — при `document.hidden` (вкладка скрыта) таймеры останавливаются. При возврате — следующий показ запланирован через random(20–60s), не сразу.

---

## 6. Файлы, изменённые в сессии

```
# Новые файлы
app/api/counter/route.ts                      (GET: live scan count)
hooks/useCounter.ts                           (polling hook, 12s interval)
components/landing/live-counter.tsx           (client component для Hero)
components/landing/stats-strip.tsx            (полоса цифр + count-up анимация)
components/landing/sticky-bottom-cta.tsx      (sticky CTA на мобайле)
components/landing/social-proof-toast.tsx     (live-уведомления о прохождениях)
components/landing/reviews.tsx                (3 отзыва: Ольга, Наталья, Марина)
lib/social-proof/data.ts                      (80+ имён, 100+ городов, шаблоны)

# Изменённые файлы
app/globals.css                               (shimmer keyframe + btn-emerald-cta)
app/(landings)/morning-face/page.tsx          (все 4 экрана: копирайт v5, новые компоненты)
app/scan/page.tsx                             (добавлен SocialProofToast)
components/landing/hero.tsx                   (Emerald CTA, LiveCounter, микро-доверие, data-hero-section)
components/landing/how-it-works.tsx           (Emerald иконки шагов)
components/landing/trust-block.tsx            (v5 контент: 3 источника, CAPS заголовок)
components/landing/final-cta.tsx              (Emerald CTA)
components/landing/stats-strip.tsx            (live count из API)
components/shared/footer-disclaimer.tsx       (data-landing-footer атрибут)
```

---

## 7. Изменения в базе данных

Новых миграций в этой сессии не было.

Используемые таблицы (без изменений схемы):
- `scan_sessions` — `email_submitted_at` используется счётчиком как признак завершённого прохождения
- `getcourse_sync_queue` — очередь лидов в GetCourse

Применённая миграция (из предыдущей сессии): `20260513120000_init.sql`

---

## 8. Переменные окружения

**Всё ещё не задана в Render (критично):**

| Переменная | Формат | Статус |
|---|---|---|
| `NEXT_PUBLIC_YANDEX_METRIKA_ID` | числовой ID (например `98765432`) | ❌ НЕ ЗАДАНА |

**Существующие (без значений):**
- `SUPABASE_URL` — URL Supabase проекта
- `SUPABASE_ANON_KEY` — публичный ключ Supabase
- `SUPABASE_SERVICE_ROLE_KEY` — серверный ключ (никогда не публичный)
- `OPENROUTER_API_KEY` — ключ OpenRouter
- `GETCOURSE_API_KEY` — ключ GetCourse API
- `GETCOURSE_SCHOOL_DOMAIN` — домен школы в GetCourse
- `TELEGRAM_BOT_TOKEN` — токен Telegram бота
- `TELEGRAM_CHAT_ID_LEADS` — ID канала для лидов
- `TELEGRAM_CHAT_ID_ERRORS` — ID канала для ошибок
- `CRON_SECRET` — секрет для авторизации cron-job.org
- `NEXT_PUBLIC_SITE_URL` — `https://edemaskan.lid.nutritionist4day.ru`

---

## 9. Следующие шаги

**Приоритет 1 — внешние настройки (делают люди, не Claude):**

1. **Задать `NEXT_PUBLIC_YANDEX_METRIKA_ID` в Render**
   - metrika.yandex.ru → создать счётчик → скопировать ID
   - Render → Environment → добавить переменную → сохранить (редеплой ~2 мин)

2. **Настроить автоматизацию в GetCourse** (IT УПДН)
   - Триггер: добавление в группу `edemaskan_leads`
   - Поле `edm_result_url` в дополнительных полях пользователя
   - Письмо: «Ваш разбор готов», кнопка → `{user.edm_result_url}`

**Приоритет 2 — после первой недели трафика:**

3. Проверить Supabase → `getcourse_sync_queue` — нет ли `failed_permanent`
4. Проверить Supabase → `ai_errors` — нет ли паттернов ошибок OpenRouter
5. Яндекс.Метрика → воронка: `landing_view` → `questionnaire_completed` → `result_view` → `cta_to_upsell`
6. Мониторинг счётчика: открыть `/api/counter` в браузере — число должно расти с каждым прохождением

**Приоритет 3 — опционально:**

7. Распространить v5-копирайт на остальные 4 лендинга (`/eye-bags`, `/face-oval`, `/legs`, `/rings`) — сейчас обновлён только `/morning-face`
8. Добавить IP-лимит на `/api/counter` (1 запрос в сутки с IP) если счётчик начнут накручивать

**Зависимости:**
- Метрика не работает → нет данных по конверсии → нельзя оптимизировать воронку
- GetCourse не настроен → пользователь не получает письмо с результатом → конверсия в продажу падает

---

## Автоматические данные

### git status
```
working tree clean (незакоммиченные: только .claude/skills/, Fotoskan/, служебные файлы)
```

### TODO в коде
```
(нет)
```

### Последние коммиты
```
6d3a105 feat: live scan counter — increments on every completed scan
8e2311d feat: landing v5 — apply Part 1 copywriting (screens 1-4)
abc24e1 feat: landing v5 — social proof toasts (live notifications)
a9336c8 feat: landing v5 — sticky bottom CTA for mobile
d4b5968 feat: landing v5 — stats strip with count-up animation
d2a226f feat: landing v5 design — Emerald CTA shimmer, updated trust block & icons
bcf7e91 fix: QR autostart, larger checkboxes/button, zone scroll margin
```

---

## Промпт для начала следующей сессии

```
Прочитай HANDOFF.md в корне проекта.

Подтверди что понял:
1. Текущий статус (деплой, все фичи v5 реализованы, живой счётчик работает)
2. Что НЕ завершено внешними командами: NEXT_PUBLIC_YANDEX_METRIKA_ID, GetCourse автоматизация
3. Критические gotchas (data-hero-section, data-landing-footer, liveCount в StatsStrip, база 327)
4. Следующие шаги с приоритетами

Затем спроси что делаем сегодня.
```
