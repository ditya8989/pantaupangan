"use client";

import { useRouter } from "next/navigation";
import { regionPath, storeRegionSlug } from "@/lib/region-preference";
import { REGIONS } from "@/lib/reference";
import { ChevronDownIcon, PinIcon } from "./illustrations";

export function RegionSelect({ current }: { current: string }) {
  const router = useRouter();
  return (
    <label className="relative inline-flex h-12 w-full max-w-sm items-center rounded-full bg-surface shadow-[var(--shadow-card)] ring-1 ring-line transition focus-within:ring-2 focus-within:ring-accent sm:w-auto sm:min-w-72">
      <PinIcon className="pointer-events-none absolute left-4 size-5 text-accent" />
      <span className="sr-only">Pilih wilayah</span>
      <select
        value={current}
        onChange={(event) => {
          const slug = event.target.value;
          storeRegionSlug(slug);
          router.push(regionPath(slug));
        }}
        className="h-full w-full cursor-pointer appearance-none rounded-full bg-transparent pl-11 pr-10 text-base font-semibold text-fg focus:outline-none"
      >
        {REGIONS.map((region) => (
          <option key={region.slug} value={region.slug}>
            {region.name}
          </option>
        ))}
      </select>
      <ChevronDownIcon className="pointer-events-none absolute right-4 size-4 text-muted" />
    </label>
  );
}
