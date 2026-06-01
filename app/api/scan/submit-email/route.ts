import { NextRequest, NextResponse } from "next/server";
import { queryOne, execute } from "@/lib/db";
import { SubmitEmailRequest } from "@/lib/validation";
import { buildGetcoursePayload } from "@/lib/getcourse";
import { sendLeadAlert } from "@/lib/telegram";

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: { code: "VALIDATION_FAILED", message: "Невалидный JSON" } },
      { status: 400 },
    );
  }

  const parsed = SubmitEmailRequest.safeParse(body);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return NextResponse.json(
      { error: { code: "VALIDATION_FAILED", message: first?.message ?? "Ошибка валидации" } },
      { status: 400 },
    );
  }

  const { session_token, result_token, name, email, phone } = parsed.data;

  type SessionRow = {
    id: string;
    entry_scenario: string;
    primary_cause_key: string | null;
    red_flag: boolean;
    result_token: string;
    email_submitted_at: string | null;
    special_price_expires_at: string | null;
    utm_source: string | null;
    utm_medium: string | null;
    utm_campaign: string | null;
    utm_content: string | null;
    ai_result: Record<string, unknown> | null;
  };

  const session = await queryOne<SessionRow>(
    `SELECT id, entry_scenario, primary_cause_key, red_flag, result_token,
            email_submitted_at, special_price_expires_at,
            utm_source, utm_medium, utm_campaign, utm_content, ai_result
     FROM scan_sessions
     WHERE session_token=$1 AND result_token=$2 AND ai_result IS NOT NULL`,
    [session_token, result_token],
  );

  if (!session) {
    return NextResponse.json(
      { error: { code: "SESSION_NOT_FOUND", message: "Сессия не найдена" } },
      { status: 404 },
    );
  }

  if (session.email_submitted_at) {
    return NextResponse.json({
      success:                  true,
      result_token:             session.result_token,
      special_price_expires_at: session.special_price_expires_at,
    });
  }

  const specialPriceExpiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString();

  await execute(
    `UPDATE scan_sessions SET
       name=$1, email=$2, email_submitted_at=$3,
       special_price_expires_at=$4, funnel_stage='email_submitted', getcourse_status='pending'
     WHERE id=$5`,
    [name, email, new Date().toISOString(), specialPriceExpiresAt, session.id],
  );

  type AiResultShape = {
    secondary_cause?: { key?: string } | null;
    recommended_program?: { key?: string } | null;
  };
  const aiResult = session.ai_result as AiResultShape | null;
  const secondaryCauseKey = aiResult?.secondary_cause?.key ?? null;
  const recommendedProgramKey = aiResult?.recommended_program?.key ?? null;

  const gcPayload = buildGetcoursePayload({
    email,
    name,
    phone,
    entry_scenario:           session.entry_scenario,
    primary_cause_key:        session.primary_cause_key,
    secondary_cause_key:      secondaryCauseKey,
    recommended_program_key:  recommendedProgramKey,
    red_flag:                 session.red_flag,
    result_token,
    special_price_expires_at: specialPriceExpiresAt,
    utm_source:               session.utm_source,
    utm_medium:               session.utm_medium,
    utm_campaign:             session.utm_campaign,
    utm_content:              session.utm_content,
  });

  await execute(
    `INSERT INTO getcourse_sync_queue (session_id, payload, status, next_retry_at)
     VALUES ($1, $2, 'pending', $3)`,
    [session.id, gcPayload, new Date().toISOString()],
  );

  void sendLeadAlert({
    name,
    email,
    scenario:     session.entry_scenario,
    primaryCause: session.primary_cause_key,
    redFlag:      session.red_flag,
    sessionId:    session.id,
  });

  return NextResponse.json({
    success:                  true,
    result_token,
    special_price_expires_at: specialPriceExpiresAt,
  });
}
