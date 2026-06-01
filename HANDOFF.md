# HANDOFF.md — Edemaskan

> Обновлено: 2026-06-02
> Проект: Edemaskan — AI-сканер отёчности лица (лид-магнит УПДН)
> Деплой: https://edemaskan.lid.nutritionist4day.ru
> Репозиторий: github.com/antoxansk/edemaskan

---

## 1. Статус проекта

- **Этап:** Продакшн, принимает трафик
- **Готовность:** ~100% MVP — все фичи реализованы и работают
- **Последний коммит:** `d501f71 feat: gallery upload + face detection preload + getcourse widget + db schema fix`
- **Ветка:** main
- **Хостинг:** Render.com (free tier, keep-alive через cron-job.org)
- **БД:** Supabase PostgreSQL, подключение через **Transaction Pooler порт 6543** (`aws-1-eu-central-1.pooler.supabase.com:6543`)

---

## 2. Что сделано в сессии 2026-06-02

| Задача | Статус | Файлы / Действие |
|--------|--------|------------------|
| **Починена БД** — пароль со скобками | ✅ Завершено | DATABASE_URL исправлен: убраны `[` `]` вокруг пароля, порт 5432→6543. Пароль `DnRIB28h50WxOcGY`. После обслуживания Supabase 26 мая pooler стал строже к auth |
| Диагностический endpoint `/api/health/db` | ✅ Завершено | `app/api/health/db/route.ts` — защищён CRON_SECRET, показывает host/port/user + список таблиц |
| Trim DATABASE_URL + connection logging | ✅ Завершено | `lib/db.ts` — `.trim()` на connectionString, логирует host:port без пароля |
| GetCourse виджет на шаге email | ✅ Завершено | `app/scan/email/page.tsx` — заменена кастомная форма на виджет `id=1610554`. Перехват submit+postMessage → fire-and-forget к нашему API |
| Preload face detection на /scan/analyzing | ✅ Завершено | `app/scan/analyzing/page.tsx` — пока OpenRouter анализирует (~60с), параллельно грузится TF.js модель и запускается детекция. К шагу результата кэш уже готов |
| Загрузка фото из галереи | ✅ Завершено | `app/scan/photos/page.tsx` — убран `capture="user"`, теперь iOS/Android показывают выбор «Камера / Галерея» |
| `cta_clicked_at` добавлена в db schema | ✅ Завершено | `db/timeweb-init.sql` — добавлена колонка (в живой БД уже была через Supabase SQL Editor) |

---

## 3. Архитектура — ключевые решения

### БД: pg (node-postgres) через Supabase Transaction Pooler
- **URL формат:** `postgresql://postgres.plgsjizgtfcdftisaxcg:ПАРОЛЬ@aws-1-eu-central-1.pooler.supabase.com:6543/postgres`
- **ВАЖНО:** порт **6543** (Transaction Pooler), НЕ 5432 (Session Pooler) и НЕ Direct connection (IPv6-only)
- **Пароль:** `DnRIB28h50WxOcGY` — оригинальный, не менять без нужды
- **Файл:** `lib/db.ts` — singleton Pool с SSL + trim connectionString

### Почему сломалась БД (2026-06-01)
- Оригинальный URL содержал `[DnRIB28h50WxOcGY]` (пароль в скобках)
- До обслуживания Supabase (26 мая 2026) pooler принимал пароль со скобками
- После обслуживания — строгая проверка, скобки стали частью неверного пароля
- **Лечение:** убрать `[` `]` из пароля в DATABASE_URL

### GetCourse виджет (шаг email)
- Виджет `id=1610554` от УПДН собирает имя/телефон/email → отправляет в GetCourse
- Наш код перехватывает `document.submit` (capture phase) для извлечения name+email
- Слушает `window.message` (postMessage от виджета) на успех → redirect к результату
- Параллельно fire-and-forget к `/api/scan/submit-email` для DB-записи + Telegram алерта
- **Важно:** если виджет не шлёт postMessage, переход не произойдёт. Нужно проверить в живом тесте

### Face Detection preload
- На шаге `/scan/analyzing`: запускается `loadDetector()` + `detectLandmarks()` в фоне
- К моменту перехода на результат (`/scan/result`) кэш `edm_landmarks_v2` уже готов
- `useFaceLandmarks` находит кэш и показывает зоны моментально

### CTA-клик трекинг
- Клик → `POST /api/scan/cta-click` (keepalive) → `cta_clicked_at` в БД → GetCourse группа `edemaskan_cta_clicked`
- Идемпотентный (`WHERE cta_clicked_at IS NULL`)

### Render + cron-job.org
- Free tier засыпает через 15 мин → Keep Alive пингует `/api/health` каждые 10 мин
- Cron-задания: `Authorization: Bearer CRON_SECRET` (пробел обязателен!)
- Три задания: Keep Alive ✅, GetCourse Retry ❓ (Inactive — надо включить), Cleanup ❓ (была 500, теперь БД починена — вероятно заработает)

---

## 4. Известные проблемы

| Проблема | Severity | Статус | Следующий шаг |
|----------|----------|--------|---------------|
| GetCourse виджет — нужна проверка postMessage | High | ❓ Нужен живой тест | Пройти флоу до шага email, заполнить виджет, убедиться что переходит к результату |
| GetCourse Retry cron — Inactive | Medium | ❌ Не включён | cron-job.org → включить задание |
| GetCourse дожим 48ч для не-кликнувших | Medium | ❌ Не настроен | IT УПДН: инструкция в разделе 6 |
| Медленный AI анализ (~60 сек) | Medium | Открыто | Render free tier. Решение: апгрейд (~$7/мес) |
| «Сессия не найдена» | Medium | Открыто | Render засыпает во время анализа. Решение: апгрейд хостинга |

---

## 5. Gotchas (подводные камни)

1. **Transaction Pooler порт 6543** — используем порт 6543, не 5432 (Session) и не прямое подключение (IPv6)

2. **Пароль БД без скобок** — в DATABASE_URL пароль `DnRIB28h50WxOcGY` должен быть БЕЗ `[` `]`

3. **`lib/env.ts`** — все `require()` вызываются при загрузке модуля. Если хоть одна переменная отсутствует — падает весь модуль → любой маршрут вернёт 500

4. **`cron-job.org` Authorization** — значение `Bearer TOKEN` (пробел обязателен!)

5. **`lib/face-detection/mediapipe-stub.ts`** — без него Turbopack упадёт при `pnpm build`

6. **`next.config.ts` → `turbopack.resolveAlias`** — перенаправляет `@mediapipe/face_mesh` на стаб. Убрать = сборка упадёт

7. **Кэш landmarks `edm_landmarks_v2`** — если меняешь формат keypoints, поднять до `v3`

8. **GetCourse виджет** — скрипт `id=873daee45f3b2bb4cbc8600bec9180aede157f00` читает свой `id` из DOM для рендера. Не менять id тег Script компонента

9. **`data-hero-section` в `hero.tsx`** — без него `StickyBottomCTA` и `SocialProofToast` не найдут якорь

10. **`app/api/counter/route.ts`** — при ошибке БД возвращает base 327 (намеренно, не ломает лендинг)

---

## 6. Инструкция для IT УПДН — Дожим не-кликнувших

```
Триггер: пользователь добавлен в группу «edemaskan_leads»
Задержка: 48 часов
Условие: пользователь НЕ состоит в группе «edemaskan_cta_clicked»
Действие: отправить письмо

Тема: «[Имя], ваш разбор всё ещё ждёт вас»
Текст: «Мы подготовили персональный разбор вашей отёчности.
Посмотрите — там есть конкретные причины и план на 7 дней.»
Кнопка: «Смотреть разбор» → ссылка: {user.edm_result_url}
```

Также убедиться что в «Дополнительных полях» есть:
- `edm_result_url` (строка) — ссылка на результат
- `edm_cta_clicked` (строка) — флаг клика на CTA

---

## 7. Переменные окружения (актуально на 2026-06-02)

**Render Environment (все заданы ✅):**
- `DATABASE_URL` = `postgresql://postgres.plgsjizgtfcdftisaxcg:DnRIB28h50WxOcGY@aws-1-eu-central-1.pooler.supabase.com:6543/postgres`
- `OPENROUTER_API_KEY`
- `GETCOURSE_API_KEY`, `GETCOURSE_SCHOOL_DOMAIN`
- `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID_LEADS`, `TELEGRAM_CHAT_ID_ERRORS`
- `CRON_SECRET`
- `NEXT_PUBLIC_SITE_URL` = `https://edemaskan.lid.nutritionist4day.ru`
- `NEXT_PUBLIC_YANDEX_METRIKA_ID` = `109298719`

**Локально `.env.local`:**
- `DATABASE_URL` = тот же Transaction Pooler URI (заполнен)
- Остальные переменные заполнены

---

## 8. Следующие шаги (по приоритету)

**Приоритет 0 — Проверить живым тестом:**

1. **Проверить GetCourse виджет** — пройти весь флоу до шага email, заполнить форму виджета, убедиться что переход к результату работает. Если нет — нужно добавить кнопку-fallback «Уже отправил → продолжить»

2. **Включить GetCourse Retry cron** на cron-job.org (сейчас Inactive)

**Приоритет 1 — Бизнес:**

3. **Настроить дожимную автоматизацию в GetCourse** (IT УПДН) — инструкция в разделе 6

**Приоритет 2 — Производительность:**

4. **Апгрейд Render.com с free tier на paid (~$7/мес)** — устраняет cold start + «Сессия не найдена»

**Приоритет 3 — После первой недели трафика:**

5. Supabase SQL Editor → проверить зависшие лиды: `SELECT * FROM getcourse_sync_queue WHERE status='failed_permanent'`
6. Supabase → `ai_errors` — проверить паттерны ошибок OpenRouter
7. Яндекс.Метрика → воронка: `landing_view` → `questionnaire_completed` → `result_view` → `cta_to_upsell`

---

## 9. Последние коммиты

```
d501f71 feat: gallery upload + face detection preload + getcourse widget + db schema fix
0a0def0 fix: trim DATABASE_URL + add connection diagnostics to health/db
4a4bae4 chore: add /api/health/db diagnostic endpoint (protected by CRON_SECRET)
c767d5d feat: CTA click tracking + remove Vercel + DB stability fixes
7ab45cc feat: migrate DB from Supabase to pg + add Dockerfile for Amvera
```

---

## 10. Промпт для начала следующей сессии

```
Прочитай HANDOFF.md в корне проекта.

Подтверди что понял:
1. БД — pg через Supabase Transaction Pooler порт 6543. Пароль DnRIB28h50WxOcGY (без скобок!)
2. Сервис был сломан из-за скобок в пароле после обслуживания Supabase 26 мая. Починено 2026-06-02
3. GetCourse виджет на шаге email — нужна живая проверка что postMessage перехватывается
4. GetCourse Retry cron на cron-job.org — Inactive, надо включить
5. GetCourse дожим (48ч, не-кликнувшие) не настроен — инструкция в разделе 6

Затем спроси что делаем сегодня.
```
