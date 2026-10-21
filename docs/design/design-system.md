# Hunar design system

Source of truth for values is `apps/web/app/globals.css` (`@theme`). This document explains the
choices and the rules around them. Reference study: `docs/motion-research.md`.

## Principles

1. **Flat.** Solid colour only. No gradients, no glass or blur, no glow, no drop shadows.
   Separation comes from colour blocks and 1px ink hairlines.
2. **Big type, few words.** One idea per screen. Hierarchy comes from size contrast.
3. **Every visual earns its place.** Decoration is allowed only when it carries meaning
   (a sticker states a real product fact; the progress stripes count the agents).
4. **Warm and confident.** Purple and pink lead; soft black and off-white keep it grown-up; one
   marigold accent is the only other hue.
5. **Motion explains.** It shows exit, swap, enter. It is never ambient.

## Colour

| Token | Hex | Role |
|---|---|---|
| `ink` | `#1e1824` | soft black: text, dark surfaces, hairlines |
| `cream` | `#f4efea` | off-white: cards, nav, light chapters |
| `plum` | `#3f1259` | deep purple: dark chapters, sidebar |
| `violet` | `#7b3fe4` | purple primary: actions, charts, links |
| `lilac` | `#cbb2f5` | light purple: tints, selected rows |
| `magenta` | `#c42a7c` | pink primary (deep): hero, banners |
| `pink` | `#ec7fb1` | pink primary (bright): cards, stories ground |
| `blush` | `#f0b8cf` | soft pink: app canvas, mentor chapter |
| `marigold` | `#f4b630` | the one supporting accent: hover, markers, stickers |

Status colours are functional and sit beside the brand, never replace it:
`success #1b6c44`, `warning #8a5a00`, `danger #b3261e`, `info #5a2db8`, each with a pale tint.

### Contrast (WCAG 2.2, measured on these exact values)

| Pair | Ratio | Use |
|---|---|---|
| ink on cream | 15.2 | body text |
| ink on blush / lilac / marigold / pink | 10.3 / 9.3 / 9.6 / 6.8 | text on coloured cards |
| cream on plum | 12.8 | dark chapters |
| cream on violet | 5.0 | dark cards |
| cream on magenta | 4.6 | hero text (display size, also AA for body) |
| fg-muted on cream | 8.4 | secondary text |
| fg-subtle on cream | 5.0 | meta, placeholders |
| success / warning / danger / info on their tints | 5.3 / 4.9 / 4.8 / 6.1 | status badges |

**Decorative only (fails AA by design, always `aria-hidden`):** cream on pink or blush for the giant
chapter words and the footer wordmark. The real heading is always present as normal text.

### Palette lock

Default Tailwind colour scales are remapped onto the brand in `@theme` (emerald and green to
success, amber to warning, red to danger, blue and purple to violet, neutrals to warm ink). Older
screens that use `text-emerald-600` or `bg-neutral-100` therefore render in brand with no edits.
shadcn-style aliases (`bg-card`, `text-foreground`, `text-muted-foreground`, `bg-primary`) map to
the same tokens.

## Typography

| Role | Face | Setting |
|---|---|---|
| Display | **Anton** | uppercase, line-height 0.86 to 0.95, hero up to 11.5vw |
| Labels, nav, buttons | **Barlow Condensed** 500 to 700 | uppercase, tracking 0.06 to 0.14em |
| Body | **Barlow** 400 to 600 | sentence case, 16 to 20px, line-height 1.5 to 1.6 |

Anton and Barlow Condensed are the condensed, heavy voice of the reference; Barlow keeps long text
readable (the reference sets body in caps, which we do not copy). Three families, all via
`next/font` (self-hosted, `display: swap`).

App scale (`--text-*`): 11, 12, 14, 15, 17, 20, 24, 32, 44px. Use the utilities `text-xs`, `text-sm`,
`text-base`, `text-md`, ... **Never** `text-[var(--text-sm)]`: Tailwind v4 compiles that to a
*colour* and silently breaks the text colour.

## Layout and spacing

- Page gutter `--layout-inset` 14px: the floating nav, the footer panel and the dashboard top bar
  all sit inset from the viewport edge, like the reference.
- Marketing content max width 96rem; sections use `px-5 md:px-10`, vertical rhythm `py-24 md:py-36`.
- Dashboard: 16rem plum sidebar (grouped), floating cream top bar (4.25rem region), blush canvas,
  content gutter 14px, gaps 16px. Mobile: bottom nav, no sidebar.
- Radius is small: 4 to 8px for cards and controls, full radius only for chips, badges, avatars.
- Corners of colour blocks are never softened with shadow; 1px ink borders do the work.

## Components (all flat)

| Component | File | Notes |
|---|---|---|
| Buttons `.btn` `.btn-ink` `.btn-cream` `.btn-violet` `.btn-ghost` | `globals.css` | condensed uppercase, back-ease press |
| Sticker, round badge | `globals.css` | tilted with the CSS `rotate` property (GSAP owns `transform`) |
| Ticker | `landing/Ticker.tsx` | CSS marquee, paused on hover, off for reduced motion |
| StatCard | `ui/StatCard.tsx` | six tones, optional progress, whole card links (KPI drill-down) |
| DataGrid | `ui/DataGrid.tsx` | search, filter chips with counts, sortable headers, pagination, empty state |
| SearchInput, FilterChips | `ui/` | chips are toggle buttons with `aria-pressed` |
| PageHeader | `ui/PageHeader.tsx` | kicker, display title, description, actions |
| CommandSearch | `layout/CommandSearch.tsx` | Ctrl/Cmd+K jump-to palette, results are real links |
| AppShell, Sidebar, BottomNav | `layout/` | role-aware grouped navigation |
| AuthShell | `layout/AuthShell.tsx` | brand panel plus form |

## Motion system

| | Value |
|---|---|
| Signature ease | `back.out(1.4)` entrances, `back.inOut(1.4)` swaps. Overshoot 1.7 only on hero lockups |
| Settle ease | `power3.out` for large objects |
| Durations | 0.2 fast, 0.45 base, 0.9 slow (seconds) |
| Stagger | letters 0.025, lines 0.09, items 0.08 |
| Scrub smoothing | `scrub: 1.4` on every scrubbed timeline (the reference's signature weight) |
| Hover | 200ms colour change, 300ms back-ease for rotate/scale |

Pattern for every chapter: a tall wrapper (`height: N * 100vh`), a `position: sticky` stage, and
**one** scrubbed timeline of exit, swap, enter beats. No `pin: true`, so there are no pin-spacer
layout jumps. `data-mode="pinned"` is set by `gsap.matchMedia`; without it the same markup is plain
stacked sections.

**Fallbacks**
- `prefers-reduced-motion: reduce`: no scrub, no pin, no Lenis, no marquee, no count-up, no autoplay
  video. Content is complete and in reading order.
- Under 768px: stacked sections with simple reveals (no scrubbed pinning).
- No JS: SSR output is the stacked layout.

**Rules enforced in review**
- Tween only `transform`, `opacity`, and flat `backgroundColor` / `color` (hex values from
  `lib/palette.ts`; GSAP cannot interpolate `var(--x)`).
- Never put `overflow: hidden` on an ancestor of a sticky stage (it silently disables sticky). Use
  `overflow-x: clip`.
- Split text keeps the full string as the accessible name; the visual copy is `aria-hidden`.

## Layers and gotchas

- Component classes in `globals.css` live in `@layer components` so Tailwind utilities (`lg:hidden`)
  can override them. Unlayered CSS beats utilities and caused a real bug.
- GSAP owns `transform`; tilt and scale on tweened elements use the independent CSS `rotate` and
  `scale` properties.

## Accessibility baseline

Visible focus ring (3px violet, marigold on dark surfaces), 44px minimum touch targets on primary
controls, `aria-current` on navigation, `aria-sort` on sortable headers, `role="status"` on result
counts, skip of decorative text via `aria-hidden`, all colour pairs above AA except the documented
decorative ones.
