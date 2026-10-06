import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { Variant } from "../lib/coldmail";
import type { Profile } from "../lib/resume";

export const STAGES = ["Found", "Researched", "Contacted", "Replied", "Referred", "Interview", "Offer"] as const;
export type Stage = (typeof STAGES)[number];

export type OutreachStatus = "draft" | "queued" | "sent" | "replied";

export interface OutreachRecord {
  personId: string;
  companyId: string;
  variant: Variant;
  subject: string;
  body: string;
  status: OutreachStatus;
  updatedAt: string;
}

interface State {
  profile: Profile | null;
  outreach: Record<string, OutreachRecord>;
  stages: Record<string, Stage>;
}

interface Store extends State {
  setProfile: (profile: Profile | null) => void;
  updateProfile: (patch: Partial<Profile>) => void;
  saveOutreach: (record: Omit<OutreachRecord, "updatedAt">) => void;
  setOutreachStatus: (personId: string, status: OutreachStatus) => void;
  setStage: (companyId: string, stage: Stage) => void;
  stageOf: (companyId: string) => Stage;
}

const KEY = "jobly:v1";

// A few companies start mid-pipeline so the board isn't empty on first run.
const SEEDED_STAGES: Record<string, Stage> = {
  vernacular: "Replied",
  tallyho: "Contacted",
  "cascade-health": "Referred",
  carbonbook: "Interview",
  ledgerloop: "Researched",
};

function load(): State {
  const empty: State = { profile: null, outreach: {}, stages: SEEDED_STAGES };
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return empty;
    const parsed = JSON.parse(raw) as Partial<State>;
    return { ...empty, ...parsed, stages: { ...SEEDED_STAGES, ...parsed.stages } };
  } catch {
    return empty;
  }
}

const Ctx = createContext<Store | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<State>(load);

  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(state));
    } catch {
      // Storage unavailable (private mode) — the app still works for this session.
    }
  }, [state]);

  const setProfile = useCallback((profile: Profile | null) => setState((s) => ({ ...s, profile })), []);

  const updateProfile = useCallback(
    (patch: Partial<Profile>) => setState((s) => (s.profile ? { ...s, profile: { ...s.profile, ...patch } } : s)),
    [],
  );

  const saveOutreach = useCallback((record: Omit<OutreachRecord, "updatedAt">) => {
    setState((s) => {
      const stages = { ...s.stages };
      const current = STAGES.indexOf(stages[record.companyId] ?? "Found");
      const target = record.status === "replied" ? "Replied" : record.status === "draft" ? "Researched" : "Contacted";
      if (STAGES.indexOf(target) > current) stages[record.companyId] = target;
      return {
        ...s,
        stages,
        outreach: { ...s.outreach, [record.personId]: { ...record, updatedAt: new Date().toISOString() } },
      };
    });
  }, []);

  const setOutreachStatus = useCallback(
    (personId: string, status: OutreachStatus) =>
      setState((s) => {
        const existing = s.outreach[personId];
        if (!existing) return s;
        const stages = { ...s.stages };
        if (status === "replied" && STAGES.indexOf(stages[existing.companyId] ?? "Found") < STAGES.indexOf("Replied")) {
          stages[existing.companyId] = "Replied";
        }
        return {
          ...s,
          stages,
          outreach: { ...s.outreach, [personId]: { ...existing, status, updatedAt: new Date().toISOString() } },
        };
      }),
    [],
  );

  const setStage = useCallback(
    (companyId: string, stage: Stage) => setState((s) => ({ ...s, stages: { ...s.stages, [companyId]: stage } })),
    [],
  );

  const store = useMemo<Store>(
    () => ({
      ...state,
      setProfile,
      updateProfile,
      saveOutreach,
      setOutreachStatus,
      setStage,
      stageOf: (id) => state.stages[id] ?? "Found",
    }),
    [state, setProfile, updateProfile, saveOutreach, setOutreachStatus, setStage],
  );

  return <Ctx.Provider value={store}>{children}</Ctx.Provider>;
}

export function useStore(): Store {
  const store = useContext(Ctx);
  if (!store) throw new Error("useStore must be used inside <StoreProvider>");
  return store;
}
