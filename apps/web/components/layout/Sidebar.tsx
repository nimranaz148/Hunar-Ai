"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Calendar,
  Sparkles,
  BarChart3,
  Users,
  Settings,
  ClipboardList,
  Briefcase,
  Package,
  Clock,
  DollarSign,
  FileText,
  Flag,
  ShieldCheck,
  User,
  UserCheck,
  Bell,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { UserRole } from "@/lib/permissions";

export interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
}

export interface NavGroup {
  label: string;
  items: NavItem[];
}

const icon = (Icon: React.ComponentType<{ className?: string }>) => <Icon className="h-4 w-4" />;

/** Sidebar structure. Same destinations as before, grouped by what the person is doing. */
export function getNavGroupsForRole(role: UserRole): NavGroup[] {
  switch (role) {
    case "entrepreneur":
      return [
        {
          label: "Workspace",
          items: [
            { label: "Today", href: "/dashboard", icon: icon(LayoutDashboard) },
            { label: "My Business", href: "/business", icon: icon(Briefcase) },
            { label: "Products", href: "/products", icon: icon(Package) },
          ],
        },
        {
          label: "Plan & Validate",
          items: [
            { label: "AI Onboarding", href: "/onboarding", icon: icon(Sparkles) },
            { label: "Idea Validation", href: "/validation", icon: icon(ShieldCheck) },
            { label: "Pricing & Margin", href: "/pricing", icon: icon(DollarSign) },
            { label: "Launch Plan", href: "/plan", icon: icon(ClipboardList) },
          ],
        },
        {
          label: "Grow",
          items: [
            { label: "Content Calendar", href: "/content", icon: icon(Calendar) },
            { label: "Performance", href: "/metrics", icon: icon(BarChart3) },
          ],
        },
        {
          label: "Support",
          items: [
            { label: "Mentors", href: "/mentors", icon: icon(Users) },
            { label: "Notifications", href: "/notifications", icon: icon(Bell) },
          ],
        },
      ];

    case "mentor":
      return [
        {
          label: "Workspace",
          items: [
            { label: "Dashboard", href: "/mentor", icon: icon(LayoutDashboard) },
            { label: "My Profile", href: "/mentor/profile", icon: icon(User) },
            { label: "My Services", href: "/mentor/services", icon: icon(Briefcase) },
            { label: "Availability", href: "/mentor/availability", icon: icon(Clock) },
          ],
        },
        {
          label: "Clients",
          items: [
            { label: "Mentees", href: "/mentor/mentees", icon: icon(Users) },
            { label: "Earnings", href: "/mentor/earnings", icon: icon(DollarSign) },
          ],
        },
        { label: "Support", items: [{ label: "Notifications", href: "/notifications", icon: icon(Bell) }] },
      ];

    case "super_admin":
      return [
        {
          label: "Overview",
          items: [
            { label: "Overview", href: "/admin", icon: icon(LayoutDashboard) },
            { label: "User Management", href: "/admin/users", icon: icon(Users) },
            { label: "Mentor Approvals", href: "/admin/mentors", icon: icon(UserCheck) },
          ],
        },
        {
          label: "Operations",
          items: [
            { label: "Agent Explorer", href: "/admin/runs", icon: icon(Sparkles) },
            { label: "Cohort Monitoring", href: "/admin/cohort", icon: icon(ClipboardList) },
            { label: "Usage Stats", href: "/admin/usage", icon: icon(BarChart3) },
          ],
        },
        {
          label: "Governance",
          items: [
            { label: "Audit Log", href: "/admin/audit", icon: icon(FileText) },
            { label: "Feature Flags", href: "/admin/feature-flags", icon: icon(Flag) },
            { label: "System Settings", href: "/admin/settings", icon: icon(Settings) },
            { label: "Notifications", href: "/notifications", icon: icon(Bell) },
          ],
        },
      ];

    default:
      return [];
  }
}

/** Flat list, kept for the mobile bottom nav and the command palette. */
export function getNavItemsForRole(role: UserRole): NavItem[] {
  return getNavGroupsForRole(role).flatMap((g) => g.items);
}

export interface SidebarProps {
  role: UserRole;
  userName?: string;
  onLogout?: () => void;
  className?: string;
}

export function Sidebar({ role, userName, onLogout, className }: SidebarProps) {
  const pathname = usePathname();
  const groups = getNavGroupsForRole(role);
  const roleLabel = (role ?? "entrepreneur").replace("_", " ");

  return (
    <aside
      className={cn(
        "on-dark fixed inset-y-0 left-0 z-30 hidden w-[var(--layout-sidebar)] select-none flex-col bg-[var(--color-plum)] text-[var(--color-cream)] lg:flex",
        className,
      )}
    >
      <div className="flex h-[var(--layout-topbar)] items-center px-6 pt-3">
        <Link href="/" aria-label="Hunar home" className="font-display text-[2.1rem] leading-none tracking-[0.02em]">
          HUNAR<span className="text-[var(--color-marigold)]">.</span>
        </Link>
      </div>

      <nav aria-label="Main" className="flex-1 space-y-5 overflow-y-auto px-3 py-4">
        {groups.map((g) => (
          <div key={g.label}>
            <p className="font-label px-3 pb-1.5 text-xs tracking-[0.14em] text-[var(--color-lilac)]">{g.label}</p>
            <ul className="space-y-0.5">
              {g.items.map((item) => {
                const isActive = pathname === item.href || pathname?.startsWith(`${item.href}/`);
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      aria-current={isActive ? "page" : undefined}
                      className={cn(
                        "font-label relative flex min-h-10 items-center gap-3 rounded-[var(--radius-md)] px-3 text-[1.0625rem] transition-colors duration-150",
                        isActive
                          ? "bg-[var(--color-cream)] text-[var(--color-ink)]"
                          : "text-[var(--color-cream)] hover:bg-[var(--color-violet)]",
                      )}
                    >
                      {isActive && <span aria-hidden className="absolute -left-3 h-6 w-1.5 rounded-r-full bg-[var(--color-marigold)]" />}
                      <span className={cn(isActive ? "text-[var(--color-violet)]" : "text-[var(--color-lilac)]")}>{item.icon}</span>
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      <div className="p-3">
        <div className="flex items-center gap-3 rounded-[var(--radius-md)] bg-[var(--color-ink)] p-3">
          <span aria-hidden className="font-display grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[var(--color-marigold)] text-lg text-[var(--color-ink)]">
            {(userName || "U").trim().charAt(0).toUpperCase()}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold">{userName || "User"}</p>
            <p className="font-label text-xs capitalize text-[var(--color-lilac)]">{roleLabel}</p>
          </div>
          {onLogout && (
            <button
              type="button"
              onClick={onLogout}
              className="font-label text-xs text-[var(--color-cream)] underline-offset-4 hover:text-[var(--color-marigold)] hover:underline"
            >
              Logout
            </button>
          )}
        </div>
      </div>
    </aside>
  );
}
