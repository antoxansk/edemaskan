import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const secret = req.headers.get("x-cron-secret") ?? req.nextUrl.searchParams.get("secret");
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const rows = await query<{ now: string; version: string }>(
      "SELECT NOW() as now, version() as version",
    );
    const row = rows[0];

    // Check tables exist
    const tables = await query<{ tablename: string }>(
      "SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename",
    );

    // Check scan_sessions columns
    const columns = await query<{ column_name: string; data_type: string }>(
      `SELECT column_name, data_type
       FROM information_schema.columns
       WHERE table_name = 'scan_sessions' AND table_schema = 'public'
       ORDER BY ordinal_position`,
    );

    return NextResponse.json({
      ok: true,
      db_time: row?.now,
      db_version: row?.version?.split(" ")[0],
      tables: tables.map((t) => t.tablename),
      scan_sessions_columns: columns.map((c) => c.column_name),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
