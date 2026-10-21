"use client";

import { useRef } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { gsap, SplitText, useGSAP, motion, mq } from "@/lib/gsap";
import { Mascot } from "./Mascot";
import { Ticker } from "./Ticker";

const stickers = [
  { text: "Roman Urdu AI", className: "left-[26%] top-[8%]", rotate: -6 },
  { text: "30-day content calendar", className: "right-[24%] top-[2%]", rotate: 5 },
  { text: "Verified mentors", className: "left-[30%] top-[52%]", rotate: 4 },
  { text: "You approve every plan", className: "right-[28%] top-[58%]", rotate: -4 },
];

export function Hero() {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();

      mm.add(mq.reduced, () => {
        gsap.set(".hero-line, .hero-sub, .hero-cta, .hero-sticker, .hero-mascot", { clearProps: "all" });
      });

      mm.add("(prefers-reduced-motion: no-preference)", () => {
        const split = SplitText.create(".hero-line", { type: "lines", mask: "lines", autoSplit: true });

        const intro = gsap.timeline({ defaults: { ease: motion.ease.pop } });
        intro
          .from(split.lines, { yPercent: 105, duration: 1, stagger: motion.stagger.lines, ease: "power4.out" })
          .from(".hero-mascot", { yPercent: 18, autoAlpha: 0, duration: 0.9, ease: motion.ease.settle }, 0.25)
          .from(".mascot-shades", { y: -90, duration: 0.7, ease: "bounce.out", transformOrigin: "50% 50%" }, 0.9)
          .from(".hero-sticker", { scale: 0, autoAlpha: 0, duration: 0.5, stagger: 0.12 }, 0.8)
          .from(".hero-sub, .hero-cta", { y: 24, autoAlpha: 0, duration: 0.6, stagger: 0.1, ease: motion.ease.settle }, 1.0);

        // A single idle motion with a job: the shades glint draws the eye to the mascot.
        gsap.to(".mascot-glint", { autoAlpha: 0.15, repeat: -1, yoyo: true, duration: 1.4, ease: "sine.inOut", delay: 2 });

        // Scroll: the headline settles back, the mascot rises. Restrained, like the reference (0.5s timeline).
        gsap
          .timeline({
            scrollTrigger: {
              trigger: root.current,
              start: "top top",
              end: "bottom top",
              scrub: motion.scrub,
            },
          })
          .to(".hero-title", { scale: 0.9, yPercent: -6, ease: "none" }, 0)
          .to(".hero-mascot", { yPercent: -10, ease: "none" }, 0)
          .to(".hero-sticker", { yPercent: -30, ease: "none", stagger: 0.04 }, 0);

        return () => split.revert();
      });
    },
    { scope: root },
  );

  return (
    <section
      ref={root}
      aria-labelledby="hero-title"
      className="on-dark relative flex min-h-[100svh] flex-col overflow-hidden bg-magenta text-cream"
    >
      <div className="hero-title mx-auto w-full max-w-[110rem] px-4 pt-24 text-center md:pt-[5.75rem]">
        <h1
          id="hero-title"
          className="font-display text-[clamp(3.4rem,11.4vw,11.5rem)] leading-[0.88]"
        >
          <span className="hero-line block">Apna business</span>
          <span className="hero-line block">shuru karein</span>
        </h1>
      </div>

      <div className="relative mx-auto mt-4 grid w-full max-w-[100rem] flex-1 items-end gap-6 px-5 md:mt-0 md:grid-cols-[1fr_auto_1fr] md:px-10">
        <p className="hero-sub relative z-10 max-w-xs text-lg font-medium leading-snug md:mb-24 md:text-xl">
          AI agents that plan, price and post with you in Roman Urdu, and verified mentors who pick up
          where the AI stops.
        </p>

        <div className="hero-mascot relative order-first mx-auto w-[min(20rem,62vw)] md:order-none md:w-[min(22rem,25vw)]">
          <Mascot className="h-auto w-full translate-y-[7%]" />
        </div>

        <div className="hero-cta relative z-10 flex flex-wrap items-center gap-3 md:mb-24 md:flex-col md:items-end">
          <Link href="/signup" className="btn btn-cream btn-lg">
            Start free <ArrowRight className="h-5 w-5" aria-hidden />
          </Link>
          <a href="#how" className="btn btn-ghost btn-lg">
            See how it works
          </a>
        </div>

        {stickers.map((s) => (
          <span
            key={s.text}
            className={`hero-sticker sticker pointer-events-none absolute hidden text-base md:inline-block ${s.className}`}
            style={{ rotate: `${s.rotate}deg` }}
          >
            {s.text}
          </span>
        ))}
      </div>

      <Ticker
        className="relative z-10 border-y border-ink bg-cream text-ink"
        items={[
          "Roman Urdu AI",
          "30-day content calendar",
          "Verified mentors",
          "Paid only when the session is done",
          "You approve every plan",
          "Weekly AI coaching",
        ]}
      />
    </section>
  );
}
