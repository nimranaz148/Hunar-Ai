/**
 * Brand colours as literal hex, for GSAP tweens (GSAP cannot interpolate `var(--x)`).
 * Keep in sync with the `--color-*` brand tokens in app/globals.css.
 */
export const palette = {
  ink: "#1e1824",
  cream: "#f4efea",
  plum: "#3f1259",
  violet: "#7b3fe4",
  lilac: "#cbb2f5",
  magenta: "#c42a7c",
  pink: "#ec7fb1",
  blush: "#f0b8cf",
  marigold: "#f4b630",
} as const;
