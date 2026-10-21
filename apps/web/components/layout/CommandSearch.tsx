"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { CornerDownLeft, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { getNavItemsForRole } from "./Sidebar";
import type { UserRole } from "@/lib/permissions";

/** The palette mounts only while open, so its query and highlight reset on every open. */
function Palette({ role, onClose }: { role: UserRole; onClose: () => void }) {
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const listRef = useRef<HTMLUListElement>(null);

  const items = useMemo(() => getNavItemsForRole(role), [role]);
  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? items.filter((i) => i.label.toLowerCase().includes(q)) : items;
  }, [items, query]);

  const onInputKey = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") return onClose();
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((a) => Math.min(results.length - 1, a + 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => Math.max(0, a - 1));
    } else if (e.key === "Enter") {
      listRef.current?.querySelector<HTMLAnchorElement>(`[data-index="${active}"]`)?.click();
    }
  };

  return (
    <div className="fixed inset-0 z-[60] grid place-items-start justify-items-center px-4 pt-[14vh]" role="presentation">
      <button type="button" aria-label="Close search" tabIndex={-1} onClick={onClose} className="absolute inset-0 cursor-default bg-[var(--color-ink)]/70" />
      <div role="dialog" aria-modal="true" aria-label="Search" className="relative w-full max-w-xl overflow-hidden rounded-[var(--radius-lg)] border-2 border-[var(--color-ink)] bg-[var(--color-cream)]">
        <div className="flex items-center gap-3 border-b-2 border-[var(--color-ink)] px-4">
          <Search aria-hidden className="h-5 w-5 shrink-0" />
          <input
            autoFocus
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setActive(0);
            }}
            onKeyDown={onInputKey}
            placeholder="Where do you want to go?"
            aria-label="Search pages"
            className="h-14 flex-1 bg-transparent text-lg outline-none placeholder:text-[var(--color-fg-subtle)]"
          />
          <kbd className="font-label rounded border border-[var(--color-ink)] px-1.5 text-xs">Esc</kbd>
        </div>
        <ul ref={listRef} className="max-h-[50vh] overflow-y-auto p-2">
          {results.length === 0 && <li className="px-3 py-6 text-center text-[var(--color-fg-muted)]">No pages match &ldquo;{query}&rdquo;.</li>}
          {results.map((r, i) => (
            <li key={r.href}>
              <Link
                href={r.href}
                data-index={i}
                onClick={onClose}
                onMouseEnter={() => setActive(i)}
                className={cn(
                  "font-label flex min-h-11 items-center gap-3 rounded-[var(--radius-md)] px-3 text-[1.0625rem]",
                  i === active ? "bg-[var(--color-ink)] text-[var(--color-cream)]" : "text-[var(--color-ink)]",
                )}
              >
                <span className={i === active ? "text-[var(--color-marigold)]" : "text-[var(--color-violet)]"}>{r.icon}</span>
                <span className="flex-1">{r.label}</span>
                {i === active && <CornerDownLeft aria-hidden className="h-4 w-4" />}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

/**
 * Top-bar search that opens a jump-to palette (Ctrl/Cmd + K).
 * Results are real links, so Enter, click and middle-click all behave like navigation.
 */
export function CommandSearch({ role }: { role: UserRole }) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const close = () => {
    setOpen(false);
    triggerRef.current?.focus();
  };

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
        className="flex h-[var(--control-md)] min-w-0 flex-1 items-center gap-2 rounded-[var(--radius-md)] border-2 border-[var(--color-ink)] bg-[var(--color-surface-raised)] px-3 text-left text-sm text-[var(--color-fg-muted)] transition-colors hover:border-[var(--color-violet)] sm:max-w-md"
      >
        <Search aria-hidden className="h-4 w-4 shrink-0" />
        <span className="flex-1 truncate">Search or jump to a page</span>
        <kbd className="font-label hidden rounded border border-[var(--color-ink)] px-1.5 text-xs text-[var(--color-ink)] sm:inline">Ctrl K</kbd>
      </button>
      {open && <Palette role={role} onClose={close} />}
    </>
  );
}
