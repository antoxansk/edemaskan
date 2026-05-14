import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "node:crypto";
import { supabaseAdmin } from "@/lib/supabase/server";
import { StartScanRequest } from "@/lib/validation";
import { checkRateLimit, RATE_LIMITS } from "@/lib/rate-limit";

function getIp(req: NextRequest): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]?.trim() ?? "unknown";
  return "unknown";
}

export async function POST(req: NextRequest) {
  const ip = getIp(req);

  // Rate limit: 10 starts/hour per IP
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

  const { data: session, error } = await supabaseAdmin
    .from("scan_sessions")
    .insert({
      session_token,
      entry_scenario:    data.entry_scenario,
      consent_pdn:       true,
      consent_scan:      true,
      consent_timestamp: new Date().toISOString(),
      utm_source:        data.utm?.utm_source   ?? null,
      utm_medium:        data.utm?.utm_medium   ?? null,
      utm_campaign:      data.utm?.utm_campaign ?? null,
      utm_content:       data.utm?.utm_content  ?? null,
      utm_term:          data.utm?.utm_term     ?? null,
      referer:           data.referer           ?? null,
      ip_address:        ip,
      user_agent:        req.headers.get("user-agent") ?? null,
      funnel_stage:      "started",
    })
    .select("id")
    .single();

  if (error || !session) {
    console.error("[scan/start] DB insert failed:", error?.message);
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "Не удалось создать сессию" } },
      { status: 500 },
    );
  }

  return NextResponse.json({ success: true, session_id: session.id, session_token });
}
