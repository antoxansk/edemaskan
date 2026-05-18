import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";

// Base count representing scans before we started tracking
const BASE_COUNT = 327;

export async function GET() {
  const { count, error } = await supabaseAdmin
    .from("scan_sessions")
    .select("*", { count: "exact", head: true })
    .not("email_submitted_at", "is", null);

  if (error) {
    // Return base count on error — never show 0
    return NextResponse.json({ count: BASE_COUNT }, {
      headers: { "Cache-Control": "public, s-maxage=30, stale-while-revalidate=60" },
    });
  }

  return NextResponse.json({ count: BASE_COUNT + (count ?? 0) }, {
    headers: { "Cache-Control": "public, s-maxage=30, stale-while-revalidate=60" },
  });
}
