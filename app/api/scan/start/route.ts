import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "node:crypto";
import { queryOne } from "@/lib/db";
import { StartScanRequest } from "@/lib/validation";
import { checkRateLimit, RATE_LIMITS } from "@/lib/rate-limit";

function getIp(req: NextRequest): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]?.trim() ?? "unknown";
  return "unknown";
}

export async function POST(req: NextRequest) {
  const ip = getIp(req);

  const rl = await checkRateLimit(
    `ip:${ip}:scan_start`,
    RATE_LIMITS.scan_start.maxRequests,
    RATE_LIMITS.scan_start.windowMs,
  );
  if (!rl.allowed) {
    return NextResponse.json(
      { error: { code: "RATE_LIMIT_EXCEEDED", message: "Слишком много запросов. Попробуйте через 5 минут." } },
      { status: 429 },
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: { code: "VALIDATION_FAILED", message: "Невалидный JSON" } },
      { status: 400 },
    );
  }

  const parsed = StartScanRequest.safeParse(body);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    const isConsent = first?.path.some((p) => String(p).startsWith("consent"));
    const code = isConsent ? "CONSENT_REQUIRED" : "VALIDATION_FAILED";
    const message = isConsent
      ? "Необходимо подтвердить обе политики"
      : (first?.message ?? "Ошибка валидации");
    return NextResponse.json({ error: { code, message } }, { status: 400 });
  }

  const data = parsed.data;
  const session_token = randomBytes(24).toString("base64url");

  try {
    const session = await queryOne<{ id: string }>(
      `INSERT INTO scan_sessions
         (session_token, entry_scenario, consent_pdn, consent_scan, consent_timestamp,
          utm_source, utm_medium, utm_campaign, utm_content, utm_term,
          referer, ip_address, user_agent, funnel_stage)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
       RETURNING id`,
      [
        session_token,
        data.entry_scenario,
        true,
        true,
        new Date().toISOString(),
        data.utm?.utm_source   ?? null,
        data.utm?.utm_medium   ?? null,
        data.utm?.utm_campaign ?? null,
        data.utm?.utm_content  ?? null,
        data.utm?.utm_term     ?? null,
        data.referer           ?? null,
        ip,
        req.headers.get("user-agent") ?? null,
        "started",
      ],
    );

    if (!session) {
      return NextResponse.json(
        { error: { code: "INTERNAL_ERROR", message: "Не удалось создать сессию" } },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true, session_id: session.id, session_token });
  } catch (e) {
    console.error("[scan/start] DB insert failed:", e);
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "Не удалось создать сессию" } },
      { status: 500 },
    );
  }
}
