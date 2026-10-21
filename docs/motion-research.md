# Motion research

Date: 2026-10-21. Method: Playwright (Chromium, 1440x900), full scroll-through at one-viewport
steps, ScrollTrigger/timeline introspection through the page's own `gsap` globals, hover/CSS
inspection, screenshots in `docs/design/reference/`.

Companion: `docs/design/reference-site-henrietta.md` (structure and technical breakdown).

## 1. Primary reference: Henrietta Said

### Timeline anatomy (measured)

`hp-section-2` (flavours): **13.65s timeline, 41 tweens, scrub 1.4**, mapped to 4,500px of scroll
(about 330px of scroll per second of timeline). One flavor "beat" is about 4s:

| Offset | Tween | Ease | Notes |
|---|---|---|---|
| 0 | subtitle chips scale 0, stagger | `back.in(1.7)` | exit of previous label |
| 0.2 | headline letters `y: 101%` (masked) | `back.inOut(1.7)` | SplitText letters, mask via overflow hidden |
| 0.2 | outgoing pack `y:100vh, x:30vw, rotation:-180deg` | `sine.out` | leaves the frame spinning |
| 0.2 | incoming pack (`runBackwards`) mirrored | `sine.out` | arrives from the opposite corner |
| 0.2-2.2 | wrapper `backgroundColor` to next flavor | `none` | the color wipe is a plain background tween |
| 0.7 | description lines `y: +-101%` | `back.out(1.7)` | SplitText lines, in and out on opposite sides |
| 1.8 | shadow `opacity 0.4, scale 1` | `none` | ground shadow returns after landing |
| 2.35 | subtitle chips pop in | `back.out(1.7)` | 0.7s, staggered |

Pattern: every beat is **exit, swap, enter** inside one continuous timeline, with entering tweens
authored via `runBackwards: true` so the in-state is the natural CSS state.

`hp-section-3` (benefits): 3.46s, 12 tweens. Facts slide in from `x: 101%`, then the stripe
columns shift left in 0.5s steps with `back.inOut(1.7)`: `-67%, -73%, -79%, -85%`. Stepped offsets
create a staircase of color without any per-stripe timeline.

`hp-section-4` (testimonials): 4.13s, 10 tweens. Cards drop to `y: 0%` with
`back.out(0.5)` and settle at rotations `5deg, -5deg, 7deg`, then fan flat (`0deg`), the front card
flips `rotationY: 180deg` (0.5s, `back.inOut(1.7)`) and the top card exits `y: -25dvh`.

`hero-section`: only 0.5s, 2 tweens. Title scales to 0.9 with `back.out(1.2)`, an overlay goes to
0.6 opacity. Restraint: the hero does almost nothing on scroll; the mascot carries it.

Toggle-based triggers (not scrubbed) are used for small reveals: marquee, section titles,
censored title, footer. `play none none reverse`, start `top 50%` to `top 80%`.

### Motion settings worth reusing

- `scrub: 1.4` is the signature. It makes the scrub feel like it has weight; direct `scrub: true`
  feels mechanical.
- Back eases (`back.out(1.7)`, `back.inOut(1.7)`) are the personality. Used everywhere, so the
  site has one consistent physical feel.
- `force3D: true` on all tweens; `clamp()` on start/end to keep triggers safe near page edges.
- Section height does the pacing. Longer wrapper = slower story. No `pin: true`, so no pin-spacer
  layout jumps and resize is simpler.
- Hover is quiet: weight shift on nav, short `0.1-0.2s` color transitions, `0.3s` back-ease for
  buttons.
- Nav links: letters split into spans, accessible name kept on the parent.

### What did not work for us

- 4-8 viewports per story beat is long. Fine for a product launch, too slow for a platform
  people want to understand in a minute. Hunar chapters should be 1.5-3 viewports.
- Constant ambient particles around the hero: decoration with no meaning for our content.
- All-caps body copy: harms readability beyond a short line.

## 2. Other sites studied

Selected from the GSAP showcase (https://gsap.com/showcase/), then opened and inspected.
Several ship GSAP inside a module bundle, so only visuals and structure could be measured for
those; stack details below are only the ones confirmed from page globals.

| Site | Confirmed stack | What it does well | Take for Hunar |
|---|---|---|---|
| A24 films (a24.raviklaassens.com) | GSAP 3.15 + ScrollTrigger + SplitText + CustomEase, Lenis, three.js, one canvas | Almost no chrome. Editorial serif for titles, tiny uppercase metadata with hairline rules, objects (discs) that rotate and slide in 3D as you move between items. Restraint in color: off-white `#f2f2f2` and black only. | Hairline-ruled metadata for mentor and agent cards; hierarchy from type scale not boxes; restraint. |
| Illoca (illoca.unseen.co) | Lenis, one canvas, 8 font families (heavy) | Warm paper ground with a faint grid, big sentence-case headline, **hand-written annotations** beside the headline, single illustration in a strict 2-3 ink palette with grain. Small floating nav pill. | Human, hand-made feel without gimmicks. Annotation lines are a cheap way to add warmth. Keep font count low (it is a cost here). |
| Built Kindly (builtkindly.com) | Nuxt, 12 canvases, no GSAP global | Cream ground `#fdfae7`, rounded serif headline (Bree Serif) over a clean sans (Montserrat), **flat spot illustrations in a limited purple / green / orange palette**, pill CTA in deep purple. Very close to our mascot brief. | Proof that flat, friendly, limited-palette illustration reads premium. Serif plus sans pairing. Single orange accent for emphasis. |
| Guillaume Colombel (guillaumecolombel.fr) | Nuxt, 2 canvases, Neue Montreal | Page loads into an almost empty canvas-led view; type is one family. | Less is more. Not used further (the page did not render usable content in the headless run). |

Not measurable here: pin counts and easing for A24/Illoca/Built Kindly. We rely on their visual
patterns, not their timings.

## 3. Cross-site patterns

1. **Few, large, confident type moments** instead of many small ones.
2. **Color is a layer that changes with the story** (Henrietta backgrounds), kept to flat fills.
3. **Objects keep the viewer's eye in one place** while text changes around them.
4. **Warm, human texture** (annotations, grain, hand-drawn lines) beats decorative shapes.
5. **Smooth scroll (Lenis) is universal** among these; none of them animate everything.
6. **Restraint in the hero**: Henrietta's hero timeline is 0.5s; the weight is in the artwork.

## 4. What Hunar takes

| Idea | Source | Hunar use |
|---|---|---|
| Scrubbed chapter timelines, `scrub` about 1.2-1.5, `clamp()` start/end | Henrietta | "How it works" story: Plan, Build, Mentor, Grow as four beats |
| Exit, swap, enter beat structure with `runBackwards` | Henrietta | Each AI agent introduced as a beat inside one pinned timeline |
| Flat background color tween between chapters | Henrietta | Chapters alternate purple, pink, off-white, soft black. No gradients, so the transition is a straight `backgroundColor` tween |
| Fixed hero object while text swaps | Henrietta | The mascot stays; agent captions change around her |
| Letter and line masked reveals via SplitText | Henrietta, A24 | Headlines only. Reduced motion falls back to opacity or no motion |
| Back ease personality | Henrietta | Same family for all UI motion; softened (`back.out(1.2)`) so it reads warm, not cartoonish |
| Hairline rules and tiny uppercase metadata | A24 | Mentor cards, agent index, dashboard tables |
| Annotations and warm paper ground | Illoca | One or two handwritten-style annotations in the hero only |
| Flat spot illustration in limited palette | Built Kindly | Mascot style guide |
| Stacked tilted cards that flip and exit | Henrietta | Success stories (rotation up to about 3deg, not 7) |
| Canvas image sequence scrubbed by ScrollTrigger | skill `lets-scroll` + brief | Hero mascot video, Step 4 |

## 5. Motion guardrails for Hunar (checked in Step 6)

- No gradients in any tween target (`backgroundColor`, `color`, `borderColor` only, solid).
- No ambient looping decoration. Every tween answers "what does this explain".
- Scrubbed chapters max 3 viewports each; whole landing page under about 14 viewports.
- Back overshoot at most 1.4 on UI, 1.7 only on the hero lockup.
- `prefers-reduced-motion: reduce`: no scrub, no pin, no parallax, no canvas sequence (show a single
  poster frame); content stays in DOM order and fully readable.
- Split text: parent keeps the full string as `aria-label`, letters are `aria-hidden`.
- Animate `transform` and `opacity` only, except flat `backgroundColor` for chapter shifts.
- Mobile: no scrubbed pinning under 768px; use toggle reveals.

## 6. Open items

- Re-measure Henrietta on a 390px viewport (mobile behavior) before locking our own mobile rules.
- Pin count and ease inventory for A24/Illoca if we want to quote timings; requires their source
  maps or a non-headless capture.
