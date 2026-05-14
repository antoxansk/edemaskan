import "server-only";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { env } from "@/lib/env";
import { AiResultSchema, type AiResultType } from "@/lib/validation";

const SYSTEM_PROMPT = readFileSync(join(process.cwd(), "prompts", "scan-agent.md"), "utf8");

export type OpenRouterCallResult =
  | {
      ok: true;
      result: AiResultType;
      usage: { prompt_tokens: number; completion_tokens: number; cost_usd: number };
      raw_content: string;
      duration_ms: number;
    }
  | {
      ok: false;
      retriable: boolean;
      error_code:
        | "OPENROUTER_TIMEOUT"
        | "OPENROUTER_5XX"
        | "OPENROUTER_4XX"
        | "OPENROUTER_INVALID_JSON"
        | "ZOD_VALIDATION_FAILED";
      error_message: string;
      raw_response?: string;
    };

export async function callOpenRouter(args: {
  scenario: string;
  userName: string;
  answers: Record<string, string>;
  photoDataUrls: string[];
  timeoutMs?: number;
}): Promise<OpenRouterCallResult> {
  const started = Date.now();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), args.timeoutMs ?? 90_000);

  const userText =
    `Сценарий входа: ${args.scenario}\n` +
    `Имя пользователя: ${args.userName}\n` +
    `Ответы опросника: ${JSON.stringify(args.answers)}\n\n` +
    `Фотографии (4 ракурса: frontal, three_quarter_left, three_quarter_right, tilted_down):`;

  try {
    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      signal: controller.signal,
      headers: {
        Authorization:  `Bearer ${env.OPENROUTER_API_KEY}`,
        "HTTP-Referer": env.OPENROUTER_REFERER_URL,
        "X-Title":      env.OPENROUTER_APP_NAME,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model:           env.OPENROUTER_MODEL,
        max_tokens:      4096,
        temperature:     0.4,
        response_format: { type: "json_object" },
        messages: [
          {
            role:    "system",
            content: [{ type: "text", text: SYSTEM_PROMPT, cache_control: { type: "ephemeral" } }],
          },
          {
            role:    "user",
            content: [
              { type: "text", text: userText },
              ...args.photoDataUrls.map((url) => ({
                type:      "image_url" as const,
                image_url: { url },
              })),
              {
                type: "text",
                text: "Верни только валидный JSON по описанному формату. Без markdown-обёрток, без комментариев.",
              },
            ],
          },
        ],
      }),
    });

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      return {
        ok:            false,
        retriable:     res.status >= 500 || res.status === 429,
        error_code:    res.status >= 500 ? "OPENROUTER_5XX" : "OPENROUTER_4XX",
        error_message: `HTTP ${res.status}: ${body.slice(0, 500)}`,
        raw_response:  body.slice(0, 4096),
      };
    }

    const data = (await res.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
      usage?: { prompt_tokens?: number; completion_tokens?: number; total_cost?: number };
    };

    const raw_content = data.choices?.[0]?.message?.content;

    if (typeof raw_content !== "string") {
      return {
        ok:            false,
        retriable:     true,
        error_code:    "OPENROUTER_INVALID_JSON",
        error_message: "no content in response",
        raw_response:  JSON.stringify(data).slice(0, 4096),
      };
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(raw_content);
    } catch {
      return {
        ok:            false,
        retriable:     false,
        error_code:    "OPENROUTER_INVALID_JSON",
        error_message: "JSON.parse failed",
        raw_response:  raw_content.slice(0, 4096),
      };
    }

    const validated = AiResultSchema.safeParse(parsed);
    if (!validated.success) {
      return {
        ok:            false,
        retriable:     false,
        error_code:    "ZOD_VALIDATION_FAILED",
        error_message: validated.error.issues
          .map((i) => `${i.path.join(".")}: ${i.message}`)
          .join("; "),
        raw_response: raw_content.slice(0, 4096),
      };
    }

    return {
      ok:     true,
      result:     validated.data,
      usage: {
        prompt_tokens:     data.usage?.prompt_tokens     ?? 0,
        completion_tokens: data.usage?.completion_tokens ?? 0,
        cost_usd:          data.usage?.total_cost        ?? 0,
      },
      raw_content,
      duration_ms: Date.now() - started,
    };
  } catch (e: unknown) {
    const err = e as { name?: string; message?: string };
    const isAbort = err?.name === "AbortError";
    return {
      ok:            false,
      retriable:     true,
      error_code:    isAbort ? "OPENROUTER_TIMEOUT" : "OPENROUTER_5XX",
      error_message: String(err?.message ?? e),
    };
  } finally {
    clearTimeout(timer);
  }
}
