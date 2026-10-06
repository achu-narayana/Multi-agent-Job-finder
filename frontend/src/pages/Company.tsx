import { useState } from "react";
import { Link, useParams, useSearchParams } from "react-router";
import { ChartCard } from "../charts/ChartCard";
import { ColumnChart } from "../charts/ColumnChart";
import { Meter } from "../charts/StatTile";
import { Avatar, DegreeBadge, RemoteBadge, RoundBadge, SampleTag, Score } from "../components/bits";
import { Composer } from "../components/Composer";
import { PageHeader } from "../components/PageHeader";
import { STARTUP_BY_ID, daysSince, type Person } from "../data/startups";
import { formatDate, formatFunding, relativeDays } from "../lib/format";
import { estimatePay, matchStartup, referralWarmth } from "../lib/insights";
import { useStaggerIn } from "../motion/useStaggerIn";
import { STAGES, useStore, type Stage } from "../state/store";
import "./pages.css";

const STATUS_LABEL = { draft: "Draft saved", queued: "Queued", sent: "Sent", replied: "Replied" } as const;

export function Company() {
  const { id = "" } = useParams();
  const startup = STARTUP_BY_ID[id];
  const { profile, outreach, stageOf, setStage } = useStore();
  const [params] = useSearchParams();
  // `?compose=<personId>` (from the command palette or constellation) opens that draft directly.
  const [composing, setComposing] = useState<Person | null>(
    () => startup?.people.find((p) => p.id === params.get("compose")) ?? null,
  );
  const revealRef = useStaggerIn<HTMLDivElement>();

  if (!startup) {
    return (
      <div className="empty card">
        <p>That startup isn't in your list.</p>
        <Link className="btn btn-ghost" to="/startups">
          Back to startups
        </Link>
      </div>
    );
  }

  const match = matchStartup(startup, profile);
  const pay = estimatePay(startup, profile);
  const people = [...startup.people]
    .map((p) => ({ person: p, warmth: referralWarmth(p, profile) }))
    .sort((a, b) => b.warmth.score - a.warmth.score);
  const best = people[0];
  const totalRaised = startup.history.reduce((n, h) => n + h.amountUsd, 0);
  const mySkills = new Set((profile?.skills ?? []).map((s) => s.toLowerCase()));

  const historyData = startup.history.map((h, i) => ({
    key: `${h.round}-${i}`,
    label: h.round,
    sublabel: new Date(h.date + "T00:00:00Z").toLocaleDateString("en-GB", { month: "short", year: "2-digit", timeZone: "UTC" }),
    value: h.amountUsd,
    display: formatFunding(startup, h.amountUsd),
  }));

  return (
    <>
      <Link to="/startups" className="back-link">
        ← Funded startups
      </Link>

      <PageHeader
        eyebrow={
          <>
            {startup.sector} · {startup.city}, {startup.country} · <SampleTag />
          </>
        }
        title={startup.name}
        description={startup.tagline}
        actions={
          <label className="toggle">
            Stage
            <select className="select" value={stageOf(startup.id)} onChange={(e) => setStage(startup.id, e.target.value as Stage)}>
              {STAGES.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </label>
        }
      />

      <div className="company-meta">
        <RoundBadge round={startup.round} />
        <RemoteBadge policy={startup.remote} />
        <span className="badge">{startup.headcount} people</span>
        <span className="badge badge-green">+{startup.headcountGrowth}% headcount in 6 mo</span>
        <span className="badge">Founded {startup.founded}</span>
        <span className="badge">{startup.domain}</span>
      </div>

      {/* The three answers: how much they raised, what they'd pay you, who can refer you. */}
      <div className="grid-3">
        <section className="card key-card">
          <span className="key-label">Raised</span>
          <span className="hero-figure">{formatFunding(startup, startup.amountUsd)}</span>
          <span className="t-caption t-muted">
            {startup.round} · {formatDate(startup.announced)} ({relativeDays(daysSince(startup.announced))})
          </span>
          <dl className="kv">
            <dt>Investors</dt>
            <dd>{startup.investors.join(", ")}</dd>
            <dt>Total raised</dt>
            <dd>{formatFunding(startup, totalRaised)}</dd>
            {startup.region === "India" && (
              <>
                <dt>In USD</dt>
                <dd>${(startup.amountUsd / 1_000_000).toFixed(1)}M</dd>
              </>
            )}
          </dl>
        </section>

        <section className="card key-card">
          <span className="key-label">What they'd likely pay you</span>
          <span className="pay-figure">{pay.display}</span>
          <span className="t-caption t-muted">
            {pay.unit} · {pay.equity}
          </span>
          <ul className="basis">
            {pay.basis.map((b) => (
              <li key={b}>{b}</li>
            ))}
          </ul>
          {!profile && <span className="note">Upload your résumé for a personal estimate — this uses a mid-level default.</span>}
        </section>

        <section className="card key-card">
          <span className="key-label">Referral paths</span>
          <span className="hero-figure">{people.filter((p) => p.warmth.score >= 50).length}</span>
          <span className="t-caption t-muted">warm contacts of {people.length} found</span>
          {best && (
            <>
              <div className="person">
                <Avatar name={best.person.name} />
                <div className="cell-main">
                  <span className="cell-title">{best.person.name}</span>
                  <span className="cell-sub">{best.person.title}</span>
                </div>
              </div>
              <button className="btn btn-signup" onClick={() => setComposing(best.person)}>
                Write cold email to {best.person.name.split(" ")[0]}
              </button>
            </>
          )}
        </section>
      </div>

      <div ref={revealRef} className="grid-2">
        <div data-reveal>
          <ChartCard
            title="Funding history"
            subtitle={`${startup.history.length} round${startup.history.length === 1 ? "" : "s"} · latest highlighted`}
            table={{
              columns: ["Round", "Date", "Amount"],
              rows: startup.history.map((h) => [h.round, formatDate(h.date), formatFunding(startup, h.amountUsd)]),
            }}
          >
            <ColumnChart data={historyData} emphasis={historyData[historyData.length - 1].key} height={220} />
          </ChartCard>
        </div>

        <section className="card key-card" data-reveal>
          <div className="section-title" style={{ marginBottom: 0 }}>
            <span className="key-label">Culture & remote signals</span>
            <Score value={startup.culture} label="Culture score" />
          </div>
          <ul className="signal-list">
            {startup.signals.map((sig) => (
              <li key={sig.label} className="signal">
                <span className={`signal-mark ${sig.positive ? "is-pos" : "is-neg"}`}>{sig.positive ? "＋" : "－"}</span>
                <span>{sig.label}</span>
                <span className="signal-source">{sig.source}</span>
              </li>
            ))}
          </ul>
          <p className="note">An estimate from public signals, not ground truth. Check the sources before deciding.</p>
        </section>
      </div>

      <section className="card key-card">
        <div className="section-title" style={{ marginBottom: 0 }}>
          <span className="key-label">Open roles for you</span>
          {profile && <span className="t-caption t-muted">Match {match.score}/100</span>}
        </div>
        {profile && <Meter value={match.score} label="Résumé match" />}
        <div className="role-list">
          {startup.roles.map((role) => (
            <div className="role" key={role.title}>
              <div className="role-head">
                <span className="cell-title">{role.title}</span>
                <span className="t-caption t-muted">{role.team}</span>
              </div>
              <div className="chip-row">
                {role.skills.map((s) => (
                  <span key={s} className={`badge${mySkills.has(s.toLowerCase()) ? " skill-hit" : ""}`}>
                    {mySkills.has(s.toLowerCase()) ? "✓ " : ""}
                    {s}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section>
        <div className="section-title">
          <h2>People who can refer you</h2>
          <span className="t-caption t-muted">Ranked by warmth</span>
        </div>
        <div className="card" style={{ padding: 0 }}>
          <div className="rows people-rows">
            <div className="rows-head">
              <span>Person</span>
              <span>Connection</span>
              <span>Why them</span>
              <span>Warmth</span>
              <span />
            </div>
            {people.map(({ person, warmth }) => {
              const record = outreach[person.id];
              return (
                <div key={person.id} className="row">
                  <div className="person">
                    <Avatar name={person.name} />
                    <div className="cell-main">
                      <span className="cell-title">{person.name}</span>
                      <span className="cell-sub">
                        {person.title} · {person.school}
                      </span>
                    </div>
                  </div>
                  <span>
                    <DegreeBadge degree={person.degree} />
                  </span>
                  <div className="reasons">
                    {warmth.reasons.slice(1).map((r) => (
                      <span key={r} className="badge">
                        {r}
                      </span>
                    ))}
                  </div>
                  <Score value={warmth.score} label="Warmth" />
                  <div className="row-actions">
                    {record && <span className="badge badge-iris">{STATUS_LABEL[record.status]}</span>}
                    <button className="btn btn-ghost" onClick={() => setComposing(person)}>
                      {record ? "Edit email" : "Write cold email"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <Composer person={composing} onClose={() => setComposing(null)} />
    </>
  );
}
