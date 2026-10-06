import { useRef, useState, type FormEvent } from "react";
import { gsap } from "gsap";
import { useGSAP } from "@gsap/react";
import { REDUCED_MOTION_QUERY } from "../motion/setup";
import { JOBS, STAGE_BADGE, STAGE_LABEL } from "../data/jobs";
import "./Hero.css";

interface HeroProps {
  onSearch: (query: string) => void;
}

export function Hero({ onSearch }: HeroProps) {
  const root = useRef<HTMLElement>(null);
  const [query, setQuery] = useState("");

  // GSAP: one orchestrated intro timeline for the whole hero.
  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(`not ${REDUCED_MOTION_QUERY}`, () => {
        gsap
          .timeline({ defaults: { duration: 1 } })
          .from(".hero-eyebrow", { y: 12, autoAlpha: 0, duration: 0.6 })
          .from(".hero-line", { yPercent: 110, stagger: 0.09 }, "-=0.35")
          .from(".hero-sub", { y: 16, autoAlpha: 0 }, "-=0.7")
          .from(".hero-search", { y: 16, autoAlpha: 0 }, "-=0.8")
          .from(
            ".hero-preview",
            { y: 64, autoAlpha: 0, rotateX: 18, transformPerspective: 1200, duration: 1.4 },
            "-=0.8",
          )
          .from(".preview-row", { x: -12, autoAlpha: 0, stagger: 0.06, duration: 0.6 }, "-=0.9");
      });
      return () => mm.revert();
    },
    { scope: root },
  );

  function submit(event: FormEvent) {
    event.preventDefault();
    onSearch(query);
    document.getElementById("jobs")?.scrollIntoView({ behavior: "smooth" });
  }

  return (
    <section className="hero" id="top" ref={root}>
      <div className="container">
        <p className="eyebrow hero-eyebrow">
          <span className="badge badge-green">
            <span className="badge-dot" />
            Agents online
          </span>
          Search, research, and reply — on autopilot
        </p>

        <h1 className="t-display hero-title">
          <span className="hero-mask">
            <span className="hero-line">Find the job.</span>
          </span>
          <span className="hero-mask">
            <span className="hero-line t-muted-heading">Skip the job board.</span>
          </span>
        </h1>

        <p className="t-subheading t-muted hero-sub">
          Jobly's agents scan LinkedIn, Boss直聘 and careers pages, research every company, and
          draft your recruiter replies.
        </p>

        <form className="hero-search" onSubmit={submit} role="search">
          <input
            className="input"
            type="search"
            placeholder="Role, skill or company — e.g. “frontend, remote”"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Search jobs"
          />
          <button type="submit" className="btn btn-primary">
            Start searching
          </button>
        </form>

        <div className="hero-preview card" aria-hidden="true">
          <div className="preview-head">
            <span className="mono t-faint">jobly / pipeline</span>
            <span className="badge">{JOBS.length} tracked</span>
          </div>
          <hr className="divider" />
          {JOBS.slice(0, 4).map((job) => (
            <div className="preview-row" key={job.id}>
              <span className="mono t-faint">{job.id.toUpperCase()}</span>
              <span className="preview-title">{job.title}</span>
              <span className="t-muted preview-company">{job.company}</span>
              <span className={`badge ${STAGE_BADGE[job.stage]}`}>
                <span className="badge-dot" />
                {STAGE_LABEL[job.stage]}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
