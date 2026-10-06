import { useState } from "react";
import { animated, useInView, useSpring } from "@react-spring/web";
import { Tooltip } from "./ChartCard";
import { useWidth } from "./useSize";

export interface StackSeries {
  key: string;
  label: string;
  color: string;
}

export interface StackRow {
  key: string;
  label: string;
  values: Record<string, number>;
}

interface Props {
  rows: StackRow[];
  series: StackSeries[]; // ≤ 3 categorical slots, fixed order
  format: (n: number) => string;
  labelWidth?: number;
}

const ROW = 40;
const BAR = 20;
const GAP = 2; // surface gap between segments

/** Horizontal stacked bars (part-to-whole). React Spring sweeps them in. */
export function StackedBar({ rows, series, format, labelWidth = 90 }: Props) {
  const [ref, width] = useWidth<HTMLDivElement>();
  const [viewRef, inView] = useInView({ once: true, amount: 0.3 });
  const [active, setActive] = useState<{ row: number; series: number } | null>(null);
  const { t } = useSpring({ t: inView ? 1 : 0, config: { tension: 140, friction: 26 } });

  const valueRoom = 64;
  const plot = Math.max(40, width - labelWidth - valueRoom);
  const totals = rows.map((r) => series.reduce((sum, s) => sum + (r.values[s.key] ?? 0), 0));
  const max = Math.max(...totals, 1);
  const height = rows.length * ROW;

  let tipX = 0;
  if (active) {
    const r = rows[active.row];
    for (let i = 0; i <= active.series; i++) tipX += ((r.values[series[i].key] ?? 0) / max) * plot;
  }

  return (
    <div className="chart-body" ref={ref}>
      <div ref={viewRef}>
        <svg className={`chart-svg${active ? " chart-dim" : ""}`} width={width} height={height} role="img" aria-label="Stacked bar chart">
          <line className="chart-grid" x1={labelWidth} x2={labelWidth} y1={0} y2={height} />
          {rows.map((row, ri) => {
            const y = ri * ROW + (ROW - BAR) / 2;
            let cursor = labelWidth;
            const segments = series.map((s, si) => {
              const w = ((row.values[s.key] ?? 0) / max) * plot;
              const x0 = cursor;
              cursor += w;
              if (w <= 0) return null;
              const isLast = series.slice(si + 1).every((n) => !(row.values[n.key] > 0));
              return (
                <g key={s.key}>
                  <animated.rect
                    className={`chart-mark${active?.row === ri && active.series === si ? " is-active" : ""}`}
                    x={t.to((p) => labelWidth + (x0 - labelWidth) * p)}
                    y={y}
                    width={t.to((p) => Math.max(0, w * p - (isLast ? 0 : GAP)))}
                    height={BAR}
                    rx={isLast ? 4 : 0}
                    fill={s.color}
                  />
                  <rect
                    className="chart-hit"
                    x={x0}
                    y={ri * ROW}
                    width={Math.max(w, 8)}
                    height={ROW}
                    tabIndex={0}
                    aria-label={`${row.label}, ${s.label}: ${format(row.values[s.key] ?? 0)}`}
                    onPointerEnter={() => setActive({ row: ri, series: si })}
                    onPointerLeave={() => setActive(null)}
                    onFocus={() => setActive({ row: ri, series: si })}
                    onBlur={() => setActive(null)}
                  />
                </g>
              );
            });
            return (
              <g key={row.key}>
                <text className="chart-label" x={labelWidth - 10} y={y + BAR / 2 + 4} textAnchor="end">
                  {row.label}
                </text>
                {segments}
                <animated.text className="chart-value" x={t.to((p) => labelWidth + (totals[ri] / max) * plot * p + 8)} y={y + BAR / 2 + 4}>
                  {format(totals[ri])}
                </animated.text>
              </g>
            );
          })}
        </svg>
      </div>
      {active && (
        <Tooltip x={labelWidth + tipX} y={active.row * ROW} width={width}>
          <div className="tt-title">
            {rows[active.row].label} · {series[active.series].label}
          </div>
          <div className="tt-row">
            <span className="tt-key" style={{ background: series[active.series].color }} />
            <strong>{format(rows[active.row].values[series[active.series].key] ?? 0)}</strong>
            of {format(totals[active.row])}
          </div>
        </Tooltip>
      )}
    </div>
  );
}
