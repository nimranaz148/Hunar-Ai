"use client";

import React, { useEffect, useRef } from "react";
import { gsap } from "@/lib/gsap";

const roundFormat = (n: number) => String(Math.round(n));

export interface CountValueProps {
  value: number;
  /** Turns the running number into display text. Pass a stable (module-level) function. */
  format?: (n: number) => string;
  className?: string;
}

/**
 * Renders the final value as plain text (so SSR, tests, search engines and screen readers
 * all see the real number), then counts up from 0 once the element scrolls into view.
 * Skipped entirely for visitors who prefer reduced motion.
 */
export function CountValue({ value, format = roundFormat, className }: CountValueProps) {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let tween: gsap.core.Tween | undefined;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        io.disconnect();
        const counter = { n: 0 };
        el.textContent = format(0);
        tween = gsap.to(counter, {
          n: value,
          duration: 1.2,
          ease: "power2.out",
          onUpdate: () => {
            el.textContent = format(counter.n);
          },
          onComplete: () => {
            el.textContent = format(value);
          },
        });
      },
      { threshold: 0.4 },
    );
    io.observe(el);

    return () => {
      io.disconnect();
      tween?.kill();
      el.textContent = format(value);
    };
  }, [value, format]);

  return (
    <span ref={ref} className={className}>
      {format(value)}
    </span>
  );
}
