// Memicu job pengambilan data lewat endpoint cron di server yang sedang berjalan.
// Pemakaian:
//   npm run data:fetch                         → http://localhost:3000 (server lokal harus berjalan)
//   npm run data:fetch -- https://domainmu.app → server produksi (CRON_SECRET harus sama)
//
// Job berhenti setelah batas waktu di Vercel dan melaporkan `done: false`; skrip ini
// mengulang sampai semua komoditas selesai (maksimal 6 kali).

const baseUrl = (process.argv[2] || process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/+$/, "");
const secret = process.env.CRON_SECRET;

if (!secret) {
  console.error("CRON_SECRET belum diisi. Isi di .env.local (lihat .env.example).");
  process.exit(1);
}

const endpoint = `${baseUrl}/api/cron/fetch-prices`;
console.log(`Memicu ${endpoint} …`);

for (let attempt = 1; attempt <= 6; attempt++) {
  let response;
  try {
    response = await fetch(endpoint, { headers: { Authorization: `Bearer ${secret}` } });
  } catch (error) {
    console.error(`Tidak bisa menghubungi ${baseUrl}. Apakah server sudah berjalan (npm run dev)?`);
    console.error(String(error?.cause ?? error));
    process.exit(1);
  }

  const body = await response.json().catch(() => null);
  if (!body || response.status === 401 || response.status === 500) {
    console.error(`Gagal (HTTP ${response.status}):`, body ?? (await response.text()));
    process.exit(1);
  }

  console.log(
    `Run #${body.logId} [${body.source}] status=${body.status} baris=${body.rowsUpserted} ` +
      `data terbaru=${body.latestDataDate ?? "-"} durasi=${(body.durationMs / 1000).toFixed(1)}s`,
  );
  if (body.failed?.length) for (const f of body.failed) console.log(`  gagal  ${f.commodity}: ${f.error}`);
  if (body.warnings?.length) for (const w of body.warnings) console.log(`  catatan ${w}`);
  if (body.alerts) console.log(`  alert:`, body.alerts);

  if (body.done || body.status === "error") process.exit(body.status === "error" ? 1 : 0);
  console.log(`  ${body.pending.length} komoditas tersisa, melanjutkan …`);
}
