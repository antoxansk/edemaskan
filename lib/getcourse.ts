import "server-only";
import { env } from "@/lib/env";

export type GetcoursePayload = {
  email:       string;
  first_name:  string;
  addfields:   Record<string, string>;
  user_groups: string[];
};

export type GetcourseSendResult =
  | { ok: true; lead_id: string; raw: string }
  | { ok: false; retriable: boolean; error: string; raw?: string };

export async function sendToGetcourse(payload: GetcoursePayload): Promise<GetcourseSendResult> {
  const url = `https://${env.GETCOURSE_SCHOOL_DOMAIN}.getcourse.ru/pl/api/users`;
  const jsonPayload = {
    user:    { email: payload.email, first_name: payload.first_name, addfields: payload.addfields },
    system:  { refresh_if_exists: 1 },
    session: { user_groups: payload.user_groups },
  };
  const params = Buffer.from(JSON.stringify(jsonPayload), "utf8").toString("base64");
  const body = new URLSearchParams({ action: "add", key: env.GETCOURSE_API_KEY, params });

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 30_000);

  try {
    const res = await fetch(url, {
      method:  "POST",
      signal:  controller.signal,
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body:    body.toString(),
    });

    const text = await res.text();
    const parsed = new URLSearchParams(text);

    if (res.status >= 500) {
      return { ok: false, retriable: true, error: `HTTP ${res.status}`, raw: text.slice(0, 1000) };
    }

    if (parsed.get("success") === "1") {
      return { ok: true, lead_id: parsed.get("user_id") ?? "unknown", raw: text };
    }

    return {
      ok:        false,
      retriable: false,
      error:     parsed.get("error_message") ?? text.slice(0, 500),
      raw:       text.slice(0, 1000),
    };
  } catch (e: unknown) {
    const err = e as { name?: string; message?: string };
    const isAbort = err?.name === "AbortError";
    return { ok: false, retriable: true, error: isAbort ? "timeout" : String(err?.message ?? e) };
  } finally {
    clearTimeout(timer);
  }
}

export function buildGetcoursePayload(session: {
  email:                    string;
  name:                     string;
  entry_scenario:           string;
  primary_cause_key:        string | null;
  secondary_cause_key:      string | null;
  recommended_program_key:  string | null;
  red_flag:                 boolean;
  result_token:             string;
  special_price_expires_at: string | null;
  utm_source:               string | null;
  utm_medium:               string | null;
  utm_campaign:             string | null;
  utm_content:              string | null;
}): GetcoursePayload {
  const resultUrl = `${env.NEXT_PUBLIC_SITE_URL}/r/${session.result_token}`;

  const user_groups = ["edemaskan_leads", `scenario_${session.entry_scenario}`];
  if (session.primary_cause_key)        user_groups.push(`cause_${session.primary_cause_key}`);
  if (session.recommended_program_key)  user_groups.push(`program_${session.recommended_program_key}`);
  if (session.red_flag)                 user_groups.push("red_flag");

  return {
    email:      session.email,
    first_name: session.name,
    addfields: {
      edm_entry_scenario:           session.entry_scenario,
      edm_primary_cause:            session.primary_cause_key           ?? "",
      edm_secondary_cause:          session.secondary_cause_key         ?? "",
      edm_recommended_program:      session.recommended_program_key     ?? "",
      edm_red_flag:                 session.red_flag ? "true" : "false",
      edm_result_url:               resultUrl,
      edm_special_price_expires_at: session.special_price_expires_at    ?? "",
      edm_utm_source:               session.utm_source                  ?? "",
      edm_utm_medium:               session.utm_medium                  ?? "",
      edm_utm_campaign:             session.utm_campaign                ?? "",
      edm_utm_content:              session.utm_content                 ?? "",
    },
    user_groups,
  };
}
