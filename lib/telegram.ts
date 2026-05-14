import "server-only";

const BOT_TOKEN  = process.env.TELEGRAM_BOT_TOKEN;
const CHAT_LEADS = process.env.TELEGRAM_CHAT_ID_LEADS;
const CHAT_ERRORS= process.env.TELEGRAM_CHAT_ID_ERRORS;

function maskEmail(email: string): string {
  const [local, domain] = email.split("@");
  if (!local || !domain) return "***@***";
  const first = local[0] ?? "*";
  const last  = local.length > 1 ? local[local.length - 1] : "*";
  return `${first}***${last}@${domain}`;
}

async function send(chatId: string, text: string): Promise<void> {
  if (!BOT_TOKEN || !chatId) return;

  try {
    await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ chat_id: chatId, text, parse_mode: "HTML" }),
    });
  } catch {
    console.error("[Telegram] Failed to send message");
  }
}

export async function sendLeadAlert(params: {
  name:           string;
  email:          string;
  scenario:       string;
  primaryCause:   string | null;
  redFlag:        boolean;
  sessionId:      string;
}): Promise<void> {
  if (!CHAT_LEADS) return;

  const emoji = params.redFlag ? "🚨" : "🎯";
  const causeLabel = params.primaryCause ?? "не определена";
  const masked = maskEmail(params.email);

  const text = params.redFlag
    ? `${emoji} <b>RED_FLAG</b>\nИмя: ${params.name}\nEmail: ${masked}\nСценарий: ${params.scenario}\nПричина: ${causeLabel}\nСессия: ${params.sessionId.slice(0, 8)}...`
    : `${emoji} Новый лид: <b>${params.name}</b>\nEmail: ${masked}\nСценарий: ${params.scenario}\nПричина: ${causeLabel}`;

  await send(CHAT_LEADS, text);
}

export async function sendErrorAlert(params: {
  errorType: string;
  sessionId: string;
  scenario:  string;
  attempt?:  number;
  critical?: boolean;
}): Promise<void> {
  if (!CHAT_ERRORS) return;

  const emoji = params.critical ? "🔴 CRITICAL" : "❌ AI-error";
  const text = `${emoji}: ${params.errorType}\nСессия: ${params.sessionId.slice(0, 8)}...\nСценарий: ${params.scenario}${params.attempt ? `\nПопытка: ${params.attempt}` : ""}`;

  await send(CHAT_ERRORS ?? CHAT_LEADS ?? "", text);
}
