"use client";

import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(ScrollTrigger, SplitText, useGSAP);

/** Motion tokens. Mirrors docs/design/design-system.md. */
export const motion = {
  ease: {
    /** Signature personality: soft overshoot, used for entrances and hover. */
    pop: "back.out(1.4)",
    popInOut: "back.inOut(1.4)",
    /** Calm settle for large objects and layout. */
    settle: "power3.out",
    linear: "none",
  },
  duration: { fast: 0.2, base: 0.45, slow: 0.9 },
  stagger: { letters: 0.025, lines: 0.09, items: 0.08 },
  /** ScrollTrigger scrub smoothing (seconds of lag), same as the reference. */
  scrub: 1.4,
} as const;

/** matchMedia conditions. Scrubbed, pinned storytelling only runs when both hold. */
export const mq = {
  full: "(min-width: 768px) and (prefers-reduced-motion: no-preference)",
  reduced: "(prefers-reduced-motion: reduce)",
  small: "(max-width: 767px) and (prefers-reduced-motion: no-preference)",
} as const;

export { gsap, ScrollTrigger, SplitText, useGSAP };
