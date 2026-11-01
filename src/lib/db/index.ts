import { mkdir } from "node:fs/promises";
import path from "node:path";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import * as schema from "./schema";
import { ensureReferenceData } from "./seed";

/**
 * Satu tipe untuk dua driver: node-postgres (Neon/Supabase) dan PGlite (lokal).
 * API query builder Drizzle-nya identik.
 */
export type Db = NodePgDatabase<typeof schema>;

type GlobalWithDb = typeof globalThis & { __pantauPanganDb?: Promise<Db> };
const globalWithDb = globalThis as GlobalWithDb;

/** True jika DATABASE_URL berisi URL Postgres; selain itu dipakai PGlite lokal. */
export function usesExternalPostgres(): boolean {
  return /^postgres(ql)?:\/\//.test(process.env.DATABASE_URL ?? "");
}

/**
 * Koneksi dibuat secara lazy (saat query pertama), bukan saat modul di-import,
 * supaya proses build yang hanya meng-import modul tidak membuka database.
 */
export function getDb(): Promise<Db> {
  if (!globalWithDb.__pantauPanganDb) {
    globalWithDb.__pantauPanganDb = createDb().catch((error: unknown) => {
      globalWithDb.__pantauPanganDb = undefined;
      throw error;
    });
  }
  return globalWithDb.__pantauPanganDb;
}

async function createDb(): Promise<Db> {
  if (usesExternalPostgres()) {
    const [pgModule, { drizzle }, { attachDatabasePool }] = await Promise.all([
      import("pg"),
      import("drizzle-orm/node-postgres"),
      import("@vercel/functions/db-connections"),
    ]);
    const Pool = pgModule.Pool ?? (pgModule as unknown as { default: typeof pgModule }).default.Pool;
    // Serverless (Vercel Fluid compute): koneksi idle ditutup setelah 5 detik (saran Vercel), dan
    // attachDatabasePool menahan instance sebentar supaya koneksi itu benar-benar ditutup sebelum
    // instance dibekukan. Di luar runtime Vercel, attachDatabasePool tidak melakukan apa-apa.
    const pool = new Pool({ connectionString: process.env.DATABASE_URL, max: 5, idleTimeoutMillis: 5_000 });
    attachDatabasePool(pool);
    // Database bisa memutus koneksi yang sedang idle (mis. Neon tidur setelah lama tidak dipakai).
    // Tanpa listener ini, node-postgres melempar error yang tidak tertangani dan fungsi bisa crash.
    pool.on("error", (error) => console.error("[db] koneksi idle terputus:", error.message));
    return drizzle(pool, { schema });
  }

  if (process.env.VERCEL) {
    throw new Error("DATABASE_URL (Postgres dari Neon/Supabase) wajib diisi saat berjalan di Vercel.");
  }

  // PGlite: Postgres tanpa server yang disimpan di folder lokal.
  // PGlite hanya mendukung satu koneksi, jadi folder ini hanya boleh dibuka satu proses.
  const [{ PGlite }, { drizzle }, { migrate }] = await Promise.all([
    import("@electric-sql/pglite"),
    import("drizzle-orm/pglite"),
    import("drizzle-orm/pglite/migrator"),
  ]);
  // Jalur ini hanya dipakai di lokal (tidak pernah di Vercel): jangan ikut di-trace ke bundle server.
  const dataDir = path.resolve(/*turbopackIgnore: true*/ process.env.PGLITE_DIR || path.join(".data", "pglite"));
  await mkdir(dataDir, { recursive: true });
  const client = new PGlite(dataDir);
  await client.waitReady;
  const db = drizzle(client, { schema });
  // Lokal: migrasi & data referensi dijalankan otomatis saat database pertama dibuka.
  await migrate(db, { migrationsFolder: path.join(process.cwd(), "drizzle") });
  const typed = db as unknown as Db;
  await ensureReferenceData(typed);
  return typed;
}
