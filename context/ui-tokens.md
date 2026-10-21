# UI Tokens

Design tokens for Hunar v2. Use these exact values throughout the codebase — never hardcode colors and never use raw Tailwind palette classes in components.

> **Status: final brand pass applied (ADR 0002, 2026-10-21).** Flat purple and pink identity, no
> gradients. The design rationale, contrast measurements and motion system live in
> `docs/design/design-system.md`. Only the values in this file and `app/globals.css` change when
> branding changes; component code that uses tokens correctly needs no edits.
>
> The functional information architecture and workflow defined in the PRD **shall not change** without product-owner approval, regardless of visual restyling.

---

## How to Use

This project uses **Tailwind CSS v4**. Tokens are defined with the `@theme` directive in `apps/web/app/globals.css`. No `tailwind.config.ts` is needed for colors or tokens.

Tailwind v4 generates utilities from `@theme` variables automatically:

- `--color-accent` gives `bg-accent`, `text-accent`, `border-accent`
- `--color-surface` gives `bg-surface`, `text-surface`, `border-surface`

```tsx
// Correct — generated utility classes
className="bg-surface text-fg border-border"

// Also correct — CSS variable reference
style={{ color: "var(--color-fg)" }}

// Never — hardcoded hex
className="bg-[#f8fafc] text-[#0f172a]"

// Never — raw Tailwind palette
className="bg-blue-500 text-gray-600"
```

---

## Design Intent

Screens are read before they are clicked, and the product has to feel warm and confident for its
audience. The system is **flat** (solid colour, 1px ink hairlines, no shadow, gradient, blur or
glow), with big condensed display type for headings and a readable sans for everything else.

- Purple and pink are the primaries; soft black and off-white are the secondaries; marigold is the
  single supporting accent.
- Status colours are functional and always paired with a label, never colour alone.
- Large display text may sit on saturated grounds; **body text is always AA** (see contrast table).

## Brand palette

| Token | Hex | Role |
| --- | --- | --- |
| `--color-ink` | `#1e1824` | soft black: text, dark surfaces, hairlines |
| `--color-cream` | `#f4efea` | off-white: cards, nav |
| `--color-plum` | `#3f1259` | deep purple: sidebar, dark chapters |
| `--color-violet` | `#7b3fe4` | purple primary: actions, links, charts |
| `--color-lilac` | `#cbb2f5` | light purple: tints, selection |
| `--color-magenta` | `#c42a7c` | pink primary (deep): hero, banners |
| `--color-pink` | `#ec7fb1` | pink primary (bright): cards |
| `--color-blush` | `#f0b8cf` | soft pink: app canvas |
| `--color-marigold` | `#f4b630` | the one supporting accent |

## Semantic tokens (what components use)

| Group | Tokens |
| --- | --- |
| Surfaces | `canvas` (blush), `surface` (cream), `surface-raised`, `surface-sunken`, `surface-hover`, `surface-active` |
| Borders | `border`, `border-strong` (ink), `border-focus` (violet) |
| Text | `fg`, `fg-muted` (8.4:1), `fg-subtle` (5.0:1), `fg-inverse` |
| Accent | `accent` (violet), `accent-hover`, `accent-active`, `accent-subtle`, `accent-border` |
| Status | `success`, `warning`, `danger`, `info`, `neutral`, each with `-subtle` and `-border` |
| Charts | `chart-1..6` (violet, magenta, plum, pink, lilac, marigold), `chart-grid`, `chart-axis` |
| Type scale | `text-2xs` 11, `xs` 12, `sm` 14, `base` 15, `md` 17, `lg` 20, `xl` 24, `2xl` 32, `3xl` 44 |
| Radius | `sm` 4, `md` 6, `lg` 8, `full` |
| Elevation | none (`--shadow-*` are `none`); use a 1px `ink` border |
| Layout | sidebar 16rem, topbar 4.25rem, inset 14px, form max 60rem |
| Motion | `--ease-out`, `--ease-back`, durations 120 / 200 / 320ms |

Fonts: `--font-display` Anton, `--font-label` Barlow Condensed, `--font-sans` Barlow.

**Use `text-sm` / `text-xs` (theme utilities) for font size. Never `text-[var(--text-sm)]`:** Tailwind
v4 compiles that to a colour and breaks the element's text colour.

Legacy Tailwind colour scales (`emerald`, `amber`, `red`, `blue`, `purple`, `neutral`, ...) and
shadcn-style aliases (`bg-card`, `text-foreground`, `bg-primary`) are remapped onto these tokens in
`globals.css`, so older screens stay on-brand. New code should still use the semantic tokens above.

---

## Status Color Mapping

Document and transaction statuses appear constantly. Map them consistently — a status badge must mean the same thing on every screen.

| Status | Token |
| --- | --- |
| Draft, Not Submitted, Pending | `neutral` |
| Submitted, Submitting, In Progress, Pending Retry | `info` |
| Approved, Posted, Accepted, Reconciled, Active, Completed, Paid | `success` |
| Warning, Low Stock, Near Expiry, Partial, Awaiting Approval | `warning` |
| Rejected, Failed, Cancelled, Void, Expired, Out of Stock, Communication Failure, Inactive | `danger` |

| Content Item Status | draft (neutral), approved (info), posted (success), skipped (warning) |
| Booking Status | requested (info), accepted (success), declined (danger), completed (success) |
| Agent Run Status | queued (neutral), running (info), awaiting_approval (warning), succeeded (success), failed (danger) |

AI autonomy levels: L1/L2 `info` · L3 `warning` (needs approval) · L4/L5 `accent`.

---

## Dark Mode

Not required for the first phase. When it is added, define the same token names under `@media (prefers-color-scheme: dark)` and a `[data-theme="dark"]` selector. Because components reference tokens rather than values, no component code changes. Do not introduce a component that hardcodes a light-mode assumption.

---

## Rules

1. Never a hex value in a component.
2. Never a raw Tailwind palette class.
3. New token needed? Add it here first, then use it. A one-off value in a component is a defect.
4. Status color comes from the mapping table above — never chosen ad hoc per screen.
5. Touch/kiosk screens use the touch scale. forms and grids use the control and grid scales. Do not mix them.
6. No gradients, blur, glass or glow, anywhere. A tween may only interpolate a flat colour.
