import { NextRequest, NextResponse } from "next/server";
import { query, execute } from "@/lib/db";
import { sendToGetcourse, type GetcoursePayload } from "@/lib/getcourse";
import { sendErrorAlert } from "@/lib/telegram";
import { env } from "@/lib/env";

type QueueRow = {
  id: string;
  session_id: string;
  payload: GetcoursePayload;
  attempts: number;
  max_attempts: number;
};

export async function GET(req: NextRequest) {
  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${env.CRON_SECRET}`) {
    return NextResponse.json(
      { error: { code: "UNAUTHORIZED", message: "Missing or invalid CRON_SECRET" } },
      { status: 401 },
    );
  }

  const now = new Date().toISOString();

  const rows = await query<QueueRow>(
    `SELECT id, session_id, payload, attempts, max_attempts
     FROM getcourse_sync_queue
     WHERE status IN ('pending','failed_temporary') AND next_retry_at <= $1
     ORDER BY next_retry_at ASC
     LIMIT 20`,
    [now],
  );

  const counters = { processed: 0, synced: 0, failed_temporary: 0, failed_permanent: 0 };

  for (const row of rows) {
    counters.processed++;
    const newAttempts = row.attempts + 1;

    await execute(
      `UPDATE getcourse_sync_queue SET status='in_progress', attempts=$1, last_attempted_at=$2 WHERE id=$3`,
      [newAttempts, new Date().toISOString(), row.id],
    );

    const result = await sendToGetcourse(row.payload);

    if (result.ok) {
      counters.synced++;
      const syncedAt = new Date().toISOString();
      await Promise.all([
        execute(
          `UPDATE getcourse_sync_queue SET status='synced', synced_at=$1, getcourse_lead_id=$2 WHERE id=$3`,
          [syncedAt, result.lead_id, row.id],
        ),
        execute(
          `UPDATE scan_sessions SET getcourse_status='synced', getcourse_lead_id=$1, getcourse_synced_at=$2 WHERE id=$3`,
          [result.lead_id, syncedAt, row.session_id],
        ),
      ]);
      continue;
    }

    const exhausted = newAttempts >= row.max_attempts;
    const permanent = !result.retriable || exhausted;

    if (permanent) {
      counters.failed_permanent++;
      await Promise.all([
        execute(
          `UPDATE getcourse_sync_queue SET status='failed_permanent', last_error=$1 WHERE id=$2`,
          [result.error, row.id],
        ),
        execute(
          `UPDATE scan_sessions SET getcourse_status='failed' WHERE id=$1`,
          [row.session_id],
        ),
      ]);
      await sendErrorAlert({
        errorType: `GetCourse failed_permanent: ${result.error}`,
        sessionId: row.session_id,
        scenario:  "getcourse-retry",
        attempt:   newAttempts,
        critical:  true,
      });
    } else {
      counters.failed_temporary++;
      const backoffMs = Math.pow(newAttempts, 2) * 60_000;
      const nextRetryAt = new Date(Date.now() + backoffMs).toISOString();
      await execute(
        `UPDATE getcourse_sync_queue SET status='failed_temporary', last_error=$1, next_retry_at=$2 WHERE id=$3`,
        [result.error, nextRetryAt, row.id],
      );
    }
  }

  return NextResponse.json(counters);
}
