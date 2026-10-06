import { useEffect, useRef, useState } from "react";
import {
  animate,
  createDrawable,
  createMotionPath,
  createScope,
  splitText,
  stagger,
  type Scope,
} from "animejs";
import { EASE, prefersReducedMotion } from "../motion/setup";
import "./AgentFlow.css";

const SOURCES = [
  { label: "LinkedIn", y: 60 },
  { label: "Boss直聘", y: 140 },
  { label: "Careers pages", y: 220 },
  { label: "RSS feeds", y: 300 },
];

const OUTPUTS = [
  { label: "Company research", y: 90 },
  { label: "Inbox drafts", y: 180 },
  { label: "Outreach", y: 270 },
];

const HUB = { x: 480, y: 180 };

const AGENTS = [
  {
    name: "Reach",
    path: "backend/packages/reach",
    badge: "badge-teal",
    body: "Searches and reads job boards, LinkedIn, careers pages and RSS so nothing gets missed.",
  },
  {
    name: "Inbox",
    path: "backend/packages/inbox",
    badge: "badge-iris",
    body: "Reads recruiter mail, drafts replies for your approval, and skips the automated noise.",
  },
  {
    name: "Marketing",
    path: "backend/packages/marketing",
    badge: "badge-lavender",
    body: "Researches companies, scores your cover letters with an expert panel, and runs outreach.",
  },
];

const curve = (x1: number, y1: number, x2: number, y2: number) => {
  const mid = (x1 + x2) / 2;
  return `M${x1} ${y1} C${mid} ${y1}, ${mid} ${y2}, ${x2} ${y2}`;
};

/** Anime.js: split-text headline, SVG line drawing, node stagger, path-following pulses. */
export function AgentFlow() {
  const root = useRef<HTMLElement>(null);
  const [armed, setArmed] = useState(false);

  useEffect(() => {
    const el = root.current;
    if (!el || prefersReducedMotion()) return;

    // Hide everything up front so nothing flashes before the reveal.
    const title = splitText(el.querySelector(".flow-title")!, {
      words: { class: "flow-word", wrap: "clip" },
    });
    setArmed(true);

    let scope: Scope | undefined;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        observer.disconnect();

        scope = createScope({ root: el }).add(() => {
          animate(".flow-word", {
            y: ["100%", "0%"],
            opacity: [0, 1],
            duration: 900,
            delay: stagger(40),
            ease: EASE.anime,
          });

          // Paths start fully undrawn, so they can be un-hidden immediately;
          // every other element is revealed by an inline opacity animation.
          const drawables = createDrawable(".flow-path", 0, 0);
          animate(".flow-path", { opacity: 1, duration: 0 });
          animate(drawables, {
            draw: ["0 0", "0 1"],
            duration: 1100,
            delay: stagger(90, { start: 250 }),
            ease: "inOutQuad",
          });

          animate(".flow-node", {
            opacity: [0, 1],
            scale: [0.85, 1],
            duration: 700,
            delay: stagger(70, { from: "center", start: 150 }),
            ease: EASE.anime,
          });

          el.querySelectorAll<SVGPathElement>(".flow-path").forEach((path, i) => {
            const pulse = el.querySelector<SVGCircleElement>(`.flow-pulse[data-index="${i}"]`);
            if (!pulse) return;
            animate(pulse, {
              ...createMotionPath(path),
              opacity: [0, 1],
              duration: 2400,
              delay: 1400 + i * 260,
              loop: true,
              ease: "inOutSine",
            });
          });

          animate(".agent-card", {
            y: [16, 0],
            opacity: [0, 1],
            duration: 800,
            delay: stagger(90, { start: 900 }),
            ease: EASE.anime,
          });
        });
      },
      { threshold: 0.25 },
    );
    observer.observe(el);

    return () => {
      observer.disconnect();
      scope?.revert();
      title.revert();
    };
  }, []);

  const paths = [
    ...SOURCES.map((s) => curve(170, s.y, HUB.x - 64, HUB.y)),
    ...OUTPUTS.map((o) => curve(HUB.x + 64, HUB.y, 790, o.y)),
  ];

  return (
    <section className={`section${armed ? " flow-armed" : ""}`} id="agents" ref={root}>
      <div className="container">
        <div className="section-head">
          <p className="eyebrow">03 — Agents</p>
          <h2 className="t-heading flow-title">Three agents. One job search.</h2>
        </div>

        <div className="flow card" aria-hidden="true">
          <svg viewBox="0 0 960 360" className="flow-svg">
            {paths.map((d, i) => (
              <path key={i} d={d} className="flow-path" />
            ))}
            {paths.map((_, i) => (
              <circle key={i} r="3" className="flow-pulse" data-index={i} />
            ))}

            {SOURCES.map((s) => (
              <g key={s.label} className="flow-node">
                <rect x="20" y={s.y - 16} width="150" height="32" rx="6" />
                <text x="95" y={s.y + 4} textAnchor="middle">
                  {s.label}
                </text>
              </g>
            ))}

            <g className="flow-node flow-hub">
              <rect x={HUB.x - 64} y={HUB.y - 28} width="128" height="56" rx="12" />
              <text x={HUB.x} y={HUB.y + 5} textAnchor="middle">
                Jobly
              </text>
            </g>

            {OUTPUTS.map((o) => (
              <g key={o.label} className="flow-node">
                <rect x="790" y={o.y - 16} width="150" height="32" rx="6" />
                <text x="865" y={o.y + 4} textAnchor="middle">
                  {o.label}
                </text>
              </g>
            ))}
          </svg>
        </div>

        <div className="agent-grid">
          {AGENTS.map((agent) => (
            <article className="card agent-card" key={agent.name}>
              <span className={`badge ${agent.badge}`}>
                <span className="badge-dot" />
                {agent.name}
              </span>
              <p className="t-body-sm">{agent.body}</p>
              <code className="t-faint">{agent.path}</code>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
