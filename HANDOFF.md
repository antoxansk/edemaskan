# HANDOFF.md — Edemaskan

> Сгенерировано: 2026-05-16
> Проект: Edemaskan — AI-сканер отёчности лица (лид-магнит УПДН)
> Деплой: https://edemaskan.lid.nutritionist4day.ru

---

## 1. Статус проекта

- **Этап:** Deploy (продакшн, принимает трафик)
- **Готовность:** ~90% — код полностью готов, остались внешние настройки
- **Последний коммит:** `a9a4ff6 feat: wire up Yandex.Metrika counter + analytics events`
- **Ветка:** main
- **Хостинг:** Render.com (free tier, keep-alive через cron-job.org)
- **Репозиторий:** github.com/antoxansk/edemaskan

---

## 2. Что сделано в этой сессии

| Задача | Статус | Файлы |
|--------|--------|-------|
| Деплой на Render.com | Завершено | — (через GitHub) |
| Фикс "Не удалось создать сессию" (неверный DB ключ) | Завершено | Render Environment |
| Фикс "фото слишком большое" — отправлялся оригинал вместо сжатого | Завершено | `lib/photo-compression.ts`, `app/scan/photos/page.tsx` |
| Фикс ZOD_VALIDATION_FAILED — zone_analysis не nullable | Завершено | `lib/validation.ts` |
| Фикс layout consent-чекбоксов на десктопе | Завершено | `app/scan/page.tsx` |
| QR-код на desktop-fallback | Завершено | `app/scan/desktop-fallback/page.tsx` |
| Фикс QR — использует window.location.origin вместо env var | Завершено | `app/scan/desktop-fallback/page.tsx` |
| Иллюстрации поз для фото-слотов | Завершено | `components/scan/photo-pose-illustration.tsx` (новый) |
| Оверлей фото пользователя с зонами на странице результата | Завершено | `components/scan/face-diagram.tsx` (переписан) |
| Таймер обратного отсчёта на странице анализа | Завершено | `app/scan/analyzing/page.tsx` |
| Подключение Яндекс.Метрики (компонент + события) | Завершено (ждёт env var) | `lib/ym.ts`, `components/shared/yandex-metrika.tsx`, `components/shared/landing-tracker.tsx` |
| Кастомный домен edemaskan.lid.nutritionist4day.ru | Завершено | Render Custom Domains + DNS |
| Cron-job.org: Keep Alive (каждые 10 мин) | Завершено | cron-job.org |
| Cron-job.org: GetCourse Retry (каждые 5 мин) | Завершено | cron-job.org |
| Cron-job.org: Cleanup (ежедневно в 3:00) | Завершено | cron-job.org |
| Настройка автоматизации GetCourse | Не начато (задача для IT УПДН) | — |
| Дизайн-правки (усиление UI) | Не начато (детали не переданы) | — |

---

## 3. Архитектурные решения

### Фото никогда не хранятся (И-1)
- **Почему:** юридическое и этическое требование УПДН
- **Как работает:** фото → base64 → OpenRouter → ответ → buffer.fill(0) → null
- **Не менять:** любое промежуточное хранение фото — критический нарушитель

### Анонимные пользователи без регистрации (И-3)
- **Почему:** снижение барьера входа, лид-магнит не требует аккаунта
- **Доступ к результату:** через `result_token` (24 символа base64url) в URL `/r/[token]`

### QR-код использует window.location.origin
- **Почему:** `NEXT_PUBLIC_SITE_URL` статична и может указывать на нерабочий домен при смене хостинга
- **Файл:** `app/scan/desktop-fallback/page.tsx` — `useEffect(() => setScanUrl(window.location.origin + ...))`
- **Не менять:** возврат к env var сломает QR при смене домена

### zone_analysis nullable в Zod-схеме
- **Почему:** AI возвращает null когда на фото не женщина (red_flag случай)
- **Файл:** `lib/validation.ts` — `zone_analysis: z.object({...}).nullable()`
- **Не менять:** без nullable() ZOD_VALIDATION_FAILED на ~10% запросов

### compressPhoto возвращает {file, dataUrl, sizeBytes}
- **Почему:** нужен сжатый File объект для отправки в API (не оригинальный файл)
- **Файл:** `lib/photo-compression.ts`
- **Критично:** `setPhoto(slot, compressed.file, ...)` — именно `compressed.file`, не оригинальный `file`

### Яндекс.Метрика gracefully no-ops без env var
- **Почему:** dev-среда не должна засорять статистику
- **Файл:** `components/shared/yandex-metrika.tsx` — `if (!YM_ID) return null`
- **CTA-события:** через event delegation на `document` по атрибуту `data-event`

### Render free tier + cron-job.org Keep Alive
- **Почему:** free tier засыпает через 15 мин без запросов
- **Решение:** cron-job.org пингует `/api/health` каждые 10 мин
- **Не менять:** при переходе на платный тариф Render можно отключить Keep Alive

---

## 4. Известные проблемы

| Проблема | Severity | Workaround |
|----------|----------|------------|
| `NEXT_PUBLIC_YANDEX_METRIKA_ID` не задан в Render | High | Метрика не работает, данные не собираются. Получить ID у техотдела и добавить в Render Environment |
| GetCourse автоматизация не настроена | High | Лиды попадают в GetCourse, но письмо с result_url пользователю не приходит. IT УПДН должны настроить воронку |
| Keep Alive первый запуск показал "Failed (output too large)" | Low | Одноразово — сервис спал, вернул Render loading page. Последующие запросы работают нормально |
| Дизайн не "докручен" | Medium | Пользователь обозначил что нужны правки, детали не переданы |

---

## 5. Gotchas (подводные камни)

1. **`lib/photo-compression.ts`** — функция `compressPhoto` возвращает объект `{file, dataUrl, sizeBytes}`. В `app/scan/photos/page.tsx` нужно передавать `compressed.file` в `setPhoto()`. Если передать оригинальный `file` (5-10MB), сервер вернёт ошибку "фото слишком большое" даже после сжатия.

2. **`lib/validation.ts`** — `AiResultSchema` имеет `zone_analysis: nullable`. В компонентах `zone-tags.tsx` и `result-view.tsx` обязательны null-чеки (`if (!zones) return null`). Убрать `.nullable()` → ZOD_VALIDATION_FAILED на красных флагах.

3. **`components/shared/yandex-metrika.tsx`** — компонент монтируется как client component, но `dangerouslySetInnerHTML` разрешён CLAUDE.md §5 именно для счётчика Метрики. Скрипт инициализации инлайнится в HTML при SSR. Click listener через useEffect работает только на клиенте.

4. **`app/api/cron/getcourse-retry/route.ts`** и **`cleanup/route.ts`** — требуют заголовок `Authorization: Bearer <CRON_SECRET>`. Без него возвращают 401. В cron-job.org заголовок настроен в Advanced → Headers.

5. **`app/scan/result/page.tsx`** — frontal фото берётся из React Context (ScanProvider), не из API. При прямом переходе на `/scan/result` (не через флоу) фото не будет — это корректное поведение, FaceDiagram покажет серый прямоугольник вместо фото.

6. **`app/(landings)/layout.tsx`** — содержит `<LandingPageTracker />` который стреляет `landing_view` событием. Работает только если `NEXT_PUBLIC_YANDEX_METRIKA_ID` задан. В dev — тихо молчит.

---

## 6. Файлы, изменённые в сессии

```
# Новые файлы
components/scan/photo-pose-illustration.tsx   (SVG иллюстрации 4 поз)
components/shared/yandex-metrika.tsx          (счётчик + CTA делегирование)
components/shared/landing-tracker.tsx         (landing_view событие)
lib/ym.ts                                     (ymGoal() хелпер)
app/api/health/route.ts                       (health check для Render)

# Изменённые файлы
lib/photo-compression.ts                      (добавлен File в return type)
lib/validation.ts                             (zone_analysis.nullable())
app/scan/page.tsx                             (фикс layout consent)
app/scan/photos/page.tsx                      (слоты, иллюстрации, compressed.file)
app/scan/analyzing/page.tsx                   (countdown timer)
app/scan/desktop-fallback/page.tsx            (QR через window.location.origin)
app/scan/result/page.tsx                      (frontalPhotoUrl из context, result_view событие)
app/scan/questionnaire/page.tsx               (questionnaire_completed событие)
app/(landings)/layout.tsx                     (LandingPageTracker)
app/layout.tsx                                (YandexMetrika)
components/scan/face-diagram.tsx              (полная переработка: фото + SVG оверлей)
components/scan/result-view.tsx               (frontalPhotoUrl prop, null-чек zones)
components/scan/zone-tags.tsx                 (null-чек zones)

# package.json
qrcode.react@4.2.0                            (QR-код)
```

---

## 7. Изменения в базе данных

Новых миграций в этой сессии не было.

Применённая миграция (из предыдущей сессии): `20260513120000_init.sql`
- Таблицы: `scan_sessions`, `ai_errors`, `getcourse_sync_queue`
- RLS: включён на всех таблицах, анон-пользователи прав не имеют
- Service role работает через серверные API routes

---

## 8. Переменные окружения

**Новая в этой сессии (нужно задать в Render):**

| Переменная | Формат | Статус |
|---|---|---|
| `NEXT_PUBLIC_YANDEX_METRIKA_ID` | числовой ID (например `98765432`) | ❌ НЕ ЗАДАНА — получить у техотдела |

**Существующие (напоминание, без значений):**
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

**Приоритет 1 — перед запуском трафика:**

1. **Задать `NEXT_PUBLIC_YANDEX_METRIKA_ID` в Render** (делает пользователь)
   - Получить ID счётчика у техотдела или создать самостоятельно на metrika.yandex.ru
   - Render → Environment → добавить переменную → сохранить (редеплой ~2 мин)

2. **Настроить автоматизацию в GetCourse** (делает IT УПДН)
   - Триггер: добавление в группу `edemaskan_leads`
   - Создать поле `edm_result_url` (тип: строка) в дополнительных полях
   - Письмо: тема "Ваш разбор готов", кнопка → `{user.edm_result_url}`
   - Серии для `program_base` и `program_advanced` — опционально

3. **Дизайн-правки** (делает Claude Code, после получения деталей от пользователя)
   - Пользователь обозначил необходимость улучшений — детали не переданы
   - Ждать конкретного ТЗ

**Приоритет 2 — после первой недели трафика:**

4. Проверить Supabase → таблица `getcourse_sync_queue` — нет ли `failed_permanent`
5. Проверить Supabase → таблица `ai_errors` — нет ли паттернов ошибок OpenRouter
6. Яндекс.Метрика → смотреть воронку: `landing_view` → `questionnaire_completed` → `result_view` → `cta_to_upsell`

**Зависимости:**
- Метрика не работает → нет данных по конверсии → нельзя оптимизировать
- GetCourse не настроен → пользователь не получает письмо с результатом → конверсия в продажу падает

---

## Автоматические данные

### git status
```
?? Fotoskan/
?? handoff-template.md
```
(рабочее дерево чистое, незакоммиченные только несвязанные файлы)

### TODO в коде
```
(нет)
```

### Последние коммиты
```
a9a4ff6 feat: wire up Yandex.Metrika counter + analytics events
c8ada94 fix: QR code uses window.location.origin instead of NEXT_PUBLIC_SITE_URL
81748aa feat: photo overlay on result, face pose illustrations, countdown timer
6d13b07 feat: add SVG face zone diagram to result page
3ec862c feat: fix consent layout, add QR code, rename photo slots
26af777 fix: allow null zone_analysis for red_flag cases (wrong audience)
d9c01ff fix: raise photo size limit to 4MB on server
f954c40 fix: send compressed file to API instead of original
```

---

## Промпт для начала следующей сессии

```
Прочитай HANDOFF.md в корне проекта.

Подтверди что понял:
1. Текущий статус (деплой, домен подключён, cron настроен)
2. Что НЕ завершено: NEXT_PUBLIC_YANDEX_METRIKA_ID, GetCourse автоматизация, дизайн
3. Критические gotchas (zone_analysis nullable, compressed.file, CRON_SECRET)
4. Следующие шаги с приоритетами

Затем спроси что делаем сегодня.
```
