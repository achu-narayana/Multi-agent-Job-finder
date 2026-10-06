import type { PointerEvent } from "react";
import { animated, to, useSpring } from "@react-spring/web";
import { STAGE_BADGE, STAGE_LABEL, type Job } from "../data/jobs";
import "./JobCard.css";

const MAX_TILT = 6;

/** React Spring: physics-based tilt + lift that follows the pointer. */
export function JobCard({ job }: { job: Job }) {
  const [spring, api] = useSpring(() => ({
    rotateX: 0,
    rotateY: 0,
    y: 0,
    glow: 0,
    config: { mass: 1, tension: 320, friction: 26 },
  }));

  function onPointerMove(event: PointerEvent<HTMLElement>) {
    if (event.pointerType !== "mouse") return;
    const rect = event.currentTarget.getBoundingClientRect();
    const px = (event.clientX - rect.left) / rect.width - 0.5;
    const py = (event.clientY - rect.top) / rect.height - 0.5;
    api.start({ rotateX: -py * MAX_TILT, rotateY: px * MAX_TILT, y: -4, glow: 1 });
  }

  function onPointerLeave() {
    api.start({ rotateX: 0, rotateY: 0, y: 0, glow: 0 });
  }

  return (
    <animated.article
      className="job-card card"
      onPointerMove={onPointerMove}
      onPointerLeave={onPointerLeave}
      style={{
        transform: to(
          [spring.y, spring.rotateX, spring.rotateY],
          (y, rx, ry) =>
            `perspective(900px) translateY(${y}px) rotateX(${rx}deg) rotateY(${ry}deg)`,
        ),
        boxShadow: spring.glow.to(
          (g) => `inset 0 0 0 1px rgba(${35 + g * 21}, ${37 + g * 22}, ${42 + g * 21}, 1)`,
        ),
      }}
    >
      <header className="job-card-head">
        <span className={`badge ${STAGE_BADGE[job.stage]}`}>
          <span className="badge-dot" />
          {STAGE_LABEL[job.stage]}
        </span>
        <span className="mono t-faint">{job.posted} ago</span>
      </header>

      <h3 className="job-title">{job.title}</h3>
      <p className="t-body-sm t-muted">
        {job.company} · {job.location}
        {job.remote ? " · Remote" : ""}
      </p>

      <div className="job-tags">
        {job.tags.map((tag) => (
          <span className="badge" key={tag}>
            {tag}
          </span>
        ))}
      </div>

      <hr className="divider" />

      <footer className="job-card-foot">
        <span className="t-caption t-muted">{job.salary}</span>
        <span className="t-caption">
          <span className="t-faint">via </span>
          {job.source}
        </span>
        <span className="job-match mono" title="Profile match">
          {job.match}%
        </span>
      </footer>
    </animated.article>
  );
}
