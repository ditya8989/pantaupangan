// Menjalankan migrasi Drizzle (folder ./drizzle) ke Postgres di DATABASE_URL (Neon/Supabase).
// Dipakai di build Vercel (lihat vercel.json) atau manual: npm run db:migrate
// PGlite lokal tidak perlu ini: aplikasi memigrasinya otomatis saat database pertama dibuka.

import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import pg from "pg";

const url = process.env.DATABASE_URL ?? "";

if (!/^postgres(ql)?:\/\//.test(url)) {
  if (process.env.VERCEL) {
    console.error("DATABASE_URL (Postgres dari Neon/Supabase) wajib diisi di Vercel.");
    process.exit(1);
  }
  console.log("DATABASE_URL kosong: memakai PGlite lokal yang dimigrasi otomatis saat aplikasi berjalan. Tidak ada yang dilakukan.");
  process.exit(0);
}

const pool = new pg.Pool({ connectionString: url, max: 1 });
try {
  await migrate(drizzle(pool), { migrationsFolder: "drizzle" });
  console.log("Migrasi database selesai.");
} catch (error) {
  console.error("Migrasi gagal:", error);
  process.exitCode = 1;
} finally {
  await pool.end();
}
