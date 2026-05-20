import { NextRequest, NextResponse } from "next/server";
import { execute } from "@/lib/db";
import { env } from "@/lib/env";

export async function GET(req: NextRequest) {
  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${env.CRON_SECRET}`) {
    return NextResponse.json(
      { error: { code: "UNAUTHORIZED", message: "Missing or invalid CRON_SECRET" } },
      { status: 401 },
    );
  }

  const sevenDaysAgo   = new Date(Date.now() - 7  * 24 * 60 * 60 * 1000).toISOString();
  const oneDayAgo      = new Date(Date.now() - 1  * 24 * 60 * 60 * 1000).toISOString();
  const ninetyDaysAgo  = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();

  const [deletedSessions, deletedBuckets, deletedErrors] = await Promise.all([
    execute(
      `DELETE FROM scan_sessions WHERE email_submitted_at IS NULL AND created_at < $1`,
      [sevenDaysAgo],
    ),
    execute(
      `DELETE FROM rate_limit_buckets WHERE window_start < $1`,
      [oneDayAgo],
    ),
    execute(
      `DELETE FROM ai_errors WHERE created_at < $1`,
      [ninetyDaysAgo],
    ),
  ]);

  console.log("[cron/cleanup] done", { deletedSessions, deletedBuckets, deletedErrors });

  return NextResponse.json({ deleted_sessions: deletedSessions, deleted_buckets: deletedBuckets, deleted_errors: deletedErrors });
}
