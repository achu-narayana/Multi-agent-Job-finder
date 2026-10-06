import { useRef, type ReactNode } from "react";
import { gsap } from "gsap";
import { useGSAP } from "@gsap/react";
import { REDUCED_MOTION_QUERY } from "../motion/setup";

interface Props {
  eyebrow?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
}

/** GSAP: every page header runs the same short intro timeline. */
export function PageHeader({ eyebrow, title, description, actions }: Props) {
  const ref = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(`not ${REDUCED_MOTION_QUERY}`, () => {
        gsap
          .timeline({ defaults: { duration: 0.7 } })
          .from(".ph-eyebrow", { y: 8, autoAlpha: 0 })
          .from(".ph-title", { y: 18, autoAlpha: 0 }, "-=0.5")
          .from(".ph-desc, .ph-actions", { y: 10, autoAlpha: 0, stagger: 0.06 }, "-=0.5");
      });
      return () => mm.revert();
    },
    { scope: ref },
  );

  return (
    <header className="page-header" ref={ref}>
      <div className="page-header-copy">
        {eyebrow && <p className="eyebrow ph-eyebrow">{eyebrow}</p>}
        <h1 className="t-heading ph-title">{title}</h1>
        {description && <p className="t-body-sm t-muted ph-desc">{description}</p>}
      </div>
      {actions && <div className="ph-actions">{actions}</div>}
    </header>
  );
}
