import "server-only";
import { queryOne, execute } from "@/lib/db";

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

  try {
    // Insert with count=0 if new key, skip if already exists
    await execute(
      `INSERT INTO rate_limit_buckets (bucket_key, request_count, window_start, updated_at)
       VALUES ($1, 0, $2, $2)
       ON CONFLICT (bucket_key) DO NOTHING`,
      [key, nowIso],
    );

    const row = await queryOne<{ request_count: number; window_start: string }>(
      `SELECT request_count, window_start FROM rate_limit_buckets WHERE bucket_key = $1`,
      [key],
    );

    if (!row) return { allowed: true, remaining: maxRequests };

    // Reset window if it has expired
    if (new Date(row.window_start) < new Date(windowStart)) {
      await execute(
        `UPDATE rate_limit_buckets SET request_count = 1, window_start = $1, updated_at = $1 WHERE bucket_key = $2`,
        [nowIso, key],
      );
      return { allowed: true, remaining: maxRequests - 1 };
    }

    const count = row.request_count;

    if (count >= maxRequests) {
      return { allowed: false, remaining: 0 };
    }

    await execute(
      `UPDATE rate_limit_buckets SET request_count = $1, updated_at = $2 WHERE bucket_key = $3`,
      [count + 1, nowIso, key],
    );

    return { allowed: true, remaining: maxRequests - count - 1 };
  } catch {
    // On DB error, fail open so legitimate users aren't blocked
    return { allowed: true, remaining: maxRequests };
  }
}

// Preset limiters (SPEC §5.8)
export const RATE_LIMITS = {
  scan_start:   { maxRequests: 10, windowMs: 60 * 60 * 1000 },
  scan_analyze: { maxRequests: 5,  windowMs: 60 * 60 * 1000 },
  result_view:  { maxRequests: 60, windowMs: 60 * 60 * 1000 },
} as const;
