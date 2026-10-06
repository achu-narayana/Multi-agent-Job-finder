import { useMemo, useState } from "react";
import { AnimatePresence, LayoutGroup, motion } from "motion/react";
import { JobCard } from "../components/JobCard";
import { JOBS, type Job, type JobStage } from "../data/jobs";
import { EASE } from "../motion/setup";
import { useScrollReveal } from "../motion/useScrollReveal";
import "./JobBoard.css";

type Filter = "all" | JobStage;
type Sort = "match" | "recent";

const FILTERS: { id: Filter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "new", label: "New" },
  { id: "applied", label: "Applied" },
  { id: "interview", label: "Interview" },
  { id: "offer", label: "Offer" },
];

const POSTED_HOURS = (posted: string) =>
  parseInt(posted, 10) * (posted.endsWith("d") ? 24 : 1);

function matches(job: Job, query: string) {
  if (!query.trim()) return true;
  const haystack = [job.title, job.company, job.location, ...job.tags]
    .join(" ")
    .toLowerCase();
  return query
    .toLowerCase()
    .split(/[\s,]+/)
    .filter(Boolean)
    .every((term) => haystack.includes(term) || (term === "remote" && job.remote));
}

/** Motion: shared-layout filter pill + animated list reflow on filter/sort. */
export function JobBoard({ query }: { query: string }) {
  const [filter, setFilter] = useState<Filter>("all");
  const [sort, setSort] = useState<Sort>("match");
  const revealRef = useScrollReveal<HTMLElement>();

  const jobs = useMemo(() => {
    const list = JOBS.filter(
      (job) => (filter === "all" || job.stage === filter) && matches(job, query),
    );
    return list.sort((a, b) =>
      sort === "match" ? b.match - a.match : POSTED_HOURS(a.posted) - POSTED_HOURS(b.posted),
    );
  }, [filter, sort, query]);

  return (
    <section className="section" id="jobs" ref={revealRef}>
      <div className="container">
        <div className="section-head">
          <p className="eyebrow" data-reveal>
            01 — Job board
          </p>
          <h2 className="t-heading" data-reveal>
            Every opening, one list.
          </h2>
          <p className="t-body-sm t-muted" data-reveal>
            Ranked by how well each role matches your profile.
            {query && (
              <>
                {" "}
                Showing results for <span className="mono">“{query}”</span>.
              </>
            )}
          </p>
        </div>

        <div className="board-toolbar" data-reveal>
          <LayoutGroup id="filters">
            <div className="board-filters" role="tablist" aria-label="Filter by stage">
              {FILTERS.map((f) => (
                <button
                  key={f.id}
                  role="tab"
                  aria-selected={filter === f.id}
                  className="btn btn-pill board-filter"
                  onClick={() => setFilter(f.id)}
                >
                  {filter === f.id && (
                    <motion.span
                      layoutId="filter-highlight"
                      className="board-filter-highlight"
                      transition={{ type: "spring", stiffness: 500, damping: 38 }}
                    />
                  )}
                  <span className="board-filter-label">{f.label}</span>
                </button>
              ))}
            </div>
          </LayoutGroup>

          <button
            className="btn btn-ghost"
            onClick={() => setSort((s) => (s === "match" ? "recent" : "match"))}
          >
            Sort: {sort === "match" ? "Best match" : "Most recent"}
          </button>
        </div>

        <motion.ul className="board-grid" layout>
          <AnimatePresence mode="popLayout" initial={false}>
            {jobs.map((job) => (
              <motion.li
                key={job.id}
                layout
                initial={{ opacity: 0, scale: 0.96, y: 12 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96 }}
                transition={{ duration: 0.45, ease: EASE.cssBezier }}
              >
                <JobCard job={job} />
              </motion.li>
            ))}
          </AnimatePresence>
        </motion.ul>

        <AnimatePresence>
          {jobs.length === 0 && (
            <motion.p
              className="board-empty t-muted"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              No roles match yet — the Reach agent will keep looking.
            </motion.p>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}
