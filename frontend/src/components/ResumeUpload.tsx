import { useEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "motion/react";
import { animate, createDrawable, stagger, utils } from "animejs";
import { useNavigate } from "react-router";
import { ALL_PEOPLE, STARTUPS } from "../data/startups";
import { matchStartup, referralWarmth } from "../lib/insights";
import { extractText, parseProfile, type Profile } from "../lib/resume";
import { prefersReducedMotion } from "../motion/setup";
import { UPLOAD_RESUME_EVENT } from "./CommandPalette";
import { useStore } from "../state/store";
import "./ResumeUpload.css";

const ACCEPT = ".pdf,.docx,.txt,.md";

const STEPS = [
  "Reading your résumé",
  "Extracting skills and experience",
  `Matching ${STARTUPS.length} recently funded startups`,
  "Estimating pay for each company",
  "Finding LinkedIn referral paths",
];

type Phase = { kind: "idle" } | { kind: "parsing"; fileName: string } | { kind: "done"; profile: Profile } | { kind: "error"; message: string };

/** The "Upload résumé" button. Renders as the lime primary CTA or a quieter pill. */
export function ResumeUpload({
  variant = "pill",
  children,
  listenForCommand = false,
}: {
  variant?: "primary" | "pill";
  children?: ReactNode;
  /** The one always-mounted instance (sidebar) answers the command palette's "Upload résumé". */
  listenForCommand?: boolean;
}) {
  const input = useRef<HTMLInputElement>(null);
  const { profile, setProfile } = useStore();
  const [phase, setPhase] = useState<Phase>({ kind: "idle" });

  useEffect(() => {
    if (!listenForCommand) return;
    const open = () => input.current?.click();
    window.addEventListener(UPLOAD_RESUME_EVENT, open);
    return () => window.removeEventListener(UPLOAD_RESUME_EVENT, open);
  }, [listenForCommand]);

  async function handle(file: File) {
    setPhase({ kind: "parsing", fileName: file.name });
    const started = performance.now();
    try {
      const text = await extractText(file);
      if (text.trim().length < 40) throw new Error("Couldn't read any text from that file. Is it a scanned image?");
      const parsed = parseProfile(text, file.name);
      // Keep preferences the user already set.
      const next = profile ? { ...parsed, targetRegions: profile.targetRegions, remoteOnly: profile.remoteOnly } : parsed;
      // Let the step animation finish so the result doesn't flash past.
      const minimum = prefersReducedMotion() ? 0 : 2600;
      await new Promise((r) => setTimeout(r, Math.max(0, minimum - (performance.now() - started))));
      setProfile(next);
      setPhase({ kind: "done", profile: next });
    } catch (error) {
      setPhase({ kind: "error", message: (error as Error).message });
    }
  }

  return (
    <>
      <input
        ref={input}
        type="file"
        accept={ACCEPT}
        hidden
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handle(file);
          e.target.value = "";
        }}
      />
      <button
        type="button"
        className={`btn ${variant === "primary" ? "btn-primary" : "btn-signup"}`}
        onClick={() => input.current?.click()}
      >
        <UploadIcon />
        {children ?? (profile ? "Replace résumé" : "Upload résumé")}
      </button>

      {createPortal(
        <AnimatePresence>
          {phase.kind !== "idle" && (
            <ParseDialog phase={phase} onClose={() => setPhase({ kind: "idle" })} onRetry={() => input.current?.click()} />
          )}
        </AnimatePresence>,
        document.body,
      )}
    </>
  );
}

function UploadIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" aria-hidden="true">
      <path d="M8 11V2.5M4.5 6 8 2.5 11.5 6M2.5 10.5v2a1 1 0 0 0 1 1h9a1 1 0 0 0 1-1v-2" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** Motion handles the dialog's enter/exit; Anime.js runs the scan + step sequence. */
function ParseDialog({ phase, onClose, onRetry }: { phase: Phase; onClose: () => void; onRetry: () => void }) {
  const navigate = useNavigate();
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = root.current;
    if (!el || phase.kind !== "parsing" || prefersReducedMotion()) return;
    const drawables = createDrawable(el.querySelectorAll(".scan-line"), 0, 0);
    const animations = [
      animate(drawables, { draw: ["0 0", "0 1"], duration: 500, delay: stagger(110), ease: "outQuad" }),
      animate(el.querySelector(".scan-beam")!, { translateY: [0, 96], duration: 1100, loop: true, alternate: true, ease: "inOutSine" }),
      animate(el.querySelectorAll(".parse-step"), {
        opacity: [0.25, 1],
        x: [-6, 0],
        duration: 400,
        delay: stagger(480, { start: 200 }),
        ease: "outExpo",
      }),
      animate(el.querySelectorAll(".parse-check"), { scale: [0, 1], duration: 300, delay: stagger(480, { start: 520 }), ease: "outBack" }),
    ];
    return () => {
      animations.forEach((a) => a.revert());
      utils.remove(el.querySelectorAll(".scan-line, .scan-beam"));
    };
  }, [phase.kind]);

  const summary = phase.kind === "done" ? summarise(phase.profile) : null;

  return (
    <motion.div className="parse-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={phase.kind === "parsing" ? undefined : onClose}>
      <motion.div
        className="parse-dialog panel"
        role="dialog"
        aria-modal="true"
        aria-label="Résumé analysis"
        ref={root}
        initial={{ opacity: 0, y: 24, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 12, scale: 0.98 }}
        transition={{ type: "spring", stiffness: 380, damping: 32 }}
        onClick={(e) => e.stopPropagation()}
      >
        {phase.kind === "parsing" && (
          <div className="parse-body">
            <svg className="parse-doc" viewBox="0 0 96 120" aria-hidden="true">
              <rect x="1" y="1" width="94" height="118" rx="8" className="doc-frame" />
              {[18, 30, 42, 58, 70, 82, 94].map((y, i) => (
                <line key={y} className="scan-line" x1="14" x2={i % 3 === 0 ? 60 : 82} y1={y} y2={y} />
              ))}
              <rect className="scan-beam" x="6" y="10" width="84" height="2" rx="1" />
            </svg>
            <div>
              <p className="t-caption t-muted">{phase.fileName}</p>
              <ol className="parse-steps">
                {STEPS.map((step) => (
                  <li key={step} className="parse-step">
                    <span className="parse-check">✓</span>
                    {step}
                  </li>
                ))}
              </ol>
            </div>
          </div>
        )}

        {phase.kind === "error" && (
          <div className="parse-result">
            <h2 className="t-heading-sm">That didn't work</h2>
            <p className="t-body-sm t-muted">{phase.message}</p>
            <p className="t-caption t-faint">PDF, DOCX or TXT with selectable text works best.</p>
            <div className="parse-actions">
              <button className="btn btn-ghost" onClick={onClose}>
                Close
              </button>
              <button className="btn btn-signup" onClick={onRetry}>
                Try another file
              </button>
            </div>
          </div>
        )}

        {phase.kind === "done" && summary && (
          <div className="parse-result">
            <p className="eyebrow">Résumé analysed</p>
            <h2 className="t-heading-sm">{phase.profile.name}</h2>
            <p className="t-body-sm t-muted">
              {phase.profile.headline} · {phase.profile.years ? `${phase.profile.years} yrs` : "experience not detected"} · {phase.profile.seniority}
              {phase.profile.location ? ` · ${phase.profile.location}` : ""}
            </p>
            <div className="chip-row">
              {phase.profile.skills.slice(0, 12).map((s) => (
                <span key={s} className="badge">
                  {s}
                </span>
              ))}
              {phase.profile.skills.length === 0 && <span className="t-caption t-faint">No skills detected — add them on your profile.</span>}
            </div>
            <dl className="parse-stats">
              <div>
                <dt>Strong matches</dt>
                <dd>{summary.strong}</dd>
              </div>
              <div>
                <dt>Warm referral paths</dt>
                <dd>{summary.warm}</dd>
              </div>
              <div>
                <dt>Shared school / employer</dt>
                <dd>{summary.shared}</dd>
              </div>
            </dl>
            <div className="parse-actions">
              <button className="btn btn-ghost" onClick={() => { onClose(); navigate("/profile"); }}>
                Review profile
              </button>
              <button className="btn btn-signup" onClick={() => { onClose(); navigate("/startups"); }}>
                See matching startups
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}

function summarise(profile: Profile) {
  const strong = STARTUPS.filter((s) => matchStartup(s, profile).score >= 60).length;
  const warmths = ALL_PEOPLE.map((p) => referralWarmth(p, profile));
  return {
    strong,
    warm: warmths.filter((w) => w.score >= 50).length,
    shared: warmths.filter((w) => w.reasons.some((r) => r.startsWith("Same school") || r.startsWith("Both worked"))).length,
  };
}
