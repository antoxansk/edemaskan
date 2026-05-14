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
  const windowStart = new Date(Date.now() - windowMs).toISOString();

  const { data, error } = await supabaseAdmin
    .from("rate_limit_buckets")
    .upsert(
      {
        bucket_key:    key,
        request_count: 1,
        window_start:  new Date().toISOString(),
        updated_at:    new Date().toISOString(),
      },
      {
        onConflict:        "bucket_key",
        ignoreDuplicates:  false,
      },
    )
    .select("request_count, window_start")
    .single();

  if (error || !data) {
    // On DB error, allow the request (fail open)
    return { allowed: true, remaining: maxRequests };
  }

  // Reset window if expired
  if (data.window_start < windowStart) {
    await supabaseAdmin
      .from("rate_limit_buckets")
      .update({ request_count: 1, window_start: new Date().toISOString() })
      .eq("bucket_key", key);

    return { allowed: true, remaining: maxRequests - 1 };
  }

  const count = data.request_count as number;

  if (count > maxRequests) {
    return { allowed: false, remaining: 0 };
  }

  // Increment
  await supabaseAdmin
    .from("rate_limit_buckets")
    .update({ request_count: count + 1 })
    .eq("bucket_key", key);

  return { allowed: true, remaining: maxRequests - count };
}

// Preset limiters (SPEC §5.8)
export const RATE_LIMITS = {
  scan_start:   { maxRequests: 10, windowMs: 60 * 60 * 1000 },        // 10/hour
  scan_analyze: { maxRequests: 5,  windowMs: 60 * 60 * 1000 },        // 5/hour
  result_view:  { maxRequests: 60, windowMs: 60 * 60 * 1000 },        // 60/hour
} as const;
