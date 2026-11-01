import { dataSourceName, type DataSourceName } from "../env";
import { mockSource } from "./mock";
import { pihpsSource } from "./pihps";
import type { PriceSource } from "./types";

export function getSource(name: DataSourceName = dataSourceName()): PriceSource {
  return name === "mock" ? mockSource : pihpsSource;
}

export const SOURCE_LABELS: Record<DataSourceName, string> = {
  pihps: "PIHPS Nasional, Bank Indonesia",
  mock: "Data contoh (mock)",
};
