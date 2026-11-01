import type { CSSProperties } from "react";
import { formatNumber } from "@/lib/format";

const DIGITS = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"];

/**
 * Angka bergaya odometer: tiap digit "berputar" ke nilainya saat halaman dimuat.
 * Murni CSS (kondisi akhir = nilai sebenarnya, jadi tetap benar tanpa animasi/JS).
 * Pembaca layar membaca teks utuh dari elemen sr-only.
 */
export function Odometer({ value, prefix = "Rp", className = "" }: { value: number; prefix?: string; className?: string }) {
  const text = `${prefix}${formatNumber(value)}`;
  let digitIndex = 0;
  return (
    <span className={className}>
      <span className="sr-only">{text}</span>
      <span className="odometer select-none" aria-hidden="true">
        {text.split("").map((char, i) => {
          if (!/\d/.test(char)) return <span key={i}>{char}</span>;
          const style = { "--d": Number(char), "--i": digitIndex++ } as CSSProperties;
          return (
            <span key={i} className="odo-digit">
              <span className="odo-strip" style={style}>
                {DIGITS.map((d) => (
                  <span key={d}>{d}</span>
                ))}
              </span>
            </span>
          );
        })}
      </span>
    </span>
  );
}
