import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "node:crypto";
import { setTimeout as wait } from "node:timers/promises";
import { queryOne, execute } from "@/lib/db";
import { QuestionnaireSchema } from "@/lib/validation";
import { checkRateLimit, RATE_LIMITS } from "@/lib/rate-limit";
import { callOpenRouter } from "@/lib/openrouter";
import { sendErrorAlert } from "@/lib/telegram";

const ALLOWED_MIME = new Set(["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"]);
const MAX_PHOTO_BYTES = 4 * 1024 * 1024;

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

  const session = await queryOne<{ id: string; entry_scenario: string; name: string | null }>(
    `SELECT id, entry_scenario, name FROM scan_sessions WHERE session_token = $1`,
    [session_token],
  );

  if (!session) {
    return NextResponse.json(
      { error: { code: "INVALID_SESSION_TOKEN", message: "Сессия не найдена или истекла" } },
      { status: 401 },
    );
  }

  const sessionRl = await checkRateLimit(`session:${session.id}:scan_analyze`, 4, 24 * 60 * 60 * 1000);
  if (!sessionRl.allowed) {
    return NextResponse.json(
      { error: { code: "RATE_LIMIT_EXCEEDED", message: "Превышен лимит попыток для этой сессии." } },
      { status: 429 },
    );
  }

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

  await execute(
    `UPDATE scan_sessions SET questionnaire=$1, funnel_stage='questionnaire_done', ai_call_started_at=$2 WHERE id=$3`,
    [parsedAnswers.data, new Date().toISOString(), session.id],
  );

  const photoDataUrls = await Promise.all(photoFiles.map(fileToBase64DataUrl));

  const userName = session.name ?? "Марина";
  const answersRecord = parsedAnswers.data as Record<string, string>;

  let attempt = 1;
  let aiResult = await callOpenRouter({
    scenario:      session.entry_scenario,
    userName,
    answers:       answersRecord,
    photoDataUrls,
  });

  if (!aiResult.ok && aiResult.retriable && attempt < 2) {
    await wait(2000);
    attempt = 2;
    aiResult = await callOpenRouter({
      scenario:      session.entry_scenario,
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
    await execute(
      `INSERT INTO ai_errors (session_id, attempt, error_code, error_message, raw_response)
       VALUES ($1, $2, $3, $4, $5)`,
      [session.id, attempt, aiResult.error_code, aiResult.error_message, (aiResult.raw_response ?? "").slice(0, 4096)],
    );

    await sendErrorAlert({
      errorType: aiResult.error_code,
      sessionId: session.id,
      scenario:  session.entry_scenario,
      attempt,
      critical:  false,
    });

    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const countRow = await queryOne<{ count: string }>(
      `SELECT COUNT(*) AS count FROM ai_errors WHERE error_code=$1 AND created_at >= $2`,
      [aiResult.error_code, oneHourAgo],
    );

    if (parseInt(countRow?.count ?? "0", 10) >= 5) {
      await sendErrorAlert({
        errorType: `${aiResult.error_code} (≥5 за час)`,
        sessionId: session.id,
        scenario:  session.entry_scenario,
        critical:  true,
      });
    }

    return NextResponse.json(
      { error: { code: "AI_TEMPORARY_FAILURE", message: "Анализ временно недоступен. Попробуйте через 1-2 минуты." } },
      { status: 503 },
    );
  }

  const result_token = randomBytes(18).toString("base64url");
  const result = aiResult.result;
  const primaryCauseKey = result.primary_cause?.key ?? null;
  const redFlag = result.red_flag;

  await execute(
    `UPDATE scan_sessions SET
       ai_result=$1, ai_model=$2, ai_call_duration_ms=$3,
       ai_input_tokens=$4, ai_output_tokens=$5, ai_cost_usd_microcents=$6,
       primary_cause_key=$7, red_flag=$8, red_flag_reason=$9,
       result_token=$10, funnel_stage=$11
     WHERE id=$12`,
    [
      result,
      process.env.OPENROUTER_MODEL ?? "anthropic/claude-sonnet-4",
      aiResult.duration_ms,
      aiResult.usage.prompt_tokens,
      aiResult.usage.completion_tokens,
      Math.round(aiResult.usage.cost_usd * 100_000_000),
      primaryCauseKey,
      redFlag,
      result.red_flag_reason ?? null,
      result_token,
      redFlag ? "red_flagged" : "ai_analyzed",
      session.id,
    ],
  );

  return NextResponse.json({ success: true, result_token, ai_result: result });
}
