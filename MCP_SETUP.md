# MCP_SETUP.md — Серверы MCP для разработки Edemaskan

> MCP (Model Context Protocol) — это коннекторы, которые расширяют Claude Code прямым доступом к внешним сервисам.
> Для этого проекта рекомендуется установить 2 MCP-сервера + 1 опциональный.

---

## Обязательные

### 1. Supabase MCP

**Зачем:** Claude Code сможет напрямую читать схему БД, проверять, что миграция применилась, запрашивать данные таблиц без `psql` или Studio.

**Установка:** в Claude Code (терминал):

```bash
claude mcp add supabase \
  -e SUPABASE_ACCESS_TOKEN=<ваш токен из dashboard.supabase.com/account/tokens> \
  -- npx -y @supabase/mcp-server-supabase
```

**Что появится:** инструменты типа `mcp__supabase__list_tables`, `mcp__supabase__execute_sql`, `mcp__supabase__get_logs`.

**Безопасность:** этот MCP даёт **полный** доступ к Supabase-проекту (на правах токена). Использовать только локально, не пушить токен в репо. Для прод-окружения — отдельный read-only-токен.

**Проверка:** в Claude Code сказать "list tables in supabase" — должен вернуть схему.

### 2. Filesystem MCP (обычно встроен в Claude Code, проверить)

Уже доступен по умолчанию через тулзы `view`, `bash`, `create_file`, `str_replace`. Дополнительно ставить не нужно.

---

## Опциональный

### 3. shadcn/ui MCP (если есть)

**Зачем:** ставить shadcn-компоненты по запросу без `pnpm dlx shadcn@latest add ...` вручную.

**Установка:** на момент мая 2026 официальный shadcn MCP в beta — проверить актуальность на https://ui.shadcn.com/docs/mcp. Если есть:

```bash
claude mcp add shadcn -- npx -y @shadcn/mcp-server
```

Если нет — пропустить, ставить компоненты через CLI.

---

## Что **НЕ** ставить

- **Vercel MCP** — для деплоев лучше использовать `git push` + автодеплой через GitHub. Vercel MCP избыточен.
- **Anthropic MCP** — мы ходим в Claude через OpenRouter, не напрямую.
- **Getcourse MCP** — нет официального, написание custom MCP под этот проект — overkill.

---

## Альтернативный режим — без MCP

Если ставить MCP не хочется, всё можно делать через `bash`:

| Задача | Как без MCP |
|--------|-------------|
| Применить миграцию | `pnpm dlx supabase db push` (после `supabase link --project-ref XXX`) |
| Запрос к БД | `psql $DATABASE_URL -c "SELECT ..."` или Supabase Studio в браузере |
| Проверить логи | Vercel Dashboard / Supabase Studio Logs |
| Установить компонент shadcn | `pnpm dlx shadcn@latest add button card input` |

MCP экономит ~30% переключений контекста, но не критичен.

---

## После установки MCP

В Claude Code запустить:
```
/doctor
```

— покажет статус всех зарегистрированных MCP. Все должны быть `connected`.

Если какой-то падает с `auth error` — пересоздать токен и переустановить.
