import {
  date,
  doublePrecision,
  index,
  integer,
  pgTable,
  serial,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";

export const commodities = pgTable("commodities", {
  id: integer("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  unit: text("unit").notNull(),
  category: text("category").notNull(),
  sortOrder: integer("sort_order").notNull(),
  sourceCode: text("source_code").notNull().unique(),
});

/** id 0 / code "ID" = Nasional. */
export const provinces = pgTable("provinces", {
  id: integer("id").primaryKey(),
  code: text("code").notNull().unique(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
});

export const prices = pgTable(
  "prices",
  {
    id: serial("id").primaryKey(),
    commodityId: integer("commodity_id")
      .notNull()
      .references(() => commodities.id),
    provinceId: integer("province_id")
      .notNull()
      .references(() => provinces.id),
    date: date("date", { mode: "string" }).notNull(),
    /** Rupiah, bilangan bulat. */
    price: integer("price").notNull(),
    source: text("source").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    // Indeks btree ini juga melayani pencarian (commodity, province, date DESC).
    uniqueIndex("prices_commodity_province_date_uq").on(t.commodityId, t.provinceId, t.date),
    index("prices_date_idx").on(t.date),
  ],
);

export const alerts = pgTable(
  "alerts",
  {
    id: serial("id").primaryKey(),
    email: text("email").notNull(),
    commodityId: integer("commodity_id")
      .notNull()
      .references(() => commodities.id),
    provinceId: integer("province_id")
      .notNull()
      .references(() => provinces.id),
    /** "above" = harga di atas Rp X; "pct7d" = naik lebih dari Y% dalam 7 hari. */
    conditionType: text("condition_type", { enum: ["above", "pct7d"] }).notNull(),
    threshold: doublePrecision("threshold").notNull(),
    confirmedAt: timestamp("confirmed_at", { withTimezone: true }),
    unsubscribedAt: timestamp("unsubscribed_at", { withTimezone: true }),
    lastSentAt: timestamp("last_sent_at", { withTimezone: true }),
    /** Tanggal data yang memicu email terakhir; mencegah email ulang tanpa data baru. */
    lastSentDataDate: date("last_sent_data_date", { mode: "string" }),
    token: text("token").notNull().unique(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("alerts_email_idx").on(t.email)],
);

export const fetchLogs = pgTable("fetch_logs", {
  id: serial("id").primaryKey(),
  source: text("source").notNull(),
  startedAt: timestamp("started_at", { withTimezone: true }).notNull().defaultNow(),
  finishedAt: timestamp("finished_at", { withTimezone: true }),
  status: text("status", { enum: ["running", "success", "partial", "error"] }).notNull(),
  rowsUpserted: integer("rows_upserted").notNull().default(0),
  latestDataDate: date("latest_data_date", { mode: "string" }),
  error: text("error"),
  warnings: text("warnings"),
});

/** Rate limit sederhana berbasis jendela waktu tetap (mis. pendaftaran alert per IP). */
export const rateLimits = pgTable("rate_limits", {
  key: text("key").primaryKey(),
  windowStart: timestamp("window_start", { withTimezone: true }).notNull(),
  count: integer("count").notNull(),
});
