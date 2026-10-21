"use client";

import React from "react";
import { cn } from "@/lib/utils";

export interface FilterOption {
  value: string;
  label: string;
  /** Optional result count shown inside the chip. */
  count?: number;
}

export interface FilterChipsProps {
  label: string;
  options: FilterOption[];
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

/** Single-select chip group. Exposed as a group of toggle buttons (aria-pressed). */
export function FilterChips({ label, options, value, onChange, className }: FilterChipsProps) {
  return (
    <div role="group" aria-label={label} className={cn("flex flex-wrap items-center gap-1.5", className)}>
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(o.value)}
            className={cn(
              "font-label inline-flex min-h-9 items-center gap-1.5 rounded-full border-2 border-[var(--color-ink)] px-3.5 text-sm transition-[background-color,color,transform] duration-200 ease-[var(--ease-back)] active:scale-95",
              active
                ? "bg-[var(--color-ink)] text-[var(--color-cream)]"
                : "bg-transparent text-[var(--color-ink)] hover:bg-[var(--color-marigold)]",
            )}
          >
            {o.label}
            {typeof o.count === "number" && (
              <span className={cn("rounded-full px-1.5 text-xs", active ? "bg-[var(--color-cream)] text-[var(--color-ink)]" : "bg-[var(--color-ink)]/10")}>
                {o.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
