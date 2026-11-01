import { createHash } from "node:crypto";
import { sql } from "drizzle-orm";
import type { Db } from "./db";

/**
 * Rate limit jendela-tetap yang disimpan di database (bekerja lintas instance serverless).
 * Mengembalikan `allowed: false` jika jumlah hit di jendela ini melebihi `limit`.
 */
export async function hitRateLimit(
  db: Db,
  key: string,
  limit: number,
  windowSeconds: number,
): Promise<{ allowed: boolean; count: number }> {
  const result = await db.execute<{ count: number }>(sql`
    insert into rate_limits (key, window_start, count)
    values (${key}, now(), 1)
    on conflict (key) do update set
      count = case
        when rate_limits.window_start < now() - ${windowSeconds}::int * interval '1 second' then 1
        else rate_limits.count + 1
      end,
      window_start = case
        when rate_limits.window_start < now() - ${windowSeconds}::int * interval '1 second' then now()
        else rate_limits.window_start
      end
    returning count
  `);
  const count = Number(result.rows[0]?.count ?? 1);
  return { allowed: count <= limit, count };
}

/** Hash satu arah (mis. untuk IP) agar data mentah tidak tersimpan. */
export function hashIdentifier(value: string): string {
  const salt = process.env.CRON_SECRET || "pantaupangan";
  return createHash("sha256").update(`${salt}:${value}`).digest("hex").slice(0, 32);
}
