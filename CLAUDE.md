@AGENTS.md

# PantauPangan

Food-price tracker (Next.js 16.4 App Router + Cache Components). Spec: `PRD.md`; setup/deploy: `README.md`. UI copy is Indonesian.

## Commands
- `npm run dev` · `npm test` (vitest) · `npm run lint` · `npm run typecheck` · `npm run build`
- `npm run data:fetch` hits `/api/cron/fetch-prices` on a running server (needs `CRON_SECRET` in `.env.local`).
- After editing `src/lib/db/schema.ts`: `npm run db:generate` (commit the generated `drizzle/` files).

## Things that bite
- **Next 16 is not the Next you know**: read `node_modules/next/dist/docs/` before using an API. Cache Components is on, so there is no `dynamic`/`revalidate` segment config. Page data comes from `"use cache"` + `cacheLife` + `cacheTag(PRICES_TAG)` functions in `src/lib/prices/queries.ts` and is prerendered at build time. Uncached DB reads must sit behind `await connection()` inside `<Suspense>`, otherwise dev reports blocking-prerender errors.
- **PGlite (local DB, `.data/pglite`) allows a single process.** Never run `next dev` and `next build`/`next start` (or a script that opens PGlite) at the same time. `next.config.ts` forces prerendering into one batch when `DATABASE_URL` is unset. `getDb()` is lazy, so importing a module must never open the DB.
- Without `RESEND_API_KEY` (and off Vercel), emails go to the in-memory outbox at `/dev/email`. On Vercel without it, alerts are switched off (`alertsEnabled()` in `src/lib/env.ts`): `/peringatan` shows "segera hadir". That is decided at build time, so redeploy after adding the key.
- Copyright owner/year and the data-source attribution live in `src/lib/attribution.ts` (footer, hero, chart caption, CSV, emails).
- PIHPS endpoint (`src/lib/sources/pihps.ts`) is undocumented. Keep requests sequential (1 per commodity, all provinces) and keep the strict Zod/format checks that throw `SourceFormatError`. Parser tests use real responses in `tests/fixtures/`.
- Dates are ISO `YYYY-MM-DD` strings (WIB data dates). Use `src/lib/dates.ts` and `src/lib/format.ts` (manual formatting, so server and client output match); avoid `Intl` in rendered output.
- Price changes compare against the previous *data day* (no weekend/holiday data), never the calendar "yesterday".

## Visual design & motion
- Warm "pasar" theme: tokens in `src/app/globals.css` (`--accent` terracotta; `--up` red = price up/bad, `--down` green = down/good; always paired with icon + sign). Subtle batik kawung pattern via `.kawung`.
- Commodity illustrations are one SVG sprite (`IllustrationSprite` in the root layout, symbols `art-<slug>`) rendered with `<CommodityIcon slug>`.
- Motion is CSS-only (`anim-rise`, `anim-float`, `spark-*`, `.odometer`, `.marquee`, `.reveal` scroll-driven) plus React `<ViewTransition>`: card art morphs into the detail hero (`name="art-<slug>"`), links carry `transitionTypes={["nav-forward"|"nav-back"]}`, pages wrap content in `<PageTransition>`. Everything collapses under `prefers-reduced-motion`; the ticker has a pause button.
- Keep `/*turbopackIgnore: true*/` on the PGlite path in `src/lib/db/index.ts`, otherwise the whole project gets traced into the Vercel server bundle.
