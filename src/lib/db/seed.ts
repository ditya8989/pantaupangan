import { sql } from "drizzle-orm";
import { COMMODITIES, REGIONS } from "../reference";
import type { Db } from "./index";
import { commodities, provinces } from "./schema";

/** Upsert data referensi (wilayah & komoditas). Idempoten dan murah: aman dipanggil tiap run. */
export async function ensureReferenceData(db: Db): Promise<void> {
  await db
    .insert(provinces)
    .values(REGIONS.map((r) => ({ id: r.id, code: r.code, slug: r.slug, name: r.name })))
    .onConflictDoUpdate({
      target: provinces.id,
      set: { code: sql`excluded.code`, slug: sql`excluded.slug`, name: sql`excluded.name` },
    });

  await db
    .insert(commodities)
    .values(
      COMMODITIES.map((c) => ({
        id: c.id,
        slug: c.slug,
        name: c.name,
        unit: c.unit,
        category: c.category,
        sortOrder: c.sortOrder,
        sourceCode: c.sourceCode,
      })),
    )
    .onConflictDoUpdate({
      target: commodities.id,
      set: {
        slug: sql`excluded.slug`,
        name: sql`excluded.name`,
        unit: sql`excluded.unit`,
        category: sql`excluded.category`,
        sortOrder: sql`excluded.sort_order`,
        sourceCode: sql`excluded.source_code`,
      },
    });
}
