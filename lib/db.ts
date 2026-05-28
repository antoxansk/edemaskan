import "server-only";
import { Pool } from "pg";

let _pool: Pool | null = null;

function getPool(): Pool {
  if (!_pool) {
    if (!process.env.DATABASE_URL) {
      console.error("[db] DATABASE_URL is not set — all queries will fail");
    }
    const isLocal = (process.env.DATABASE_URL ?? "").includes("localhost");
    _pool = new Pool({
      connectionString:      process.env.DATABASE_URL,
      ssl:                   isLocal ? false : { rejectUnauthorized: false },
      max:                   10,
      idleTimeoutMillis:     30_000,
      connectionTimeoutMillis: 5_000,
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
