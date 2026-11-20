import "server-only";
import mysql, { type Pool, type ResultSetHeader } from "mysql2/promise";

const g = globalThis as unknown as { __vitPool?: Pool };

/** Aiven / managed MySQL needs TLS. Provide DB_SSL_CA (PEM, "\n" escapes allowed) to verify the server certificate. */
function sslConfig() {
  if (process.env.DB_SSL !== "true") return undefined;
  const ca = process.env.DB_SSL_CA?.replace(/\\n/g, "\n").trim();
  return ca ? { ca, rejectUnauthorized: true } : { rejectUnauthorized: false };
}

export function pool(): Pool {
  if (!g.__vitPool) {
    g.__vitPool = mysql.createPool({
      host: process.env.DB_HOST || "127.0.0.1",
      port: Number(process.env.DB_PORT || 3306),
      user: process.env.DB_USER || "root",
      password: process.env.DB_PASS || "",
      database: process.env.DB_NAME || "vishnuit",
      ssl: sslConfig(),
      connectionLimit: process.env.VERCEL ? 3 : 8,
      waitForConnections: true,
      multipleStatements: false,
      timezone: "Z",
      dateStrings: true,
      connectTimeout: 5000,
    });
  }
  return g.__vitPool;
}

export async function query<T = Record<string, unknown>>(sql: string, params: unknown[] = []): Promise<T[]> {
  const [rows] = await pool().query(sql, params);
  return rows as T[];
}

export async function queryOne<T = Record<string, unknown>>(sql: string, params: unknown[] = []) {
  const rows = await query<T>(sql, params);
  return rows[0] ?? null;
}

export async function exec(sql: string, params: unknown[] = []) {
  const [res] = await pool().execute(sql, params as never[]);
  return res as ResultSetHeader;
}

/** Runs `fn` inside a transaction on one connection; rolls back if it throws. */
export async function transaction<T>(fn: (c: import("mysql2/promise").PoolConnection) => Promise<T>): Promise<T> {
  const c = await pool().getConnection();
  try {
    await c.beginTransaction();
    const out = await fn(c);
    await c.commit();
    return out;
  } catch (e) {
    await c.rollback().catch(() => {});
    throw e;
  } finally {
    c.release();
  }
}
