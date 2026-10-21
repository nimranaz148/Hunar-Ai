import Link from "next/link";

const nav = [
  { label: "How it works", href: "#how" },
  { label: "AI agents", href: "#agents" },
  { label: "Mentors", href: "#mentors" },
  { label: "Stories", href: "#stories" },
  { label: "Network", href: "#network" },
];

const account = [
  { label: "Log in", href: "/login" },
  { label: "Join free", href: "/signup" },
  { label: "Apply as a mentor", href: "/mentor-apply" },
];

/** Inset rounded panel on the page ground, like the reference footer. */
export function Footer() {
  return (
    <footer className="bg-cream p-[var(--layout-inset)] text-ink">
      <div className="rounded-md bg-blush px-5 pb-8 pt-12 md:px-12">
        <p
          aria-hidden
          className="font-display select-none text-center text-[clamp(6rem,30vw,30rem)] leading-[0.78] text-cream"
        >
          Hunar
        </p>

        <div className="mt-10 flex flex-wrap items-start justify-between gap-8 border-t border-ink pt-6">
          <nav aria-label="Footer" className="flex flex-wrap gap-x-6 gap-y-2">
            {nav.map((l) => (
              <a key={l.href} href={l.href} className="font-label text-lg tracking-[0.07em] uppercase hover:text-violet">
                {l.label}
              </a>
            ))}
          </nav>
          <nav aria-label="Account" className="flex flex-wrap gap-x-6 gap-y-2">
            {account.map((l) => (
              <Link key={l.href} href={l.href} className="font-label text-lg tracking-[0.07em] uppercase hover:text-violet">
                {l.label}
              </Link>
            ))}
          </nav>
        </div>

        <p className="mt-8 text-sm text-fg-muted">
          © 2026 Hunar. Built for Pakistani women entrepreneurs.
        </p>
      </div>
    </footer>
  );
}
