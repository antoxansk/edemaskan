# OpenRouter Vision API — Howto

> Скопированный из практики паттерн вызова OpenRouter для Edemaskan.
> Источник истины по бизнес-логике — `SPEC.md` §5.4.

---

## Зачем OpenRouter, а не Anthropic напрямую

1. **Работает из РФ без VPN.** Anthropic API напрямую — заблокирован.
2. **Единая биллинговая точка** при возможной смене модели в будущем (Gemini, GPT-4o-vision).
3. **Prompt Caching доступен** через `cache_control: ephemeral` на системных сообщениях (актуально для нашего длинного промпта 3000+ слов).

## Базовые параметры

```
URL:     https://openrouter.ai/api/v1/chat/completions
Метод:   POST
Модель:  anthropic/claude-sonnet-4
```

## Заголовки (обязательные)

```
Authorization: Bearer ${OPENROUTER_API_KEY}
HTTP-Referer:  ${OPENROUTER_REFERER_URL}        # для аналитики на стороне OpenRouter
X-Title:       ${OPENROUTER_APP_NAME}            # отображается в дашборде OpenRouter
Content-Type:  application/json
```

`HTTP-Referer` и `X-Title` не обязательны технически, но дают видимость в дашборде OpenRouter, что важно для отладки и контроля расходов.

## Структура запроса

```jsonc
{
  "model": "anthropic/claude-sonnet-4",
  "max_tokens": 4096,
  "temperature": 0.4,
  "response_format": { "type": "json_object" },
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
        { "type": "text",      "text": "Сценарий входа: morning-face\nИмя пользователя: Марина\nОтветы опросника: {\"swelling_time\":\"morning\", ...}\n\nФотографии (4 ракурса):" },
        { "type": "image_url", "image_url": { "url": "data:image/jpeg;base64,<base64>" } },
        { "type": "image_url", "image_url": { "url": "data:image/jpeg;base64,<base64>" } },
        { "type": "image_url", "image_url": { "url": "data:image/jpeg;base64,<base64>" } },
        { "type": "image_url", "image_url": { "url": "data:image/jpeg;base64,<base64>" } },
        { "type": "text",      "text": "Верни только валидный JSON по описанному в системном промпте формату. Без markdown-обёрток, без префиксов, без комментариев." }
      ]
    }
  ]
}
```

## Параметры — почему именно так

- **`max_tokens: 4096`** — наш JSON-ответ ~1500-2500 токенов в среднем, 4096 даёт запас.
- **`temperature: 0.4`** — нужна стабильность формата + немного вариативности в формулировках personal_comment.
- **`response_format: { type: "json_object" }`** — гарантирует, что модель не вернёт `'Конечно! Вот результат:\n```json\n...'`.
- **`cache_control: ephemeral`** — кеш системного промпта на 5 минут со стороны OpenRouter. При активной нагрузке экономит ~30% на input-токенах.

## Структура ответа

```jsonc
{
  "id": "chatcmpl-...",
  "model": "anthropic/claude-sonnet-4",
  "choices": [
    {
      "index": 0,
      "finish_reason": "stop",
      "message": {
        "role": "assistant",
        "content": "{\"red_flag\":false,\"user_name\":\"Марина\", ...}"
      }
    }
  ],
  "usage": {
    "prompt_tokens": 3247,
    "completion_tokens": 1893,
    "total_tokens": 5140,
    "total_cost": 0.0287                 // в USD (float)
  }
}
```

`content` — это строка JSON. Парсим её, потом валидируем через `AiResultSchema` из `lib/validation.ts`.

## Готовая утилита `lib/openrouter.ts`

```ts
import "server-only";
import { env } from "@/lib/env";
import { AiResultSchema, type AiResult } from "@/lib/validation";
import { readFileSync } from "node:fs";
import { join } from "node:path";

// Грузим промпт один раз при холодном старте (Vercel serverless)
const SYSTEM_PROMPT = readFileSync(join(process.cwd(), "prompts", "scan-agent.md"), "utf8");

export type OpenRouterCallResult =
  | {
      ok: true;
      result: AiResult;
      usage: { prompt_tokens: number; completion_tokens: number; cost_usd: number };
      raw_content: string;
      duration_ms: number;
    }
  | {
      ok: false;
      retriable: boolean;
      error_code: "OPENROUTER_TIMEOUT" | "OPENROUTER_5XX" | "OPENROUTER_4XX" | "OPENROUTER_INVALID_JSON" | "ZOD_VALIDATION_FAILED";
      error_message: string;
      raw_response?: string;
    };

export async function callOpenRouter(args: {
  scenario: string;
  userName: string;
  answers: Record<string, string>;
  photoDataUrls: string[];   // 4 шт
  timeoutMs?: number;
}): Promise<OpenRouterCallResult> {
  const started = Date.now();
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), args.timeoutMs ?? 90_000);

  const userText =
    `Сценарий входа: ${args.scenario}\n` +
    `Имя пользователя: ${args.userName}\n` +
    `Ответы опросника: ${JSON.stringify(args.answers)}\n\n` +
    `Фотографии (4 ракурса: frontal, three_quarter_left, three_quarter_right, tilted_down):`;

  let raw_content: string | undefined;

  try {
    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      signal: controller.signal,
      headers: {
        "Authorization": `Bearer ${env.OPENROUTER_API_KEY}`,
        "HTTP-Referer":  env.OPENROUTER_REFERER_URL,
        "X-Title":       env.OPENROUTER_APP_NAME,
        "Content-Type":  "application/json",
      },
      body: JSON.stringify({
        model: env.OPENROUTER_MODEL,
        max_tokens: 4096,
        temperature: 0.4,
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content: [{ type: "text", text: SYSTEM_PROMPT, cache_control: { type: "ephemeral" } }],
          },
          {
            role: "user",
            content: [
              { type: "text", text: userText },
              ...args.photoDataUrls.map((url) => ({ type: "image_url" as const, image_url: { url } })),
              { type: "text", text: "Верни только валидный JSON по описанному формату. Без markdown-обёрток, без комментариев." },
            ],
          },
        ],
      }),
    });

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      return {
        ok: false,
        retriable: res.status >= 500 || res.status === 429,
        error_code: res.status >= 500 ? "OPENROUTER_5XX" : "OPENROUTER_4XX",
        error_message: `HTTP ${res.status}: ${body.slice(0, 500)}`,
        raw_response: body.slice(0, 4096),
      };
    }

    const data = await res.json();
    raw_content = data.choices?.[0]?.message?.content;

    if (typeof raw_content !== "string") {
      return {
        ok: false,
        retriable: true,
        error_code: "OPENROUTER_INVALID_JSON",
        error_message: "no content in response",
        raw_response: JSON.stringify(data).slice(0, 4096),
      };
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(raw_content);
    } catch {
      return {
        ok: false,
        retriable: false,                                 // парс-фейл — модель сама исправит навряд ли
        error_code: "OPENROUTER_INVALID_JSON",
        error_message: "JSON.parse failed",
        raw_response: raw_content.slice(0, 4096),
      };
    }

    const validated = AiResultSchema.safeParse(parsed);
    if (!validated.success) {
      return {
        ok: false,
        retriable: false,
        error_code: "ZOD_VALIDATION_FAILED",
        error_message: validated.error.issues.map(i => `${i.path.join(".")}: ${i.message}`).join("; "),
        raw_response: raw_content.slice(0, 4096),
      };
    }

    return {
      ok: true,
      result: validated.data,
      usage: {
        prompt_tokens:     data.usage?.prompt_tokens     ?? 0,
        completion_tokens: data.usage?.completion_tokens ?? 0,
        cost_usd:          data.usage?.total_cost        ?? 0,
      },
      raw_content,
      duration_ms: Date.now() - started,
    };

  } catch (e: any) {
    const isAbort = e?.name === "AbortError";
    return {
      ok: false,
      retriable: true,
      error_code: isAbort ? "OPENROUTER_TIMEOUT" : "OPENROUTER_5XX",
      error_message: String(e?.message ?? e),
    };
  } finally {
    clearTimeout(t);
  }
}
```

## Retry-стратегия

В вызывающем коде (route handler) — один retry с задержкой 2 секунды на `retriable: true`:

```ts
import { setTimeout as wait } from "node:timers/promises";

let attempt = 1;
let result = await callOpenRouter({ ... });
if (!result.ok && result.retriable && attempt < 2) {
  await wait(2000);
  attempt = 2;
  result = await callOpenRouter({ ... });
}
```

Не делать больше одной попытки на сервере — иначе таймаут на стороне Vercel. Если AI стабильно падает — пусть клиент пробует через UI (см. US-009).

## Стоимость (на момент мая 2026)

`anthropic/claude-sonnet-4` через OpenRouter:
- input: ~$3 / 1M токенов
- output: ~$15 / 1M токенов
- input с кешем (cache hit): ~$0.30 / 1M токенов
- Изображения: тарифицируются как ~1500 input-токенов каждое (~1024×1024 px)

Средний разбор:
- Input: 3000 текста + 4×1500 фото = 9000 токенов → $0.027
- Output: 2000 токенов → $0.030
- **Итого: ~$0.06 (≈ 5,4 ₽) за разбор**

Сверять с актуальными ценами на https://openrouter.ai/models/anthropic/claude-sonnet-4 перед запуском.

## Сжатие фото клиентом — что отправлять

После `browser-image-compression` (max 1024px, JPEG q=0.85) каждое фото = 200-500 KB. Конвертация в base64 даёт +33% объёма → 300-700 KB на фото в data URL. 4 фото в одном запросе = 1.2-2.8 MB. Vercel принимает запросы до 4.5 MB → запас есть.

Если на сервере получили фото > 800 KB после base64 — значит, клиентское сжатие не сработало, отклонить с 400.

## Тестовый вызов

Минимальный curl для проверки токена:

```bash
curl https://openrouter.ai/api/v1/chat/completions \
  -H "Authorization: Bearer $OPENROUTER_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "anthropic/claude-sonnet-4",
    "max_tokens": 100,
    "messages": [{"role":"user","content":"Ответь одним словом: работает?"}]
  }'
```

Если ответ — JSON с `choices[0].message.content` — токен живой.

## Частые ошибки

| Симптом | Причина | Что делать |
|---------|---------|-----------|
| `401 Unauthorized` | Невалидный `OPENROUTER_API_KEY` | Проверить env, заголовок Authorization |
| `404 No endpoints found for model` | Опечатка в имени модели | Использовать ровно `anthropic/claude-sonnet-4` |
| `400 Image too large` | Фото > 5 MB в data URL | Усилить клиентское сжатие |
| `response_format unsupported` | Старая модель/провайдер | Убрать `response_format`, оставить инструкцию в тексте |
| Текст вместо JSON | `response_format` не сработал | Парсить с `JSON.parse` после извлечения через regex `/\{[\s\S]*\}/` |
| `429 Too Many Requests` | Лимит OpenRouter | Подождать, увеличить лимиты через support |

## Когда обновлять модель

Если выходит новая Claude (Sonnet 4.5/5) — поменять только `OPENROUTER_MODEL` в env. Промпт `scan-agent.md` совместим с любой Claude-моделью с vision. Перед сменой — прогнать 20-30 тестовых разборов и сверить с методологом.
