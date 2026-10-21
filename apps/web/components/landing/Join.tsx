"use client";

import { useRef } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { gsap, SplitText, useGSAP, motion } from "@/lib/gsap";

const paths = [
  {
    who: "I run a home business",
    line: "Start with your idea. The plan, the pricing and the first 30 days are on us.",
    cta: "Join free",
    href: "/signup",
    cls: "bg-ink text-cream hover:bg-violet",
  },
  {
    who: "I want to mentor",
    line: "Set your services and your availability. Get matched with founders who need what you know.",
    cta: "Apply as a mentor",
    href: "/mentor-apply",
    cls: "bg-cream text-ink hover:bg-pink",
  },
];

export function Join() {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        const split = SplitText.create(".join-title", { type: "lines", mask: "lines" });
        gsap.from(split.lines, {
          yPercent: 105,
          stagger: motion.stagger.lines,
          duration: 0.9,
          ease: "power4.out",
          scrollTrigger: { trigger: root.current, start: "top 65%", toggleActions: "play none none reverse" },
        });
        gsap.from(".join-path", {
          y: 50,
          autoAlpha: 0,
          stagger: 0.14,
          duration: 0.8,
          ease: motion.ease.pop,
          scrollTrigger: { trigger: ".join-paths", start: "top 85%", toggleActions: "play none none reverse" },
        });
        return () => split.revert();
      });
    },
    { scope: root },
  );

  return (
    <section
      ref={root}
      id="join"
      aria-labelledby="join-title"
      className="bg-marigold px-5 py-24 text-ink md:px-10 md:py-36"
    >
      <div className="mx-auto max-w-[96rem]">
        <h2
          id="join-title"
          className="join-title font-display text-[clamp(3.4rem,11vw,11rem)] leading-[0.88]"
        >
          Ready when you are
        </h2>

        <div className="join-paths mt-14 grid gap-5 md:grid-cols-2">
          {paths.map((p) => (
            <Link
              key={p.href}
              href={p.href}
              className={`join-path group flex min-h-[17rem] flex-col justify-between rounded-lg border-2 border-ink p-7 transition-colors duration-200 md:p-9 ${p.cls}`}
            >
              <div>
                <h3 className="font-display text-4xl leading-none md:text-6xl">{p.who}</h3>
                <p className="mt-4 max-w-md text-lg leading-snug">{p.line}</p>
              </div>
              <span className="font-label mt-8 inline-flex items-center gap-2 text-xl font-bold tracking-[0.07em]">
                {p.cta}
                <ArrowRight className="h-6 w-6 transition-transform duration-300 ease-[var(--ease-back)] group-hover:translate-x-2" aria-hidden />
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
