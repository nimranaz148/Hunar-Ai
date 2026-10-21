"use client";

import { useRef } from "react";
import { gsap, SplitText, useGSAP, motion } from "@/lib/gsap";

/** LinkedIn connection is a requested feature that is not in the PRD yet (see docs/adr/0002).
 *  The page therefore labels it "Coming soon" and makes no functional claims. */
const sides = [
  {
    who: "For entrepreneurs",
    points: ["Link your LinkedIn profile to your Hunar business.", "Find mentors and other founders in your field.", "Ask for an introduction in one tap."],
  },
  {
    who: "For mentors",
    points: ["Show your real experience on your mentor profile.", "Be found by founders who match what you know.", "Keep your network and your sessions in one place."],
  },
];

export function Network() {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        const split = SplitText.create(".net-title", { type: "lines", mask: "lines" });
        gsap.from(split.lines, {
          yPercent: 105,
          stagger: motion.stagger.lines,
          duration: 0.9,
          ease: "power4.out",
          scrollTrigger: { trigger: root.current, start: "top 65%", toggleActions: "play none none reverse" },
        });
        gsap.from(".net-col", {
          y: 50,
          autoAlpha: 0,
          stagger: 0.15,
          duration: 0.8,
          ease: motion.ease.settle,
          scrollTrigger: { trigger: ".net-cols", start: "top 80%", toggleActions: "play none none reverse" },
        });
        return () => split.revert();
      });
    },
    { scope: root },
  );

  return (
    <section
      ref={root}
      id="network"
      aria-labelledby="network-title"
      className="on-dark bg-plum px-5 py-24 text-cream md:px-10 md:py-36"
    >
      <div className="mx-auto max-w-[96rem]">
        <p className="font-label text-sm tracking-[0.12em] text-marigold">NETWORK</p>
        <h2
          id="network-title"
          className="net-title font-display mt-3 max-w-6xl text-[clamp(3.4rem,10.5vw,10.5rem)] leading-[0.88]"
        >
          Connect. Network. Grow.
        </h2>
        <p className="mt-6 flex flex-wrap items-center gap-3 text-lg md:text-xl">
          <span className="sticker bg-marigold text-ink">Coming soon</span>
          <span className="max-w-xl leading-relaxed text-cream/85">
            Bring your LinkedIn into Hunar so the people who can help you are one introduction away.
          </span>
        </p>

        <div className="net-cols mt-14 grid gap-10 md:grid-cols-2">
          {sides.map((s) => (
            <div key={s.who} className="net-col border-t-2 border-cream pt-5">
              <h3 className="font-display text-4xl leading-none md:text-5xl">{s.who}</h3>
              <ul className="mt-5 space-y-3">
                {s.points.map((p) => (
                  <li key={p} className="flex gap-3 text-lg leading-snug">
                    <span aria-hidden className="mt-2 h-2 w-2 shrink-0 rounded-full bg-marigold" />
                    {p}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
