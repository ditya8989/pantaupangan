# PantauPangan

Pelacak harga bahan pokok Indonesia: harga terbaru per provinsi, tren 7/30/90 hari, perbandingan antarprovinsi, dan peringatan email saat harga naik. Spesifikasi lengkap ada di [PRD.md](PRD.md).

Sumber data: **PIHPS Nasional, Bank Indonesia** (harga konsumen, pasar tradisional), diambil sekali sehari lewat cron.

## Fitur

| | Fitur | Status |
|---|---|---|
| F1 | Dashboard harga terbaru: 10 komoditas, nasional + 34 provinsi, pilihan wilayah diingat | ✅ |
| F2 | Detail komoditas: grafik 7/30/90 hari, banding ≤ 3 wilayah, ringkasan, peringkat provinsi | ✅ |
| F3 | Pengambilan data terjadwal (Vercel Cron), idempoten, `fetch_logs` | ✅ |
| F4 | Peringatan email: double opt-in, maks. 1 email/hari, berhenti berlangganan satu klik | ✅ |
| F6 | Unduh CSV | ✅ |
| F8 | Bagikan ke WhatsApp (gambar Open Graph dinamis belum) | sebagian |
| F5, F7 | Ringkasan mingguan AI, peta panas provinsi | belum |

## Menjalankan di lokal

Butuh Node.js 20.9+ (diuji dengan Node 24). Tidak perlu memasang database: secara default aplikasi memakai **PGlite**, Postgres yang tersimpan di folder `.data/pglite`.

```bash
npm install
cp .env.example .env.local   # lalu isi CRON_SECRET dengan string acak
npm run dev                  # http://localhost:3000
```

Saat pertama kali dibuka, database masih kosong. Klik **"Ambil data 90 hari sekarang"** di halaman, atau jalankan perintah berikut di terminal kedua selagi server berjalan:

```bash
npm run data:fetch
```

Pengambilan pertama (90 hari × 10 komoditas) butuh ±1,5 menit. Setelah itu setiap run hanya mengambil 7 hari terakhir.

### Mode mock (tanpa internet)

Atur `DATA_SOURCE=mock` untuk data contoh yang deterministik. Pakai folder database terpisah agar tidak tercampur dengan data asli:

```bash
# .env.local
DATA_SOURCE=mock
PGLITE_DIR=.data/pglite-mock
```

### Email di lokal

Tanpa `RESEND_API_KEY`, email tidak dikirim, melainkan ditampung di **http://localhost:3000/dev/email**. Dari sana Anda bisa membuka tautan konfirmasi dan berhenti berlangganan untuk menguji alur peringatan.

### Perintah

| Perintah | Fungsi |
|---|---|
| `npm run dev` | Server development |
| `npm run build` / `npm start` | Build & jalankan mode produksi |
| `npm test` | Unit test (parsing adapter PIHPS dengan respons asli, kalkulasi harga, kondisi alert) |
| `npm run lint` / `npm run typecheck` | ESLint / TypeScript |
| `npm run data:fetch [url]` | Picu job pengambilan data lewat endpoint cron (default `http://localhost:3000`) |
| `npm run db:generate` | Buat file migrasi baru setelah mengubah `src/lib/db/schema.ts` |
| `npm run db:migrate` | Jalankan migrasi ke Postgres di `DATABASE_URL` (PGlite dimigrasi otomatis) |

> **PGlite hanya boleh dibuka satu proses.** Hentikan `npm run dev` sebelum menjalankan `npm run build` atau `npm start`. Untuk mengosongkan database lokal, hapus folder `.data/pglite` saat server mati.

## Deploy ke Vercel

1. **Database:** buat proyek gratis di [Neon](https://neon.tech) (pilih region Singapura), lalu salin *connection string* yang **pooled**. Supabase juga bisa dipakai.
2. **Email:** buat API key di [Resend](https://resend.com). Untuk mengirim ke alamat siapa pun, verifikasi domain Anda di Resend dan pakai alamat dari domain itu di `EMAIL_FROM`; alamat `onboarding@resend.dev` hanya bisa mengirim ke email akun Resend Anda sendiri. Langkah ini boleh menyusul: selama `RESEND_API_KEY` kosong, situs tetap berjalan dan halaman Peringatan menampilkan "segera hadir". Setelah mengisinya, lakukan *Redeploy*.
3. **Proyek Vercel:** push repo ini ke GitHub lalu *Import* di Vercel, atau pakai `npx vercel`. Isi Environment Variables:

   | Variabel | Isi |
   |---|---|
   | `DATABASE_URL` | connection string Neon (pooled) |
   | `CRON_SECRET` | string acak panjang (Vercel Cron mengirimkannya otomatis sebagai Bearer token) |
   | `RESEND_API_KEY`, `EMAIL_FROM` | dari langkah 2 (opsional; tanpa ini fitur peringatan nonaktif) |
   | `NEXT_PUBLIC_SITE_URL` | opsional: kosongkan untuk memakai domain produksi Vercel secara otomatis, atau isi domain Anda |
   | `DATA_SOURCE` | `pihps` |
   | `ALERT_DEV_EMAIL` | opsional: email Anda, dikabari jika fetch gagal 2× berturut-turut |

4. **Deploy.** `vercel.json` menjalankan `npm run db:migrate` sebelum build, jadi tabel dibuat otomatis. File itu juga menaruh fungsi server di region Singapura (`sin1`), dekat dengan database Neon dan server PIHPS; kalau database Anda di region lain, samakan nilai `regions`-nya. Catatan: deploy *preview* juga menjalankan migrasi ke database yang sama.
5. **Isi data awal** tanpa menunggu cron harian. Dengan `CRON_SECRET` produksi (PowerShell):

   ```powershell
   $env:CRON_SECRET="<CRON_SECRET produksi>"; npm run data:fetch -- https://<domain-anda>
   ```

   Di Vercel, satu run berhenti memulai komoditas baru setelah ±3 menit. Kalau belum selesai, skrip ini otomatis mengulang sampai 10 komoditas terambil (biasanya cukup 1 run).
6. **Cron** berjalan setiap hari pukul 02:00 UTC (09:00 WIB). Di plan Hobby, waktunya bisa bergeser dalam rentang satu jam. Riwayat run ada di tabel `fetch_logs`.

## Arsitektur singkat

- **Next.js 16 (App Router, Cache Components)**, TypeScript, Tailwind CSS 4, Recharts, Drizzle ORM, Zod, Resend.
- **Sumber data** memakai pola adapter `fetchPrices(startDate, endDate) → PriceRecord[]` di `src/lib/sources/`: `pihps` (endpoint JSON PIHPS, 1 request per komoditas untuk semua provinsi) dan `mock`.
- **Job harian** (`src/lib/jobs/fetch-prices.ts`): mengambil ulang 7 hari terakhir, atau 90 hari jika database kosong, lalu upsert ke `prices`, mencatat ke `fetch_logs`, dan mengevaluasi alert.
- **Halaman** dashboard dan detail di-prerender (ISR) dari fungsi `"use cache"` dengan tag `prices`, lalu di-revalidate oleh endpoint cron. Pengunjung tidak pernah memicu request ke PIHPS.
- **Database:** PGlite di lokal, Postgres (Neon/Supabase) di produksi. Skema di `src/lib/db/schema.ts`, migrasi di `drizzle/`.

### Catatan sumber data

Endpoint PIHPS yang dipakai adalah endpoint JSON milik frontend situs BI dan **tidak terdokumentasi resmi**, jadi formatnya bisa berubah sewaktu-waktu. Adapter memvalidasi respons dengan Zod dan menggagalkan run (tanpa menyimpan data rusak) jika format berubah. Detail investigasi ada di PRD §4. Atribusi sumber ditampilkan di footer setiap halaman.
