# Геткурс API — Howto

> Паттерн интеграции с Геткурс CRM для Edemaskan.
> Источник истины по бизнес-логике — `SPEC.md` §5.5.

---

## Зачем Геткурс

УПДН уже использует Геткурс как CRM + email-провайдер + welcome-цепочки. Edemaskan не дублирует эту функциональность, а проталкивает лидов туда. Cтоп: внутри Edemaskan мы **не отправляем email самостоятельно** — это делает Геткурс.

## Базовые параметры

```
Базовый URL: https://${GETCOURSE_SCHOOL_DOMAIN}.getcourse.ru
Endpoint:    /pl/api/users
Метод:       POST
Content-Type: application/x-www-form-urlencoded
```

Для УПДН: `https://updn.getcourse.ru/pl/api/users`.

## Формат запроса

Геткурс — старая платформа. API ожидает **form-encoded** POST со специфичной упаковкой:

```
action=add&key=<GETCOURSE_API_KEY>&params=<base64(JSON_payload)>
```

`params` — это **base64(URL-safe нет, обычный base64) от JSON-строки** с описанием пользователя.

### Структура `JSON_payload`

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
    "user_groups": [
      "edemaskan_leads",
      "scenario_morning-face",
      "cause_lymph_stasis"
    ]
  }
}
```

### Поля — назначение

| Поле | Что это |
|------|--------|
| `user.email` | главный идентификатор; при дубле — обновляется |
| `user.first_name` | имя из формы |
| `user.addfields.*` | произвольные доп. поля (custom fields). Должны быть **заранее заведены в Геткурсе** под этими ключами |
| `system.refresh_if_exists: 1` | если email уже есть — обновить, не выдавать ошибку |
| `session.user_groups` | теги. Если тега нет — создаётся автоматически |

### Теги, которые мы прокидываем

Минимальный набор:
- `edemaskan_leads` — основной тег для всех лидов сервиса
- `scenario_<key>` — для сегментации (morning-face, eye-bags, …)
- `cause_<key>` — главная причина (lymph_stasis, parasitic_intoxication, …)
- `red_flag` — добавляется только если AI выставил red flag
- `program_base` / `program_advanced` — рекомендованная программа

Welcome-цепочки настраиваются в Геткурсе **по тегам**, не нашим кодом. Маркетолог УПДН должен иметь подготовленные цепочки:
- `edemaskan_leads` → общая welcome-серия
- `cause_*` → специализированные письма
- `red_flag` → отдельная нейтральная цепочка без upsell

## Ответ Геткурса

Формат — `application/x-www-form-urlencoded` или `text/plain`:

```
success=1&user_id=12345678&action=added
```

или при ошибке:

```
success=0&error_message=Email%20is%20invalid
```

Парсим через `new URLSearchParams(responseText)`.

## Готовая утилита `lib/getcourse.ts`

```ts
import "server-only";
import { env } from "@/lib/env";

export type GetcoursePayload = {
  email: string;
  first_name: string;
  addfields: Record<string, string>;
  user_groups: string[];
};

export type GetcourseSendResult =
  | { ok: true; lead_id: string; raw: string }
  | { ok: false; retriable: boolean; error: string; raw?: string };

export async function sendToGetcourse(payload: GetcoursePayload): Promise<GetcourseSendResult> {
  const url = `https://${env.GETCOURSE_SCHOOL_DOMAIN}.getcourse.ru/pl/api/users`;
  const jsonPayload = {
    user: {
      email: payload.email,
      first_name: payload.first_name,
      addfields: payload.addfields,
    },
    system: { refresh_if_exists: 1 },
    session: { user_groups: payload.user_groups },
  };
  const params = Buffer.from(JSON.stringify(jsonPayload), "utf8").toString("base64");
  const body = new URLSearchParams({
    action: "add",
    key:    env.GETCOURSE_API_KEY,
    params,
  });

  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), 30_000);

  try {
    const res = await fetch(url, {
      method: "POST",
      signal: controller.signal,
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: body.toString(),
    });

    const text = await res.text();
    const parsed = new URLSearchParams(text);
    const success = parsed.get("success");

    if (res.status >= 500) {
      return { ok: false, retriable: true, error: `HTTP ${res.status}`, raw: text.slice(0, 1000) };
    }

    if (success === "1") {
      return { ok: true, lead_id: parsed.get("user_id") ?? "unknown", raw: text };
    }

    return {
      ok: false,
      retriable: false,                                       // 4xx или success=0 — не повторяем
      error: parsed.get("error_message") ?? text.slice(0, 500),
      raw: text.slice(0, 1000),
    };

  } catch (e: any) {
    const isAbort = e?.name === "AbortError";
    return {
      ok: false,
      retriable: true,
      error: isAbort ? "timeout" : String(e?.message ?? e),
    };
  } finally {
    clearTimeout(t);
  }
}

export function buildPayloadFromSession(session: {
  email: string;
  name: string;
  entry_scenario: string;
  primary_cause_key: string | null;
  secondary_cause_key: string | null;
  recommended_program_key: string | null;
  red_flag: boolean;
  result_token: string;
  special_price_expires_at: string | null;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  utm_content: string | null;
}): GetcoursePayload {
  const resultUrl = `${env.NEXT_PUBLIC_SITE_URL}/r/${session.result_token}`;

  const user_groups = ["edemaskan_leads", `scenario_${session.entry_scenario}`];
  if (session.primary_cause_key)   user_groups.push(`cause_${session.primary_cause_key}`);
  if (session.recommended_program_key) user_groups.push(`program_${session.recommended_program_key}`);
  if (session.red_flag) user_groups.push("red_flag");

  return {
    email: session.email,
    first_name: session.name,
    addfields: {
      edm_entry_scenario:           session.entry_scenario,
      edm_primary_cause:            session.primary_cause_key ?? "",
      edm_secondary_cause:          session.secondary_cause_key ?? "",
      edm_recommended_program:      session.recommended_program_key ?? "",
      edm_red_flag:                 session.red_flag ? "true" : "false",
      edm_result_url:               resultUrl,
      edm_special_price_expires_at: session.special_price_expires_at ?? "",
      edm_utm_source:               session.utm_source ?? "",
      edm_utm_medium:               session.utm_medium ?? "",
      edm_utm_campaign:             session.utm_campaign ?? "",
      edm_utm_content:              session.utm_content ?? "",
    },
    user_groups,
  };
}
```

## Очередь и retry — паттерн использования

Прямой вызов из `/api/scan/submit-email` блокировал бы клиента на 1-30 секунд при сбое Геткурса. Поэтому:

1. `/api/scan/submit-email` записывает payload в `getcourse_sync_queue` со статусом `pending` и возвращает 200 пользователю.
2. Cron `/api/cron/getcourse-retry` каждые 5 минут берёт до 20 строк со статусом `pending|failed_temporary` и отправляет в Геткурс.
3. На временный сбой — статус `failed_temporary`, `next_retry_at = now() + (attempts^2 * 1 min)`.
4. На 5+ попытках или 4xx — статус `failed_permanent`, Telegram-алерт.

Псевдокод обработчика cron:

```ts
const supabase = getServiceClient();
const { data: rows } = await supabase
  .from("getcourse_sync_queue")
  .select("*")
  .in("status", ["pending", "failed_temporary"])
  .lte("next_retry_at", new Date().toISOString())
  .order("next_retry_at", { ascending: true })
  .limit(20);

for (const row of rows ?? []) {
  await supabase.from("getcourse_sync_queue").update({
    status: "in_progress",
    attempts: row.attempts + 1,
    last_attempted_at: new Date().toISOString(),
  }).eq("id", row.id);

  const result = await sendToGetcourse(row.payload as GetcoursePayload);

  if (result.ok) {
    await supabase.from("getcourse_sync_queue").update({
      status: "synced",
      synced_at: new Date().toISOString(),
      getcourse_lead_id: result.lead_id,
    }).eq("id", row.id);

    await supabase.from("scan_sessions").update({
      getcourse_status: "synced",
      getcourse_lead_id: result.lead_id,
      getcourse_synced_at: new Date().toISOString(),
    }).eq("id", row.session_id);
    continue;
  }

  // ошибка
  const exhausted = (row.attempts + 1) >= row.max_attempts;
  const permanent = !result.retriable || exhausted;
  const backoffMin = Math.pow(row.attempts + 1, 2);

  await supabase.from("getcourse_sync_queue").update({
    status: permanent ? "failed_permanent" : "failed_temporary",
    last_error: result.error,
    next_retry_at: permanent ? null : new Date(Date.now() + backoffMin * 60_000).toISOString(),
  }).eq("id", row.id);

  if (permanent) {
    await supabase.from("scan_sessions").update({ getcourse_status: "failed" }).eq("id", row.session_id);
    await sendTelegram("errors", `❌ Геткурс failed_permanent\nsession: ${row.session_id}\nerror: ${result.error}`);
  }
}
```

## Что нужно подготовить на стороне Геткурса

Перед запуском попросить методолога / IT УПДН:

1. **Custom fields в Геткурсе** под наши ключи `edm_*`. Создаются один раз через интерфейс Геткурса (Настройки → Доп. поля пользователей).
2. **Доступ к API**: в Геткурсе сгенерировать API-ключ (Настройки → Безопасность → API).
3. **Welcome-цепочки** под теги: `edemaskan_leads`, `cause_lymph_stasis`, `red_flag` и т.д. Это работа маркетолога УПДН.
4. **Шаблон письма "Ваш разбор готов"** с шорткодом для `edm_result_url` — пользователь получит ссылку на постоянную страницу с результатом.

## Тестовый вызов

```bash
PAYLOAD='{"user":{"email":"test+'$(date +%s)'@example.ru","first_name":"Тест","addfields":{"edm_entry_scenario":"morning-face"}},"system":{"refresh_if_exists":1},"session":{"user_groups":["edemaskan_leads","test_lead"]}}'
PARAMS=$(echo -n "$PAYLOAD" | base64 -w 0)

curl -X POST "https://updn.getcourse.ru/pl/api/users" \
  -d "action=add" \
  -d "key=$GETCOURSE_API_KEY" \
  --data-urlencode "params=$PARAMS"
```

Ожидаем: `success=1&user_id=...`.

## Частые ошибки

| Симптом | Причина | Что делать |
|---------|---------|-----------|
| `success=0&error_message=Invalid+API+key` | Неверный ключ | Сверить с Геткурс UI |
| `success=0&error_message=Field+...` | Custom field не создан | Создать в Геткурсе |
| Ответ — HTML | Сменился URL/домен | Проверить `GETCOURSE_SCHOOL_DOMAIN` |
| Лид создаётся, но без тегов | `user_groups` пустой массив | Прокинуть хотя бы `edemaskan_leads` |
| Лид не появляется в цепочке | Цепочка триггерится не по тому тегу | Сверить с маркетологом |

## Геткурс не отвечает > 1 часа

`failed_permanent` лиды остаются в БД, методолог через Supabase Studio может выгрузить CSV-импорт:

```sql
SELECT name, email, entry_scenario, primary_cause_key,
       'edemaskan_leads,scenario_' || entry_scenario AS tags
FROM scan_sessions
WHERE getcourse_status = 'failed'
  AND email IS NOT NULL
  AND created_at > NOW() - INTERVAL '24 hours'
ORDER BY created_at DESC;
```

И импортнуть руками в Геткурс через CSV → отметить флаг `getcourse_status = 'synced'` после.
