import { useState } from "react";
import { animated, useInView, useSprings } from "@react-spring/web";
import { Tooltip } from "./ChartCard";
import { barPath, useWidth } from "./useSize";

export interface ColumnDatum {
  key: string;
  label: string;
  sublabel?: string;
  value: number;
  display: string;
}

interface Props {
  data: ColumnDatum[];
  height?: number;
  color?: string;
  /** Key of the column to emphasise; others render in the de-emphasis grey. */
  emphasis?: string;
}

const PAD = { top: 24, bottom: 40 };
const COL = 24; // ≤ 24px wide

/** Single-series columns; value on the cap. React Spring raises them from the baseline. */
export function ColumnChart({ data, height = 200, color = "var(--viz-1)", emphasis }: Props) {
  const [ref, width] = useWidth<HTMLDivElement>();
  const [viewRef, inView] = useInView({ once: true, amount: 0.3 });
  const [active, setActive] = useState<number | null>(null);

  const plotH = height - PAD.top - PAD.bottom;
  const max = Math.max(...data.map((d) => d.value), 1);
  const slot = width / Math.max(1, data.length);
  const base = PAD.top + plotH;
  // Thin x labels when slots are narrower than a label; always keep the last one.
  const labelEvery = Math.max(1, Math.ceil(52 / slot));
  const last = data.length - 1;
  const showLabel = (i: number) => i === last || (i % labelEvery === 0 && last - i >= labelEvery);

  const springs = useSprings(
    data.length,
    data.map((d, i) => ({ h: inView ? (d.value / max) * plotH : 0, delay: i * 90, config: { tension: 160, friction: 24 } })),
  );

  return (
    <div className="chart-body" ref={ref}>
      <div ref={viewRef}>
        <svg className={`chart-svg${active !== null ? " chart-dim" : ""}`} width={width} height={height} role="img" aria-label="Column chart">
          <line className="chart-grid" x1={0} x2={width} y1={base} y2={base} />
          {data.map((d, i) => {
            const cx = slot * i + slot / 2;
            const fill = emphasis && d.key !== emphasis ? "var(--viz-muted)" : color;
            return (
              <g key={d.key}>
                <animated.path
                  className={`chart-mark${active === i ? " is-active" : ""}`}
                  fill={fill}
                  d={springs[i].h.to((h) => barPath(cx - COL / 2, base - h, COL, h, "v"))}
                />
                <animated.text className="chart-value" x={cx} y={springs[i].h.to((h) => base - h - 8)} textAnchor="middle">
                  {d.display}
                </animated.text>
                {showLabel(i) && (
                  <text className="chart-label" x={cx} y={base + 16} textAnchor="middle">
                    {d.label}
                  </text>
                )}
                {d.sublabel && showLabel(i) && (
                  <text className="chart-tick" x={cx} y={base + 31} textAnchor="middle">
                    {d.sublabel}
                  </text>
                )}
                <rect
                  className="chart-hit"
                  x={slot * i}
                  y={0}
                  width={slot}
                  height={height}
                  tabIndex={0}
                  aria-label={`${d.label}: ${d.display}`}
                  onPointerEnter={() => setActive(i)}
                  onPointerLeave={() => setActive(null)}
                  onFocus={() => setActive(i)}
                  onBlur={() => setActive(null)}
                />
              </g>
            );
          })}
        </svg>
      </div>
      {active !== null && (
        <Tooltip x={slot * active + slot / 2} y={base - (data[active].value / max) * plotH} width={width}>
          <div className="tt-title">
            {data[active].label}
            {data[active].sublabel ? ` · ${data[active].sublabel}` : ""}
          </div>
          <div className="tt-row">
            <span className="tt-key" style={{ background: color }} />
            <strong>{data[active].display}</strong>
          </div>
        </Tooltip>
      )}
    </div>
  );
}
