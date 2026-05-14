import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";
import { sendToGetcourse, type GetcoursePayload } from "@/lib/getcourse";
import { sendErrorAlert } from "@/lib/telegram";
import { env } from "@/lib/env";

export async function GET(req: NextRequest) {
  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${env.CRON_SECRET}`) {
    return NextResponse.json(
      { error: { code: "UNAUTHORIZED", message: "Missing or invalid CRON_SECRET" } },
      { status: 401 },
    );
  }

  const now = new Date().toISOString();

  const { data: rows } = await supabaseAdmin
    .from("getcourse_sync_queue")
    .select("*")
    .in("status", ["pending", "failed_temporary"])
    .lte("next_retry_at", now)
    .order("next_retry_at", { ascending: true })
    .limit(20);

  const counters = { processed: 0, synced: 0, failed_temporary: 0, failed_permanent: 0 };

  for (const row of rows ?? []) {
    counters.processed++;
    const newAttempts = (row.attempts as number) + 1;

    await supabaseAdmin
      .from("getcourse_sync_queue")
      .update({
        status:            "in_progress",
        attempts:          newAttempts,
        last_attempted_at: new Date().toISOString(),
      })
      .eq("id", row.id);

    const result = await sendToGetcourse(row.payload as GetcoursePayload);

    if (result.ok) {
      counters.synced++;
      await supabaseAdmin
        .from("getcourse_sync_queue")
        .update({
          status:             "synced",
          synced_at:          new Date().toISOString(),
          getcourse_lead_id:  result.lead_id,
        })
        .eq("id", row.id);

      await supabaseAdmin
        .from("scan_sessions")
        .update({
          getcourse_status:    "synced",
          getcourse_lead_id:   result.lead_id,
          getcourse_synced_at: new Date().toISOString(),
        })
        .eq("id", row.session_id);

      continue;
    }

    const maxAttempts = row.max_attempts as number;
    const exhausted = newAttempts >= maxAttempts;
    const permanent = !result.retriable || exhausted;

    if (permanent) {
      counters.failed_permanent++;
      await supabaseAdmin
        .from("getcourse_sync_queue")
        .update({ status: "failed_permanent", last_error: result.error })
        .eq("id", row.id);

      await supabaseAdmin
        .from("scan_sessions")
        .update({ getcourse_status: "failed" })
        .eq("id", row.session_id);

      await sendErrorAlert({
        errorType: `GetCourse failed_permanent: ${result.error}`,
        sessionId: row.session_id as string,
        scenario:  "getcourse-retry",
        attempt:   newAttempts,
        critical:  true,
      });
    } else {
      counters.failed_temporary++;
      const backoffMs = Math.pow(newAttempts, 2) * 60_000;
      const nextRetryAt = new Date(Date.now() + backoffMs).toISOString();

      await supabaseAdmin
        .from("getcourse_sync_queue")
        .update({
          status:        "failed_temporary",
          last_error:    result.error,
          next_retry_at: nextRetryAt,
        })
        .eq("id", row.id);
    }
  }

  return NextResponse.json(counters);
}
