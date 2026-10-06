import type { ReactNode } from "react";
import { NavLink, useLocation } from "react-router";
import { AnimatePresence, motion } from "motion/react";
import { EASE } from "../motion/setup";
import { useStore } from "../state/store";
import { CommandPalette, Kbd, MOD_KEY, OPEN_PALETTE_EVENT } from "./CommandPalette";
import { ResumeUpload } from "./ResumeUpload";
import "./Shell.css";

const NAV = [
  { to: "/", label: "Dashboard" },
  { to: "/startups", label: "Funded startups" },
  { to: "/referrals", label: "Referrals" },
  { to: "/outreach", label: "Outreach" },
  { to: "/pipeline", label: "Pipeline" },
  { to: "/profile", label: "Profile" },
];

export function Shell({ children }: { children: ReactNode }) {
  const location = useLocation();
  const { profile, outreach } = useStore();
  const drafts = Object.values(outreach).filter((o) => o.status === "draft").length;

  return (
    <div className="shell">
      <header className="topbar">
        <div className="topbar-inner">
          <NavLink to="/" className="logo" aria-label="Jobly home">
            Jobly<span className="logo-mark">1-Search</span>
          </NavLink>

          <nav className="top-nav" aria-label="Main">
            {NAV.map((item) => (
              <NavLink key={item.to} to={item.to} end={item.to === "/"} className="top-link">
                {({ isActive }) => (
                  <>
                    {isActive && (
                      <motion.span
                        layoutId="nav-active"
                        className="top-link-underline"
                        transition={{ type: "spring", stiffness: 500, damping: 40 }}
                      />
                    )}
                    <span className="top-link-label">{item.label}</span>
                    {item.to === "/outreach" && drafts > 0 && <span className="nav-count">{drafts}</span>}
                  </>
                )}
              </NavLink>
            ))}
          </nav>

          <div className="topbar-actions">
            <button
              type="button"
              className="cmd-trigger"
              onClick={() => window.dispatchEvent(new Event(OPEN_PALETTE_EVENT))}
              aria-label="Search (command palette)"
            >
              <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true">
                <path d="M7 12A5 5 0 1 0 7 2a5 5 0 0 0 0 10zM14 14l-3.5-3.5" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
              </svg>
              <span className="cmd-trigger-label">Search</span>
              <span className="cmd-trigger-keys">
                <Kbd>{MOD_KEY}</Kbd>
                <Kbd>K</Kbd>
              </span>
            </button>
            {profile && (
              <NavLink to="/profile" className="topbar-profile" title={profile.fileName}>
                {profile.name}
              </NavLink>
            )}
            <ResumeUpload listenForCommand />
          </div>
        </div>
      </header>

      <CommandPalette />
      <span className="serial" aria-hidden="true">
        Jobly 1-Search · Funded startups · Referral engine
      </span>

      <main className="main">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={location.pathname + location.search}
            className="page"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.28, ease: EASE.cssBezier }}
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}
