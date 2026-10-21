"use client";

import { useRef } from "react";
import Link from "next/link";
import { palette } from "@/lib/palette";
import { gsap, ScrollTrigger, SplitText, useGSAP, motion, mq } from "@/lib/gsap";
import { CalendarCard, ChatCard, GrowthCard, MentorCard } from "./StepCards";

const steps = [
  {
    key: "plan",
    word: "PLAN",
    bg: palette.blush,
    fg: palette.ink,
    ghost: palette.cream,
    n: "01",
    title: "Tell the AI your idea in Roman Urdu",
    body: "Chat the way you talk. Your plan, pricing and a 30-day launch roadmap are ready in minutes, and nothing is final until you approve it.",
    sticker: "No English forms",
    cta: { label: "Start free", href: "/signup" },
    Card: ChatCard,
  },
  {
    key: "launch",
    word: "LAUNCH",
    bg: palette.lilac,
    fg: palette.ink,
    ghost: palette.cream,
    n: "02",
    title: "Get 30 days of content, ready to post",
    body: "A full calendar with Roman Urdu captions for every day. You review each post and approve it before it goes anywhere.",
    sticker: "You approve every post",
    cta: { label: "Start free", href: "/signup" },
    Card: CalendarCard,
  },
  {
    key: "mentor",
    word: "MENTOR",
    bg: palette.marigold,
    fg: palette.ink,
    ghost: palette.cream,
    n: "03",
    title: "Book a verified mentor when you need a human",
    body: "Pick a mentor and a slot. Your payment is held until the session is done, then you leave a review.",
    sticker: "Paid only when done",
    cta: { label: "Meet mentors", href: "#mentors" },
    Card: MentorCard,
  },
  {
    key: "grow",
    word: "GROW",
    bg: palette.plum,
    fg: palette.cream,
    ghost: palette.violet,
    n: "04",
    title: "Weekly coaching on your real numbers",
    body: "Log views, inquiries and revenue. Your AI coach reads the week and tells you what to change next.",
    sticker: "Every single week",
    cta: { label: "Start free", href: "/signup" },
    Card: GrowthCard,
  },
] as const;

export function HowItWorks() {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const el = root.current;
      if (!el) return;
      const mm = gsap.matchMedia();

      mm.add(mq.full, () => {
        el.dataset.mode = "pinned";

        const stage = el.querySelector<HTMLElement>(".hiw-stage")!;
        const items = gsap.utils.toArray<HTMLElement>(".hiw-step", el);
        const words = items.map((s) => s.querySelector<HTMLElement>(".hiw-word")!);
        const splits = words.map((w) => SplitText.create(w, { type: "chars", mask: "chars" }));
        const copies = items.map((s) => gsap.utils.toArray<HTMLElement>(".hiw-copy > *", s));
        const cards = items.map((s) => s.querySelector<HTMLElement>(".hiw-card")!);
        const badges = items.map((s) => s.querySelector<HTMLElement>(".hiw-badge")!);

        // Starting state: only the first beat is visible.
        gsap.set(stage, { backgroundColor: steps[0].bg, color: steps[0].fg });
        items.forEach((s, i) => {
          if (i === 0) return;
          gsap.set(s, { autoAlpha: 0 });
          gsap.set(splits[i].chars, { yPercent: 110 });
          gsap.set(copies[i], { yPercent: 40, autoAlpha: 0 });
          gsap.set([cards[i], badges[i]], { scale: 0.6, autoAlpha: 0 });
        });

        const tl = gsap.timeline({
          defaults: { ease: "none" },
          scrollTrigger: {
            trigger: el.querySelector(".hiw-track"),
            start: "top top",
            end: "bottom bottom",
            scrub: motion.scrub,
          },
        });

        // Exit, swap, enter. Each beat is 1 timeline unit.
        for (let i = 1; i < steps.length; i++) {
          const t = i - 0.5;
          const prev = i - 1;
          tl.to(splits[prev].chars, { yPercent: -110, duration: 0.35, stagger: 0.02, ease: motion.ease.popInOut }, t - 0.05)
            .to(copies[prev], { yPercent: -40, autoAlpha: 0, duration: 0.25, stagger: 0.03 }, t - 0.05)
            .to([cards[prev], badges[prev]], { scale: 0.6, autoAlpha: 0, duration: 0.25, ease: "back.in(1.4)" }, t - 0.05)
            .to(stage, { backgroundColor: steps[i].bg, color: steps[i].fg, duration: 0.4 }, t)
            .set(items[prev], { autoAlpha: 0 }, t + 0.3)
            .set(items[i], { autoAlpha: 1 }, t)
            .to(splits[i].chars, { yPercent: 0, duration: 0.45, stagger: 0.03, ease: motion.ease.popInOut }, t + 0.1)
            .to(copies[i], { yPercent: 0, autoAlpha: 1, duration: 0.35, stagger: 0.06, ease: motion.ease.settle }, t + 0.2)
            .to([cards[i], badges[i]], { scale: 1, autoAlpha: 1, duration: 0.4, stagger: 0.06, ease: motion.ease.pop }, t + 0.25);
        }
        tl.to({}, { duration: 0.5 }); // hold on the last beat

        return () => {
          splits.forEach((s) => s.revert());
          el.dataset.mode = "static";
        };
      });

      return () => ScrollTrigger.refresh();
    },
    { scope: root },
  );

  return (
    <section ref={root} id="how" data-mode="static" aria-labelledby="how-title" className="group/hiw relative">
      <h2 id="how-title" className="sr-only">
        How Hunar works
      </h2>

      <div className="hiw-track relative group-data-[mode=pinned]/hiw:h-[420vh]">
        <div
          className="hiw-stage group-data-[mode=pinned]/hiw:sticky group-data-[mode=pinned]/hiw:top-0 group-data-[mode=pinned]/hiw:h-screen group-data-[mode=pinned]/hiw:overflow-hidden"
        >
          {steps.map((s) => (
            <article
              key={s.key}
              className="hiw-step relative flex min-h-[88svh] items-center overflow-hidden px-5 py-24 group-data-[mode=pinned]/hiw:absolute group-data-[mode=pinned]/hiw:inset-0 group-data-[mode=pinned]/hiw:min-h-0 group-data-[mode=pinned]/hiw:!bg-transparent group-data-[mode=pinned]/hiw:py-0 md:px-10"
              style={{ background: s.bg, color: s.fg }}
            >
              {/* decorative giant word; the real heading is the h3 below */}
              <span
                aria-hidden
                className="hiw-word font-display pointer-events-none absolute inset-x-0 top-1/2 -translate-y-1/2 select-none text-center text-[clamp(7rem,27vw,26rem)] leading-[0.8]"
                style={{ color: s.ghost }}
              >
                {s.word}
              </span>

              <div className="relative z-10 mx-auto grid w-full max-w-[96rem] items-center gap-10 md:grid-cols-[1fr_auto_1fr]">
                <div className="hiw-copy max-w-sm md:justify-self-start">
                  <p className="font-label text-sm tracking-[0.12em]">STEP {s.n}</p>
                  <h3 className="font-display mt-2 text-[clamp(2rem,3.4vw,3.2rem)] leading-[0.95]">{s.title}</h3>
                  <p className="mt-4 text-base leading-relaxed md:text-lg">{s.body}</p>
                  <span className="sticker mt-5 bg-plum text-cream">{s.sticker}</span>
                </div>

                <div className="hiw-card justify-self-center">
                  <s.Card />
                </div>

                <div className="md:justify-self-end">
                  <Link
                    href={s.cta.href}
                    className="hiw-badge badge-round hover:bg-ink hover:text-cream"
                    style={{ color: s.fg }}
                  >
                    {s.cta.label}
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
