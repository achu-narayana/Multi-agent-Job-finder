import { Link } from "react-router";
import { LayoutGroup, motion } from "motion/react";
import { RoundBadge, SampleTag } from "../components/bits";
import { PageHeader } from "../components/PageHeader";
import { STARTUPS } from "../data/startups";
import { formatFunding } from "../lib/format";
import { matchStartup } from "../lib/insights";
import { STAGES, useStore } from "../state/store";
import "./pages.css";

/** Kanban board. Motion's shared layout animates a card between columns. */
export function Pipeline() {
  const { profile, stageOf, setStage } = useStore();

  return (
    <>
      <PageHeader
        eyebrow={<>Tracking · <SampleTag /></>}
        title="Pipeline"
        description="Every startup from first find to offer. Sending an email moves a company to Contacted automatically."
      />

      <LayoutGroup id="board">
        <div className="board">
          {STAGES.map((stage, si) => {
            const cards = STARTUPS.filter((s) => stageOf(s.id) === stage);
            return (
              <section key={stage} className="board-col" aria-label={stage}>
                <header className="board-col-head">
                  <span>{stage}</span>
                  <span>{cards.length}</span>
                </header>
                {cards.map((s) => (
                  <motion.article key={s.id} layoutId={`card-${s.id}`} layout className="board-card" transition={{ type: "spring", stiffness: 420, damping: 36 }}>
                    <Link to={`/startups/${s.id}`} className="board-card-title">
                      {s.name}
                    </Link>
                    <span className="t-muted">
                      {formatFunding(s, s.amountUsd)} · {s.city}
                    </span>
                    <span>
                      <RoundBadge round={s.round} />
                    </span>
                    <div className="board-card-actions">
                      <button className="icon-btn" disabled={si === 0} onClick={() => setStage(s.id, STAGES[si - 1])} aria-label={`Move ${s.name} back to ${STAGES[si - 1] ?? ""}`}>
                        ←
                      </button>
                      {profile && <span className="t-faint">match {matchStartup(s, profile).score}</span>}
                      <button
                        className="icon-btn"
                        disabled={si === STAGES.length - 1}
                        onClick={() => setStage(s.id, STAGES[si + 1])}
                        aria-label={`Move ${s.name} forward to ${STAGES[si + 1] ?? ""}`}
                      >
                        →
                      </button>
                    </div>
                  </motion.article>
                ))}
              </section>
            );
          })}
        </div>
      </LayoutGroup>
    </>
  );
}
