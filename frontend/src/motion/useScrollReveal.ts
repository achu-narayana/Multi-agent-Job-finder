import { useRef } from "react";
import { gsap } from "gsap";
import { useGSAP } from "@gsap/react";
import { REDUCED_MOTION_QUERY } from "./setup";

/**
 * GSAP ScrollTrigger reveal: children marked [data-reveal] fade and rise in,
 * staggered, the first time the container scrolls into view.
 */
export function useScrollReveal<T extends HTMLElement = HTMLElement>() {
  const ref = useRef<T>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(`not ${REDUCED_MOTION_QUERY}`, () => {
        gsap.from("[data-reveal]", {
          y: 24,
          autoAlpha: 0,
          duration: 0.9,
          stagger: 0.08,
          scrollTrigger: { trigger: ref.current, start: "top 80%", once: true },
        });
      });
      return () => mm.revert();
    },
    { scope: ref },
  );

  return ref;
}
