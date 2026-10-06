import { useEffect, useRef, useState, type PointerEvent } from "react";
import { animate, createDrawable } from "animejs";
import { prefersReducedMotion } from "../motion/setup";
import { Tooltip } from "./ChartCard";
import { niceTicks, useWidth } from "./useSize";

export interface Point {
  label: string; // x label
  value: number;
  display: string;
}

interface Props {
  data: Point[];
  height?: number;
  seriesLabel: string;
  color?: string;
}

const PAD = { top: 16, right: 56, bottom: 28, left: 36 };

/**
 * Single-series area over time. Anime.js draws the 2px line in when it enters
 * the viewport; a crosshair snaps to the nearest point on hover.
 */
export function AreaChart({ data, height = 220, seriesLabel, color = "var(--viz-1)" }: Props) {
  const [ref, width] = useWidth<HTMLDivElement>();
  const lineRef = useRef<SVGPathElement>(null);
  const [active, setActive] = useState<number | null>(null);
  const [drawn, setDrawn] = useState(false);

  const plotW = Math.max(60, width - PAD.left - PAD.right);
  const plotH = height - PAD.top - PAD.bottom;
  const ticks = niceTicks(Math.max(...data.map((d) => d.value), 1));
  const max = ticks[ticks.length - 1];
  const x = (i: number) => PAD.left + (data.length > 1 ? (i / (data.length - 1)) * plotW : plotW / 2);
  const y = (v: number) => PAD.top + plotH - (v / max) * plotH;

  const line = data.map((d, i) => `${i ? "L" : "M"}${x(i)} ${y(d.value)}`).join("");
  const area = `${line}L${x(data.length - 1)} ${PAD.top + plotH}L${x(0)} ${PAD.top + plotH}Z`;

  useEffect(() => {
    const path = lineRef.current;
    const host = ref.current;
    if (!path || !host || drawn) return;
    if (prefersReducedMotion()) {
      setDrawn(true);
      return;
    }
    const [drawable] = createDrawable(path, 0, 0);
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        observer.disconnect();
        animate(drawable, { draw: ["0 0", "0 1"], duration: 1400, ease: "inOutQuad", onComplete: () => setDrawn(true) });
      },
      { threshold: 0.4 },
    );
    observer.observe(host);
    return () => observer.disconnect();
  }, [ref, drawn, line]);

  function onMove(event: PointerEvent<SVGRectElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    const px = event.clientX - rect.left;
    const i = Math.round((px / rect.width) * (data.length - 1));
    setActive(Math.max(0, Math.min(data.length - 1, i)));
  }

  const last = data.length - 1;
  const labelEvery = Math.ceil(data.length / Math.max(2, Math.floor(plotW / 70)));

  return (
    <div className="chart-body" ref={ref}>
      <svg className="chart-svg" width={width} height={height} role="img" aria-label={`${seriesLabel} over time`}>
        {ticks.map((t) => (
          <g key={t}>
            <line className="chart-grid" x1={PAD.left} x2={PAD.left + plotW} y1={y(t)} y2={y(t)} />
            <text className="chart-tick" x={PAD.left - 8} y={y(t) + 4} textAnchor="end">
              {t}
            </text>
          </g>
        ))}
        {data.map((d, i) =>
          i === last || (i % labelEvery === 0 && last - i >= labelEvery) ? (
            <text key={d.label} className="chart-tick" x={x(i)} y={height - 8} textAnchor="middle">
              {d.label}
            </text>
          ) : null,
        )}

        <path d={area} fill={color} opacity={0.1} />
        <path
          ref={lineRef}
          d={line}
          fill="none"
          stroke={color}
          strokeWidth={2}
          strokeLinejoin="round"
          strokeLinecap="round"
        />

        {/* End marker + direct label on the latest value */}
        <circle cx={x(last)} cy={y(data[last].value)} r={4} fill={color} stroke="var(--viz-surface)" strokeWidth={2} />
        <text className="chart-value" x={x(last) + 10} y={y(data[last].value) + 4}>
          {data[last].display}
        </text>

        {active !== null && (
          <g>
            <line className="chart-grid" x1={x(active)} x2={x(active)} y1={PAD.top} y2={PAD.top + plotH} stroke="var(--color-smoke)" />
            <circle cx={x(active)} cy={y(data[active].value)} r={4} fill={color} stroke="var(--viz-surface)" strokeWidth={2} />
          </g>
        )}

        <rect
          className="chart-hit"
          x={PAD.left}
          y={PAD.top}
          width={plotW}
          height={plotH}
          tabIndex={0}
          aria-label={`${seriesLabel}: use the table view for every value`}
          onPointerMove={onMove}
          onPointerLeave={() => setActive(null)}
          onFocus={() => setActive(last)}
          onBlur={() => setActive(null)}
          onKeyDown={(e) => {
            if (e.key === "ArrowRight") setActive((a) => Math.min(last, (a ?? 0) + 1));
            if (e.key === "ArrowLeft") setActive((a) => Math.max(0, (a ?? last) - 1));
          }}
        />
      </svg>
      {active !== null && (
        <Tooltip x={x(active)} y={y(data[active].value)} width={width}>
          <div className="tt-title">{data[active].label}</div>
          <div className="tt-row">
            <span className="tt-key" style={{ background: color }} />
            <strong>{data[active].display}</strong>
            {seriesLabel}
          </div>
        </Tooltip>
      )}
    </div>
  );
}
