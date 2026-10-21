import Link from "next/link";
import { Mascot } from "@/components/landing/Mascot";
import { Ticker } from "@/components/landing/Ticker";

const stickers = [
  { text: "Roman Urdu AI", className: "left-10 top-[30%]", rotate: -6 },
  { text: "Verified mentors", className: "right-10 top-[44%]", rotate: 5 },
  { text: "You approve every plan", className: "left-16 top-[58%]", rotate: -3 },
];

/**
 * Split layout for login, signup and mentor-apply: a hero-style brand panel (desktop only)
 * beside the form. Pages pass their own card as children.
 */
export function AuthShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-screen lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
      <aside className="on-dark relative hidden flex-col overflow-hidden bg-[var(--color-magenta)] text-[var(--color-cream)] lg:sticky lg:top-0 lg:flex lg:h-screen lg:self-start">
        <div className="p-10 pb-0">
          <Link href="/" aria-label="Hunar home" className="font-display w-fit text-4xl leading-none">
            HUNAR<span className="text-[var(--color-marigold)]">.</span>
          </Link>
          <p className="font-display mt-10 text-[clamp(3.6rem,7.4vw,7.5rem)] leading-[0.86]">
            Apna business shuru karein
          </p>
        </div>

        <div className="relative flex-1">
          <Mascot
            variant="dupatta"
            className="pointer-events-none absolute bottom-0 left-1/2 w-[min(24rem,78%)] -translate-x-1/2 translate-y-[6%]"
          />
          {stickers.map((s) => (
            <span key={s.text} className={`sticker pointer-events-none absolute text-base ${s.className}`} style={{ rotate: `${s.rotate}deg` }}>
              {s.text}
            </span>
          ))}
        </div>

        <Ticker
          className="relative z-10 border-y border-[var(--color-ink)] bg-[var(--color-cream)] text-[var(--color-ink)]"
          items={["Roman Urdu AI", "30-day content calendar", "Verified mentors", "You approve every plan", "Weekly AI coaching"]}
        />
      </aside>

      <main className="flex flex-col items-center justify-center bg-[var(--color-blush)] p-4 sm:p-8">
        <Link href="/" aria-label="Hunar home" className="font-display mb-6 text-4xl leading-none lg:hidden">
          HUNAR<span className="text-[var(--color-magenta)]">.</span>
        </Link>
        {children}
      </main>
    </div>
  );
}
