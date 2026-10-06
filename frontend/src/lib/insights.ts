// Scoring used by the prototype: résumé ↔ startup match, a compensation
// estimate, and referral warmth. All are transparent heuristics — every number
// ships with the reasons behind it so you can judge it yourself.

import type { Person, Round, Startup } from "../data/startups";
import type { Profile, Seniority } from "./resume";

// ── Match ─────────────────────────────────────────────────────────

export interface Match {
  score: number; // 0–100
  matchedSkills: string[];
  bestRole: Startup["roles"][number] | null;
}

const norm = (s: string) => s.toLowerCase();

export function matchStartup(startup: Startup, profile: Profile | null): Match {
  if (!profile) return { score: 0, matchedSkills: [], bestRole: null };
  const mine = new Set(profile.skills.map(norm));

  let best: Match = { score: 0, matchedSkills: [], bestRole: null };
  for (const role of startup.roles) {
    const hits = role.skills.filter((s) => mine.has(norm(s)));
    const skillScore = role.skills.length ? hits.length / role.skills.length : 0;
    const titleBonus = sameFamily(profile.headline, role.title) ? 0.15 : 0;
    const remoteFit = profile.remoteOnly && startup.remote !== "Remote" ? -0.25 : 0;
    const regionFit = profile.targetRegions.includes(startup.region) ? 0 : -0.2;
    const score = Math.round(
      Math.max(0, Math.min(1, skillScore * 0.7 + titleBonus + (startup.culture / 100) * 0.15 + remoteFit + regionFit)) * 100,
    );
    if (score > best.score) best = { score, matchedSkills: hits, bestRole: role };
  }
  return best;
}

function sameFamily(a: string, b: string) {
  const families = [
    /front ?end|react|web|ui/i,
    /back ?end|platform|api|server/i,
    /full ?stack/i,
    /data|analytics|dbt/i,
    /machine learning|ml|ai|speech|model/i,
    /devops|sre|reliability|infra|platform/i,
    /android|ios|mobile|react native/i,
    /security/i,
    /design/i,
    /product manager/i,
  ];
  return families.some((f) => f.test(a) && f.test(b));
}

// ── Compensation ──────────────────────────────────────────────────

export interface Compensation {
  low: number;
  high: number;
  currency: "INR" | "USD" | "EUR" | "GBP";
  display: string;
  unit: string;
  equity: string;
  basis: string[];
}

// Annual base, local currency. INR in lakh (LPA); USD/EUR/GBP in thousands.
const BANDS: Record<"India" | "USA" | "Europe" | "UK", Record<Seniority, [number, number]>> = {
  India: { Junior: [8, 14], Mid: [16, 30], Senior: [30, 50], Staff: [50, 80] },
  USA: { Junior: [110, 140], Mid: [140, 180], Senior: [180, 230], Staff: [230, 290] },
  Europe: { Junior: [50, 65], Mid: [65, 85], Senior: [85, 110], Staff: [110, 140] },
  UK: { Junior: [50, 65], Mid: [65, 90], Senior: [90, 120], Staff: [120, 150] },
};

const STAGE: Record<Round, number> = {
  "Pre-seed": 0.8,
  Seed: 0.88,
  "Series A": 0.97,
  "Series B": 1.06,
  "Series C": 1.12,
};

const EQUITY: Record<Round, string> = {
  "Pre-seed": "0.5–1.5% equity typical",
  Seed: "0.2–0.8% equity typical",
  "Series A": "0.1–0.4% equity typical",
  "Series B": "0.05–0.2% equity typical",
  "Series C": "0.02–0.1% equity typical",
};

const PREMIUM_CITY: Record<string, number> = {
  Bengaluru: 1.05,
  Hyderabad: 1.0,
  Gurugram: 1.0,
  Mumbai: 1.02,
  Pune: 0.95,
  "San Francisco": 1.1,
  "New York": 1.08,
  Seattle: 1.05,
  Austin: 0.97,
  London: 1.0,
  Berlin: 1.0,
  Amsterdam: 1.02,
};

const round5 = (n: number) => Math.round(n / 5) * 5;

export function estimatePay(startup: Startup, profile: Profile | null): Compensation {
  const seniority: Seniority = profile?.seniority ?? "Mid";
  const match = matchStartup(startup, profile);

  // Remote-first companies pay from a US-anchored band with a location discount
  // when you're in India.
  let market: keyof typeof BANDS = startup.region === "Europe" ? (startup.country === "UK" ? "UK" : "Europe") : startup.region === "Remote" ? "USA" : startup.region;
  let locationFactor = PREMIUM_CITY[startup.city] ?? 1;
  const basis: string[] = [];

  const youInIndia = !profile?.location || /hyderabad|bengaluru|pune|mumbai|chennai|delhi|gurugram|noida|kolkata|ahmedabad/i.test(profile.location);
  if (startup.region === "Remote" || (startup.remote === "Remote" && startup.region !== "India" && youInIndia)) {
    market = "USA";
    locationFactor = youInIndia ? 0.45 : 0.9;
    basis.push(youInIndia ? "Remote role paid on a location-adjusted US band (you're based in India)" : "Remote role, US-anchored band");
  } else {
    basis.push(`${startup.city} market band for ${seniority.toLowerCase()} engineers`);
  }

  const [lo, hi] = BANDS[market][seniority];
  const stage = STAGE[startup.round];
  const fit = match.score >= 75 ? 1.05 : match.score >= 50 ? 1 : 0.95;

  basis.push(`${seniority} level from ~${profile?.years ?? 3} years of experience`);
  basis.push(`${startup.round} stage adjustment (×${stage.toFixed(2)})`);
  if (fit !== 1) basis.push(fit > 1 ? "Strong skill match (+5%)" : "Partial skill match (−5%)");

  const factor = stage * fit * locationFactor;
  const low = lo * factor;
  const high = hi * factor;

  if (market === "India") {
    return {
      low: Math.round(low),
      high: Math.round(high),
      currency: "INR",
      display: `₹${Math.round(low)}–${Math.round(high)} LPA`,
      unit: "base salary, per year",
      equity: EQUITY[startup.round],
      basis,
    };
  }
  const symbol = market === "USA" ? "$" : market === "UK" ? "£" : "€";
  const currency = market === "USA" ? "USD" : market === "UK" ? "GBP" : "EUR";
  const inLakh = market === "USA" && locationFactor < 0.6;
  return {
    low: round5(low),
    high: round5(high),
    currency,
    display: inLakh
      ? `$${round5(low)}–${round5(high)}k (≈ ₹${Math.round((low * 1000 * 84) / 100000)}–${Math.round((high * 1000 * 84) / 100000)} LPA)`
      : `${symbol}${round5(low)}–${round5(high)}k`,
    unit: "base salary, per year",
    equity: EQUITY[startup.round],
    basis,
  };
}

// ── Referral warmth ───────────────────────────────────────────────

export interface Warmth {
  score: number; // 0–100
  reasons: string[];
}

const loose = (a: string, b: string) => {
  const x = a.toLowerCase();
  const y = b.toLowerCase();
  return x.includes(y) || y.includes(x);
};

export function referralWarmth(person: Person, profile: Profile | null): Warmth {
  const reasons: string[] = [];
  let score = person.degree === 1 ? 45 : person.degree === 2 ? 25 : 8;
  reasons.push(person.degree === 1 ? "1st-degree connection" : person.degree === 2 ? "2nd-degree connection" : "3rd-degree / no connection");

  if (person.mutuals > 0) {
    score += Math.min(20, person.mutuals);
    reasons.push(`${person.mutuals} mutual connection${person.mutuals === 1 ? "" : "s"}`);
  }
  if (profile) {
    const school = profile.schools.find((s) => loose(s, person.school));
    if (school) {
      score += 15;
      reasons.push(`Same school: ${person.school}`);
    }
    const employer = person.pastEmployers.find((e) => profile.employers.some((mine) => loose(mine, e)));
    if (employer) {
      score += 15;
      reasons.push(`Both worked at ${employer}`);
    }
  }
  if (person.recentlyActive) {
    score += 5;
    reasons.push("Posted on LinkedIn in the last 2 weeks");
  }
  if (person.kind === "Engineer" || person.kind === "Engineering manager") {
    score += 5;
    reasons.push(person.kind === "Engineer" ? "Engineers can submit internal referrals" : "Hiring manager for the team");
  }
  return { score: Math.min(100, score), reasons };
}

export function bestContact(startup: Startup, profile: Profile | null) {
  return [...startup.people]
    .map((p) => ({ person: p, warmth: referralWarmth(p, profile) }))
    .sort((a, b) => b.warmth.score - a.warmth.score)[0];
}
