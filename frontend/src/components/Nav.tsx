import { motion, useScroll, useTransform } from "motion/react";
import "./Nav.css";

const LINKS = [
  { href: "#jobs", label: "Jobs" },
  { href: "#pipeline", label: "Pipeline" },
  { href: "#agents", label: "Agents" },
];

export function Logo() {
  return (
    <a href="#top" className="logo" aria-label="Jobly home">
      <svg viewBox="0 0 32 32" width="22" height="22" aria-hidden="true">
        <rect width="32" height="32" rx="8" fill="var(--color-carbon)" />
        <path
          d="M19 8v11a5 5 0 0 1-10 0"
          fill="none"
          stroke="var(--color-paper)"
          strokeWidth="3"
          strokeLinecap="round"
        />
      </svg>
      <span>Jobly</span>
    </a>
  );
}

export function Nav() {
  // Motion: hairline border fades in once the page scrolls.
  const { scrollY } = useScroll();
  const borderOpacity = useTransform(scrollY, [0, 80], [0, 1]);

  return (
    <header className="nav">
      <motion.div className="nav-border" style={{ opacity: borderOpacity }} />
      <div className="container nav-inner">
        <Logo />
        <nav className="nav-links" aria-label="Primary">
          {LINKS.map((link) => (
            <a key={link.href} href={link.href} className="btn btn-nav">
              {link.label}
            </a>
          ))}
          <a href="#signup" className="btn btn-signup">
            Sign up
          </a>
        </nav>
      </div>
    </header>
  );
}
