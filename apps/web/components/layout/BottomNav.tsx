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
  // Top five destinations; everything else is reachable through search.
  const navItems = getNavItemsForRole(role).slice(0, 5);

  return (
    <nav
      aria-label="Mobile Navigation"
      className={cn(
        "on-dark fixed inset-x-[var(--layout-inset)] bottom-[var(--layout-inset)] z-40 flex h-[4.5rem] items-center justify-around rounded-[var(--radius-md)] bg-[var(--color-plum)] px-1 text-[var(--color-cream)] lg:hidden",
        className,
      )}
    >
      {navItems.map((item) => {
        const isActive = pathname === item.href || pathname?.startsWith(`${item.href}/`);
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={isActive ? "page" : undefined}
            className={cn(
              "flex min-w-0 flex-1 flex-col items-center justify-center gap-0.5 py-1 text-center transition-colors",
              isActive ? "text-[var(--color-marigold)]" : "text-[var(--color-cream)]/80 hover:text-[var(--color-cream)]",
            )}
          >
            <span className={cn("grid h-7 w-7 place-items-center rounded-full", isActive && "bg-[var(--color-cream)] text-[var(--color-plum)]")}>{item.icon}</span>
            <span className="font-label w-full text-center text-2xs leading-[1.05] tracking-wide">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
