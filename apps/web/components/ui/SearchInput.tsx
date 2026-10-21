"use client";

import React from "react";
import { Search, X } from "lucide-react";
import { cn } from "@/lib/utils";

export interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  /** Accessible name; the visible placeholder is not a label. */
  label: string;
  className?: string;
}

export function SearchInput({ value, onChange, placeholder = "Search", label, className }: SearchInputProps) {
  return (
    <div className={cn("relative", className)}>
      <Search aria-hidden className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-fg-muted)]" />
      <input
        type="search"
        aria-label={label}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="h-[var(--control-md)] w-full rounded-[var(--radius-md)] border-2 border-[var(--color-ink)] bg-[var(--color-surface-raised)] pl-9 pr-9 text-base text-[var(--color-fg)] outline-none placeholder:text-[var(--color-fg-subtle)] focus:border-[var(--color-violet)] focus:ring-2 focus:ring-[var(--color-violet)] [&::-webkit-search-cancel-button]:hidden"
      />
      {value && (
        <button
          type="button"
          aria-label="Clear search"
          onClick={() => onChange("")}
          className="absolute right-2 top-1/2 grid h-6 w-6 -translate-y-1/2 place-items-center rounded-full hover:bg-[var(--color-surface-hover)]"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
