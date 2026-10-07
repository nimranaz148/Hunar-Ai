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
  ShieldCheck,
  User,
  UserCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { UserRole } from "@/lib/permissions";

export interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
}

export function getNavItemsForRole(role: UserRole): NavItem[] {
  switch (role) {
    case "entrepreneur":
      return [
        { label: "Today", href: "/dashboard", icon: <LayoutDashboard className="w-4 h-4" /> },
        { label: "AI Onboarding", href: "/onboarding", icon: <Sparkles className="w-4 h-4" /> },
        { label: "My Business", href: "/business", icon: <Briefcase className="w-4 h-4" /> },
        { label: "Products", href: "/products", icon: <Package className="w-4 h-4" /> },
        { label: "Idea Validation", href: "/validation", icon: <ShieldCheck className="w-4 h-4" /> },
        { label: "Pricing & Margin", href: "/pricing", icon: <DollarSign className="w-4 h-4" /> },
        { label: "Launch Plan", href: "/plan", icon: <ClipboardList className="w-4 h-4" /> },
        { label: "Content Calendar", href: "/content", icon: <Calendar className="w-4 h-4" /> },
        { label: "Performance", href: "/metrics", icon: <BarChart3 className="w-4 h-4" /> },
        { label: "Mentors", href: "/mentors", icon: <Users className="w-4 h-4" /> },
      ];

    case "mentor":
      return [
        { label: "Dashboard", href: "/mentor", icon: <LayoutDashboard className="w-4 h-4" /> },
        { label: "My Profile", href: "/mentor/profile", icon: <User className="w-4 h-4" /> },
        { label: "My Services", href: "/mentor/services", icon: <Briefcase className="w-4 h-4" /> },
        { label: "Availability", href: "/mentor/availability", icon: <Clock className="w-4 h-4" /> },
        { label: "Mentees", href: "/mentor/mentees", icon: <Users className="w-4 h-4" /> },
        { label: "Earnings", href: "/mentor/earnings", icon: <DollarSign className="w-4 h-4" /> },
      ];
    case "super_admin":
      return [
        { label: "Overview", href: "/admin", icon: <LayoutDashboard className="w-4 h-4" /> },
        { label: "User Management", href: "/admin/users", icon: <Users className="w-4 h-4" /> },
        { label: "Mentor Approvals", href: "/admin/mentors", icon: <UserCheck className="w-4 h-4" /> },
        { label: "Audit Log", href: "/admin/audit", icon: <FileText className="w-4 h-4" /> },
        { label: "Agent Explorer", href: "/admin/runs", icon: <Sparkles className="w-4 h-4" /> },
        { label: "Cohort Monitoring", href: "/admin/cohort", icon: <ClipboardList className="w-4 h-4" /> },
        { label: "System Settings", href: "/admin/settings", icon: <Settings className="w-4 h-4" /> },
      ];
    default:
      return [];
  }
}

export interface SidebarProps {
  role: UserRole;
  userName?: string;
  onLogout?: () => void;
  className?: string;
}

export function Sidebar({ role, userName, onLogout, className }: SidebarProps) {
  const pathname = usePathname();
  const navItems = getNavItemsForRole(role);

  return (
    <aside
      className={cn(
        "hidden lg:flex flex-col w-[var(--layout-sidebar)] h-screen sticky top-0 border-r border-[var(--color-border)] bg-[var(--color-surface)] z-30 select-none",
        className
      )}
    >
      {/* Brand Header */}
      <div className="h-[var(--layout-topbar)] px-6 flex items-center border-b border-[var(--color-border)]">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-[var(--radius-md)] bg-[var(--color-accent)] text-[var(--color-fg-inverse)] flex items-center justify-center font-bold text-base shadow-[var(--shadow-sm)]">
            H
          </div>
          <div>
            <span className="font-bold text-[var(--text-base)] text-[var(--color-fg)] tracking-tight">
              Hunar <span className="text-[var(--color-accent)]">v2</span>
            </span>
            <span className="block text-[var(--text-2xs)] text-[var(--color-fg-subtle)] font-medium capitalize">
              {(role ?? "entrepreneur").replace("_", " ")}
            </span>
          </div>
        </Link>
      </div>

      {/* Nav Menu */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname?.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-[var(--radius-md)] text-[var(--text-sm)] font-medium transition-colors",
                isActive
                  ? "bg-[var(--color-accent-subtle)] text-[var(--color-accent)] font-semibold"
                  : "text-[var(--color-fg-muted)] hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-fg)]"
              )}
            >
              <span className={cn(isActive ? "text-[var(--color-accent)]" : "text-[var(--color-fg-subtle)]")}>
                {item.icon}
              </span>
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* User / Footer */}
      <div className="p-3 border-t border-[var(--color-border)]">
        <div className="px-3 py-2 rounded-[var(--radius-md)] bg-[var(--color-canvas)] flex items-center justify-between">
          <div className="truncate">
            <p className="text-[var(--text-xs)] font-semibold text-[var(--color-fg)] truncate">
              {userName || "User"}
            </p>
            <p className="text-[var(--text-2xs)] text-[var(--color-fg-subtle)] capitalize">
              {role.replace("_", " ")}
            </p>
          </div>
          {onLogout && (
            <button
              type="button"
              onClick={onLogout}
              className="text-[var(--text-2xs)] text-[var(--color-fg-muted)] hover:text-[var(--color-danger)] font-medium transition-colors"
            >
              Logout
            </button>
          )}
        </div>
      </div>
    </aside>
  );
}
