import { NextResponse } from "next/server";
import { queryOne } from "@/lib/db";

const BASE_COUNT = 327;

export async function GET() {
  try {
    const row = await queryOne<{ count: string }>(
      `SELECT COUNT(*) AS count FROM scan_sessions WHERE email_submitted_at IS NOT NULL`,
    );
    const count = parseInt(row?.count ?? "0", 10);
    return NextResponse.json({ count: BASE_COUNT + count }, {
      headers: { "Cache-Control": "public, s-maxage=30, stale-while-revalidate=60" },
    });
  } catch {
    return NextResponse.json({ count: BASE_COUNT }, {
      headers: { "Cache-Control": "public, s-maxage=30, stale-while-revalidate=60" },
    });
  }
}
