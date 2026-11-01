"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { readStoredRegionSlug, regionPath } from "@/lib/region-preference";

/** Di beranda (Nasional): arahkan ke provinsi pilihan terakhir pengguna, jika ada. */
export function RememberRegion() {
  const router = useRouter();
  useEffect(() => {
    const slug = readStoredRegionSlug();
    if (slug && slug !== "nasional") router.replace(regionPath(slug));
  }, [router]);
  return null;
}
