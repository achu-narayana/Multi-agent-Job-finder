import { animated, useInView, useTrail } from "@react-spring/web";
import { useScrollReveal } from "../motion/useScrollReveal";
import "./Pipeline.css";

const STAGES = [
  { label: "Scanned", value: 1284, hint: "postings read this week", tone: "var(--color-ash)" },
  { label: "Matched", value: 96, hint: "above your match threshold", tone: "var(--color-signal-teal)" },
  { label: "Applied", value: 31, hint: "applications sent", tone: "var(--color-iris-violet)" },
  { label: "Interviews", value: 7, hint: "scheduled via inbox", tone: "var(--color-lavender)" },
  { label: "Offers", value: 2, hint: "awaiting your decision", tone: "var(--color-pulse-green)" },
];

const MAX = STAGES[0].value;
const format = new Intl.NumberFormat("en-US");

/** React Spring: physics counters + funnel bars, triggered once in view. */
export function Pipeline() {
  const revealRef = useScrollReveal<HTMLElement>();
  const [inViewRef, inView] = useInView({ once: true, amount: 0.3 });

  const trail = useTrail(STAGES.length, {
    from: { n: 0, w: 0 },
    to: { n: inView ? 1 : 0, w: inView ? 1 : 0 },
    config: { mass: 1, tension: 120, friction: 26 },
  });

  return (
    <section className="section" id="pipeline" ref={revealRef}>
      <div className="container">
        <div className="section-head">
          <p className="eyebrow" data-reveal>
            02 — Pipeline
          </p>
          <h2 className="t-heading" data-reveal>
            From thousands of postings to the two that matter.
          </h2>
        </div>

        <div className="pipeline card" ref={inViewRef}>
          {trail.map((style, i) => {
            const stage = STAGES[i];
            // Log scale keeps small stages visible next to "Scanned".
            const share = Math.log10(stage.value + 1) / Math.log10(MAX + 1);
            return (
              <div className="pipeline-row" key={stage.label}>
                <div className="pipeline-meta">
                  <span className="t-caption t-muted">{stage.label}</span>
                  <animated.span className="pipeline-value">
                    {style.n.to((n) => format.format(Math.round(n * stage.value)))}
                  </animated.span>
                  <span className="t-caption t-faint">{stage.hint}</span>
                </div>
                <div className="pipeline-track">
                  <animated.div
                    className="pipeline-bar"
                    style={{
                      background: stage.tone,
                      transform: style.w.to((w) => `scaleX(${w * share})`),
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
