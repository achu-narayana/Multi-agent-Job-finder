import { useEffect, useMemo, useRef, type ReactNode } from "react";
import { Link } from "react-router";
import { motion } from "motion/react";
import { gsap } from "gsap";
import { useGSAP } from "@gsap/react";
import { animate, splitText, stagger } from "animejs";
import { HBarChart } from "../charts/HBarChart";
import { Kbd, MOD_KEY, OPEN_PALETTE_EVENT } from "../components/CommandPalette";
import { Constellation } from "../components/Constellation";
import { ResumeUpload } from "../components/ResumeUpload";
import { EXAMPLE_PROFILE, SAMPLE_HISTORY } from "../data/history";
import { STARTUPS, STARTUP_BY_ID, daysSince } from "../data/startups";
import { VARIANT_LABEL, draftMail, scoreDraft, type Variant } from "../lib/coldmail";
import { formatFunding, pct, relativeDays } from "../lib/format";
import { bestContact, estimatePay } from "../lib/insights";
import { EASE, REDUCED_MOTION_QUERY, prefersReducedMotion } from "../motion/setup";
import { useStore } from "../state/store";
import "./Landing.css";

// Product-editorial landing page (after ORYZO): a full-height hero with the
// wordmark as the object, then one section per step of the workflow, each
// with a heading on the left, a working piece of the app in the centre and
// the explanation on the right.

const STEPS = [
  { id: "find", n: "01", label: "Find" },
  { id: "reach", n: "02", label: "Reach" },
  { id: "write", n: "03", label: "Write" },
  { id: "track", n: "04", label: "Track" },
];

/** Sections slide up into place; content stays readable before it moves. */
function Reveal({ children, delay = 0, className }: { children: ReactNode; delay?: number; className?: string }) {
  return (
    <motion.div
      className={className}
      initial={{ y: 36 }}
      whileInView={{ y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.9, delay, ease: EASE.cssBezier }}
    >
      {children}
    </motion.div>
  );
}

export function Landing() {
  const { profile: mine } = useStore();
  // Until a résumé is uploaded, the showcase runs on a labelled example candidate.
  const profile = mine ?? EXAMPLE_PROFILE;
  const isExample = !mine;
  const hero = useRef<HTMLElement>(null);
  const wordmark = useRef<HTMLHeadingElement>(null);

  const featured = STARTUP_BY_ID.ledgerloop;
  const contact = bestContact(featured, profile);
  const pay = estimatePay(featured, profile);

  const ledger = useMemo(
    () => [...STARTUPS].sort((a, b) => daysSince(a.announced) - daysSince(b.announced)).slice(0, 7),
    [],
  );

  const draft = useMemo(() => draftMail(contact.person, featured, profile, "referral"), [contact.person, featured, profile]);
  const draftScore = scoreDraft(draft, featured).score;

  const replyRates = (Object.keys(VARIANT_LABEL) as Variant[]).map((v) => {
    const rows = SAMPLE_HISTORY.filter((h) => h.variant === v);
    const sent = rows.reduce((n, h) => n + h.sent, 0);
    const replied = rows.reduce((n, h) => n + h.replied, 0);
    const rate = sent ? (replied / sent) * 100 : 0;
    return { key: v, label: VARIANT_LABEL[v], value: rate, display: pct(rate), detail: `${replied} replies / ${sent} sent` };
  });
  const bestRate = [...replyRates].sort((a, b) => b.value - a.value)[0].key;

  // GSAP: the hero's one orchestrated moment.
  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(`not ${REDUCED_MOTION_QUERY}`, () => {
        gsap
          .timeline({ defaults: { duration: 1, ease: "expo.out" } })
          .from(".lp-tagline", { y: 24, opacity: 0.001 }, 0.55)
          .from(".lp-hero-ctas > *", { y: 16, opacity: 0.001, stagger: 0.08 }, 0.7)
          .from(".lp-info", { y: 30, opacity: 0.001 }, 0.85)
          .from(".lp-preview", { y: 30, opacity: 0.001 }, 0.95);
      });
      return () => mm.revert();
    },
    { scope: hero },
  );

  // Anime.js: the wordmark's letters rise in, one by one.
  useEffect(() => {
    const el = wordmark.current;
    if (!el || prefersReducedMotion()) return;
    const split = splitText(el, { chars: { class: "lp-char", wrap: "clip" } });
    const anim = animate(".lp-char", { y: ["105%", "0%"], duration: 1100, delay: stagger(70), ease: "outExpo" });
    return () => {
      anim.revert();
      split.revert();
    };
  }, []);

  return (
    <div className="landing">
      <header className="lp-nav">
        <Link to="/" className="lp-logo" aria-label="Jobly home">
          Jobly
        </Link>
        <nav className="lp-links" aria-label="Sections">
          {STEPS.map((s) => (
            <a key={s.id} href={`#${s.id}`}>
              {s.label}
            </a>
          ))}
        </nav>
        <div className="lp-nav-actions">
          <button className="cmd-trigger" type="button" onClick={() => window.dispatchEvent(new Event(OPEN_PALETTE_EVENT))} aria-label="Search">
            <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true">
              <path d="M7 12A5 5 0 1 0 7 2a5 5 0 0 0 0 10zM14 14l-3.5-3.5" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
            </svg>
            <span className="cmd-trigger-keys">
              <Kbd>{MOD_KEY}</Kbd>
              <Kbd>K</Kbd>
            </span>
          </button>
          <Link to="/dashboard" className="btn btn-signup">
            Open app
          </Link>
        </div>
      </header>

      <span className="lp-serial" aria-hidden="true">
        Jobly 1-Search · Personal GTM for one job search
      </span>

      {/* ── Hero ───────────────────────────────────────────── */}
      <section className="lp-hero" ref={hero}>
        <p className="eyebrow lp-eyebrow">Personal GTM for your job search · India · USA · Europe · Remote</p>
        <h1 className="lp-wordmark" ref={wordmark}>
          Jobly
        </h1>
        <p className="lp-tagline">
          Find the startups that just raised. Find the person who will refer you. Send the email that gets answered.
        </p>
        <div className="lp-hero-ctas">
          <ResumeUpload variant="primary" listenForCommand>
            Upload résumé
          </ResumeUpload>
          <Link to="/startups" className="btn btn-nav">
            Browse funded startups →
          </Link>
        </div>

        <div className="lp-hero-foot">
          <aside className="lp-info">
            <p className="label">Built for one job search — yours</p>
            <hr className="divider" />
            <p>
              Your résumé is read in your browser. Jobly ranks every recently funded startup against it, estimates the pay,
              and finds who can refer you.
            </p>
          </aside>

          <Link to={`/startups/${featured.id}?compose=${contact.person.id}`} className="lp-preview">
            <span className="label">Found this week{isExample ? " · example" : ""}</span>
            <span className="lp-preview-name">{featured.name}</span>
            <span className="lp-preview-meta">
              <span className="t-accent">{formatFunding(featured, featured.amountUsd)}</span> {featured.round} ·{" "}
              {featured.city} · {relativeDays(daysSince(featured.announced))}
            </span>
            <hr className="divider" />
            <span className="lp-preview-row">
              <span>Pay for you</span>
              <strong>{pay.display}</strong>
            </span>
            <span className="lp-preview-row">
              <span>Warmest referral</span>
              <strong>
                {contact.person.name} · {contact.warmth.score}
              </strong>
            </span>
            <span className="lp-preview-go">Write the email →</span>
          </Link>
        </div>
      </section>

      {/* ── 01 Find ─────────────────────────────────────────── */}
      <section className="lp-section" id="find">
        <Reveal className="lp-left">
          <p className="lp-step">01 — Find</p>
          <h2 className="lp-h2">Every round, the week it is announced</h2>
        </Reveal>
        <Reveal className="lp-center" delay={0.1}>
          <ol className="lp-ledger">
            {ledger.map((s) => (
              <li key={s.id}>
                <Link to={`/startups/${s.id}`}>
                  <span className="lp-ledger-name">{s.name}</span>
                  <span className="lp-ledger-where">
                    {s.city} · {s.round}
                  </span>
                  <span className="lp-ledger-amount">{formatFunding(s, s.amountUsd)}</span>
                </Link>
              </li>
            ))}
          </ol>
        </Reveal>
        <Reveal className="lp-right" delay={0.2}>
          <p className="lp-body">
            Seed to Series B, from Hyderabad to San Francisco. Each startup shows what it raised, who invested, how it treats
            remote work, and what it would likely pay you.
          </p>
        </Reveal>
      </section>

      {/* ── 02 Reach ────────────────────────────────────────── */}
      <section className="lp-section" id="reach">
        <Reveal className="lp-left">
          <p className="lp-step">02 — Reach</p>
          <h2 className="lp-h2">The warmest way in</h2>
        </Reveal>
        <Reveal className="lp-center lp-constellation" delay={0.1}>
          <Constellation startups={STARTUPS} profile={profile} />
        </Reveal>
        <Reveal className="lp-right" delay={0.2}>
          <p className="lp-body">
            Shared school, past employer, mutual connections. Every person who could refer you, ranked — you at the centre,
            the companies on the edge.
          </p>
        </Reveal>
      </section>

      {/* ── 03 Write ────────────────────────────────────────── */}
      <section className="lp-section" id="write">
        <Reveal className="lp-left">
          <p className="lp-step">03 — Write</p>
          <h2 className="lp-h2">A cold email worth answering</h2>
        </Reveal>
        <Reveal className="lp-center" delay={0.1}>
          <article className="lp-mail">
            <header>
              <span className="label">
                To {contact.person.name}
                {isExample ? ` · from ${profile.name}'s example résumé` : ""}
              </span>
              <span className="lp-mail-score">{draftScore}/100</span>
            </header>
            <p className="lp-mail-subject">{draft.subject}</p>
            <hr className="divider" />
            <p className="lp-mail-body">{draft.body}</p>
          </article>
        </Reveal>
        <Reveal className="lp-right" delay={0.2}>
          <p className="lp-body">
            Drafted from your résumé and their funding news, checked against the outreach rules, and never sent without you.
          </p>
        </Reveal>
      </section>

      {/* ── 04 Track ────────────────────────────────────────── */}
      <section className="lp-section" id="track">
        <Reveal className="lp-left">
          <p className="lp-step">04 — Track</p>
          <h2 className="lp-h2">Every reply, every referral</h2>
        </Reveal>
        <Reveal className="lp-center" delay={0.1}>
          <div className="lp-track">
            <p className="label">Reply rate by message type</p>
            <HBarChart data={replyRates} labelWidth={110} emphasis={bestRate} />
          </div>
        </Reveal>
        <Reveal className="lp-right" delay={0.2}>
          <p className="lp-body">
            Referral asks get answered most. The pipeline follows each company from found to offer, so nothing goes quiet.
          </p>
        </Reveal>
      </section>

      {/* ── Close ───────────────────────────────────────────── */}
      <section className="lp-close">
        <h2 className="lp-close-title">Start with your résumé</h2>
        <div className="lp-hero-ctas">
          <ResumeUpload variant="primary">Upload résumé</ResumeUpload>
          <Link to="/dashboard" className="btn btn-signup">
            Open dashboard
          </Link>
        </div>
      </section>

      <footer className="lp-footer">
        <span className="lp-credit">Runs on the Reach, Inbox and Marketing agents</span>
        <span className="lp-legal">
          Sample data · Companies, people and investors shown are fictional · Pay figures are estimates, not offers
        </span>
      </footer>
    </div>
  );
}
