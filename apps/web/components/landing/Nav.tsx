"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";

const links = [
  { label: "How it works", href: "#how" },
  { label: "AI agents", href: "#agents" },
  { label: "Mentors", href: "#mentors" },
  { label: "Stories", href: "#stories" },
  { label: "Network", href: "#network" },
];

/** Letter-roll hover without splitting the accessible name: the duplicate line is aria-hidden. */
function RollLink({ href, children, onClick }: { href: string; children: string; onClick?: () => void }) {
  return (
    <a
      href={href}
      onClick={onClick}
      className="group relative block h-[1.25em] overflow-hidden font-label text-[1.0625rem] leading-[1.25em] tracking-[0.07em] uppercase"
    >
      <span className="block transition-transform duration-300 ease-[var(--ease-back)] group-hover:-translate-y-full group-focus-visible:-translate-y-full">
        {children}
      </span>
      <span
        aria-hidden
        className="absolute left-0 top-full block text-violet transition-transform duration-300 ease-[var(--ease-back)] group-hover:-translate-y-full group-focus-visible:-translate-y-full"
      >
        {children}
      </span>
    </a>
  );
}

export function Nav() {
  const [open, setOpen] = useState(false);

  return (
    <header className="fixed inset-x-[var(--layout-inset)] top-[var(--layout-inset)] z-50 text-ink">
      <div className="mx-auto flex h-16 items-center justify-between rounded-md border border-ink/15 bg-cream px-5">
        <nav aria-label="Primary" className="hidden flex-1 items-center gap-5 lg:flex">
          {links.map((l, i) => (
            <div key={l.href} className="flex items-center gap-5">
              <RollLink href={l.href}>{l.label}</RollLink>
              {i < links.length - 1 && <span aria-hidden className="h-4 w-px bg-ink" />}
            </div>
          ))}
        </nav>

        <Link
          href="/"
          aria-label="Hunar home"
          className="font-display text-[2rem] leading-none tracking-[0.02em] lg:absolute lg:left-1/2 lg:-translate-x-1/2"
        >
          HUNAR<span className="text-magenta">.</span>
        </Link>

        <div className="hidden flex-1 items-center justify-end gap-2 lg:flex">
          <Link href="/login" className="btn btn-ghost !min-h-10 !border-transparent hover:!border-ink">
            Log in
          </Link>
          <Link href="/signup" className="btn btn-ink !min-h-10">
            Join free
          </Link>
        </div>

        <button
          type="button"
          className="btn btn-ink !min-h-10 !px-3 lg:hidden"
          aria-expanded={open}
          aria-controls="mobile-menu"
          aria-label={open ? "Close menu" : "Open menu"}
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {open && (
        <div id="mobile-menu" className="mt-2 rounded-md bg-cream p-5 lg:hidden">
          <nav aria-label="Primary mobile" className="flex flex-col gap-4">
            {links.map((l) => (
              <RollLink key={l.href} href={l.href} onClick={() => setOpen(false)}>
                {l.label}
              </RollLink>
            ))}
          </nav>
          <div className="mt-5 flex gap-2">
            <Link href="/login" className="btn btn-ghost flex-1">
              Log in
            </Link>
            <Link href="/signup" className="btn btn-ink flex-1">
              Join free
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
