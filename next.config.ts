import type { NextConfig } from "next";

const usesExternalPostgres = /^postgres(ql)?:\/\//.test(process.env.DATABASE_URL ?? "");

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  poweredByHeader: false,
  // PGlite memuat Postgres versi WASM; biarkan di-require dari node_modules, jangan di-bundle.
  serverExternalPackages: ["@electric-sql/pglite"],
  // Tanpa DATABASE_URL, database lokal (PGlite) hanya boleh dibuka oleh satu proses:
  // paksa prerender saat `next build` memakai satu worker.
  experimental: usesExternalPostgres ? undefined : { staticGenerationMinPagesPerWorker: 10_000 },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
