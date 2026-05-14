import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "node:crypto";
import { setTimeout as wait } from "node:timers/promises";
import { supabaseAdmin } from "@/lib/supabase/server";
import { QuestionnaireSchema } from "@/lib/validation";
import { checkRateLimit, RATE_LIMITS } from "@/lib/rate-limit";
import { callOpenRouter } from "@/lib/openrouter";
import { sendErrorAlert } from "@/lib/telegram";

const ALLOWED_MIME = new Set(["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"]);
const MAX_PHOTO_BYTES = 800 * 1024;

function getIp(req: NextRequest): string {
  const fwd = req.headers.get("x-forwarded-for");
  return fwd ? (fwd.split(",")[0]?.trim() ?? "unknown") : "unknown";
}

async function fileToBase64DataUrl(file: File): Promise<string> {
  const ab = await file.arrayBuffer();
  const buf = Buffer.from(ab);
  const mime = file.type || "image/jpeg";
  const b64 = buf.toString("base64");
  buf.fill(0);
  return `data:${mime};base64,${b64}`;
}

export async function POST(req: NextRequest) {
  const ip = getIp(req);

  // Rate limit per IP
  const rl = await checkRateLimit(
    `ip:${ip}:scan_analyze`,
    RATE_LIMITS.scan_analyze.maxRequests,
    RATE_LIMITS.scan_analyze.windowMs,
  );
  if (!rl.allowed) {
    return NextResponse.json(
      { error: { code: "RATE_LIMIT_EXCEEDED", message: "Слишком много попыток. Попробуйте через час." } },
      { status: 429 },
    );
  }

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json(
      { error: { code: "VALIDATION_FAILED", message: "Невалидные данные формы" } },
      { status: 400 },
    );
  }

  const session_token = formData.get("session_token");
  const answersRaw = formData.get("answers");

  if (typeof session_token !== "string" || typeof answersRaw !== "string") {
    return NextResponse.json(
      { error: { code: "VALIDATION_FAILED", message: "session_token и answers обязательны" } },
      { status: 400 },
    );
  }

  // Lookup session
  const { data: session } = await supabaseAdmin
    .from("scan_sessions")
    .select("id, entry_scenario, name")
    .eq("session_token", session_token)
    .single();

  if (!session) {
    return NextResponse.json(
      { error: { code: "INVALID_SESSION_TOKEN", message: "Сессия не найдена или истекла" } },
      { status: 401 },
    );
  }

  // Rate limit per session (4 attempts lifetime)
  const sessionRl = await checkRateLimit(`session:${session.id}:scan_analyze`, 4, 24 * 60 * 60 * 1000);
  if (!sessionRl.allowed) {
    return NextResponse.json(
      { error: { code: "RATE_LIMIT_EXCEEDED", message: "Превышен лимит попыток для этой сессии." } },
      { status: 429 },
    );
  }

  // Parse questionnaire answers
  let answersObj: unknown;
  try {
    answersObj = JSON.parse(answersRaw);
  } catch {
    return NextResponse.json(
      { error: { code: "VALIDATION_FAILED", message: "answers — невалидный JSON" } },
      { status: 400 },
    );
  }

  const parsedAnswers = QuestionnaireSchema.safeParse(answersObj);
  if (!parsedAnswers.success) {
    return NextResponse.json(
      { error: { code: "VALIDATION_FAILED", message: "Ответы опросника невалидны" } },
      { status: 400 },
    );
  }

  // Extract and validate photos
  const photoKeys = ["photo_frontal", "photo_three_quarter_left", "photo_three_quarter_right", "photo_tilted_down"] as const;
  const photoFiles: File[] = [];

  for (const key of photoKeys) {
    const f = formData.get(key);
    if (!(f instanceof File)) {
      return NextResponse.json(
        { error: { code: "VALIDATION_FAILED", message: `Не все фото загружены (отсутствует ${key})` } },
        { status: 400 },
      );
    }
    if (!ALLOWED_MIME.has(f.type)) {
      return NextResponse.json(
        { error: { code: "VALIDATION_FAILED", message: `Недопустимый формат файла: ${f.type}` } },
        { status: 400 },
      );
    }
    if (f.size > MAX_PHOTO_BYTES) {
      return NextResponse.json(
        { error: { code: "VALIDATION_FAILED", message: "Фото слишком большое. Максимум 800 KB после сжатия." } },
        { status: 400 },
      );
    }
    photoFiles.push(f);
  }

  // Update session with questionnaire
  await supabaseAdmin
    .from("scan_sessions")
    .update({
      questionnaire:      parsedAnswers.data,
      funnel_stage:       "questionnaire_done",
      ai_call_started_at: new Date().toISOString(),
    })
    .eq("id", session.id);

  // Convert photos to base64 data URLs
  const photoDataUrls = await Promise.all(photoFiles.map(fileToBase64DataUrl));

  // Call OpenRouter (with one retry on retriable errors)
  const userName = (session.name as string | null) ?? "Марина";
  const answersRecord = parsedAnswers.data as Record<string, string>;

  let attempt = 1;
  let aiResult = await callOpenRouter({
    scenario:      session.entry_scenario as string,
    userName,
    answers:       answersRecord,
    photoDataUrls,
  });

  if (!aiResult.ok && aiResult.retriable && attempt < 2) {
    await wait(2000);
    attempt = 2;
    aiResult = await callOpenRouter({
      scenario:      session.entry_scenario as string,
      userName,
      answers:       answersRecord,
      photoDataUrls,
    });
  }

  // Purge photo data from memory
  for (let i = 0; i < photoDataUrls.length; i++) {
    photoDataUrls[i] = "";
  }
  console.log("[scan/analyze] photos_purged: true, session:", session.id);

  if (!aiResult.ok) {
    // Log error
    await supabaseAdmin.from("ai_errors").insert({
      session_id:    session.id,
      attempt,
      error_code:    aiResult.error_code,
      error_message: aiResult.error_message,
      raw_response:  (aiResult.raw_response ?? "").slice(0, 4096),
    });

    await sendErrorAlert({
      errorType:  aiResult.error_code,
      sessionId:  session.id,
      scenario:   session.entry_scenario as string,
      attempt,
      critical:   false,
    });

    // Check if 5+ errors of this type in the last hour → critical alert
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const { count } = await supabaseAdmin
      .from("ai_errors")
      .select("id", { count: "exact", head: true })
      .eq("error_code", aiResult.error_code)
      .gte("created_at", oneHourAgo);

    if ((count ?? 0) >= 5) {
      await sendErrorAlert({
        errorType: `${aiResult.error_code} (≥5 за час)`,
        sessionId: session.id,
        scenario:  session.entry_scenario as string,
        critical:  true,
      });
    }

    return NextResponse.json(
      { error: { code: "AI_TEMPORARY_FAILURE", message: "Анализ временно недоступен. Попробуйте через 1-2 минуты." } },
      { status: 503 },
    );
  }

  // Success — generate result_token and save
  const result_token = randomBytes(18).toString("base64url"); // 24 base64url chars
  const result = aiResult.result;
  const primaryCauseKey = result.primary_cause?.key ?? null;
  const redFlag = result.red_flag;

  await supabaseAdmin
    .from("scan_sessions")
    .update({
      ai_result:           result,
      ai_model:            process.env.OPENROUTER_MODEL ?? "anthropic/claude-sonnet-4",
      ai_call_duration_ms: aiResult.duration_ms,
      ai_input_tokens:     aiResult.usage.prompt_tokens,
      ai_output_tokens:    aiResult.usage.completion_tokens,
      ai_cost_usd_microcents: Math.round(aiResult.usage.cost_usd * 100_000_000),
      primary_cause_key:   primaryCauseKey,
      red_flag:            redFlag,
      red_flag_reason:     result.red_flag_reason ?? null,
      result_token,
      funnel_stage:        redFlag ? "red_flagged" : "ai_analyzed",
    })
    .eq("id", session.id);

  return NextResponse.json({ success: true, result_token, ai_result: result });
}
