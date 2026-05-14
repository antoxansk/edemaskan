# Photo Pipeline — Zero Retention

> Критический инвариант проекта: **фотографии лица никогда не сохраняются**.
> Любая реализация, нарушающая это — баг блокирующего уровня.

---

## Юридический контекст (зачем это важно)

ФЗ-152 различает биометрические ПД и обычные ПД. Биометрия — это данные, "используемые **для установления личности**" (ч.1 ст.11 ФЗ-152). Мы используем фото для анализа состояния кожи, **не для идентификации** → это не биометрия. Дополнительно подкрепляется тем, что мы **не храним** фото — что снимает вопрос полностью.

Если бы мы сохраняли фото даже на 5 минут в Supabase Storage — это уже даёт основания для классификации как ПД с обработкой, со всеми последствиями: согласие на хранение, регламент удаления, ответственность оператора и т.д. Поэтому конструктивно проще и юридически чище — **не хранить вообще**.

См. `LEGAL_TZ.md` (Важные правовые аргументы).

---

## Жизненный цикл фото — диаграмма

```
┌─────────────────────────────────────────────────────────────────────────┐
│  КЛИЕНТ (браузер Марины)                                                │
│                                                                          │
│  1. <input type="file" capture="user"> → File object                    │
│  2. browser-image-compression: max 1024px, JPEG q=0.85, ≤ 500 KB        │
│  3. Сжатый Blob → React useState (4 фото в массиве)                     │
│  4. Превью: URL.createObjectURL(blob) → revokeObjectURL на unmount      │
│                                                                          │
│  При сабмите "Получить разбор":                                          │
│  5. new FormData() с 4 файлами + session_token + answers (JSON)         │
│  6. fetch POST /api/scan/analyze                                         │
│                                                                          │
│  После ответа сервера (успех или ошибка):                                │
│  7. Сжатые blob-ы остаются в state пока пользователь на /scan/analyzing │
│     (для retry без повторной съёмки)                                    │
│  8. При навигации на /scan/email или закрытии вкладки — state очищается │
│     браузером автоматически (нет persisted storage)                     │
└─────────────────────────────────────────────────────────────────────────┘

                              ↓ multipart/form-data

┌─────────────────────────────────────────────────────────────────────────┐
│  СЕРВЕР (Vercel serverless function, ~30s lifetime)                     │
│                                                                          │
│  1. await req.formData() → File-объекты в памяти                        │
│  2. Валидация: mime ∈ allowed, size ≤ 800 KB, ровно 4 фото              │
│  3. Buffer.from(await file.arrayBuffer()) для каждого фото               │
│  4. Конвертация в base64 → data URL                                     │
│  5. Передача в callOpenRouter() как photoDataUrls[]                     │
│                                                                          │
│  Внутри callOpenRouter:                                                  │
│  6. fetch к https://openrouter.ai/.../chat/completions                  │
│     body содержит base64 фото                                            │
│  7. Получен ответ AI, валидирован Zod                                   │
│                                                                          │
│  Сохранение в БД:                                                        │
│  8. UPDATE scan_sessions SET ai_result = ..., ВСЁ КРОМЕ ФОТО            │
│                                                                          │
│  ОЧИСТКА (обязательно в finally):                                        │
│  9. for buf of photoBuffers: buf.fill(0)                                │
│  10. photoBuffers.length = 0                                            │
│  11. photoDataUrls.length = 0                                           │
│  12. Локальные переменные = null                                        │
│                                                                          │
│  Ответ клиенту:                                                          │
│  13. { success: true, result_token, ai_result } — без фото              │
│                                                                          │
│  После завершения функции — Vercel убивает контейнер,                   │
│  вся память освобождается ОС.                                            │
└─────────────────────────────────────────────────────────────────────────┘

                              ↓ ответ

┌─────────────────────────────────────────────────────────────────────────┐
│  OPENROUTER (внешний сервис)                                            │
│                                                                          │
│  Согласно политике OpenRouter (https://openrouter.ai/privacy):          │
│  - inference-провайдеры (Anthropic) не сохраняют контент по умолчанию   │
│  - OpenRouter сам не хранит content message                             │
│  - сохраняются только: счётчики токенов, длительность, model_id         │
└─────────────────────────────────────────────────────────────────────────┘
```

## Что **никогда** не должно появиться в коде

### ❌ Запрещённые паттерны

```ts
// НЕ ДЕЛАТЬ: Supabase Storage
await supabase.storage.from("photos").upload(`${session_id}/frontal.jpg`, file);

// НЕ ДЕЛАТЬ: локальная файловая система (даже /tmp)
import { writeFileSync } from "node:fs";
writeFileSync(`/tmp/${session_id}.jpg`, buffer);

// НЕ ДЕЛАТЬ: внешние blob-хранилища
await fetch("https://blob.vercel-storage.com/...", { method: "PUT", body: buffer });

// НЕ ДЕЛАТЬ: запись в БД
await supabase.from("scan_sessions").update({ photo_frontal_base64: base64 });

// НЕ ДЕЛАТЬ: длительный кеш в Redis/KV
await kv.set(`photo:${session_id}:frontal`, base64, { ex: 3600 });

// НЕ ДЕЛАТЬ: console.log фото (попадёт в Vercel logs)
console.log("processing photo", { buffer });
```

### ✅ Правильный паттерн

```ts
// app/api/scan/analyze/route.ts
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 90;

export async function POST(req: NextRequest) {
  let photoBuffers: Buffer[] = [];
  let photoDataUrls: string[] = [];

  try {
    // 1. Парс multipart
    const form = await req.formData();
    const slots = ["frontal", "three_quarter_left", "three_quarter_right", "tilted_down"];
    for (const slot of slots) {
      const file = form.get(`photo_${slot}`);
      if (!(file instanceof File)) {
        return NextResponse.json({ error: { code: "VALIDATION_FAILED", message: `Не загружено фото: ${slot}` } }, { status: 400 });
      }
      if (file.size > 800_000) {
        return NextResponse.json({ error: { code: "VALIDATION_FAILED", message: "Фото слишком большое" } }, { status: 400 });
      }
      const ab = await file.arrayBuffer();
      const buf = Buffer.from(ab);
      photoBuffers.push(buf);
      photoDataUrls.push(`data:${file.type};base64,${buf.toString("base64")}`);
    }

    // 2. Вызов AI
    const result = await callOpenRouter({
      scenario: ...,
      userName: ...,
      answers: ...,
      photoDataUrls,
    });

    // 3. Сохранение результата (БЕЗ фото)
    if (result.ok) {
      const result_token = randomBytes(24).toString("base64url");
      await supabase.from("scan_sessions").update({
        ai_result: result.result,
        ai_model: env.OPENROUTER_MODEL,
        ai_call_duration_ms: result.duration_ms,
        ai_input_tokens: result.usage.prompt_tokens,
        ai_output_tokens: result.usage.completion_tokens,
        ai_cost_usd_microcents: Math.round(result.usage.cost_usd * 100_000_000),
        primary_cause_key: result.result.primary_cause?.key ?? null,
        red_flag: result.result.red_flag,
        red_flag_reason: result.result.red_flag_reason,
        result_token,
        funnel_stage: result.result.red_flag ? "red_flagged" : "ai_analyzed",
      }).eq("id", session_id);

      return NextResponse.json({ success: true, result_token, ai_result: result.result });
    }

    // 4. Обработка ошибки AI
    await supabase.from("ai_errors").insert({
      session_id,
      attempt: 1,
      error_code: result.error_code,
      error_message: result.error_message,
      raw_response: result.raw_response ?? null,
    });

    return NextResponse.json(
      { error: { code: "AI_TEMPORARY_FAILURE", message: "Анализ временно недоступен. Попробуйте через 1-2 минуты." } },
      { status: 503 }
    );

  } finally {
    // ↓↓↓ КРИТИЧНО: очистка ↓↓↓
    for (const buf of photoBuffers) {
      buf.fill(0);
    }
    photoBuffers.length = 0;
    photoDataUrls.length = 0;
  }
}
```

## Замечания о реальной безопасности

### Что гарантирует наш код
1. Сразу после ответа AI фото-буферы зануляются — даже если контейнер живёт ещё 5 минут, в его памяти уже нет читаемых данных.
2. В БД фото не попадают (нет колонок для них).
3. В логах Vercel фото не попадают (нет `console.log` буферов).
4. На клиенте — фото живут только в React state, при навигации/закрытии вкладки исчезают.

### Что мы не контролируем (и в чём честны)
1. **Память контейнера до зануления.** Между `Buffer.from(ab)` и `buf.fill(0)` фото живёт в памяти ~30 секунд — на время AI-вызова. Если в этот момент кто-то с root-доступом к Vercel-инфраструктуре дампит память — он увидит фото. Это уровень угрозы "государство РФ vs Vercel" — за пределами модели угроз сервиса.
2. **OpenRouter и Anthropic.** Фото уходят через HTTPS, в дороге зашифрованы. На стороне OpenRouter/Anthropic, согласно их политикам, контент не сохраняется. Доверяем заявленным политикам.
3. **TLS-сертификат браузера.** Если у пользователя на устройстве MITM (родительский контроль, корпоративный прокси) — фото могут перехватываться там. Это уровень угрозы на стороне пользователя.

Эти ограничения **не пишутся** в политике использования сервиса — мы заявляем то, что контролируем: "Мы не сохраняем ваши фотографии."

## Проверки (для QA-агента)

```bash
# 1. Нет storage-вызовов
grep -rn "supabase.storage\|\.upload(" app/ lib/
# Должно быть пусто

# 2. Нет writeFile
grep -rn "writeFile\|writeFileSync\|fs\.write" app/ lib/
# Должно быть пусто

# 3. Нет blob-хранилищ
grep -rn "blob\.vercel\|@vercel/blob\|aws-sdk\|s3" app/ lib/ package.json
# Должно быть пусто

# 4. В analyze есть finally с зануением
grep -A 5 "} finally {" app/api/scan/analyze/route.ts
# Должна быть строка с .fill(0)

# 5. БД не имеет колонок под фото
psql ... -c "SELECT column_name FROM information_schema.columns WHERE table_name = 'scan_sessions';"
# Не должно быть колонок типа photo_*, image_*, *_base64

# 6. На странице результата не пытаемся отрисовать фото пользователя
grep -rn "frontal\.jpg\|photo_url\|<img.*src.*data:image" app/scan/result/ app/r/
# Должно быть пусто (мы используем SVG-иллюстрацию, см. SPEC §4.8)
```

## На странице результата — что показывать вместо фото

См. SPEC §4.8 (US-007): на странице результата отображается **стилизованная SVG-иллюстрация лица** с цветными эллипсами в зонах, где `intensity !== 'none'`. SVG — статический ассет в `public/face-template.svg`, цветные оверлеи накладываются через позиционированные элементы. Реальное фото пользователя — никогда.

Это даёт:
- честное "мы не храним фото" (без скрытых "храним 5 секунд для отображения");
- защита от ситуаций когда AI пометил неполиткорректный момент на фото — мы не возвращаем оригинал;
- единообразный UI независимо от качества снимка пользователя.
