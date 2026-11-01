import type { Metadata } from "next";
import { SOURCE_NAME } from "@/lib/attribution";

export const metadata: Metadata = { title: "Kebijakan privasi" };

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:py-12">
      <h1 className="text-2xl font-bold tracking-tight">Kebijakan privasi</h1>
      <div className="mt-6 space-y-4 leading-relaxed text-fg-2">
        <p>PantauPangan menampilkan harga bahan pokok dari {SOURCE_NAME}. Melihat harga tidak memerlukan akun.</p>
        <h2 className="pt-2 text-lg font-semibold text-fg">Data yang kami simpan</h2>
        <ul className="list-disc space-y-2 pl-5">
          <li>
            <strong className="text-fg">Email peringatan.</strong> Alamat email, komoditas, wilayah, dan ambang yang Anda
            pilih. Email hanya dipakai untuk mengirim konfirmasi dan peringatan harga tersebut, tidak ditampilkan di mana
            pun, dan tidak dibagikan kepada pihak lain selain layanan pengirim email (Resend).
          </li>
          <li>
            <strong className="text-fg">Pembatasan spam.</strong> Saat Anda mendaftar peringatan, alamat IP disimpan
            dalam bentuk hash satu arah selama paling lama satu jam untuk membatasi pendaftaran berlebihan.
          </li>
          <li>
            <strong className="text-fg">Pilihan wilayah.</strong> Wilayah terakhir yang Anda pilih disimpan di browser
            Anda sendiri (localStorage), tidak dikirim ke server.
          </li>
        </ul>
        <h2 className="pt-2 text-lg font-semibold text-fg">Berhenti kapan saja</h2>
        <p>
          Setiap email peringatan berisi tautan berhenti berlangganan satu klik. Peringatan yang belum dikonfirmasi tidak
          pernah mengirim email harga.
        </p>
      </div>
    </div>
  );
}
