# Reference site analysis: Henrietta Said

Source: https://henrietta.wearetattoodigital.com/ (Webflow, studied 2026-10-21 at 1440x900).
Screenshots: `docs/design/reference/d00..d21.webp` (one per viewport of scroll), `h-nav-*.webp` (hover).

This is a study, not a clone target. Hunar borrows the *structure and mechanics* and replaces the
visual language (see `docs/motion-research.md`, "What Hunar takes").

## 1. Layout and structure

One page, ~19,740px tall (~22 viewports at 900px), inside a single `transition-container`.

| Scroll (px) | Section | What happens |
|---|---|---|
| 0-900 | Hero | Oversized two-line headline `SCANDALOUSLY SPICY SNACKS`, mascot product centered below it, small snack particles drifting around it, claims ticker strip along the bottom. Scrolling scales the title to 0.9 and darkens an overlay to 0.6 over a 0.5s timeline. |
| 900-5400 | Flavours (`hp-section-2`, 5 viewports) | Full-bleed color changes per flavor (pink to deep red to orange to yellow). Giant flavor word behind a centered product; sticker label left, round "View product" badge right. One scrubbed timeline of 41 tweens. |
| 5400-12400 | Benefits (`hp-section-3`, ~8 viewports) | Product pack fixed center. Left column: tilted headline and sticker. Right column: facts swap (keto, XL peanuts, fiber, protein...) while vertical color stripes slide in from the right edge. |
| 13050-13300 | Marquee + title | Marquee band, title reveals on enter (toggle, not scrub). |
| 13830-17430 | Testimonials (`hp-section-4`, 4 viewports) | Curved text banner (`SCANDALOUSLY SPICY - ...`) on a path with two mascots at its ends. Stack of tilted colored cards; each flips (rotationY 180) and exits upward to reveal the next. |
| 17900-18800 | Closing statement | Large "censored" lockup, round "Contact us" badge. |
| 18800-19741 | Footer | Inset rounded panel: logo, giant two-line wordmark, nav, socials, legal. |

Persistent chrome: floating inset nav bar (off-white, 14px from the edges, 65px tall): five text
links left, logo center, black "Our products" CTA + square search button right. The nav never
changes style on scroll.

## 2. Visual system observed

- Palette: dusty pink ground `#e3a898`, brick `#8b231a` and orange `#f45016` (read from the
  tweens/computed style); tomato, yellow, off-white and near-black are visual estimates
  (about `#d62828`, `#eec715`, `#e9e6e3`, `#252525`). Flat fills, no gradients.
  Product photography is the only rendered/3D element.
- Type: three display faces (Thedodgerinky, Sink, Changa One), all-caps, heavy condensed, with a
  very tight line height. Hero headline ~160px. Body is uppercase condensed at ~17px. Hierarchy
  comes almost entirely from size contrast and color, not weight.
- Shapes: tilted rectangular "sticker" labels (about -4deg), round badges with rotated text,
  thin horizontal rules. Corner radius on the nav and cards is small (4-6px).
- Motion language: playful and springy (back eases) which matches a snack brand.

## 3. Technical requirements (as built)

| Concern | Reference implementation |
|---|---|
| Platform | Webflow (IX3 interactions + custom GSAP), jQuery |
| GSAP | 3.15.0 with ScrollTrigger, SplitText, CustomEase, CustomWiggle, EasePack |
| Smooth scroll | Lenis 1.1.14 |
| ScrollTrigger count | 9 (4 scrubbed timelines, 5 toggle reveals) |
| Scrub | `scrub: 1.4` on every scrubbed trigger (smoothing lag, not pinned) |
| Start/end | `clamp(top top)` / `clamp(bottom bottom)`; toggles use `top 50%`, `top 80%` |
| Pinning | None via ScrollTrigger. Section height is set in CSS and content is `position: sticky`; the timeline is scrubbed against the tall wrapper. |
| Toggle reveals | `toggleActions: "play none none reverse"` |
| Preloader | `.preloader` with a percentage counter, `display: none` after load |
| Page transition | `.fading-element` overlay + `.transition-container` wrapper |
| Cursor | Native (no custom cursor) |
| Fonts | Webfont loader, 3 custom + Changa One |
| Hover | Mostly IX3; CSS only has `background-color 0.1-0.2s`, `filter 0.4s`, and `0.3s cubic-bezier(0.68,-0.55,0.265,1.55)` |
| Nav links | Each letter in its own `aria-hidden` span, parent keeps the accessible name; hover shifts weight |

## 4. Requirements it implies for Hunar

1. Full-viewport "chapters" with one dominant idea each.
2. Chapter color changes driven by scroll (background tween), not by a gradient.
3. A fixed hero object that stays while text swaps around it.
4. Letter/line masked text reveals that also work with reduced motion.
5. Accessible handling of split text (`aria-label` on the parent, `aria-hidden` on letters).
6. A way to pause or reduce all of this (reduced-motion fallback = static layout, no pinning).

## 5. Things we deliberately do not copy

- Product-photo style, flavor/snack content, brand colors, fonts, copy, the "censored" bit.
- Webflow/jQuery. Hunar is Next.js + Tailwind v4 + `@gsap/react`.
- Elements that exist only for fun (drifting particles) unless they carry meaning for Hunar.
