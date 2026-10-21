"use client";

import { useEffect, useRef } from "react";
import { gsap, useGSAP, motion } from "@/lib/gsap";

const clips = [
  {
    src: "/media/roadmap.mp4",
    poster: "/media/roadmap-poster.webp",
    no: "01",
    title: "Your launch roadmap",
    caption: "Research, pricing and a 30-day plan, laid out as stages with the next task always clear.",
    label: "Animation of a business roadmap leading to a launch stage",
  },
  {
    src: "/media/growth.mp4",
    poster: "/media/growth-poster.webp",
    no: "02",
    title: "Your first 90 days",
    caption: "Day 7, day 30, day 90: orders and revenue tracked against the plan you approved.",
    label: "Animation of a growth timeline from day 7 to day 90 with orders and revenue",
  },
] as const;

/** Plays only while on screen, and never for visitors who prefer reduced motion. */
function Clip({ src, poster, label }: { src: string; poster: string; label: string }) {
  const ref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const v = ref.current;
    if (!v || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const io = new IntersectionObserver(
      ([e]) => (e.isIntersecting ? void v.play().catch(() => {}) : v.pause()),
      { threshold: 0.35 },
    );
    io.observe(v);
    return () => io.disconnect();
  }, []);

  return (
    <video
      ref={ref}
      className="aspect-video w-full rounded-[4px] bg-ink object-cover"
      src={src}
      poster={poster}
      muted
      loop
      playsInline
      preload="none"
      aria-label={label}
    />
  );
}

export function Proof() {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      gsap.from(".proof-item", {
        y: 60,
        autoAlpha: 0,
        stagger: 0.18,
        duration: 0.9,
        ease: motion.ease.settle,
        scrollTrigger: { trigger: root.current, start: "top 65%", toggleActions: "play none none reverse" },
      });
    },
    { scope: root },
  );

  return (
    <section ref={root} aria-labelledby="proof-title" className="on-dark bg-ink px-5 py-24 text-cream md:px-10 md:py-32">
      <div className="mx-auto max-w-[96rem]">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <h2 id="proof-title" className="font-display text-[clamp(3.2rem,9vw,8.5rem)] leading-[0.88]">
            See it work
          </h2>
          <p className="max-w-sm text-lg leading-relaxed text-cream/80">
            What you get is a plan with dates on it, not a report to file away.
          </p>
        </div>

        <div className="mt-14 grid gap-10 md:grid-cols-2">
          {clips.map((c) => (
            <figure key={c.no} className="proof-item">
              <div className="border-2 border-cream p-2 rounded-md">
                <Clip src={c.src} poster={c.poster} label={c.label} />
              </div>
              <figcaption className="mt-4 border-t border-cream pt-3">
                <span className="font-label text-sm tracking-[0.12em] text-marigold">{c.no}</span>
                <span className="font-display ml-3 text-3xl align-middle">{c.title}</span>
                <p className="mt-2 max-w-md text-base leading-relaxed text-cream/80">{c.caption}</p>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
