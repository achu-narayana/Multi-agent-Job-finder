import type { ReactNode } from "react";
import { NavLink, useLocation } from "react-router";
import { AnimatePresence, motion } from "motion/react";
import { EASE } from "../motion/setup";
import { useStore } from "../state/store";
import { ResumeUpload } from "./ResumeUpload";
import "./Shell.css";

const NAV = [
  { to: "/", label: "Dashboard", icon: "M3 3h4v4H3zM9 3h4v4H9zM3 9h4v4H3zM9 9h4v4H9z" },
  { to: "/startups", label: "Funded startups", icon: "M2 13h12M4 13V7m4 6V4m4 9V9" },
  { to: "/referrals", label: "Referrals", icon: "M6 7a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5zm-4 7a4 4 0 0 1 8 0m1.5-7a2 2 0 1 0 0-4m1.5 11a3.5 3.5 0 0 0-2-3.2" },
  { to: "/outreach", label: "Outreach", icon: "M2 4l6 4.5L14 4M2.5 3.5h11v9h-11z" },
  { to: "/pipeline", label: "Pipeline", icon: "M2.5 3h3v10h-3zM6.5 3h3v7h-3zM10.5 3h3v4h-3z" },
  { to: "/profile", label: "Profile", icon: "M8 7.5a2.75 2.75 0 1 0 0-5.5 2.75 2.75 0 0 0 0 5.5zM3 14a5 5 0 0 1 10 0" },
];

export function Shell({ children }: { children: ReactNode }) {
  const location = useLocation();
  const { profile, outreach } = useStore();
  const drafts = Object.values(outreach).filter((o) => o.status === "draft").length;

  return (
    <div className="shell">
      <aside className="sidebar">
        <NavLink to="/" className="logo" aria-label="Jobly home">
          <svg viewBox="0 0 32 32" width="22" height="22" aria-hidden="true">
            <rect width="32" height="32" rx="8" fill="var(--color-obsidian)" />
            <path d="M19 8v11a5 5 0 0 1-10 0" fill="none" stroke="var(--color-paper)" strokeWidth="3" strokeLinecap="round" />
          </svg>
          <span>Jobly</span>
        </NavLink>

        <nav className="side-nav" aria-label="Main">
          {NAV.map((item) => (
            <NavLink key={item.to} to={item.to} end={item.to === "/"} className="side-link">
              {({ isActive }) => (
                <>
                  {isActive && (
                    <motion.span
                      layoutId="nav-active"
                      className="side-link-bg"
                      transition={{ type: "spring", stiffness: 500, damping: 40 }}
                    />
                  )}
                  <svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true">
                    <path d={item.icon} fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <span className="side-link-label">{item.label}</span>
                  {item.to === "/outreach" && drafts > 0 && <span className="side-count">{drafts}</span>}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="side-foot">
          {profile ? (
            <div className="side-profile">
              <span className="t-caption">{profile.name}</span>
              <span className="t-caption t-faint">{profile.fileName}</span>
            </div>
          ) : (
            <p className="t-caption t-faint">Upload your résumé to personalise matches, pay estimates and emails.</p>
          )}
          <ResumeUpload />
        </div>
      </aside>

      <main className="main">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={location.pathname}
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
