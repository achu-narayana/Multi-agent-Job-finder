import { useRef } from "react";
import { gsap } from "gsap";
import { useGSAP } from "@gsap/react";
import { REDUCED_MOTION_QUERY } from "./setup";

/**
 * GSAP: children marked [data-reveal] rise in with a short stagger on mount.
 * They start visible-in-flow and finish within a second, so nothing is left
 * hidden waiting for a scroll.
 */
export function useStaggerIn<T extends HTMLElement = HTMLElement>() {
  const ref = useRef<T>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(`not ${REDUCED_MOTION_QUERY}`, () => {
        gsap.from("[data-reveal]", { y: 16, opacity: 0.001, duration: 0.7, stagger: 0.06, delay: 0.15 });
      });
      return () => mm.revert();
    },
    { scope: ref },
  );

  return ref;
}
