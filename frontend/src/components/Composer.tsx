import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, LayoutGroup, motion } from "motion/react";
import { animated, useSpring } from "@react-spring/web";
import { STARTUP_BY_ID, type Person } from "../data/startups";
import { VARIANT_LABEL, defaultVariant, draftMail, scoreDraft, type Draft, type Variant } from "../lib/coldmail";
import { referralWarmth } from "../lib/insights";
import { useStore } from "../state/store";
import { Avatar, DegreeBadge } from "./bits";
import "../pages/pages.css";

const VARIANTS: Variant[] = ["referral", "hiring-manager", "founder"];

interface Props {
  person: Person | null;
  onClose: () => void;
}

/** Cold-mail composer drawer. Motion slides it in; React Spring drives the score meter. */
export function Composer({ person, onClose }: Props) {
  return createPortal(
    <AnimatePresence>{person && <ComposerPanel key={person.id} person={person} onClose={onClose} />}</AnimatePresence>,
    document.body,
  );
}

function ComposerPanel({ person, onClose }: { person: Person; onClose: () => void }) {
  const startup = STARTUP_BY_ID[person.companyId];
  const { profile, outreach, saveOutreach } = useStore();
  const existing = outreach[person.id];

  const [variant, setVariant] = useState<Variant>(existing?.variant ?? defaultVariant(person));
  const [draft, setDraft] = useState<Draft>(() =>
    existing
      ? { subject: existing.subject, body: existing.body, linkedinNote: draftMail(person, startup, profile, existing.variant).linkedinNote }
      : draftMail(person, startup, profile, variant),
  );
  const [copied, setCopied] = useState<string | null>(null);

  const warmth = referralWarmth(person, profile);
  const { score, checks } = useMemo(() => scoreDraft(draft, startup), [draft, startup]);
  const meter = useSpring({ w: score / 100, config: { tension: 200, friction: 24 } });

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  function switchVariant(next: Variant) {
    setVariant(next);
    setDraft(draftMail(person, startup, profile, next));
  }

  async function copy(text: string, what: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(what);
      setTimeout(() => setCopied(null), 1600);
    } catch {
      setCopied("Copy failed");
    }
  }

  function save(status: "draft" | "queued") {
    saveOutreach({ personId: person.id, companyId: startup.id, variant, subject: draft.subject, body: draft.body, status });
    onClose();
  }

  const linkedinSearch = `https://www.linkedin.com/search/results/people/?keywords=${encodeURIComponent(`${person.name} ${startup.name}`)}`;
  const mailto = `mailto:${person.email}?subject=${encodeURIComponent(draft.subject)}&body=${encodeURIComponent(draft.body)}`;

  return (
    <>
      <motion.div className="drawer-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} />
      <motion.aside
        className="drawer"
        role="dialog"
        aria-modal="true"
        aria-label={`Cold email to ${person.name}`}
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{ type: "spring", stiffness: 340, damping: 36 }}
      >
        <div className="drawer-head">
          <div className="person">
            <Avatar name={person.name} />
            <div className="cell-main">
              <span className="cell-title">{person.name}</span>
              <span className="cell-sub">
                {person.title} · {startup.name}
              </span>
            </div>
            <DegreeBadge degree={person.degree} />
          </div>
          <button className="btn btn-ghost" onClick={onClose} aria-label="Close composer">
            Esc
          </button>
        </div>

        <div className="drawer-body">
          <div className="reasons">
            {warmth.reasons.map((r) => (
              <span key={r} className="badge">
                {r}
              </span>
            ))}
          </div>

          <LayoutGroup id="variants">
            <div className="segmented" role="group" aria-label="Message type">
              {VARIANTS.map((v) => (
                <button key={v} className="segment" aria-pressed={variant === v} onClick={() => switchVariant(v)}>
                  {variant === v && <motion.span layoutId="variant-bg" className="segment-bg" transition={{ type: "spring", stiffness: 500, damping: 40 }} />}
                  <span>{VARIANT_LABEL[v]}</span>
                </button>
              ))}
            </div>
          </LayoutGroup>

          <label className="field">
            <span className="field-label">
              To <span className="t-faint">{person.email} · pattern guess, verified by the backend later</span>
            </span>
          </label>

          <label className="field">
            <span className="field-label">Subject</span>
            <input className="input" value={draft.subject} onChange={(e) => setDraft({ ...draft, subject: e.target.value })} />
          </label>

          <label className="field">
            <span className="field-label">
              Email <span className="t-faint">{draft.body.split(/\s+/).filter(Boolean).length} words</span>
            </span>
            <textarea className="input textarea" value={draft.body} onChange={(e) => setDraft({ ...draft, body: e.target.value })} />
          </label>

          <div className="score-panel" aria-live="polite">
            <div className="score-head">
              <span className="t-caption t-muted">Draft check</span>
              <span className="score-big">{score}/100</span>
            </div>
            <div className="meter">
              <animated.div className="meter-fill" style={{ transform: meter.w.to((w) => `scaleX(${w})`) }} />
            </div>
            <ul className="check-list">
              {checks.map((c) => (
                <li key={c.label} className={c.pass ? "" : "is-fail"}>
                  <span className={`check-icon ${c.pass ? "pass" : "fail"}`}>{c.pass ? "✓" : "✕"}</span>
                  {c.label}
                </li>
              ))}
            </ul>
            <p className="note">Local check based on the marketing package's copy rules. The backend expert panel will score drafts with Claude.</p>
          </div>

          <label className="field">
            <span className="field-label">
              LinkedIn connection note <span className="t-faint">{draft.linkedinNote.length}/300</span>
            </span>
            <textarea
              className="input textarea textarea-sm"
              maxLength={300}
              value={draft.linkedinNote}
              onChange={(e) => setDraft({ ...draft, linkedinNote: e.target.value })}
            />
          </label>
          <p className="note">LinkedIn messages are never sent automatically — copy the note, open their profile and send it yourself.</p>
        </div>

        <div className="drawer-foot">
          <button className="btn btn-ghost" onClick={() => copy(`Subject: ${draft.subject}\n\n${draft.body}`, "Email copied")}>
            Copy email
          </button>
          <button className="btn btn-ghost" onClick={() => copy(draft.linkedinNote, "Note copied")}>
            Copy LinkedIn note
          </button>
          <a className="btn btn-ghost" href={linkedinSearch} target="_blank" rel="noreferrer">
            Find on LinkedIn ↗
          </a>
          <a className="btn btn-ghost" href={mailto}>
            Open in mail app
          </a>
          <span className="spacer" />
          <AnimatePresence>
            {copied && (
              <motion.span className="t-caption t-muted" initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                {copied}
              </motion.span>
            )}
          </AnimatePresence>
          <button className="btn btn-ghost" onClick={() => save("draft")}>
            Save draft
          </button>
          <button className="btn btn-primary" onClick={() => save("queued")}>
            Approve &amp; queue
          </button>
        </div>
      </motion.aside>
    </>
  );
}
