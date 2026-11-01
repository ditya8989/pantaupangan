import type { CSSProperties } from "react";

const WIDTH = 240;
const HEIGHT = 48;
const PAD_X = 6;
const PAD_Y = 7;

/**
 * Sparkline SVG (tanpa JavaScript): garis tergambar perlahan, area tipis memudar masuk,
 * titik terakhir muncul lalu berdenyut. `index` dipakai untuk menunda animasi per kartu.
 */
export function Sparkline({ values, index = 0, className = "" }: { values: number[]; index?: number; className?: string }) {
  if (values.length < 2) return null;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const points = values.map((v, i) => {
    const x = PAD_X + (i * (WIDTH - 2 * PAD_X)) / (values.length - 1);
    const y = HEIGHT - PAD_Y - ((v - min) / span) * (HEIGHT - 2 * PAD_Y);
    return [x, y] as const;
  });

  const line = points.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(1)} ${y.toFixed(1)}`).join(" ");
  const area = `${line} L${points[points.length - 1][0].toFixed(1)} ${HEIGHT} L${points[0][0].toFixed(1)} ${HEIGHT} Z`;
  let length = 0;
  for (let i = 1; i < points.length; i++) {
    length += Math.hypot(points[i][0] - points[i - 1][0], points[i][1] - points[i - 1][1]);
  }
  const [lastX, lastY] = points[points.length - 1];
  const style = { "--len": Math.ceil(length), "--i": index } as CSSProperties;

  return (
    <svg
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      aria-hidden="true"
      className={`h-auto w-full overflow-visible text-accent ${className}`}
      style={style}
    >
      <path d={area} className="spark-area" fill="currentColor" fillOpacity="0.09" />
      <path
        d={line}
        className="spark-line"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      <circle cx={lastX} cy={lastY} r="4.5" className="spark-ping" fill="currentColor" />
      <circle cx={lastX} cy={lastY} r="4.5" className="spark-dot stroke-surface" fill="currentColor" strokeWidth="2.5" />
    </svg>
  );
}
