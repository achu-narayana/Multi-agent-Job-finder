import { useState } from "react";
import { animated, useInView, useSprings } from "@react-spring/web";
import { Tooltip } from "./ChartCard";
import { barPath, useWidth } from "./useSize";

export interface BarDatum {
  key: string;
  label: string;
  value: number;
  display: string;
  detail?: string;
}

interface Props {
  data: BarDatum[];
  color?: string;
  labelWidth?: number;
  /** Highlight one bar in the accent and grey the rest (emphasis form). */
  emphasis?: string;
}

const ROW = 36;
const BAR = 18; // ≤ 24px thick

/** Single-series horizontal bars. React Spring grows each bar from the baseline. */
export function HBarChart({ data, color = "var(--viz-1)", labelWidth = 110, emphasis }: Props) {
  const [ref, width] = useWidth<HTMLDivElement>();
  const [viewRef, inView] = useInView({ once: true, amount: 0.3 });
  const [active, setActive] = useState<number | null>(null);

  const valueRoom = 72;
  const plot = Math.max(40, width - labelWidth - valueRoom);
  const max = Math.max(...data.map((d) => d.value), 1);
  const height = data.length * ROW;

  const springs = useSprings(
    data.length,
    data.map((d, i) => ({
      w: inView ? (d.value / max) * plot : 0,
      delay: i * 60,
      config: { tension: 170, friction: 26 },
    })),
  );

  return (
    <div className="chart-body" ref={ref}>
      <div ref={viewRef}>
        <svg className={`chart-svg${active !== null ? " chart-dim" : ""}`} width={width} height={height} role="img" aria-label="Bar chart">
          <line className="chart-grid" x1={labelWidth} x2={labelWidth} y1={0} y2={height} />
          {data.map((d, i) => {
            const y = i * ROW + (ROW - BAR) / 2;
            const fill = emphasis && d.key !== emphasis ? "var(--viz-muted)" : color;
            return (
              <g key={d.key}>
                <text className="chart-label" x={labelWidth - 10} y={y + BAR / 2 + 4} textAnchor="end">
                  {d.label}
                </text>
                <animated.path
                  className={`chart-mark${active === i ? " is-active" : ""}`}
                  fill={fill}
                  d={springs[i].w.to((w) => barPath(labelWidth, y, Math.max(0, w), BAR, "h"))}
                />
                <animated.text
                  className="chart-value"
                  x={springs[i].w.to((w) => labelWidth + w + 8)}
                  y={y + BAR / 2 + 4}
                >
                  {d.display}
                </animated.text>
                <rect
                  className="chart-hit"
                  x={0}
                  y={i * ROW}
                  width={width}
                  height={ROW}
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
        <Tooltip x={labelWidth + (data[active].value / max) * plot} y={active * ROW} width={width}>
          <div className="tt-title">{data[active].label}</div>
          <div className="tt-row">
            <span className="tt-key" style={{ background: color }} />
            <strong>{data[active].display}</strong>
          </div>
          {data[active].detail && <div className="tt-row">{data[active].detail}</div>}
        </Tooltip>
      )}
    </div>
  );
}
