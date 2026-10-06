import type { Startup } from "../data/startups";

export const USD_TO_INR = 84;

const compactUsd = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  notation: "compact",
  maximumFractionDigits: 1,
});

export function formatUsd(amount: number): string {
  return compactUsd.format(amount);
}

/** ₹ crore for India, compact $ elsewhere. */
export function formatFunding(startup: Pick<Startup, "region">, amountUsd: number): string {
  if (startup.region === "India") {
    const crore = (amountUsd * USD_TO_INR) / 10_000_000;
    return `₹${crore >= 100 ? Math.round(crore) : crore.toFixed(1)} Cr`;
  }
  return formatUsd(amountUsd);
}

export function formatDate(iso: string): string {
  return new Date(iso + "T00:00:00Z").toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}

export function relativeDays(days: number): string {
  if (days <= 0) return "today";
  if (days === 1) return "yesterday";
  if (days < 14) return `${days} days ago`;
  if (days < 60) return `${Math.round(days / 7)} weeks ago`;
  return `${Math.round(days / 30)} months ago`;
}

export const formatInt = (n: number) => new Intl.NumberFormat("en-US").format(n);

export function pct(n: number): string {
  return `${Math.round(n)}%`;
}
