import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import { IllustrationSprite } from "@/components/illustrations";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { siteUrl } from "@/lib/env";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-jakarta",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl()),
  title: {
    default: "PantauPangan: harga bahan pokok terbaru",
    template: "%s · PantauPangan",
  },
  description:
    "Pantau harga beras, cabai, bawang, minyak goreng, gula, telur, dan ayam di seluruh provinsi Indonesia. Data harian dari PIHPS Bank Indonesia.",
  openGraph: {
    type: "website",
    locale: "id_ID",
    siteName: "PantauPangan",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fbf8f1" },
    { media: "(prefers-color-scheme: dark)", color: "#110f0d" },
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="id" className={jakarta.variable}>
      <body className="flex min-h-dvh flex-col font-sans">
        <IllustrationSprite />
        <SiteHeader />
        <main className="flex-1">{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}
