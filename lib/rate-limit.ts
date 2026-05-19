import "server-only";
import { supabaseAdmin } from "@/lib/supabase/server";

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
}

/**
 * Postgres-based sliding window rate limiter (SPEC §5.8).
 * Uses rate_limit_buckets table — no Redis required.
 */
export async function checkRateLimit(
  key: string,
  maxRequests: number,
  windowMs: number,
): Promise<RateLimitResult> {
  const now = new Date();
  const windowStart = new Date(now.getTime() - windowMs).toISOString();
  const nowIso = now.toISOString();

  // Ensure row exists — insert with count=0 if new, do nothing if exists
  await supabaseAdmin
    .from("rate_limit_buckets")
    .upsert(
      {
        bucket_key:    key,
        request_count: 0,
        window_start:  nowIso,
        updated_at:    nowIso,
      },
      { onConflict: "bucket_key", ignoreDuplicates: true },
    );

  // Read current state
  const { data, error } = await supabaseAdmin
    .from("rate_limit_buckets")
    .select("request_count, window_start")
    .eq("bucket_key", key)
    .single();

  if (error || !data) {
    // On DB error, fail open so legitimate users aren't blocked
    return { allowed: true, remaining: maxRequests };
  }

  // Reset window if it has expired
  if (data.window_start < windowStart) {
    await supabaseAdmin
      .from("rate_limit_buckets")
      .update({ request_count: 1, window_start: nowIso, updated_at: nowIso })
      .eq("bucket_key", key);
    return { allowed: true, remaining: maxRequests - 1 };
  }

  const count = data.request_count as number;

  if (count >= maxRequests) {
    return { allowed: false, remaining: 0 };
  }

  // Increment counter
  await supabaseAdmin
    .from("rate_limit_buckets")
    .update({ request_count: count + 1, updated_at: nowIso })
    .eq("bucket_key", key);

  return { allowed: true, remaining: maxRequests - count - 1 };
}

// Preset limiters (SPEC §5.8)
export const RATE_LIMITS = {
  scan_start:   { maxRequests: 10, windowMs: 60 * 60 * 1000 },        // 10/hour
  scan_analyze: { maxRequests: 5,  windowMs: 60 * 60 * 1000 },        // 5/hour
  result_view:  { maxRequests: 60, windowMs: 60 * 60 * 1000 },        // 60/hour
} as const;
