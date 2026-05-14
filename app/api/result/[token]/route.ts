import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";
import { checkRateLimit, RATE_LIMITS } from "@/lib/rate-limit";

function getIp(req: NextRequest): string {
  const fwd = req.headers.get("x-forwarded-for");
  return fwd ? (fwd.split(",")[0]?.trim() ?? "unknown") : "unknown";
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;

  // Basic token format validation
  if (!/^[A-Za-z0-9\-_]{24,48}$/.test(token)) {
    return NextResponse.json(
      { error: { code: "RESULT_NOT_FOUND", message: "Результат не найден" } },
      { status: 404 },
    );
  }

  const ip = getIp(req);

  // Rate limit: 60/hour per IP
  const rl = await checkRateLimit(
    `ip:${ip}:result_view`,
    RATE_LIMITS.result_view.maxRequests,
    RATE_LIMITS.result_view.windowMs,
  );
  if (!rl.allowed) {
    return NextResponse.json(
      { error: { code: "RATE_LIMIT_EXCEEDED", message: "Слишком много запросов. Попробуйте позже." } },
      { status: 429 },
    );
  }

  const { data: session } = await supabaseAdmin
    .from("scan_sessions")
    .select("ai_result, name, special_price_expires_at, created_at, red_flag")
    .eq("result_token", token)
    .not("ai_result", "is", null)
    .single();

  if (!session) {
    return NextResponse.json(
      { error: { code: "RESULT_NOT_FOUND", message: "Результат не найден" } },
      { status: 404 },
    );
  }

  return NextResponse.json({
    success:                  true,
    ai_result:                session.ai_result,
    name:                     session.name,
    red_flag:                 session.red_flag,
    special_price_expires_at: session.special_price_expires_at,
    created_at:               session.created_at,
  });
}
