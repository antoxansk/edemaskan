import "server-only";
import { Pool } from "pg";

let _pool: Pool | null = null;

function getPool(): Pool {
  if (!_pool) {
    const dbUrl = (process.env.DATABASE_URL ?? "").trim();
    if (!dbUrl) {
      console.error("[db] DATABASE_URL is not set — all queries will fail");
    } else {
      // Log only the host part for diagnostics, never the password
      try {
        const u = new URL(dbUrl);
        console.log(`[db] connecting to ${u.hostname}:${u.port} as ${u.username}`);
      } catch {
        console.error("[db] DATABASE_URL is not a valid URL");
      }
    }
    const isLocal = dbUrl.includes("localhost");
    _pool = new Pool({
      connectionString:        dbUrl || undefined,
      ssl:                     isLocal ? false : { rejectUnauthorized: false },
      max:                     10,
      idleTimeoutMillis:       30_000,
      connectionTimeoutMillis: 10_000,
    });
  }
  return _pool;
}

export async function query<T extends Record<string, unknown> = Record<string, unknown>>(
  sql: string,
  params?: unknown[],
): Promise<T[]> {
  const result = await getPool().query<T>(sql, params);
  return result.rows;
}

export async function queryOne<T extends Record<string, unknown> = Record<string, unknown>>(
  sql: string,
  params?: unknown[],
): Promise<T | null> {
  const rows = await query<T>(sql, params);
  return rows[0] ?? null;
}

export async function execute(sql: string, params?: unknown[]): Promise<number> {
  const result = await getPool().query(sql, params);
  return result.rowCount ?? 0;
}
