import { useState } from "react";
import { Link } from "react-router";
import { AnimatePresence, motion } from "motion/react";
import { ChartCard } from "../charts/ChartCard";
import { HBarChart } from "../charts/HBarChart";
import { StatTile } from "../charts/StatTile";
import { Avatar, SampleTag } from "../components/bits";
import { Composer } from "../components/Composer";
import { PageHeader } from "../components/PageHeader";
import { SAMPLE_HISTORY } from "../data/history";
import { ALL_PEOPLE, STARTUP_BY_ID, type Person } from "../data/startups";
import { VARIANT_LABEL, type Variant } from "../lib/coldmail";
import { pct } from "../lib/format";
import { EASE } from "../motion/setup";
import { useStore, type OutreachStatus } from "../state/store";
import "./pages.css";

const PEOPLE_BY_ID = Object.fromEntries(ALL_PEOPLE.map((p) => [p.id, p]));
const STATUSES: OutreachStatus[] = ["draft", "queued", "sent", "replied"];
const STATUS_LABEL: Record<OutreachStatus, string> = { draft: "Draft", queued: "Queued", sent: "Sent", replied: "Replied" };

export function Outreach() {
  const { outreach, setOutreachStatus } = useStore();
  const [composing, setComposing] = useState<Person | null>(null);
  const records = Object.values(outreach).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  const count = (s: OutreachStatus) => records.filter((r) => r.status === s).length;

  const variantRates = (Object.keys(VARIANT_LABEL) as Variant[]).map((v) => {
    const rows = SAMPLE_HISTORY.filter((h) => h.variant === v);
    const sent = rows.reduce((n, h) => n + h.sent, 0);
    const referred = rows.reduce((n, h) => n + h.referred, 0);
    const rate = sent ? (referred / sent) * 100 : 0;
    return { key: v, label: VARIANT_LABEL[v], value: rate, display: pct(rate), detail: `${referred} referrals / ${sent} sent` };
  });

  return (
    <>
      <PageHeader
        eyebrow={<>Cold email · <SampleTag /></>}
        title="Outreach"
        description="Every email you've drafted or approved. Approved emails go out through Jobly Inbox once Cloudflare is connected."
      />

      <div className="kpi-row">
        <StatTile label="Drafts" value={count("draft")} />
        <StatTile label="Queued to send" value={count("queued")} />
        <StatTile label="Sent" value={count("sent")} />
        <StatTile label="Replied" value={count("replied")} />
        <StatTile label="Daily send cap" value={25} delta={{ text: "protects your domain", direction: "flat" }} />
      </div>

      <section>
        <div className="section-title">
          <h2>Your emails</h2>
        </div>
        <div className="card" style={{ padding: 0 }}>
          {records.length === 0 ? (
            <div className="empty">
              <p style={{ marginBottom: 16 }}>No emails yet. Open a startup and pick someone to write to.</p>
              <Link className="btn btn-ghost" to="/referrals">
                Find people to email
              </Link>
            </div>
          ) : (
            <div className="rows outreach-rows">
              <div className="rows-head">
                <span>To</span>
                <span>Subject</span>
                <span>Type</span>
                <span>Status</span>
                <span />
              </div>
              <AnimatePresence initial={false}>
                {records.map((r) => {
                  const person = PEOPLE_BY_ID[r.personId];
                  const startup = STARTUP_BY_ID[r.companyId];
                  if (!person || !startup) return null;
                  return (
                    <motion.div key={r.personId} layout className="row" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3, ease: EASE.cssBezier }}>
                      <div className="person">
                        <Avatar name={person.name} />
                        <div className="cell-main">
                          <span className="cell-title">{person.name}</span>
                          <span className="cell-sub">{startup.name}</span>
                        </div>
                      </div>
                      <span className="cell-sub">{r.subject}</span>
                      <span className="t-caption">{VARIANT_LABEL[r.variant]}</span>
                      <select className="select" value={r.status} onChange={(e) => setOutreachStatus(r.personId, e.target.value as OutreachStatus)} aria-label={`Status for ${person.name}`}>
                        {STATUSES.map((s) => (
                          <option key={s} value={s}>
                            {STATUS_LABEL[s]}
                          </option>
                        ))}
                      </select>
                      <div className="row-actions">
                        <button className="btn btn-ghost" onClick={() => setComposing(person)}>
                          Open
                        </button>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          )}
        </div>
      </section>

      <ChartCard
        title="Referral rate by message type"
        subtitle="Share of sent emails that turned into a referral (sample history)"
        table={{ columns: ["Message type", "Referral rate", "Referrals / sent"], rows: variantRates.map((v) => [v.label, v.display, v.detail ?? ""]) }}
      >
        <HBarChart data={variantRates} labelWidth={110} emphasis={[...variantRates].sort((a, b) => b.value - a.value)[0].key} />
      </ChartCard>

      <Composer person={composing} onClose={() => setComposing(null)} />
    </>
  );
}
