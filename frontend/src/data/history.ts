// Sample outreach history so the tracking charts have shape before you send
// anything. Your own drafts and sends are added on top of this.

import type { Variant } from "../lib/coldmail";

export interface PastSend {
  week: string; // ISO Monday
  variant: Variant;
  sent: number;
  replied: number;
  referred: number;
}

const WEEKS = ["2026-08-17", "2026-08-24", "2026-08-31", "2026-09-07", "2026-09-14", "2026-09-21", "2026-09-28"];

const PATTERN: Record<Variant, [number, number, number][]> = {
  referral: [[3, 1, 0], [5, 2, 1], [4, 1, 1], [6, 3, 1], [7, 3, 2], [5, 2, 1], [8, 4, 2]],
  "hiring-manager": [[2, 0, 0], [3, 1, 0], [4, 1, 0], [3, 1, 1], [5, 1, 0], [4, 2, 1], [5, 1, 1]],
  founder: [[1, 0, 0], [2, 1, 0], [1, 0, 0], [2, 0, 0], [3, 1, 1], [2, 1, 0], [3, 1, 0]],
};

export const SAMPLE_HISTORY: PastSend[] = (Object.keys(PATTERN) as Variant[]).flatMap((variant) =>
  PATTERN[variant].map(([sent, replied, referred], i) => ({ week: WEEKS[i], variant, sent, replied, referred })),
);
