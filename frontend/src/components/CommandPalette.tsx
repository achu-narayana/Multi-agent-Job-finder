import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router";
import { AnimatePresence, motion } from "motion/react";
import { ALL_PEOPLE, STARTUPS, STARTUP_BY_ID } from "../data/startups";
import { formatFunding } from "../lib/format";
import { referralWarmth } from "../lib/insights";
import { useStore } from "../state/store";
import { Avatar } from "./bits";
import "./CommandPalette.css";

// Raycast-style command palette: one keyboard-first entry point to every
// startup, person, page and action. Motion handles open/close and the
// highlight that glides between results.

export const OPEN_PALETTE_EVENT = "jobly:open-palette";
export const UPLOAD_RESUME_EVENT = "jobly:upload-resume";

interface Item {
  id: string;
  group: "Actions" | "Pages" | "Startups" | "People";
  title: string;
  subtitle?: string;
  keywords: string;
  icon: ReactNode;
  run: () => void;
}

const isMac = typeof navigator !== "undefined" && /mac|iphone|ipad/i.test(navigator.platform || navigator.userAgent);
export const MOD_KEY = isMac ? "⌘" : "Ctrl";

export function Kbd({ children }: { children: ReactNode }) {
  return <kbd className="kbd">{children}</kbd>;
}

function Glyph({ d }: { d: string }) {
  return (
    <span className="cmd-glyph" aria-hidden="true">
      <svg viewBox="0 0 16 16" width="14" height="14">
        <path d={d} fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </span>
  );
}

const PAGES = [
  { to: "/", title: "Dashboard", d: "M3 3h4v4H3zM9 3h4v4H9zM3 9h4v4H3zM9 9h4v4H9z" },
  { to: "/startups", title: "Funded startups", d: "M2 13h12M4 13V7m4 6V4m4 9V9" },
  { to: "/referrals", title: "Referrals", d: "M6 7a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5zm-4 7a4 4 0 0 1 8 0" },
  { to: "/outreach", title: "Outreach", d: "M2 4l6 4.5L14 4M2.5 3.5h11v9h-11z" },
  { to: "/pipeline", title: "Pipeline", d: "M2.5 3h3v10h-3zM6.5 3h3v7h-3zM10.5 3h3v4h-3z" },
  { to: "/profile", title: "Profile", d: "M8 7.5a2.75 2.75 0 1 0 0-5.5 2.75 2.75 0 0 0 0 5.5zM3 14a5 5 0 0 1 10 0" },
];

const GROUP_ORDER: Item["group"][] = ["Actions", "Startups", "People", "Pages"];

function score(item: Item, query: string): number {
  if (!query) return 1;
  const title = item.title.toLowerCase();
  const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
  let total = 0;
  for (const term of terms) {
    if (title.startsWith(term)) total += 3;
    else if (title.split(/\s+/).some((w) => w.startsWith(term))) total += 2;
    else if (item.keywords.includes(term)) total += 1;
    else return 0;
  }
  return total;
}

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  // A fresh key per opening, so reopening during the exit animation starts clean.
  const [session, setSession] = useState(0);
  const show = () => {
    setSession((n) => n + 1);
    setOpen(true);
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const typing = target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.tagName === "SELECT" || target.isContentEditable);
      if ((e.key === "k" || e.key === "K") && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((v) => {
          if (!v) setSession((n) => n + 1);
          return !v;
        });
      } else if (e.key === "/" && !typing) {
        e.preventDefault();
        show();
      }
    };
    const onOpen = () => show();
    window.addEventListener("keydown", onKey);
    window.addEventListener(OPEN_PALETTE_EVENT, onOpen);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener(OPEN_PALETTE_EVENT, onOpen);
    };
  }, []);

  return createPortal(<AnimatePresence>{open && <Palette key={session} onClose={() => setOpen(false)} />}</AnimatePresence>, document.body);
}

function Palette({ onClose }: { onClose: () => void }) {
  const navigate = useNavigate();
  const { profile } = useStore();
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const listRef = useRef<HTMLDivElement>(null);
  const restoreFocus = useRef<HTMLElement | null>(document.activeElement as HTMLElement | null);

  useEffect(() => () => restoreFocus.current?.focus?.(), []);

  const items = useMemo<Item[]>(() => {
    const go = (to: string) => () => navigate(to);
    const actions: Item[] = [
      {
        id: "upload",
        group: "Actions",
        title: profile ? "Replace résumé" : "Upload résumé",
        subtitle: "PDF, DOCX or TXT",
        keywords: "upload resume cv file replace",
        icon: <Glyph d="M8 11V2.5M4.5 6 8 2.5 11.5 6M2.5 10.5v2a1 1 0 0 0 1 1h9a1 1 0 0 0 1-1v-2" />,
        run: () => window.dispatchEvent(new Event(UPLOAD_RESUME_EVENT)),
      },
      {
        id: "remote",
        group: "Actions",
        title: "Show remote startups",
        keywords: "remote filter wfh",
        icon: <Glyph d="M8 14A6 6 0 1 0 8 2a6 6 0 0 0 0 12zM2 8h12M8 2c1.8 1.7 2.7 3.7 2.7 6S9.8 12.3 8 14C6.2 12.3 5.3 10.3 5.3 8S6.2 3.7 8 2z" />,
        run: go("/startups?remote=1"),
      },
      {
        id: "hyderabad",
        group: "Actions",
        title: "Startups in Hyderabad",
        keywords: "hyderabad india city",
        icon: <Glyph d="M8 14s4.5-4.2 4.5-7.5a4.5 4.5 0 0 0-9 0C3.5 9.8 8 14 8 14zM8 8a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3z" />,
        run: go("/startups?city=Hyderabad"),
      },
    ];
    const pages: Item[] = PAGES.map((p) => ({
      id: `page-${p.to}`,
      group: "Pages",
      title: p.title,
      keywords: p.title.toLowerCase(),
      icon: <Glyph d={p.d} />,
      run: go(p.to),
    }));
    const startups: Item[] = STARTUPS.map((s) => ({
      id: `s-${s.id}`,
      group: "Startups",
      title: s.name,
      subtitle: `${formatFunding(s, s.amountUsd)} ${s.round} · ${s.city}`,
      keywords: [s.name, s.city, s.country, s.region, s.sector, s.round, s.tagline, ...s.roles.flatMap((r) => [r.title, ...r.skills])].join(" ").toLowerCase(),
      icon: <span className="cmd-mark">{s.name[0]}</span>,
      run: go(`/startups/${s.id}`),
    }));
    const people: Item[] = ALL_PEOPLE.map((p) => {
      const s = STARTUP_BY_ID[p.companyId];
      return {
        id: `p-${p.id}`,
        group: "People",
        title: p.name,
        subtitle: `${p.title} · ${s.name} · warmth ${referralWarmth(p, profile).score}`,
        keywords: [p.name, p.title, p.kind, p.school, ...p.pastEmployers, s.name, s.city].join(" ").toLowerCase(),
        icon: <Avatar name={p.name} size={22} />,
        run: go(`/startups/${s.id}?compose=${p.id}`),
      };
    });
    return [...actions, ...startups, ...people, ...pages];
  }, [navigate, profile]);

  const results = useMemo(() => {
    const q = query.trim();
    const scored = items
      .map((item) => ({ item, s: score(item, q) }))
      .filter((r) => r.s > 0)
      .sort((a, b) => GROUP_ORDER.indexOf(a.item.group) - GROUP_ORDER.indexOf(b.item.group) || b.s - a.s);
    // Without a query, keep the list short: actions, top startups, pages.
    const capped = q
      ? scored.slice(0, 40)
      : scored.filter((r) => r.item.group !== "People").filter((r, i, all) => r.item.group !== "Startups" || all.slice(0, i).filter((x) => x.item.group === "Startups").length < 5);
    return capped.map((r) => r.item);
  }, [items, query]);

  useEffect(() => setActive(0), [query]);

  useEffect(() => {
    listRef.current?.querySelector<HTMLElement>(`[data-index="${active}"]`)?.scrollIntoView({ block: "nearest" });
  }, [active]);

  function run(item: Item | undefined) {
    if (!item) return;
    onClose();
    // Run after the palette starts closing so focus and navigation don't race.
    requestAnimationFrame(item.run);
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((i) => Math.min(results.length - 1, i + 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => Math.max(0, i - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      run(results[active]);
    } else if (e.key === "Escape") {
      e.preventDefault();
      onClose();
    }
  }

  let lastGroup: string | null = null;

  return (
    <motion.div className="cmd-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }} onClick={onClose}>
      <motion.div
        className="cmd"
        role="dialog"
        aria-modal="true"
        aria-label="Command palette"
        initial={{ opacity: 0, scale: 0.97, y: -8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.98, y: -4 }}
        transition={{ type: "spring", stiffness: 520, damping: 38 }}
        onClick={(e) => e.stopPropagation()}
        onKeyDown={onKeyDown}
      >
        <div className="cmd-search">
          <svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true">
            <path d="M7 12A5 5 0 1 0 7 2a5 5 0 0 0 0 10zM14 14l-3.5-3.5" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
          </svg>
          <input
            id="command-palette-input"
            autoFocus
            className="cmd-input"
            placeholder="Search startups, people, cities, skills…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            role="combobox"
            aria-expanded="true"
            aria-controls="cmd-results"
            aria-activedescendant={results[active] ? `cmd-${results[active].id}` : undefined}
          />
          <Kbd>Esc</Kbd>
        </div>

        <div className="cmd-list" id="cmd-results" role="listbox" ref={listRef}>
          {results.length === 0 && <p className="cmd-empty">No matches for “{query}”.</p>}
          {results.map((item, i) => {
            const header = item.group !== lastGroup ? item.group : null;
            lastGroup = item.group;
            return (
              <div key={item.id}>
                {header && <div className="cmd-group">{header}</div>}
                <div
                  id={`cmd-${item.id}`}
                  role="option"
                  aria-selected={i === active}
                  data-index={i}
                  className="cmd-item"
                  onPointerMove={() => i !== active && setActive(i)}
                  onClick={() => run(item)}
                >
                  {i === active && <motion.span layoutId="cmd-active" className="cmd-item-bg" transition={{ type: "spring", stiffness: 700, damping: 45 }} />}
                  {item.icon}
                  <span className="cmd-item-text">
                    <span className="cmd-item-title">{item.title}</span>
                    {item.subtitle && <span className="cmd-item-sub">{item.subtitle}</span>}
                  </span>
                  <span className="cmd-item-kind">{item.group === "People" ? "Write email" : item.group === "Startups" ? "Open" : item.group === "Pages" ? "Go to" : "Run"}</span>
                </div>
              </div>
            );
          })}
        </div>

        <div className="cmd-foot">
          <span className="cmd-brand">
            <svg viewBox="0 0 32 32" width="14" height="14" aria-hidden="true">
              <path d="M19 8v11a5 5 0 0 1-10 0" fill="none" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" />
            </svg>
            Jobly
          </span>
          <span className="cmd-hints">
            <span>
              <Kbd>↑</Kbd>
              <Kbd>↓</Kbd> Move
            </span>
            <span>
              <Kbd>↵</Kbd> Open
            </span>
            <span>
              <Kbd>{MOD_KEY}</Kbd>
              <Kbd>K</Kbd> Toggle
            </span>
          </span>
        </div>
      </motion.div>
    </motion.div>
  );
}
