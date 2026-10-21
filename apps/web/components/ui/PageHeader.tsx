import React from "react";
import { cn } from "@/lib/utils";

export interface PageHeaderProps {
  title: string;
  kicker?: string;
  description?: string;
  actions?: React.ReactNode;
  className?: string;
}

/** Page heading used at the top of every dashboard screen. One h1 per page. */
export function PageHeader({ title, kicker, description, actions, className }: PageHeaderProps) {
  return (
    <header className={cn("flex flex-wrap items-end justify-between gap-4", className)}>
      <div className="min-w-0">
        {kicker && <p className="font-label text-sm text-[var(--color-fg)]">{kicker}</p>}
        <h1 className="font-display mt-1 text-[clamp(2.25rem,4.5vw,4rem)] leading-[0.95] text-[var(--color-fg)]">{title}</h1>
        {description && <p className="mt-2 max-w-2xl text-base text-[var(--color-fg)]/80">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </header>
  );
}
