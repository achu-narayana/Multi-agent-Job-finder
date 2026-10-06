import { useMemo, useState } from "react";
import { Link } from "react-router";
import { AnimatePresence, LayoutGroup, motion } from "motion/react";
import { Avatar, DegreeBadge, SampleTag, Score } from "../components/bits";
import { Composer } from "../components/Composer";
import { PageHeader } from "../components/PageHeader";
import { ALL_PEOPLE, REGIONS, STARTUP_BY_ID, type Person, type PersonKind, type Region } from "../data/startups";
import { formatFunding } from "../lib/format";
import { referralWarmth } from "../lib/insights";
import { EASE } from "../motion/setup";
import { useStore } from "../state/store";
import "./pages.css";

const KINDS: (PersonKind | "All")[] = ["All", "Engineer", "Engineering manager", "Recruiter", "Founder"];

export function Referrals() {
  const { profile, outreach } = useStore();
  const [degree, setDegree] = useState<"All" | 1 | 2>("All");
  const [kind, setKind] = useState<PersonKind | "All">("All");
  const [region, setRegion] = useState<Region | "All">("All");
  const [sharedOnly, setSharedOnly] = useState(false);
  const [composing, setComposing] = useState<Person | null>(null);

  const rows = useMemo(
    () =>
      ALL_PEOPLE.map((p) => ({ person: p, startup: STARTUP_BY_ID[p.companyId], warmth: referralWarmth(p, profile) }))
        .filter(
          ({ person, startup, warmth }) =>
            (degree === "All" || person.degree === degree) &&
            (kind === "All" || person.kind === kind) &&
            (region === "All" || startup.region === region) &&
            (!sharedOnly || warmth.reasons.some((r) => r.startsWith("Same school") || r.startsWith("Both worked"))),
        )
        .sort((a, b) => b.warmth.score - a.warmth.score),
    [profile, degree, kind, region, sharedOnly],
  );

  return (
    <>
      <PageHeader
        eyebrow={<>LinkedIn referral paths · <SampleTag /></>}
        title="Who can refer you"
        description="People at recently funded startups, ranked by how warm the connection is — shared school or employer, mutuals and recent activity."
      />

      <div className="filter-row">
        <LayoutGroup id="degree">
          <div className="segmented" role="group" aria-label="Connection degree">
            {(["All", 1, 2] as const).map((d) => (
              <button key={d} className="segment" aria-pressed={degree === d} onClick={() => setDegree(d)}>
                {degree === d && <motion.span layoutId="degree-bg" className="segment-bg" transition={{ type: "spring", stiffness: 500, damping: 40 }} />}
                <span>{d === "All" ? "All" : d === 1 ? "1st degree" : "2nd degree"}</span>
              </button>
            ))}
          </div>
        </LayoutGroup>
        <select className="select" value={kind} onChange={(e) => setKind(e.target.value as PersonKind | "All")} aria-label="Role">
          {KINDS.map((k) => (
            <option key={k} value={k}>
              {k === "All" ? "All roles" : k}
            </option>
          ))}
        </select>
        <select className="select" value={region} onChange={(e) => setRegion(e.target.value as Region | "All")} aria-label="Region">
          <option value="All">All regions</option>
          {REGIONS.map((r) => (
            <option key={r}>{r}</option>
          ))}
        </select>
        <label className="toggle">
          <input type="checkbox" checked={sharedOnly} onChange={(e) => setSharedOnly(e.target.checked)} />
          Shared school or employer
        </label>
        <span className="spacer" />
        <span className="t-caption t-muted">{rows.length} people</span>
      </div>

      <div className="card" style={{ padding: 0 }}>
        <div className="rows referral-rows">
          <div className="rows-head">
            <span>Person</span>
            <span>Company</span>
            <span>Connection</span>
            <span>Why them</span>
            <span>Warmth</span>
            <span />
          </div>
          <AnimatePresence initial={false} mode="popLayout">
            {rows.map(({ person, startup, warmth }) => (
              <motion.div
                key={person.id}
                layout
                className="row"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3, ease: EASE.cssBezier }}
              >
                <div className="person">
                  <Avatar name={person.name} />
                  <div className="cell-main">
                    <span className="cell-title">{person.name}</span>
                    <span className="cell-sub">{person.title}</span>
                  </div>
                </div>
                <div className="cell-main">
                  <Link to={`/startups/${startup.id}`}>{startup.name}</Link>
                  <span className="cell-sub">
                    {formatFunding(startup, startup.amountUsd)} {startup.round} · {startup.city}
                  </span>
                </div>
                <span>
                  <DegreeBadge degree={person.degree} />
                </span>
                <div className="reasons">
                  {warmth.reasons.slice(1, 4).map((r) => (
                    <span key={r} className="badge">
                      {r}
                    </span>
                  ))}
                </div>
                <Score value={warmth.score} label="Warmth" />
                <div className="row-actions">
                  <button className="btn btn-ghost" onClick={() => setComposing(person)}>
                    {outreach[person.id] ? "Edit email" : "Write cold email"}
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          {rows.length === 0 && <p className="empty">Nobody matches these filters yet.</p>}
        </div>
      </div>

      <p className="note">
        Connection degree and mutuals will come from the LinkedIn channel in backend/packages/reach. Jobly never sends LinkedIn messages for you — it writes them, you send them.
      </p>

      <Composer person={composing} onClose={() => setComposing(null)} />
    </>
  );
}
