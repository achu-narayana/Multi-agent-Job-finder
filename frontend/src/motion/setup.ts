/**
 * Animation library roles — each library owns one kind of motion so they
 * never fight over the same element:
 *
 *   GSAP         timelines and scroll-driven reveals   (Hero, useScrollReveal)
 *   Motion       layout / presence / shared-element    (JobBoard filters + list)
 *   React Spring physics: hover tilt, counters         (JobCard, Pipeline)
 *   Anime.js     SVG line drawing, text + grid stagger (AgentFlow)
 *
 * Reduced motion is honoured globally: GSAP via gsap.matchMedia in each hook,
 * Motion via <MotionConfig reducedMotion="user">, React Spring via
 * Globals.skipAnimation, Anime.js via prefersReducedMotion() checks.
 */
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { Globals } from "@react-spring/web";

export const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

export function prefersReducedMotion(): boolean {
  return typeof window !== "undefined" && window.matchMedia(REDUCED_MOTION_QUERY).matches;
}

/** Shared easing so the four libraries feel like one system. */
export const EASE = {
  gsap: "expo.out",
  anime: "outExpo",
  cssBezier: [0.16, 1, 0.3, 1] as const,
};

let initialised = false;

export function setupMotion() {
  if (initialised) return;
  initialised = true;

  gsap.registerPlugin(ScrollTrigger, useGSAP);
  gsap.defaults({ ease: EASE.gsap, duration: 0.8 });

  const query = window.matchMedia(REDUCED_MOTION_QUERY);
  const sync = () => Globals.assign({ skipAnimation: query.matches });
  sync();
  query.addEventListener("change", sync);
}
