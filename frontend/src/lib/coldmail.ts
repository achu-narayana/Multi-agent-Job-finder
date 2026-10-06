// Cold-mail drafting + a local quality check modelled on
// backend/packages/marketing (outreach copy rules + expert_panel humanizer).
// The backend will swap in Claude drafting and the full expert panel.

import type { Person, Startup } from "../data/startups";
import { formatFunding } from "./format";
import { matchStartup, referralWarmth } from "./insights";
import type { Profile } from "./resume";

export type Variant = "referral" | "hiring-manager" | "founder";

export const VARIANT_LABEL: Record<Variant, string> = {
  referral: "Referral ask",
  "hiring-manager": "Hiring manager",
  founder: "Founder note",
};

export function defaultVariant(person: Person): Variant {
  if (person.kind === "Founder") return "founder";
  if (person.kind === "Engineering manager" || person.kind === "Recruiter") return "hiring-manager";
  return "referral";
}

export interface Draft {
  subject: string;
  body: string;
  linkedinNote: string;
}

const first = (name: string) => name.replace(/^dr\.?\s+/i, "").split(" ")[0];
// Lowercase only the first letter so proper nouns ("Indian", "SMB") survive.
const lowerFirst = (text: string) => text.charAt(0).toLowerCase() + text.slice(1);

export function draftMail(person: Person, startup: Startup, profile: Profile | null, variant: Variant): Draft {
  const me = profile?.name && profile.name !== "You" ? profile.name.split(" ")[0] : "[Your name]";
  const match = matchStartup(startup, profile);
  const role = match.bestRole?.title ?? startup.roles[0]?.title ?? "engineering";
  const skills = (match.matchedSkills.length ? match.matchedSkills : profile?.skills ?? []).slice(0, 3);
  const skillLine = skills.length ? skills.join(", ") : "[your top skills]";
  const years = profile?.years ? `${profile.years} years` : "[X] years";
  const warmth = referralWarmth(person, profile);
  const shared = warmth.reasons.find((r) => r.startsWith("Same school") || r.startsWith("Both worked"));
  const sharedLine = shared
    ? shared.startsWith("Same school")
      ? `We're both ${person.school} alumni, which is why I thought to reach out to you directly.`
      : `${shared.replace("Both worked at", "We both spent time at")}, so I suspect we'd have plenty in common.`
    : "";
  const funding = `${formatFunding(startup, startup.amountUsd)} ${startup.round}`;

  let subject = "";
  let body = "";

  if (variant === "referral") {
    subject = `${role} at ${startup.name}`;
    body = [
      `Hi ${first(person.name)},`,
      `Congrats on the ${funding} — ${lowerFirst(startup.tagline)} is a problem I've wanted to work on. ${sharedLine}`.trim(),
      `I'm a ${profile?.headline ?? "software engineer"} with ${years} of experience, mostly in ${skillLine}. The ${role} opening on the ${match.bestRole?.team ?? "engineering"} team lines up closely with what I've been building.`,
      `Would you be open to referring me, or to a 15-minute chat about what the team is like first? Happy to send my résumé either way.`,
      `Thanks,\n${me}`,
    ].join("\n\n");
  } else if (variant === "hiring-manager") {
    subject = `${role} — ${skills[0] ?? "engineer"} with ${years}`;
    body = [
      `Hi ${first(person.name)},`,
      `Saw the ${funding} news — congrats. With ${startup.headcount} people and growing ${startup.headcountGrowth}% in six months, I imagine the ${match.bestRole?.team ?? "engineering"} team is hiring fast.`,
      `I'm a ${profile?.headline ?? "software engineer"} with ${years} of experience in ${skillLine}. ${sharedLine}`.trim(),
      `Is the ${role} role still open? If it's useful, I can share a short write-up of a relevant project before we talk.`,
      `Best,\n${me}`,
    ].join("\n\n");
  } else {
    subject = `Congrats on the ${startup.round}`;
    body = [
      `Hi ${first(person.name)},`,
      `Congrats on closing the ${funding}. ${startup.tagline} is exactly the kind of product I want to help build. ${sharedLine}`.trim(),
      `I'm a ${profile?.headline ?? "software engineer"} (${years}, ${skillLine}) and I'd love to be one of the next engineers you hire.`,
      `Who would be the right person to talk to about the ${role} role?`,
      `Thanks,\n${me}`,
    ].join("\n\n");
  }

  const linkedinNote = `Hi ${first(person.name)} — congrats on ${startup.name}'s ${startup.round}! I'm a ${profile?.headline ?? "software engineer"} (${skillLine}) interested in the ${role} role. ${shared ? shared + ". " : ""}Would love to connect.`.slice(0, 300);

  return { subject, body, linkedinNote };
}

// ── Local quality check ─────────────────────────────────────────────

export interface Check {
  label: string;
  pass: boolean;
  weight: number;
}

const SLOP = [
  "i hope this email finds you well",
  "i hope you're doing well",
  "i am writing to",
  "synergy",
  "leverage",
  "passionate",
  "rockstar",
  "ninja",
  "delve",
  "game-changer",
  "touch base",
  "circle back",
  "just following up",
  "to whom it may concern",
];

export function scoreDraft(draft: Draft, startup: Startup): { score: number; checks: Check[] } {
  const text = draft.body.toLowerCase();
  const words = draft.body.split(/\s+/).filter(Boolean).length;
  const questions = (draft.body.match(/\?/g) ?? []).length;
  const opening = draft.body.split("\n").find((l) => l.trim() && !/^hi\b|^hello\b|^dear\b/i.test(l)) ?? "";

  const checks: Check[] = [
    { label: "50–150 words — readable on a phone", pass: words >= 50 && words <= 150, weight: 20 },
    { label: `Mentions ${startup.name}'s funding`, pass: text.includes(startup.round.toLowerCase()), weight: 15 },
    { label: "Specific skills, not adjectives", pass: !text.includes("[your top skills]"), weight: 15 },
    { label: "One clear ask", pass: questions >= 1 && questions <= 2, weight: 15 },
    { label: "No filler or AI-sounding phrases", pass: !SLOP.some((s) => text.includes(s)), weight: 15 },
    { label: "Subject under 8 words", pass: draft.subject.split(/\s+/).length <= 8, weight: 10 },
    { label: "Doesn't open with “I”", pass: !/^i\b/i.test(opening.trim()), weight: 5 },
    { label: "No unfilled placeholders", pass: !/\[[^\]]+\]/.test(draft.body), weight: 5 },
  ];
  const score = checks.reduce((sum, c) => sum + (c.pass ? c.weight : 0), 0);
  return { score, checks };
}
