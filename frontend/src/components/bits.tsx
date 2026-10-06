import type { RemotePolicy, Round } from "../data/startups";

export function RoundBadge({ round }: { round: Round }) {
  const tone = round === "Series B" || round === "Series C" ? "badge-green" : round === "Series A" ? "badge-iris" : "badge-teal";
  return (
    <span className={`badge ${tone}`}>
      <span className="badge-dot" />
      {round}
    </span>
  );
}

export function RemoteBadge({ policy }: { policy: RemotePolicy }) {
  return <span className={`badge${policy === "Remote" ? " badge-green" : ""}`}>{policy}</span>;
}

/** 0–100 score with a small same-ramp bar; the number is always shown. */
export function Score({ value, label }: { value: number; label: string }) {
  return (
    <span className="score" title={label} aria-label={`${label}: ${value} out of 100`}>
      <span className="score-track">
        <span className="score-fill" style={{ transform: `scaleX(${value / 100})` }} />
      </span>
      <span className="score-value">{value}</span>
    </span>
  );
}

export function SampleTag() {
  return (
    <span className="badge" title="Fictional sample data until the backend is connected">
      Sample data
    </span>
  );
}

export function initials(name: string) {
  return name
    .replace(/^dr\.?\s+/i, "")
    .split(" ")
    .slice(0, 2)
    .map((p) => p[0])
    .join("")
    .toUpperCase();
}

export function Avatar({ name, size = 32 }: { name: string; size?: number }) {
  return (
    <span className="avatar" style={{ width: size, height: size, fontSize: size * 0.38 }} aria-hidden="true">
      {initials(name)}
    </span>
  );
}

export function DegreeBadge({ degree }: { degree: 1 | 2 | 3 }) {
  return <span className={`badge${degree === 1 ? " badge-green" : degree === 2 ? " badge-iris" : ""}`}>{degree === 1 ? "1st" : degree === 2 ? "2nd" : "3rd"}</span>;
}
