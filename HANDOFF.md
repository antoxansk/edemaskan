# HANDOFF.md — Edemaskan

> Сгенерировано: 2026-05-19
> Проект: Edemaskan — AI-сканер отёчности лица (лид-магнит УПДН)
> Деплой: https://edemaskan.lid.nutritionist4day.ru
> Репозиторий: github.com/antoxansk/edemaskan

---

## 1. Статус проекта

- **Этап:** Deploy (продакшн, принимает трафик)
- **Готовность:** ~99% — все фичи v5 + AI landmark detection реализованы и работают
- **Последний коммит:** `d312880 fix: scale landmark coordinates back to natural image space`
- **Ветка:** main
- **Хостинг:** Render.com (free tier, keep-alive через cron-job.org)

---

## 2. Что сделано в сессии 2026-05-19

| Задача | Статус | Файлы |
|--------|--------|-------|
| AI Face Zone Detection — полная реализация | Завершено | `lib/face-detection/` (3 новых файла), `hooks/useFaceLandmarks.ts`, `components/result/FaceZoneCanvas.tsx`, `ZoneTagBar.tsx`, `ZoneDescriptionCard.tsx` |
| Обновление `ResultPageLayout` — AI flow | Завершено | `components/result/ResultPageLayout.tsx` |
| Fix сборки: Turbopack + @mediapipe/face_mesh | Завершено | `next.config.ts`, `lib/face-detection/mediapipe-stub.ts` |
| Fix координат: canvas→natural image space | Завершено | `lib/face-detection/detect.ts`, `hooks/useFaceLandmarks.ts` |
| Emerald shimmer на всех CTA флоу сканирования | Завершено | `app/scan/page.tsx`, `photos/`, `questionnaire/`, `email/` |
| Emerald shimmer на кнопках результата | Завершено | `components/result/ProgramCard.tsx`, `StickyBottomCTA.tsx` |

### Что сделано в сессии 2026-05-18 (предыдущей)

| Задача | Статус | Файлы |
|--------|--------|-------|
| Дизайн-правки v5: Emerald shimmer-кнопки на лендинге | Завершено | `app/globals.css`, `components/landing/hero.tsx`, `final-cta.tsx` |
| Stats Strip (полоса цифр + count-up анимация) | Завершено | `components/landing/stats-strip.tsx` (новый) |
| Sticky Bottom CTA на мобайле (лендинг) | Завершено | `components/landing/sticky-bottom-cta.tsx` (новый) |
| Social Proof Toasts (Live-уведомления) | Завершено | `components/landing/social-proof-toast.tsx` (новый), `lib/social-proof/data.ts` |
| Копирайт v5 (экраны 1–4) | Завершено | `app/(landings)/morning-face/page.tsx` |
| Отзывы (3 карточки) | Завершено | `components/landing/reviews.tsx` (новый) |
| Живой счётчик: GET /api/counter + useCounter | Завершено | `app/api/counter/route.ts`, `hooks/useCounter.ts`, `components/landing/live-counter.tsx` |

---

## 3. Архитектурные решения

### AI Face Zone Detection — клиентский TFJS inference
- **Почему клиентский:** фото не покидают браузер → инвариант И-1 (нулевое хранение) соблюдён
- **Как работает:**
  1. `hooks/useFaceLandmarks.ts` lazy-импортирует `lib/face-detection/detect.ts` внутри `useEffect`
  2. `detect.ts` грузит MediaPipe Face Mesh через `@tensorflow-models/face-landmarks-detection` с `runtime: "tfjs"`
  3. Фото ресайзится до canvas 640px → inference → 468 landmarks в координатах canvas
  4. Координаты масштабируются обратно в пространство натурального изображения (`kp.x * naturalW/canvasW`)
  5. `FaceZoneCanvas` масштабирует из naturalW/H в displayW/H через `scaleLandmarks()`
- **Кэш:** `sessionStorage["edm_landmarks_v2"]` — пересчёт не нужен при повторном открытии
- **Не менять:** ключ кэша `v2` — если изменить формат keypoints, поднять до `v3`, иначе старые неверные данные из кэша продолжат использоваться

### @mediapipe/face_mesh Stub (Turbopack fix)
- **Проблема:** `@tensorflow-models/face-landmarks-detection` в ESM-бандле делает `import * as t from "@mediapipe/face_mesh"` (строка 17), но этот пакет — IIFE без ESM-экспортов. Turbopack крашится при анализе.
- **Решение:** `lib/face-detection/mediapipe-stub.ts` экспортирует класс `FaceMesh` и константы как заглушки. `next.config.ts` → `turbopack.resolveAlias` перенаправляет импорт на стаб.
- **Не менять:** если убрать `turbopack.resolveAlias` или стаб — сборка упадёт с `Export FaceMesh doesn't exist`
- **Файлы:** `next.config.ts` (строки resolveAlias), `lib/face-detection/mediapipe-stub.ts`

### Coordinate Scaling: canvas → natural image → display
- **Проблема:** TFJS возвращает keypoints в координатах canvas (≤640px). Фото с телефона имеет naturalWidth 3000–4000px. Деление на naturalWidth давало scale ~0.08 — все зоны сжимались в угол.
- **Решение:** в `detect.ts` после inference умножаем `kp.x *= naturalWidth/canvasWidth` и аналогично для Y. Теперь keypoints в naturalW/H пространстве. `FaceZoneCanvas` затем делит на naturalW/H и умножает на displayW/H.
- **Файл:** `lib/face-detection/detect.ts`, последние строки `detectLandmarks()`

### ResultPageLayout — прогрессивное улучшение
- **idle/loading:** мгновенно показываем `FacePhotoWithZones` (старые эллипсы) + маленький spinner-бейдж снизу «AI определяет контуры…»
- **done + keypoints:** заменяем на `FaceZoneCanvas` + `ZoneTagBar` + `ZoneDescriptionCard`
- **no-face/error:** оставляем `FacePhotoWithZones` + сообщение с кнопкой «Сделать фото заново»
- **Почему так:** пользователь всегда видит фото сразу, AI-контуры — прогрессивное улучшение

### Фото никогда не хранятся (И-1)
- **Как работает:** фото → base64 → OpenRouter → ответ → buffer.fill(0) → null
- **Не менять:** любое промежуточное хранение фото — критический нарушитель

### Живой счётчик — считает из scan_sessions
- **Как работает:** `COUNT(*) FROM scan_sessions WHERE email_submitted_at IS NOT NULL` + база 327
- **Файл:** `app/api/counter/route.ts`
- **Не менять:** база 327 — «досессионные» прохождения; без неё счётчик начнётся с 0

### Sticky CTA и Social Proof Toast — самодостаточные клиентские компоненты
- **Как работает:** `document.querySelector("[data-hero-section]")` и `[data-landing-footer]`
- **Не менять:** атрибуты `data-hero-section` в `hero.tsx` и `data-landing-footer` в `footer-disclaimer.tsx`

### Render free tier + cron-job.org Keep Alive
- **Почему:** free tier засыпает через 15 мин без запросов → холодный старт ~10–15 сек → замедляет AI анализ
- **Решение:** cron-job.org пингует `/api/health` каждые 10 мин
- **Критично:** это также влияет на «Сессия не найдена» — если сервер заснул во время анализа, сессия теряется

---

## 4. Известные проблемы

| Проблема | Severity | Workaround / Причина |
|----------|----------|----------------------|
| `NEXT_PUBLIC_YANDEX_METRIKA_ID` не задан в Render | High | Метрика не работает. Получить ID, добавить в Render Environment |
| GetCourse автоматизация не настроена | High | Лиды попадают в GetCourse, но письмо не уходит. IT УПДН настраивает воронку |
| Медленный AI анализ (~60 сек) | Medium | Render free tier: cold start + OpenRouter latency. Решение: апгрейд Render или смена хостинга |
| Медленный face landmark detection (~30 сек) | Medium | TFJS модель ~5MB грузится по сети при первом открытии результата. Решение: preload модели заранее |
| Итоговое время флоу ~90 секунд | Medium | Сумма: анализ OpenRouter (60с) + TFJS inference (30с). Неприемлемо долго для продакшна |
| «Сессия не найдена» | Medium | Render засыпает во время анализа → сессия теряется. Решение: апгрейд хостинга или увеличить таймаут |
| Таймер на /scan/analyzing показывает 30с | Low | Нужно изменить на 60с — реальное время ближе к 60с. Файл: `app/scan/analyzing/page.tsx` |
| Счётчик на лендинге кэшируется 30с | Low | Ожидаемо. `/api/counter` возвращает `s-maxage=30` |

---

## 5. Gotchas (подводные камни)

1. **`lib/face-detection/mediapipe-stub.ts`** — без него Turbopack упадёт при `pnpm build`. Файл должен экспортировать `class FaceMesh {}` и все FACEMESH_* константы.

2. **`next.config.ts` → `turbopack.resolveAlias`** — не путать с `webpack`. Next.js 16 использует Turbopack по умолчанию. Любая `webpack` конфиг-функция → ошибка сборки.

3. **Кэш landmarks `edm_landmarks_v2`** — если меняешь формат keypoints (например, добавляешь поля), нужно поднять версию до `v3` в `hooks/useFaceLandmarks.ts`, иначе старые юзеры получат неверные данные из кэша.

4. **Координаты keypoints в natural-image-пространстве** — `FaceZoneCanvas` ожидает keypoints в пространстве `img.naturalWidth × img.naturalHeight`. Если меняешь `detect.ts`, убедись что масштабирование `scaleBackX/Y` сохраняется.

5. **`data-hero-section` в `components/landing/hero.tsx`** — атрибут на `<section>`. Без него `StickyBottomCTA` и `SocialProofToast` не найдут якорь.

6. **`data-landing-footer` в `components/shared/footer-disclaimer.tsx`** — нужен обоим компонентам для остановки.

7. **`lib/photo-compression.ts`** — `compressPhoto` возвращает `{file, dataUrl, sizeBytes}`. Передавать `compressed.file`, не оригинал.

8. **`app/api/counter/route.ts`** — при ошибке Supabase возвращает base 327, не 500. Намеренно.

9. **`app/api/cron/getcourse-retry/route.ts`** и **`cleanup/route.ts`** — требуют `Authorization: Bearer <CRON_SECRET>`.

10. **Render free tier засыпает через 15 мин** — если пользователь открывает сервис после паузы, первый запрос (cold start) занимает 10–15 сек. Это основная причина «Сессия не найдена» и медленного анализа.

---

## 6. Файлы, изменённые в сессии 2026-05-19

```
# Новые файлы
lib/face-detection/zones.ts           (8 зон: landmark-индексы, цвета, лейблы)
lib/face-detection/detect.ts          (singleton TFJS detector + coordinate scaling)
lib/face-detection/utils.ts           (scaleLandmarks, buildZonePolygons, getNeckPolygon)
lib/face-detection/mediapipe-stub.ts  (Turbopack build fix: stub для @mediapipe/face_mesh)
hooks/useFaceLandmarks.ts             (React-хук, sessionStorage кэш v2)
components/result/FaceZoneCanvas.tsx  (фото + SVG landmark overlay)
components/result/ZoneTagBar.tsx      (кликабельные теги зон)
components/result/ZoneDescriptionCard.tsx (AI-разбор выбранной зоны)

# Изменённые файлы
next.config.ts                         (turbopack.resolveAlias для @mediapipe/face_mesh)
components/result/ResultPageLayout.tsx (AI flow: idle→load→done, прогрессивное улучшение)
app/scan/page.tsx                      (кнопка «Начать»: btn-emerald-cta, h-16)
app/scan/photos/page.tsx               (кнопка «Продолжить»: btn-emerald-cta)
app/scan/questionnaire/page.tsx        (кнопка «Получить разбор»: btn-emerald-cta)
app/scan/email/page.tsx                (кнопка «Получить разбор»: btn-emerald-cta)
components/result/ProgramCard.tsx      (primary CTA: btn-emerald-cta, emerald рамка/бейдж)
components/result/StickyBottomCTA.tsx  (btn-emerald-cta вместо bg-accent)
```

---

## 7. Изменения в базе данных

Новых миграций нет. Используемые таблицы (схема без изменений):
- `scan_sessions` — `email_submitted_at` используется счётчиком
- `getcourse_sync_queue` — очередь лидов

---

## 8. Переменные окружения

**Не заданы в Render (критично):**

| Переменная | Формат | Статус |
|---|---|---|
| `NEXT_PUBLIC_YANDEX_METRIKA_ID` | числовой ID | ❌ НЕ ЗАДАНА |

**Существующие:**
- `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
- `OPENROUTER_API_KEY`
- `GETCOURSE_API_KEY`, `GETCOURSE_SCHOOL_DOMAIN`
- `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID_LEADS`, `TELEGRAM_CHAT_ID_ERRORS`
- `CRON_SECRET`
- `NEXT_PUBLIC_SITE_URL` — `https://edemaskan.lid.nutritionist4day.ru`

---

## 9. Следующие шаги

**Приоритет 0 — Производительность (критично для UX):**

1. **Увеличить таймер на /scan/analyzing с 30с до 60с**
   - Файл: `app/scan/analyzing/page.tsx` — найти константу таймера, изменить на 60
   - Реальное время анализа ~60 сек, пользователь видит «0с» и думает что сломалось

2. **Апгрейд Render.com с free tier на paid**
   - Причина: free tier засыпает → cold start 10–15с → «Сессия не найдена» + медленный анализ
   - Цена: ~$7/мес. Устраняет 90% жалоб на скорость
   - Альтернатива: переехать на Railway / Fly.io (схожие цены, лучший cold start)

3. **Preload TFJS модели**
   - Сейчас модель (~5MB) грузится только когда пользователь открывает страницу результата
   - Можно начать загрузку раньше — например, на странице `/scan/analyzing`
   - Это уберёт 15–20 сек ожидания на последнем экране

**Приоритет 1 — Внешние настройки:**

4. **Задать `NEXT_PUBLIC_YANDEX_METRIKA_ID` в Render**
5. **Настроить автоматизацию в GetCourse** (IT УПДН)
   - Триггер: добавление в группу `edemaskan_leads`
   - Письмо с `{user.edm_result_url}`

**Приоритет 2 — После первой недели трафика:**

6. Проверить Supabase → `getcourse_sync_queue` — нет ли `failed_permanent`
7. Проверить Supabase → `ai_errors` — паттерны ошибок OpenRouter
8. Метрика → воронка: `landing_view` → `questionnaire_completed` → `result_view` → `cta_to_upsell`

**Приоритет 3 — Опционально:**

9. Распространить v5-копирайт на `/eye-bags`, `/face-oval`, `/legs`, `/rings`
10. Добавить IP-лимит на `/api/counter` если начнут накручивать

---

## Автоматические данные

### Последние коммиты
```
d312880 fix: scale landmark coordinates back to natural image space
d5c201a feat: apply emerald shimmer style to all scan flow CTAs
b460a45 fix: resolve Turbopack build failure for TF.js face detection
f3c12bf feat: AI face landmark zone detection on result page
0d9ae96 docs: session handoff 2026-05-18 — landing v5 complete
6d3a105 feat: live scan counter — increments on every completed scan
```

### TODO в коде
```
app/scan/analyzing/page.tsx — таймер 30с нужно изменить на 60с
```

---

## Промпт для начала следующей сессии

```
Прочитай HANDOFF.md в корне проекта.

Подтверди что понял:
1. AI landmark detection работает (коммит d312880 исправил масштабирование)
2. Главная проблема: производительность — анализ ~60с + TFJS ~30с = ~90с суммарно
3. Критические gotchas: mediapipe-stub, turbopack.resolveAlias, cache key v2, natural-image coords
4. Приоритет 0: таймер 30→60с на /scan/analyzing, апгрейд Render, preload TFJS

Затем спроси что делаем сегодня.
```
