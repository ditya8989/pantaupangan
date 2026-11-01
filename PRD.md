# PRD — PantauPangan

Pelacak harga bahan pokok Indonesia: tren harian, perbandingan antarprovinsi, dan peringatan saat harga naik.

> Dokumen ini ditujukan untuk agent coding (Claude CLI). Struktur folder, pemilihan library minor, dan detail implementasi diserahkan ke agent selama mengikuti batasan di sini.
>
> **Revisi 1 Nov 2026:** sumber data ditetapkan berdasarkan hasil investigasi (lihat §4). PIHPS Bank Indonesia menjadi sumber utama, dan cakupan wilayah menjadi nasional + 34 provinsi.

---

## 1. Latar Belakang

Harga pangan (beras, cabai, bawang, minyak goreng, telur, dll.) berfluktuasi tajam dan berdampak langsung ke rumah tangga, pedagang kecil, dan pelaku UMKM kuliner. Data resmi sebenarnya tersedia (Panel Harga Badan Pangan Nasional / Bapanas, PIHPS Bank Indonesia), tetapi tampilannya kurang ramah untuk orang awam, tidak menyimpan riwayat yang mudah dibandingkan, dan tidak punya fitur notifikasi personal.

PantauPangan mengambil data tersebut setiap hari, menyimpannya, lalu menyajikannya dengan cara yang cepat dipahami di HP.

## 2. Tujuan

- Pengguna bisa tahu harga komoditas terbaru di provinsinya dalam < 5 detik sejak membuka halaman.
- Pengguna bisa melihat tren 7 / 30 / 90 hari dan perbandingan antarprovinsi.
- Pengguna bisa berlangganan peringatan email saat harga komoditas tertentu melewati ambang yang ia tentukan.
- Seluruh sistem berjalan di Vercel (plan Hobby/gratis) + database dengan tier gratis.

### Non-goals (v1)
- Aplikasi mobile native.
- Prediksi harga berbasis machine learning.
- Data harga per kabupaten/kota atau per pasar (cukup nasional + provinsi).
- Akun pengguna dengan password (pakai email + magic link / tautan konfirmasi saja).

## 3. Target Pengguna

| Persona | Kebutuhan utama |
|---|---|
| Ibu/bapak rumah tangga | "Cabai lagi mahal nggak? Mending beli sekarang atau nanti?" |
| Pemilik warung / UMKM kuliner | Pantau bahan baku utama, dapat peringatan kalau naik. |
| Mahasiswa / jurnalis / peneliti | Lihat tren dan unduh data CSV. |

## 4. Sumber Data

> Hasil investigasi per 1 Nov 2026. Endpoint di bawah dipakai oleh frontend situs sumber dan tidak terdokumentasi resmi, jadi agent wajib memverifikasi ulang saat implementasi.

**Sumber utama: PIHPS Nasional, Bank Indonesia** (`https://www.bi.go.id/hargapangan`), diambil lewat endpoint JSON yang dipakai frontend situsnya (bukan scraping HTML).

| Aspek | Detail |
|---|---|
| Endpoint | `GET https://www.bi.go.id/hargapangan/WebSite/TabelHarga/GetGridDataKomoditas` |
| Parameter | `price_type_id=1` (harga konsumen, pasar tradisional), `comcat_id=<kode PIHPS>`, `province_id=` (kosong = semua provinsi), `regency_id=`, `showKota=false`, `showPasar=false`, `tipe_laporan=1` (harian), `start_date=YYYY-MM-DD`, `end_date=YYYY-MM-DD` |
| Autentikasi | Tidak perlu: tanpa API key, cookie, atau header khusus |
| Respons | `{"data":[{"name":"Semua Provinsi","level":0,"30/10/2026":"16,650",…},{"name":"DKI Jakarta","level":1,…}]}`. `level` 0 = nasional, 1 = provinsi; satu key per tanggal (`DD/MM/YYYY`) |
| Cakupan | Nasional + 34 provinsi, hanya hari kerja (tidak ada kolom untuk akhir pekan/libur) |
| Biaya | 1 request = 1 komoditas × semua provinsi × rentang tanggal. Terukur ±0,3 detik untuk 3 hari dan ±5 detik (52 KB) untuk 90 hari |
| Katalog | `/WebSite/TabelHarga/GetRefCommodityAndCategory` (komoditas), `/WebSite/TabelHarga/GetRefProvince` (provinsi) |

Aturan parsing:
- `"16,650"` → `16650` (integer rupiah).
- `"-"` atau kosong = tidak ada laporan → lewati, jangan simpan sebagai 0.
- Baris `level` 0 ("Semua Provinsi") → Nasional (`province_id` 0).
- Baris provinsi hanya berisi nama, bukan id → petakan berdasarkan nama ke tabel `provinces`. Nama yang tidak dikenal dicatat sebagai peringatan di `fetch_logs`, tidak menggagalkan run.
- Tidak semua komoditas dilaporkan di semua provinsi (mis. per 30 Okt 2026, cabai rawit merah tidak ada untuk Aceh dan Sumatera Barat). Tidak ada baris = "Data tidak tersedia".
- Validasi struktur respons dengan Zod. Jika strukturnya berubah, run gagal dengan error yang jelas dan tidak menyimpan data rusak.

**Komoditas v1.** Nama tampilan mengikuti PIHPS agar label tidak keliru. PIHPS tidak memakai kelas beras "premium/medium" versi Bapanas, jadi dipakai padanan terdekat.

| Kebutuhan awal | Kode PIHPS | Nama tampilan |
|---|---|---|
| Beras premium | `com_5` | Beras Kualitas Super I |
| Beras medium | `com_3` | Beras Kualitas Medium I |
| Cabai merah keriting | `com_14` | Cabai Merah Keriting |
| Cabai rawit merah | `com_16` | Cabai Rawit Merah |
| Bawang merah | `com_11` | Bawang Merah Ukuran Sedang |
| Bawang putih | `com_12` | Bawang Putih Ukuran Sedang |
| Minyak goreng | `com_18` | Minyak Goreng Kemasan Bermerk 1 |
| Gula pasir | `com_21` | Gula Pasir Lokal |
| Telur ayam ras | `com_10` | Telur Ayam Ras Segar |
| Daging ayam ras | `com_7` | Daging Ayam Ras Segar |

Satuan diambil dari field `denomination` di katalog (saat ini semuanya `kg`). Komoditas PIHPS lain (mis. minyak goreng curah, gula pasir premium, daging sapi) bisa ditambah cukup dengan menambah baris, dengan biaya +1 request per run.

**Dievaluasi, tetapi tidak dipakai di v1:**
- **Panel Harga Bapanas** (`https://panelharga.badanpangan.go.id/`): semua endpoint `api-panelhargav2.badanpangan.go.id/api/front/*` mengembalikan HTTP 401 tanpa API key. Jangan memakai key yang tertanam di JavaScript situs mereka, karena key itu tidak diterbitkan untuk kita dan bisa diganti kapan saja. Adapter Bapanas baru dibuat jika ada akses resmi dari Bapanas; keuntungannya 38 provinsi dan klasifikasi beras premium/medium.
- **API Indonesia** (`apiindonesia.id`): data harga pangannya hanya rata-rata bulanan, dan bulan terbaru yang tersedia Januari 2026. Tidak cocok untuk fitur harian.
- **Scraping HTML**: tidak diperlukan karena PIHPS menyediakan JSON.

Persyaratan:
- Implementasikan sebagai **adapter** dengan interface yang sama (`fetchPrices(startDate, endDate) → PriceRecord[]`) supaya sumber bisa diganti tanpa menyentuh bagian lain.
- Sediakan **adapter mock/seed** yang menghasilkan data realistis 90 hari ke belakang dan meniru pola PIHPS (hanya hari kerja, beberapa pasangan komoditas–provinsi kosong), agar aplikasi bisa dikembangkan dan didemokan walau sumber asli down atau berubah.
- Hormati sumber: ±10 request per run (1 per komoditas), dijalankan berurutan dengan jeda ±1 detik. `User-Agent` berisi nama aplikasi dan URL situs (mis. `PantauPangan/1.0 (+https://<domain>)`), tanpa email pribadi. Cantumkan atribusi sumber di UI.
- Simpan satu respons asli PIHPS sebagai fixture untuk unit test adapter.

## 5. Fitur

### P0 — wajib ada di v1

**F1. Dashboard harga terbaru**
- Daftar komoditas (min. 10, lihat tabel komoditas di §4).
- Untuk tiap komoditas: harga, satuan, perubahan vs hari data sebelumnya dan vs 7 hari lalu (nominal + persen), indikator naik/turun/stabil. Karena tidak ada data di akhir pekan/libur, "7 hari lalu" = harga pada tanggal data terakhir yang ≤ (tanggal data terbaru − 7 hari).
- Label "Data per <tanggal>" selalu tampil (tanggal data terakhir, bukan tanggal hari ini).
- Pemilih wilayah: Nasional atau salah satu dari 34 provinsi (cakupan PIHPS). Pilihan terakhir diingat (localStorage).
- Komoditas yang tidak dilaporkan di provinsi terpilih tampil sebagai "Data tidak tersedia", bukan Rp0.

**F2. Halaman detail komoditas**
- Grafik garis tren dengan rentang 7 / 30 / 90 hari. Hanya tanggal yang ada datanya yang diplot; hari tanpa data tidak diisi 0.
- Opsi membandingkan hingga 3 provinsi dalam satu grafik.
- Ringkasan: harga tertinggi, terendah, rata-rata dalam rentang terpilih.
- Tabel peringkat provinsi termahal & termurah pada tanggal data terakhir.

**F3. Pengambilan data terjadwal**
- Vercel Cron memanggil `/api/cron/fetch-prices` sekali sehari (pagi WIB, mis. 09:00 WIB = 02:00 UTC).
- Endpoint diamankan dengan header `Authorization: Bearer ${CRON_SECRET}`.
- Setiap run mengambil 7 hari terakhir (`fetchPrices(hari ini − 7, hari ini)`), bukan hanya hari ini, supaya data yang terlambat masuk atau direvisi tetap tertangkap. Jam publikasi data harian PIHPS belum diverifikasi; tentukan jam cron terbaik setelah melihat `fetch_logs` beberapa hari pertama.
- Idempoten: menjalankan dua kali di hari yang sama tidak menghasilkan duplikat (upsert pada `commodity_id + province_id + date`).
- Mencatat setiap run ke tabel `fetch_logs` (status, jumlah baris, tanggal data terbaru, error). Run tanpa data baru di akhir pekan/libur tetap berstatus sukses.
- Selesai dalam batas waktu eksekusi fungsi Vercel (±10 request per run).
- Backfill awal 90 hari dijalankan sekali lewat script terpisah (±10 request, ±5 detik per request).

**F4. Peringatan harga via email**
- Pengguna memasukkan email, memilih komoditas + wilayah + kondisi (`naik di atas Rp X` atau `naik lebih dari Y% dalam 7 hari`, dengan definisi "7 hari lalu" seperti di F1).
- Double opt-in: email konfirmasi wajib diklik sebelum alert aktif.
- Setelah cron selesai mengambil data, sistem mengevaluasi semua alert aktif dan mengirim email (via Resend) untuk yang terpenuhi.
- Satu alert maksimal mengirim 1 email per hari, dan hanya jika ada tanggal data baru sejak email terakhir (`last_sent_data_date`), supaya data hari Jumat tidak memicu email ulang di hari Sabtu dan Minggu. Setiap email punya tautan berhenti berlangganan satu klik.

### P1 — kalau waktu cukup

**F5. Ringkasan mingguan AI** — Teks singkat otomatis tiap Senin, mis. "Cabai rawit naik 15% minggu ini, tertinggi di Papua." Dibuat dari data agregat, bukan dari teks berita. Simpan hasilnya di DB agar tidak memanggil model AI setiap request.

**F6. Unduh CSV** — Tombol unduh data komoditas + wilayah + rentang yang sedang dilihat.

**F7. Peta panas provinsi** — Peta Indonesia berwarna sesuai harga komoditas terpilih.

**F8. Bagikan** — Tombol share ke WhatsApp dengan ringkasan teks + tautan; Open Graph image dinamis per komoditas.

## 6. Alur Pengguna Utama

1. Buka situs → lihat dashboard nasional → ganti ke provinsi sendiri.
2. Tap "Cabai rawit merah" → lihat grafik 30 hari → bandingkan dengan provinsi tetangga.
3. Tap "Pasang peringatan" → isi email & ambang → cek email → klik konfirmasi.
4. Beberapa hari kemudian menerima email saat harga melewati ambang → klik tautan → kembali ke halaman detail.

## 7. Model Data (indikatif)

```
commodities   (id, slug, name, unit, category, sort_order, source_code)
                                               -- source_code = kode PIHPS, mis. "com_16"
provinces     (id, code, name)                 -- id 0 / code "ID" = Nasional; 34 provinsi,
                                               -- name = nama persis di PIHPS (dipakai untuk pemetaan)
prices        (id, commodity_id, province_id, date, price, source, created_at)
              UNIQUE (commodity_id, province_id, date)
              INDEX  (commodity_id, province_id, date DESC)
alerts        (id, email, commodity_id, province_id, condition_type,
               threshold, confirmed_at, unsubscribed_at, last_sent_at,
               last_sent_data_date, token, created_at)
fetch_logs    (id, source, started_at, finished_at, status, rows_upserted,
               latest_data_date, error)
weekly_summaries (id, week_start, content, created_at)   -- P1
```

## 8. Arsitektur & Stack

| Lapisan | Pilihan |
|---|---|
| Framework | Next.js (App Router) + TypeScript |
| Styling | Tailwind CSS (+ shadcn/ui boleh) |
| Grafik | Recharts |
| Database | Postgres via Neon atau Supabase (tier gratis) |
| ORM | Drizzle (disarankan) atau Prisma |
| Email | Resend |
| Scheduler | Vercel Cron (`vercel.json`) |
| Validasi | Zod untuk input form & data hasil fetch |
| Hosting | Vercel |

Prinsip:
- Halaman dashboard & detail dirender di server dan di-cache (ISR / revalidate), lalu di-revalidate setelah cron selesai. Pengunjung tidak pernah memicu fetch ke sumber eksternal.
- Semua akses ke sumber eksternal hanya terjadi di cron dan di script backfill yang dijalankan manual.
- Tidak ada server yang berjalan terus-menerus.

### Environment variables
```
DATABASE_URL=
CRON_SECRET=
RESEND_API_KEY=
EMAIL_FROM=
NEXT_PUBLIC_SITE_URL=
DATA_SOURCE=pihps | mock   # PIHPS tidak memerlukan API key
ANTHROPIC_API_KEY=        # hanya untuk F5
```

## 9. Persyaratan Non-Fungsional

- **Mobile-first**: nyaman di layar 360px, target Lighthouse mobile ≥ 90 untuk Performance & Accessibility.
- **Bahasa**: seluruh UI dalam Bahasa Indonesia; format angka `Rp15.510`, tanggal `1 Nov 2026`, zona waktu Asia/Jakarta.
- **Ketahanan**: UI selalu menampilkan label "Data per <tanggal>" berdasarkan tanggal data terakhir (PIHPS tidak punya data akhir pekan/libur). Jika fetch gagal, UI tetap menampilkan data terakhir.
- **Privasi**: email hanya dipakai untuk alert, tidak ditampilkan di mana pun; ada kebijakan privasi singkat.
- **Anti-spam**: rate limit pada endpoint pendaftaran alert (mis. 5 per IP per jam), dan validasi email.
- **Atribusi**: footer mencantumkan sumber data dan tautannya: "Sumber: PIHPS Nasional, Bank Indonesia" → `https://www.bi.go.id/hargapangan`.

## 10. Kriteria Selesai (v1)

- [ ] Deploy berjalan di domain Vercel, tanpa error di build.
- [ ] Cron berjalan otomatis dan `fetch_logs` menunjukkan run sukses harian.
- [ ] Dashboard menampilkan ≥ 10 komoditas untuk nasional dan 34 provinsi (cakupan PIHPS); pasangan komoditas–provinsi yang tidak dilaporkan tampil sebagai "Data tidak tersedia".
- [ ] Grafik 7/30/90 hari dan perbandingan 3 provinsi berfungsi.
- [ ] Alert email: daftar → konfirmasi → terkirim saat kondisi terpenuhi → unsubscribe berfungsi.
- [ ] Mode `DATA_SOURCE=mock` bisa menjalankan seluruh aplikasi secara lokal tanpa koneksi ke sumber asli.
- [ ] Unit test untuk: adapter parsing (dengan fixture respons asli PIHPS), kalkulasi perubahan harga (termasuk melewati akhir pekan/libur), evaluasi kondisi alert.
- [ ] README berisi cara setup lokal, migrasi DB, seeding, backfill 90 hari, dan deploy.

## 11. Urutan Pengerjaan yang Disarankan

1. Setup project, DB schema, migrasi, seed 34 provinsi & 10 komoditas (dengan kode PIHPS).
2. Adapter mock + seed data 90 hari → bangun dashboard & detail di atas data mock.
3. Adapter PIHPS (endpoint sudah diinvestigasi, lihat §4; verifikasi ulang) + fixture test + script backfill 90 hari.
4. Endpoint cron + `vercel.json` + logging.
5. Fitur alert email end-to-end.
6. Polishing mobile, SEO/OG, README.
7. Fitur P1.

## 12. Risiko

| Risiko | Mitigasi |
|---|---|
| Endpoint PIHPS tidak terdokumentasi resmi dan bisa berubah tanpa pemberitahuan | Pola adapter, validasi Zod pada respons (run gagal dengan error jelas, data rusak tidak disimpan), mode mock, alert ke developer bila 2 run berturut-turut berstatus error (run tanpa data baru di akhir pekan/libur bukan error). |
| Belum ada sumber cadangan di v1 (API Bapanas butuh API key) | UI tetap menampilkan data terakhir dengan label "Data per <tanggal>"; ajukan akses API resmi ke Bapanas untuk adapter cadangan. |
| Sumber memblokir request dari Vercel | Frekuensi rendah (±10 request/hari), User-Agent jelas. Per 1 Nov 2026, endpoint PIHPS dapat diakses dari server di luar Indonesia. |
| Cakupan data tidak lengkap: 34 provinsi, sebagian komoditas tidak dilaporkan di provinsi tertentu, tidak ada data akhir pekan/libur | Tampilkan "Data tidak tersedia", label "Data per <tanggal>", dan perbandingan vs hari data sebelumnya. |
| Batas waktu eksekusi fungsi | ±10 request per run (semua provinsi per request), bulk upsert; backfill lewat script terpisah. |
| Kuota email gratis habis | Batasi 1 email/alert/hari dan hanya untuk tanggal data baru, batasi jumlah alert per email. |
