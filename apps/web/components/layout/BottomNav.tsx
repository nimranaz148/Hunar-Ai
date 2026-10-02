"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { getNavItemsForRole } from "./Sidebar";
import type { UserRole } from "@/lib/permissions";

export interface BottomNavProps {
  role: UserRole;
  className?: string;
}

export function BottomNav({ role, className }: BottomNavProps) {
  const pathname = usePathname();
  // Take top 4 or 5 items for mobile navigation
  const navItems = getNavItemsForRole(role).slice(0, 5);

  return (
    <nav
      aria-label="Mobile Navigation"
      className={cn(
        "lg:hidden fixed bottom-0 left-0 right-0 h-16 border-t border-[var(--color-border)] bg-[var(--color-surface)] z-40 px-2 flex items-center justify-around shadow-[var(--shadow-lg)]",
        className
      )}
    >
      {navItems.map((item) => {
        const isActive = pathname === item.href || pathname?.startsWith(`${item.href}/`);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex flex-col items-center justify-center flex-1 py-1 text-center transition-colors",
              isActive
                ? "text-[var(--color-accent)] font-semibold"
                : "text-[var(--color-fg-muted)] hover:text-[var(--color-fg)]"
            )}
          >
            <div className={cn("p-1 rounded-[var(--radius-sm)]", isActive && "bg-[var(--color-accent-subtle)]")}>
              {item.icon}
            </div>
            <span className="text-[var(--text-2xs)] mt-0.5 tracking-tight truncate max-w-[4.5rem]">
              {item.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
