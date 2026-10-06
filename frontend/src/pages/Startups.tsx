import { useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { AnimatePresence, LayoutGroup, motion } from "motion/react";
import { RemoteBadge, RoundBadge, SampleTag, Score } from "../components/bits";
import { PageHeader } from "../components/PageHeader";
import { REGIONS, ROUNDS, STARTUPS, daysSince, type Region, type Round } from "../data/startups";
import { formatFunding, relativeDays } from "../lib/format";
import { bestContact, estimatePay, matchStartup } from "../lib/insights";
import { EASE } from "../motion/setup";
import { useStore } from "../state/store";
import "./pages.css";

type SortKey = "match" | "recent" | "amount" | "culture";

const SORTS: { key: SortKey; label: string }[] = [
  { key: "match", label: "Best match" },
  { key: "recent", label: "Most recent" },
  { key: "amount", label: "Largest round" },
  { key: "culture", label: "Best culture" },
];

export function Startups() {
  const navigate = useNavigate();
  const { profile } = useStore();
  // Deep links from the command palette: ?city=Hyderabad, ?remote=1
  const [params] = useSearchParams();
  const initialCity = params.get("city");
  const [region, setRegion] = useState<Region | "All">(
    () => (initialCity && STARTUPS.find((s) => s.city === initialCity)?.region) || "All",
  );
  const [city, setCity] = useState(initialCity ?? "All");
  const [round, setRound] = useState<Round | "All">("All");
  const [within, setWithin] = useState(90);
  const [remoteOnly, setRemoteOnly] = useState(params.get("remote") === "1" || (profile?.remoteOnly ?? false));
  const [sort, setSort] = useState<SortKey>(profile ? "match" : "recent");
  const [query, setQuery] = useState("");

  const cities = useMemo(
    () => [...new Set(STARTUPS.filter((s) => region === "All" || s.region === region).map((s) => s.city))].sort(),
    [region],
  );

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return STARTUPS.filter(
      (s) =>
        (region === "All" || s.region === region) &&
        (city === "All" || s.city === city) &&
        (round === "All" || s.round === round) &&
        daysSince(s.announced) <= within &&
        (!remoteOnly || s.remote === "Remote") &&
        (!q || [s.name, s.tagline, s.sector, s.city, ...s.roles.flatMap((r) => [r.title, ...r.skills])].join(" ").toLowerCase().includes(q)),
    )
      .map((s) => ({ s, match: matchStartup(s, profile), pay: estimatePay(s, profile), contact: bestContact(s, profile) }))
      .sort((a, b) => {
        if (sort === "match") return b.match.score - a.match.score || daysSince(a.s.announced) - daysSince(b.s.announced);
        if (sort === "recent") return daysSince(a.s.announced) - daysSince(b.s.announced);
        if (sort === "amount") return b.s.amountUsd - a.s.amountUsd;
        return b.s.culture - a.s.culture;
      });
  }, [region, city, round, within, remoteOnly, sort, query, profile]);

  return (
    <>
      <PageHeader
        eyebrow={<>Funded in the last 90 days · <SampleTag /></>}
        title="Recently funded startups"
        description="Every round, with what the company would likely pay you and your warmest way in."
      />

      <div className="filter-row">
        <LayoutGroup id="region">
          <div className="segmented" role="group" aria-label="Region">
            {(["All", ...REGIONS] as const).map((r) => (
              <button
                key={r}
                className="segment"
                aria-pressed={region === r}
                onClick={() => {
                  setRegion(r);
                  setCity("All");
                }}
              >
                {region === r && <motion.span layoutId="region-bg" className="segment-bg" transition={{ type: "spring", stiffness: 500, damping: 40 }} />}
                <span>{r === "USA" ? "USA" : r}</span>
              </button>
            ))}
          </div>
        </LayoutGroup>
        <select className="select" value={city} onChange={(e) => setCity(e.target.value)} aria-label="City">
          <option value="All">All cities</option>
          {cities.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
        <select className="select" value={round} onChange={(e) => setRound(e.target.value as Round | "All")} aria-label="Round">
          <option value="All">All rounds</option>
          {ROUNDS.map((r) => (
            <option key={r}>{r}</option>
          ))}
        </select>
        <select className="select" value={within} onChange={(e) => setWithin(Number(e.target.value))} aria-label="Funded within">
          <option value={30}>Last 30 days</option>
          <option value={60}>Last 60 days</option>
          <option value={90}>Last 90 days</option>
        </select>
        <label className="toggle">
          <input type="checkbox" checked={remoteOnly} onChange={(e) => setRemoteOnly(e.target.checked)} />
          Remote only
        </label>
        <span className="spacer" />
        <input className="input-sm" type="search" placeholder="Search name, sector, skill…" value={query} onChange={(e) => setQuery(e.target.value)} aria-label="Search startups" />
        <select className="select" value={sort} onChange={(e) => setSort(e.target.value as SortKey)} aria-label="Sort">
          {SORTS.map((s) => (
            <option key={s.key} value={s.key}>
              {s.label}
            </option>
          ))}
        </select>
      </div>

      <div className="card" style={{ padding: 0 }}>
        <div className="rows startup-rows">
          <div className="rows-head">
            <span>Startup</span>
            <span>Location</span>
            <span>Funding</span>
            <span>Est. pay for you</span>
            <span className="col-culture">Culture</span>
            <span>Match</span>
            <span className="col-referral">Warmest contact</span>
          </div>
          <AnimatePresence initial={false} mode="popLayout">
            {rows.map(({ s, match, pay, contact }) => (
              <motion.div
                key={s.id}
                layout
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3, ease: EASE.cssBezier }}
                className="row row-link"
                role="link"
                tabIndex={0}
                onClick={() => navigate(`/startups/${s.id}`)}
                onKeyDown={(e) => e.key === "Enter" && navigate(`/startups/${s.id}`)}
              >
                <div className="cell-main">
                  <span className="cell-title">{s.name}</span>
                  <span className="cell-sub">{s.tagline}</span>
                </div>
                <div className="cell-main">
                  <span>{s.city}</span>
                  <span className="cell-sub">
                    <RemoteBadge policy={s.remote} />
                  </span>
                </div>
                <div className="cell-main">
                  <span className="num">
                    {formatFunding(s, s.amountUsd)} <RoundBadge round={s.round} />
                  </span>
                  <span className="cell-sub">{relativeDays(daysSince(s.announced))}</span>
                </div>
                <span className="num">{pay.display}</span>
                <span className="col-culture">
                  <Score value={s.culture} label="Culture score" />
                </span>
                <Score value={match.score} label="Match" />
                <span className="cell-sub col-referral">
                  {contact ? `${contact.person.name} · ${contact.warmth.score}` : "—"}
                </span>
              </motion.div>
            ))}
          </AnimatePresence>
          {rows.length === 0 && <p className="empty">No startups match these filters. Try a wider date range or another region.</p>}
        </div>
      </div>
      <p className="note">
        Pay is a transparent estimate from market bands, stage and your résumé — open a company to see the reasoning. Culture scores come from public signals and always show their sources.
      </p>
    </>
  );
}
