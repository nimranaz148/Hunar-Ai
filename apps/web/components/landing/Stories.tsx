"use client";

import { useRef } from "react";
import { gsap, ScrollTrigger, SplitText, useGSAP, motion, mq } from "@/lib/gsap";

/** SAMPLE stories: written to show the format. Replace with real, consented founder stories
 *  before launch (see docs/design/content-todo.md). They are labelled "Sample" in the UI. */
const stories = [
  {
    name: "Aisha",
    meta: "Home bakery · Lahore",
    quote: "Roman Urdu mein baat karke plan ban gaya. Pehli dafa pata chala ke mera asal munafa kitna hai.",
    bg: "var(--color-plum)",
    fg: "var(--color-cream)",
    tilt: 4,
  },
  {
    name: "Sana",
    meta: "Stitching · Karachi",
    quote: "Roz kya post karna hai, ye sochna band ho gaya. Tees din ka calendar pehle se tayyar tha.",
    bg: "var(--color-violet)",
    fg: "var(--color-cream)",
    tilt: -4,
  },
  {
    name: "Rabia",
    meta: "Skincare · Islamabad",
    quote: "Mentor ne mera brief pehle se parha hua tha, is liye poora ghanta kaam ki baat hui.",
    bg: "var(--color-ink)",
    fg: "var(--color-cream)",
    tilt: 3,
  },
  {
    name: "Hina",
    meta: "Home-made pickles · Multan",
    quote: "Har hafte coach batata hai kya kaam kar raha hai. Ab main andaza nahi lagati.",
    bg: "var(--color-cream)",
    fg: "var(--color-ink)",
    tilt: -3,
  },
] as const;

const bannerText = "APNA BUSINESS  ·  APNI PEHCHAN  ·  ";

export function Stories() {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const el = root.current;
      if (!el) return;
      const mm = gsap.matchMedia();

      // The banner text always travels along its arc (non-reduced motion), pinned or not.
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        gsap.to(el.querySelector(".st-textpath"), {
          attr: { startOffset: "-42%" },
          ease: "none",
          scrollTrigger: { trigger: el, start: "top bottom", end: "bottom top", scrub: motion.scrub },
        });
      });

      mm.add(mq.full, () => {
        el.dataset.mode = "pinned";
        const split = SplitText.create(el.querySelector(".st-title")!, { type: "lines", mask: "lines" });
        const cards = gsap.utils.toArray<HTMLElement>(".st-card", el);

        gsap.set(cards, { yPercent: 220, rotate: 0 });

        gsap.from(split.lines, {
          yPercent: 105,
          duration: 0.9,
          stagger: motion.stagger.lines,
          ease: "power4.out",
          scrollTrigger: { trigger: el, start: "top 55%", toggleActions: "play none none reverse" },
        });

        const tl = gsap.timeline({
          defaults: { ease: "none" },
          scrollTrigger: {
            trigger: el.querySelector(".st-track"),
            start: "top top",
            end: "bottom bottom",
            scrub: motion.scrub,
          },
        });

        cards.forEach((c, i) => {
          const tilt = stories[i].tilt;
          tl.to(c, { yPercent: 0, rotate: tilt, duration: 0.55, ease: "back.out(0.6)" }, i);
          if (i < cards.length - 1) {
            tl.to(c, { yPercent: -230, rotate: tilt * 2.2, duration: 0.4, ease: "back.in(1.2)" }, i + 0.72);
          }
        });
        tl.to({}, { duration: 0.4 });

        return () => {
          split.revert();
          el.dataset.mode = "static";
        };
      });

      return () => ScrollTrigger.refresh();
    },
    { scope: root },
  );

  return (
    <section
      ref={root}
      id="stories"
      data-mode="static"
      aria-labelledby="stories-title"
      className="group/st relative overflow-x-clip bg-pink text-ink"
    >
      {/* curved banner */}
      <svg
        aria-hidden
        viewBox="0 0 1440 380"
        preserveAspectRatio="xMidYMin slice"
        className="pointer-events-none absolute inset-x-0 top-0 z-10 h-[13rem] w-full md:h-[19rem]"
      >
        <path id="st-arc" d="M-160 330Q720 -110 1600 330" fill="none" stroke="var(--color-marigold)" strokeWidth="120" />
        <text className="font-display" fontSize="74" fill="var(--color-plum)" letterSpacing="2">
          <textPath href="#st-arc" startOffset="0%" className="st-textpath">
            {bannerText.repeat(6)}
          </textPath>
        </text>
      </svg>

      <div className="st-track relative group-data-[mode=pinned]/st:h-[420vh]">
        <div className="group-data-[mode=pinned]/st:sticky group-data-[mode=pinned]/st:top-0 group-data-[mode=pinned]/st:h-screen group-data-[mode=pinned]/st:overflow-hidden">
          <div className="relative px-5 pb-20 pt-48 md:px-10 md:pt-[17rem] group-data-[mode=pinned]/st:pb-0 group-data-[mode=pinned]/st:pt-[14.5rem]">
            <div className="mx-auto max-w-5xl text-center">
              <p className="font-label text-sm tracking-[0.12em]">STORIES</p>
              <h2
                id="stories-title"
                className="st-title font-display mt-1 text-[clamp(2.6rem,5.4vw,5rem)] leading-[0.9]"
              >
                Hear it from founders
              </h2>
              <span className="sticker mt-3 bg-ink text-cream">Sample stories</span>
            </div>

            <ul className="relative mx-auto mt-10 grid max-w-5xl gap-5 sm:grid-cols-2 group-data-[mode=pinned]/st:mt-4 group-data-[mode=pinned]/st:block group-data-[mode=pinned]/st:h-[22rem]">
              {stories.map((s) => (
                <li
                  key={s.name}
                  className="st-card rounded-lg border-2 border-ink p-7 group-data-[mode=pinned]/st:absolute group-data-[mode=pinned]/st:left-1/2 group-data-[mode=pinned]/st:top-0 group-data-[mode=pinned]/st:w-[min(36rem,88vw)] group-data-[mode=pinned]/st:-translate-x-1/2"
                  style={{ background: s.bg, color: s.fg }}
                >
                  <span aria-hidden className="font-display block text-7xl leading-[0.6] text-marigold">
                    &ldquo;
                  </span>
                  <blockquote className="mt-3 text-xl font-medium leading-snug md:text-2xl">{s.quote}</blockquote>
                  <p className="mt-6 flex items-center gap-3 border-t border-current/40 pt-4">
                    <span className="grid h-10 w-10 place-items-center rounded-full bg-marigold font-display text-lg text-ink">
                      {s.name[0]}
                    </span>
                    <span>
                      <span className="font-label block text-lg font-bold leading-none tracking-wide">{s.name.toUpperCase()}</span>
                      <span className="text-sm opacity-80">{s.meta}</span>
                    </span>
                  </p>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
