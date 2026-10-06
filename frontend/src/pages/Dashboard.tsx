import { useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { LayoutGroup, motion } from "motion/react";
import { AreaChart } from "../charts/AreaChart";
import { ChartCard } from "../charts/ChartCard";
import { ColumnChart } from "../charts/ColumnChart";
import { HBarChart } from "../charts/HBarChart";
import { StackedBar } from "../charts/StackedBar";
import { StatTile } from "../charts/StatTile";
import { Avatar, SampleTag, Score } from "../components/bits";
import { Constellation } from "../components/Constellation";
import { PageHeader } from "../components/PageHeader";
import { ResumeUpload } from "../components/ResumeUpload";
import { SAMPLE_HISTORY } from "../data/history";
import { REGIONS, STARTUPS, daysSince, type Round } from "../data/startups";
import { VARIANT_LABEL, type Variant } from "../lib/coldmail";
import { formatFunding, formatUsd, pct } from "../lib/format";
import { bestContact, estimatePay, matchStartup } from "../lib/insights";
import { useStaggerIn } from "../motion/useStaggerIn";
import { STAGES, useStore } from "../state/store";
import "./pages.css";

const RANGES = [30, 60, 90] as const;

const ROUND_GROUPS: { key: string; label: string; color: string; rounds: Round[] }[] = [
  { key: "seed", label: "Pre-seed & seed", color: "var(--viz-3)", rounds: ["Pre-seed", "Seed"] },
  { key: "a", label: "Series A", color: "var(--viz-1)", rounds: ["Series A"] },
  { key: "b", label: "Series B+", color: "var(--viz-2)", rounds: ["Series B", "Series C"] },
];

export function Dashboard() {
  const navigate = useNavigate();
  const { profile, outreach, stages } = useStore();
  const [range, setRange] = useState<(typeof RANGES)[number]>(90);
  const revealRef = useStaggerIn<HTMLDivElement>();

  const inRange = useMemo(() => STARTUPS.filter((s) => daysSince(s.announced) <= range), [range]);

  const matches = inRange.map((s) => ({ s, match: matchStartup(s, profile), contact: bestContact(s, profile), pay: estimatePay(s, profile) }));
  const strong = matches.filter((m) => m.match.score >= 60).length;
  const warm = matches.filter((m) => m.contact && m.contact.warmth.score >= 50).length;

  // Outreach totals = sample history + your own sends.
  const mine = Object.values(outreach);
  const mineSent = mine.filter((o) => o.status === "sent" || o.status === "replied" || o.status === "queued").length;
  const mineReplied = mine.filter((o) => o.status === "replied").length;
  const totalSent = SAMPLE_HISTORY.reduce((n, h) => n + h.sent, 0) + mineSent;
  const totalReplied = SAMPLE_HISTORY.reduce((n, h) => n + h.replied, 0) + mineReplied;
  const replyRate = totalSent ? (totalReplied / totalSent) * 100 : 0;
  const rateFor = (from: string, to: string) => {
    const rows = SAMPLE_HISTORY.filter((h) => h.week >= from && h.week < to);
    const sent = rows.reduce((n, h) => n + h.sent, 0);
    return sent ? (rows.reduce((n, h) => n + h.replied, 0) / sent) * 100 : 0;
  };
  const rateChange = Math.round(rateFor("2026-09-01", "2026-10-01") - rateFor("2026-08-01", "2026-09-01"));

  // Charts
  const byRegion = REGIONS.map((r) => {
    const list = inRange.filter((s) => s.region === r);
    const usd = list.reduce((n, s) => n + s.amountUsd, 0);
    return { key: r, label: r, value: usd, display: formatUsd(usd), detail: `${list.length} startups` };
  }).sort((a, b) => b.value - a.value);

  const weeks = Math.ceil(range / 7);
  const perWeek = Array.from({ length: weeks }, (_, i) => {
    const w = weeks - 1 - i;
    const count = inRange.filter((s) => Math.floor(daysSince(s.announced) / 7) === w).length;
    return { label: w === 0 ? "This wk" : `${w}w ago`, value: count, display: String(count) };
  });

  const roundRows = REGIONS.map((r) => ({
    key: r,
    label: r,
    values: Object.fromEntries(ROUND_GROUPS.map((g) => [g.key, inRange.filter((s) => s.region === r && g.rounds.includes(s.round)).length])),
  }));

  const stageCounts = STAGES.slice(2).map((stage) => {
    const reached = STARTUPS.filter((s) => STAGES.indexOf(stages[s.id] ?? "Found") >= STAGES.indexOf(stage)).length;
    return { key: stage, label: stage, value: reached, display: String(reached) };
  });

  const variantRates = (Object.keys(VARIANT_LABEL) as Variant[]).map((v) => {
    const rows = SAMPLE_HISTORY.filter((h) => h.variant === v);
    const sent = rows.reduce((n, h) => n + h.sent, 0) + mine.filter((o) => o.variant === v && o.status !== "draft").length;
    const replied = rows.reduce((n, h) => n + h.replied, 0) + mine.filter((o) => o.variant === v && o.status === "replied").length;
    const rate = sent ? (replied / sent) * 100 : 0;
    return { key: v, label: VARIANT_LABEL[v], value: rate, display: pct(rate), detail: `${replied} replies / ${sent} sent` };
  });
  const bestVariant = [...variantRates].sort((a, b) => b.value - a.value)[0]?.key;

  const weekly = [...new Set(SAMPLE_HISTORY.map((h) => h.week))].map((week) => {
    const sent = SAMPLE_HISTORY.filter((h) => h.week === week).reduce((n, h) => n + h.sent, 0);
    const d = new Date(week + "T00:00:00Z");
    return { key: week, label: d.toLocaleDateString("en-GB", { day: "numeric", month: "short", timeZone: "UTC" }), value: sent, display: String(sent) };
  });
  weekly.push({ key: "now", label: "This wk", value: mineSent, display: String(mineSent) });

  const nextMoves = [...matches].sort((a, b) => b.match.score - a.match.score || b.s.culture - a.s.culture).slice(0, 5);

  return (
    <>
      <PageHeader
        eyebrow={<>Monday, 6 October · <SampleTag /></>}
        title={profile ? `Hi ${profile.name.split(" ")[0]}, here's your search` : "Find funded startups that fit you"}
        description="Recently funded startups, what they'd pay you, and who can refer you — all ranked against your résumé."
      />

      {!profile && (
        <section className="welcome card">
          <div>
            <h2 className="t-heading-sm">Start with your résumé</h2>
            <p className="t-body-sm t-muted" style={{ marginBottom: 24 }}>
              It's parsed in your browser — nothing is uploaded. Jobly uses it to rank every startup, estimate your pay, and write the cold emails.
            </p>
            <ResumeUpload variant="primary">Upload résumé</ResumeUpload>
          </div>
          <ol className="welcome-steps">
            <li>Match your skills and experience against every recently funded startup</li>
            <li>Estimate what each company would likely pay you</li>
            <li>Find LinkedIn connections who can refer you — shared school, employer or mutuals</li>
            <li>Draft a cold email for each one and track replies here</li>
          </ol>
        </section>
      )}

      <div className="filter-row" role="group" aria-label="Date range">
        <LayoutGroup id="range">
          <div className="segmented">
            {RANGES.map((r) => (
              <button key={r} className="segment" aria-pressed={range === r} onClick={() => setRange(r)}>
                {range === r && <motion.span layoutId="range-bg" className="segment-bg" transition={{ type: "spring", stiffness: 500, damping: 40 }} />}
                <span>Last {r} days</span>
              </button>
            ))}
          </div>
        </LayoutGroup>
        <span className="t-caption t-faint">Scopes the funding stats and charts below</span>
      </div>

      <ChartCard
        className="constellation-card"
        title="Your referral constellation"
        subtitle="You at the centre, people who can refer you in between, startups on the outer ring. Brighter lines are warmer paths — click any point."
        table={{
          columns: ["Startup", "Raised", "Warmest contact", "Warmth"],
          rows: matches.map((m) => [m.s.name, `${formatFunding(m.s, m.s.amountUsd)} ${m.s.round}`, m.contact?.person.name ?? "—", m.contact?.warmth.score ?? 0]),
        }}
      >
        <ul className="legend-shapes">
          <li><span className="legend-you" />You</li>
          <li><span className="legend-dot" />Contact (brighter = warmer)</li>
          {ROUND_GROUPS.map((g) => (
            <li key={g.key}>
              <span className="legend-tri" style={{ color: g.color }} />
              {g.label}
            </li>
          ))}
        </ul>
        <Constellation startups={inRange} profile={profile} />
      </ChartCard>

      <div className="kpi-row">
        <StatTile label="Startups funded" value={inRange.length} delta={{ text: `in the last ${range} days`, direction: "flat" }} />
        <StatTile label="Strong matches" value={strong} delta={{ text: profile ? "score ≥ 60" : "upload résumé", direction: "flat" }} />
        <StatTile label="Warm referral paths" value={warm} delta={{ text: "warmth ≥ 50", direction: "flat" }} />
        <StatTile label="Emails sent" value={totalSent} delta={{ text: "last 8 weeks", direction: "flat" }} />
        <StatTile label="Reply rate" value={replyRate} format={(n) => pct(n)} delta={{ text: `${rateChange >= 0 ? "+" : ""}${rateChange} pts Sep vs Aug`, direction: rateChange > 0 ? "up" : rateChange < 0 ? "down" : "flat" }} />
      </div>

      <div ref={revealRef} className="grid-2">
        <div data-reveal>
          <ChartCard
            title="Capital raised by region"
            subtitle={`Total announced in the last ${range} days`}
            table={{ columns: ["Region", "Raised", "Startups"], rows: byRegion.map((r) => [r.label, r.display, r.detail ?? ""]) }}
          >
            <HBarChart data={byRegion} labelWidth={80} />
          </ChartCard>
        </div>
        <div data-reveal>
          <ChartCard
            title="Funding announcements per week"
            subtitle="New rounds that match your target regions"
            table={{ columns: ["Week", "Announcements"], rows: perWeek.map((p) => [p.label, p.value]) }}
          >
            <AreaChart data={perWeek} seriesLabel="announcements" />
          </ChartCard>
        </div>
        <div data-reveal>
          <ChartCard
            title="Rounds by region"
            subtitle="Number of startups at each stage"
            legend={ROUND_GROUPS.map((g) => ({ label: g.label, color: g.color }))}
            table={{
              columns: ["Region", ...ROUND_GROUPS.map((g) => g.label)],
              rows: roundRows.map((r) => [r.label, ...ROUND_GROUPS.map((g) => r.values[g.key])]),
            }}
          >
            <StackedBar rows={roundRows} series={ROUND_GROUPS} format={(n) => String(n)} labelWidth={80} />
          </ChartCard>
        </div>
        <div data-reveal>
          <ChartCard
            title="Your pipeline"
            subtitle="Companies that reached each stage"
            table={{ columns: ["Stage", "Companies"], rows: stageCounts.map((s) => [s.label, s.value]) }}
          >
            <HBarChart data={stageCounts} labelWidth={90} />
          </ChartCard>
        </div>
        <div data-reveal>
          <ChartCard
            title="Reply rate by message type"
            subtitle="Which kind of cold email gets answered"
            table={{ columns: ["Message type", "Reply rate", "Replies / sent"], rows: variantRates.map((v) => [v.label, v.display, v.detail ?? ""]) }}
          >
            <HBarChart data={variantRates} labelWidth={110} emphasis={bestVariant} />
          </ChartCard>
        </div>
        <div data-reveal>
          <ChartCard
            title="Emails sent per week"
            subtitle="Sample history plus what you've queued this week"
            table={{ columns: ["Week", "Sent"], rows: weekly.map((w) => [w.label, w.value]) }}
          >
            <ColumnChart data={weekly} emphasis="now" />
          </ChartCard>
        </div>
      </div>

      <section>
        <div className="section-title">
          <h2>Best next moves</h2>
          <button className="btn btn-nav" onClick={() => navigate("/startups")}>
            All startups →
          </button>
        </div>
        <div className="card" style={{ padding: 0 }}>
          <div className="rows move-list">
            <div className="rows-head">
              <span>Startup</span>
              <span>Est. pay for you</span>
              <span>Best referral</span>
              <span>Match</span>
            </div>
            {nextMoves.map(({ s, match, contact, pay }) => (
              <div
                key={s.id}
                className="row row-link"
                role="link"
                tabIndex={0}
                onClick={() => navigate(`/startups/${s.id}`)}
                onKeyDown={(e) => e.key === "Enter" && navigate(`/startups/${s.id}`)}
              >
                <div className="cell-main">
                  <span className="cell-title">{s.name}</span>
                  <span className="cell-sub">
                    {formatFunding(s, s.amountUsd)} {s.round} · {s.city}
                  </span>
                </div>
                <span className="num">{pay.display}</span>
                {contact ? (
                  <div className="person">
                    <Avatar name={contact.person.name} size={24} />
                    <div className="cell-main">
                      <span>{contact.person.name}</span>
                      <span className="cell-sub">{contact.warmth.reasons[1] ?? contact.warmth.reasons[0]}</span>
                    </div>
                  </div>
                ) : (
                  <span className="t-faint">—</span>
                )}
                <Score value={match.score} label="Match" />
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
