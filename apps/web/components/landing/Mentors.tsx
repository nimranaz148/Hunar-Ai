"use client";

import { useRef } from "react";
import Link from "next/link";
import { gsap, SplitText, useGSAP, motion } from "@/lib/gsap";

/** Mirrors PRD workflow W-005 (Mentor Booking). Payments are simulated in v2, so copy only
 *  claims what the workflow does: payment held, then released after the session. */
const rows = [
  { n: "01", t: "Browse", d: "See each mentor's services, price in PKR and open slots." },
  { n: "02", t: "Request", d: "Pick a slot. Your payment is held, not spent." },
  { n: "03", t: "Meet", d: "The mentor accepts and you get a prepared brief, so the hour is used well." },
  { n: "04", t: "Review", d: "Payment is released after the session and you leave a review." },
];

export function Mentors() {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        const split = SplitText.create(".mnt-title", { type: "lines", mask: "lines" });
        gsap.from(split.lines, {
          yPercent: 105,
          stagger: motion.stagger.lines,
          duration: 0.9,
          ease: "power4.out",
          scrollTrigger: { trigger: root.current, start: "top 65%", toggleActions: "play none none reverse" },
        });
        gsap.from(".mnt-row", {
          y: 40,
          autoAlpha: 0,
          stagger: motion.stagger.items * 1.5,
          duration: 0.7,
          ease: motion.ease.settle,
          scrollTrigger: { trigger: ".mnt-rows", start: "top 75%", toggleActions: "play none none reverse" },
        });
        return () => split.revert();
      });
    },
    { scope: root },
  );

  return (
    <section
      ref={root}
      id="mentors"
      aria-labelledby="mentors-title"
      className="bg-blush px-5 py-24 text-ink md:px-10 md:py-36"
    >
      <div className="mx-auto grid max-w-[96rem] gap-14 lg:grid-cols-[1.1fr_1fr] lg:gap-24">
        <div>
          <p className="font-label text-sm tracking-[0.12em]">MENTORS</p>
          <h2
            id="mentors-title"
            className="mnt-title font-display mt-3 text-[clamp(3.4rem,9.5vw,9.5rem)] leading-[0.88]"
          >
            When you need a human
          </h2>
          <p className="mt-6 max-w-lg text-lg leading-relaxed md:text-xl">
            The agents do the heavy lifting. For the judgement calls, book a vetted mentor who
            has already read your plan.
          </p>
          <span className="sticker mt-6">Vetted before they can sell</span>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/signup" className="btn btn-ink btn-lg">
              Find a mentor
            </Link>
            <Link href="/mentor-apply" className="btn btn-ghost btn-lg">
              Apply as a mentor
            </Link>
          </div>
        </div>

        <ol className="mnt-rows self-center">
          {rows.map((r) => (
            <li key={r.n} className="mnt-row grid grid-cols-[3.5rem_1fr] gap-4 border-t border-ink py-6 last:border-b">
              <span className="font-label text-lg font-bold tracking-wider">{r.n}</span>
              <div>
                <h3 className="font-display text-4xl leading-none">{r.t}</h3>
                <p className="mt-2 max-w-md text-base leading-relaxed">{r.d}</p>
              </div>
            </li>
          ))}
          <li className="pt-5 text-sm text-fg-muted">
            No reply from the mentor in 48 hours? The request is declined and you are refunded.
          </li>
        </ol>
      </div>
    </section>
  );
}
