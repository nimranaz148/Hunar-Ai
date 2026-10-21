"use client";

import { useRef } from "react";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { palette } from "@/lib/palette";
import { gsap, ScrollTrigger, SplitText, useGSAP, motion, mq } from "@/lib/gsap";

/** Six stations covering the twelve PRD agents (Orchestrator, Intake, Idea Validator, Pricing,
 *  Launch Planner, Competitor & Trend Researcher, Content Strategist/Writer/Visual Prompt/QA,
 *  Mentor Matcher, Weekly Coach). Human gates per PRD section 36.7. */
const agents = [
  {
    key: "listen",
    name: "Listens first",
    who: "Orchestrator + Intake",
    line: "Tell it your idea, messy is fine.",
    detail: "Talk in Roman Urdu or English. It pulls out your business profile and sends you to the right specialist.",
    bg: palette.violet,
    fg: palette.cream,
  },
  {
    key: "market",
    name: "Checks the market",
    who: "Idea Validator + Researcher",
    line: "Finds out if people will actually buy.",
    detail: "Researches demand and competitors, with sources, before you spend a rupee on stock.",
    bg: palette.pink,
    fg: palette.ink,
  },
  {
    key: "price",
    name: "Prices and plans",
    who: "Pricing + Launch Planner",
    line: "A price that leaves you a profit, and a 30-day plan.",
    detail: "Costs, margin and break-even, then dated launch tasks. Gate 1: nothing starts until you approve.",
    bg: palette.marigold,
    fg: palette.ink,
  },
  {
    key: "content",
    name: "Writes your 30 days",
    who: "Strategist + Writer + Visual Prompt + QA",
    line: "A month of posts, ready to copy and paste.",
    detail: "Captions, hooks, hashtags and image prompts for every day, checked for tone. Gate 2: you review the outline first.",
    bg: palette.plum,
    fg: palette.cream,
  },
  {
    key: "mentor",
    name: "Finds your mentor",
    who: "Mentor Matcher",
    line: "The right human, with a brief already prepared.",
    detail: "Ranks mentors by fit and writes a session brief so you do not start from zero. You decide who to book.",
    bg: palette.lilac,
    fg: palette.ink,
  },
  {
    key: "coach",
    name: "Coaches every week",
    who: "Weekly Coach",
    line: "Reads your numbers, proposes what to change.",
    detail: "Looks at your metrics and content performance and suggests a re-plan. Gate 3: you approve the changes.",
    bg: palette.blush,
    fg: palette.ink,
  },
] as const;

const stripeColors = [
  palette.plum,
  palette.magenta,
  palette.violet,
  palette.marigold,
  palette.pink,
  palette.lilac,
];

export function Agents() {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const el = root.current;
      if (!el) return;
      const mm = gsap.matchMedia();

      mm.add(mq.full, () => {
        el.dataset.mode = "pinned";

        const panel = el.querySelector<HTMLElement>(".agt-panel")!;
        const items = gsap.utils.toArray<HTMLElement>(".agt-item", el);
        const counters = gsap.utils.toArray<HTMLElement>(".agt-count", el);
        const stripes = gsap.utils.toArray<HTMLElement>(".agt-stripe", el);
        const title = SplitText.create(el.querySelector(".agt-title")!, { type: "lines", mask: "lines" });

        gsap.set(panel, { backgroundColor: agents[0].bg, color: agents[0].fg });
        gsap.set(stripes, { xPercent: 105 });
        gsap.set(stripes[0], { xPercent: 0 });
        items.forEach((it, i) => i > 0 && gsap.set(it, { autoAlpha: 0, yPercent: 30 }));
        counters.forEach((c, i) => i > 0 && gsap.set(c, { yPercent: 110 }));

        gsap.from(title.lines, {
          yPercent: 105,
          stagger: motion.stagger.lines,
          duration: 0.9,
          ease: "power4.out",
          scrollTrigger: { trigger: el, start: "top 60%", toggleActions: "play none none reverse" },
        });

        const tl = gsap.timeline({
          defaults: { ease: "none" },
          scrollTrigger: {
            trigger: el.querySelector(".agt-track"),
            start: "top top",
            end: "bottom bottom",
            scrub: motion.scrub,
          },
        });

        for (let i = 1; i < agents.length; i++) {
          const t = i - 0.5;
          tl.to(items[i - 1], { autoAlpha: 0, yPercent: -30, duration: 0.3, ease: motion.ease.popInOut }, t - 0.05)
            .to(counters[i - 1], { yPercent: -110, duration: 0.3, ease: motion.ease.popInOut }, t - 0.05)
            .to(panel, { backgroundColor: agents[i].bg, color: agents[i].fg, duration: 0.4 }, t)
            .to(stripes[i], { xPercent: 0, duration: 0.5, ease: motion.ease.popInOut }, t)
            .to(items[i], { autoAlpha: 1, yPercent: 0, duration: 0.4, ease: motion.ease.pop }, t + 0.15)
            .to(counters[i], { yPercent: 0, duration: 0.35, ease: motion.ease.popInOut }, t + 0.1);
        }
        tl.to({}, { duration: 0.5 });

        return () => {
          title.revert();
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
      id="agents"
      data-mode="static"
      aria-labelledby="agents-title"
      className="group/agt relative bg-cream text-ink"
    >
      <div className="agt-track relative group-data-[mode=pinned]/agt:h-[560vh]">
        <div className="group-data-[mode=pinned]/agt:sticky group-data-[mode=pinned]/agt:top-0 group-data-[mode=pinned]/agt:h-screen group-data-[mode=pinned]/agt:overflow-hidden">
          <div className="grid gap-10 px-5 py-24 md:h-full md:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] md:gap-0 md:p-0">
            {/* Left: sticky statement */}
            <div className="flex flex-col justify-center md:px-12 lg:px-20">
              <p className="font-label text-sm tracking-[0.12em] text-fg-muted">AI AGENTS</p>
              <h2
                id="agents-title"
                className="agt-title font-display mt-3 text-[clamp(3.5rem,9vw,9rem)] leading-[0.88]"
              >
                Twelve agents. One team.
              </h2>
              <p className="mt-6 max-w-md text-lg leading-relaxed text-fg-muted">
                Twelve specialists work behind one chat, each doing one job and handing over to the next.
                Three approval gates mean none of them acts without your say-so.
              </p>
              <span className="sticker mt-6 self-start">3 human approval gates</span>

              <div
                className="font-display mt-8 hidden items-end gap-2 text-6xl leading-none group-data-[mode=pinned]/agt:flex"
                aria-hidden
              >
                <span className="relative h-[1em] w-[1.15em] overflow-hidden">
                  {agents.map((a, i) => (
                    <span key={a.key} className="agt-count absolute inset-0 block">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                  ))}
                </span>
                <span className="mb-1 text-2xl text-fg-muted">/ 06</span>
              </div>
            </div>

            {/* Right: swapping panel + progress stripes */}
            <div className="agt-panel relative overflow-hidden md:h-full" style={{ background: agents[0].bg, color: agents[0].fg }}>
              <div className="relative h-full">
                {agents.map((a, i) => (
                  <article
                    key={a.key}
                    className="agt-item flex flex-col justify-center gap-4 border-b border-current/30 px-6 py-10 first:border-t group-data-[mode=pinned]/agt:absolute group-data-[mode=pinned]/agt:inset-0 group-data-[mode=pinned]/agt:border-0 group-data-[mode=pinned]/agt:py-0 md:px-14 md:pr-[22%]"
                    style={{ background: agents[i].bg, color: agents[i].fg }}
                  >
                    <p className="font-label text-sm tracking-[0.12em]">{String(i + 1).padStart(2, "0")} · {a.who.toUpperCase()}</p>
                    <h3 className="font-display text-[clamp(2.4rem,4.6vw,4.4rem)] leading-[0.92]">{a.name}</h3>
                    <p className="text-xl font-semibold leading-snug md:text-2xl">{a.line}</p>
                    <p className="max-w-md text-base leading-relaxed md:text-lg">{a.detail}</p>
                    <Link href="/signup" className="btn btn-ghost mt-2 self-start">
                      Try it free <ArrowUpRight className="h-4 w-4" aria-hidden />
                    </Link>
                  </article>
                ))}
              </div>

              <div className="pointer-events-none absolute inset-y-0 right-0 hidden w-[20%] group-data-[mode=pinned]/agt:flex" aria-hidden>
                {stripeColors.map((c, i) => (
                  <span key={i} className="agt-stripe h-full flex-1" style={{ background: c }} />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
