import React from "react";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";

export type StatTone = "violet" | "pink" | "marigold" | "plum" | "lilac" | "cream";

/** Text colours are chosen per tone to keep WCAG AA contrast (see docs/design/design-system.md). */
const TONES: Record<StatTone, { box: string; track: string; fill: string }> = {
  violet: { box: "bg-[var(--color-violet)] text-[var(--color-cream)]", track: "bg-white/25", fill: "bg-[var(--color-cream)]" },
  pink: { box: "bg-[var(--color-pink)] text-[var(--color-ink)]", track: "bg-[var(--color-ink)]/20", fill: "bg-[var(--color-ink)]" },
  marigold: { box: "bg-[var(--color-marigold)] text-[var(--color-ink)]", track: "bg-[var(--color-ink)]/20", fill: "bg-[var(--color-ink)]" },
  plum: { box: "bg-[var(--color-plum)] text-[var(--color-cream)]", track: "bg-white/25", fill: "bg-[var(--color-marigold)]" },
  lilac: { box: "bg-[var(--color-lilac)] text-[var(--color-ink)]", track: "bg-[var(--color-ink)]/20", fill: "bg-[var(--color-ink)]" },
  cream: { box: "bg-[var(--color-surface)] text-[var(--color-ink)]", track: "bg-[var(--color-ink)]/15", fill: "bg-[var(--color-violet)]" },
};

export interface StatCardProps {
  label: string;
  value: React.ReactNode;
  hint?: string;
  /** 0 to 100. Renders a flat progress bar when provided. */
  progress?: number;
  href?: string;
  linkLabel?: string;
  tone?: StatTone;
  className?: string;
}

export function StatCard({ label, value, hint, progress, href, linkLabel, tone = "cream", className }: StatCardProps) {
  const t = TONES[tone];
  const body = (
    <>
      <div className="flex items-start justify-between gap-3">
        <span className="font-label text-sm">{label}</span>
        {href && (
          <span
            aria-hidden
            className="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-current transition-transform duration-300 ease-[var(--ease-back)] group-hover:rotate-45"
          >
            <ArrowUpRight className="h-4 w-4" />
          </span>
        )}
      </div>
      <div className="font-display mt-6 text-[clamp(2.75rem,4.2vw,4.25rem)] leading-none">{value}</div>
      {hint && <p className="mt-2 text-sm opacity-90">{hint}</p>}
      {typeof progress === "number" && (
        <div className={cn("mt-4 h-2 overflow-hidden rounded-full", t.track)} role="progressbar" aria-valuenow={Math.round(progress)} aria-valuemin={0} aria-valuemax={100} aria-label={`${label} progress`}>
          <div className={cn("h-full rounded-full transition-[width] duration-700 ease-[var(--ease-out)]", t.fill)} style={{ width: `${Math.max(0, Math.min(100, progress))}%` }} />
        </div>
      )}
      {href && linkLabel && <p className="font-label mt-4 text-sm underline-offset-4 group-hover:underline">{linkLabel}</p>}
    </>
  );

  const base = cn(
    "group block rounded-[var(--radius-lg)] border border-[var(--color-ink)] p-5 transition-transform duration-300 ease-[var(--ease-back)]",
    t.box,
    href && "hover:-translate-y-1",
    className,
  );

  return href ? (
    <Link href={href} className={base}>
      {body}
    </Link>
  ) : (
    <div className={base}>{body}</div>
  );
}
