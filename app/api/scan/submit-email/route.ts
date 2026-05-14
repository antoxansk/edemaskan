import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";
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

  const { session_token, result_token, name, email } = parsed.data;

  // Lookup session: must have AI result
  const { data: session } = await supabaseAdmin
    .from("scan_sessions")
    .select(
      "id, entry_scenario, primary_cause_key, red_flag, result_token, email_submitted_at, special_price_expires_at, utm_source, utm_medium, utm_campaign, utm_content, ai_result",
    )
    .eq("session_token", session_token)
    .eq("result_token", result_token)
    .not("ai_result", "is", null)
    .single();

  if (!session) {
    return NextResponse.json(
      { error: { code: "SESSION_NOT_FOUND", message: "Сессия не найдена" } },
      { status: 404 },
    );
  }

  // Idempotency: if already submitted, return existing data
  if (session.email_submitted_at) {
    return NextResponse.json({
      success:                  true,
      result_token:             session.result_token,
      special_price_expires_at: session.special_price_expires_at,
    });
  }

  const specialPriceExpiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString();

  // Update session with name/email
  await supabaseAdmin
    .from("scan_sessions")
    .update({
      name,
      email,
      email_submitted_at:       new Date().toISOString(),
      special_price_expires_at: specialPriceExpiresAt,
      funnel_stage:             "email_submitted",
      getcourse_status:         "pending",
    })
    .eq("id", session.id);

  // Extract secondary_cause and recommended_program from ai_result
  type AiResultShape = {
    secondary_cause?: { key?: string } | null;
    recommended_program?: { key?: string } | null;
  };
  const aiResult = session.ai_result as AiResultShape | null;
  const secondaryCauseKey = aiResult?.secondary_cause?.key ?? null;
  const recommendedProgramKey = aiResult?.recommended_program?.key ?? null;

  // Build GetCourse payload
  const gcPayload = buildGetcoursePayload({
    email,
    name,
    entry_scenario:           session.entry_scenario as string,
    primary_cause_key:        session.primary_cause_key as string | null,
    secondary_cause_key:      secondaryCauseKey ?? null,
    recommended_program_key:  recommendedProgramKey ?? null,
    red_flag:                 session.red_flag as boolean,
    result_token:             result_token,
    special_price_expires_at: specialPriceExpiresAt,
    utm_source:               session.utm_source as string | null,
    utm_medium:               session.utm_medium as string | null,
    utm_campaign:             session.utm_campaign as string | null,
    utm_content:              session.utm_content as string | null,
  });

  // Enqueue for GetCourse sync
  await supabaseAdmin.from("getcourse_sync_queue").insert({
    session_id:    session.id,
    payload:       gcPayload,
    status:        "pending",
    next_retry_at: new Date().toISOString(),
  });

  // Fire-and-forget Telegram lead alert
  void sendLeadAlert({
    name,
    email,
    scenario:     session.entry_scenario as string,
    primaryCause: session.primary_cause_key as string | null,
    redFlag:      session.red_flag as boolean,
    sessionId:    session.id as string,
  });

  return NextResponse.json({
    success:                  true,
    result_token,
    special_price_expires_at: specialPriceExpiresAt,
  });
}
