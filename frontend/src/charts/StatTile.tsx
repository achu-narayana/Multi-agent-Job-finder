import { animated, useInView, useSpring } from "@react-spring/web";

interface StatTileProps {
  label: string;
  value: number;
  format?: (n: number) => string;
  delta?: { text: string; direction: "up" | "down" | "flat"; good?: boolean };
  className?: string;
}

const defaultFormat = (n: number) => new Intl.NumberFormat("en-US").format(Math.round(n));

/** Stat tile: React Spring counts the value up when it enters the viewport. */
export function StatTile({ label, value, format = defaultFormat, delta, className = "" }: StatTileProps) {
  const [ref, inView] = useInView({ once: true, amount: 0.4 });
  const { n } = useSpring({ n: inView ? value : 0, config: { tension: 120, friction: 26 } });

  const deltaClass =
    delta && delta.direction !== "flat" ? ((delta.good ?? delta.direction === "up") ? " is-up" : " is-down") : "";

  return (
    <div className={`stat-tile card ${className}`} ref={ref}>
      <span className="stat-label">{label}</span>
      <animated.span className="stat-value">{n.to(format)}</animated.span>
      {delta && (
        <span className={`stat-delta${deltaClass}`}>
          {delta.direction === "up" ? "↑ " : delta.direction === "down" ? "↓ " : ""}
          {delta.text}
        </span>
      )}
    </div>
  );
}

/** Same-ramp meter; the fill springs to its value. */
export function Meter({ value, label }: { value: number; label: string }) {
  const [ref, inView] = useInView({ once: true });
  const { w } = useSpring({ w: inView ? Math.max(0, Math.min(1, value / 100)) : 0, config: { tension: 120, friction: 22 } });
  return (
    <div className="meter" ref={ref} role="meter" aria-valuenow={value} aria-valuemin={0} aria-valuemax={100} aria-label={label}>
      <animated.div className="meter-fill" style={{ transform: w.to((v) => `scaleX(${v})`) }} />
    </div>
  );
}
