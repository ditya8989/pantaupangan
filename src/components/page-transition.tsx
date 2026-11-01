import { ViewTransition, type ReactNode } from "react";

const DIRECTIONAL = {
  "nav-forward": "nav-forward",
  "nav-back": "nav-back",
  default: "none",
};

/**
 * Animasi arah navigasi: masuk lebih dalam (nav-forward) bergeser ke kiri, kembali (nav-back) ke kanan.
 * Navigasi tanpa tipe (tombol back browser, refresh) tidak dianimasikan.
 */
export function PageTransition({ children }: { children: ReactNode }) {
  return (
    <ViewTransition enter={DIRECTIONAL} exit={DIRECTIONAL} default="none">
      <div>{children}</div>
    </ViewTransition>
  );
}
