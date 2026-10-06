import { Logo } from "../components/Nav";
import { useScrollReveal } from "../motion/useScrollReveal";
import "./Footer.css";

export function Footer() {
  const revealRef = useScrollReveal<HTMLElement>();

  return (
    <footer className="footer section" id="signup" ref={revealRef}>
      <div className="container">
        <div className="footer-cta card" data-reveal>
          <div className="footer-cta-copy">
            <h2 className="t-heading-sm">Let the agents do the searching.</h2>
            <p className="t-body-sm t-muted">
              Get a daily shortlist and drafted recruiter replies in your inbox.
            </p>
          </div>
          <form className="footer-form" onSubmit={(e) => e.preventDefault()}>
            <input className="input" type="email" placeholder="you@example.com" aria-label="Email" />
            <button type="submit" className="btn btn-signup">
              Join the waitlist
            </button>
          </form>
        </div>

        <hr className="divider footer-divider" />

        <div className="footer-bottom">
          <Logo />
          <span className="t-caption t-faint">© {new Date().getFullYear()} Jobly</span>
        </div>
      </div>
    </footer>
  );
}
