import { NextRequest, NextResponse } from "next/server";
import { queryOne } from "@/lib/db";
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

  if (!/^[A-Za-z0-9\-_]{24,48}$/.test(token)) {
    return NextResponse.json(
      { error: { code: "RESULT_NOT_FOUND", message: "Результат не найден" } },
      { status: 404 },
    );
  }

  const ip = getIp(req);

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

  const session = await queryOne<{
    ai_result:                Record<string, unknown>;
    name:                     string | null;
    special_price_expires_at: string | null;
    created_at:               string;
    red_flag:                 boolean;
  }>(
    `SELECT ai_result, name, special_price_expires_at, created_at, red_flag
     FROM scan_sessions
     WHERE result_token=$1 AND ai_result IS NOT NULL`,
    [token],
  );

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
