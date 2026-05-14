import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";
import { env } from "@/lib/env";

export async function GET(req: NextRequest) {
  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${env.CRON_SECRET}`) {
    return NextResponse.json(
      { error: { code: "UNAUTHORIZED", message: "Missing or invalid CRON_SECRET" } },
      { status: 401 },
    );
  }

  // Delete incomplete sessions older than 7 days (no email = not a lead)
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const { count: deletedSessions } = await supabaseAdmin
    .from("scan_sessions")
    .delete({ count: "exact" })
    .is("email_submitted_at", null)
    .lt("created_at", sevenDaysAgo);

  // Delete expired rate limit buckets older than 24h
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { count: deletedBuckets } = await supabaseAdmin
    .from("rate_limit_buckets")
    .delete({ count: "exact" })
    .lt("window_start", oneDayAgo);

  // Delete AI errors older than 90 days
  const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();
  const { count: deletedErrors } = await supabaseAdmin
    .from("ai_errors")
    .delete({ count: "exact" })
    .lt("created_at", ninetyDaysAgo);

  console.log("[cron/cleanup] done", { deletedSessions, deletedBuckets, deletedErrors });

  return NextResponse.json({
    deleted_sessions: deletedSessions ?? 0,
    deleted_buckets:  deletedBuckets  ?? 0,
    deleted_errors:   deletedErrors   ?? 0,
  });
}
