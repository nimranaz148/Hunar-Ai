import { Sidebar } from "./Sidebar";
import { BottomNav } from "./BottomNav";
import { NotificationBell } from "./NotificationBell";
import { CommandSearch } from "./CommandSearch";
import type { UserRole } from "@/lib/permissions";

export interface AppShellProps {
  role: UserRole;
  userName?: string;
  pageTitle?: string;
  onLogout?: () => void;
  actions?: React.ReactNode;
  children: React.ReactNode;
}

/**
 * Dashboard frame: plum sidebar, a floating cream top bar (same language as the landing nav),
 * and a blush canvas. Pages that pass `pageTitle` get it as the page <h1> (visually in the bar from xl up, always in the accessibility tree).
 */
export function AppShell({ role, userName, pageTitle, onLogout, actions, children }: AppShellProps) {
  return (
    <div className="min-h-screen bg-[var(--color-canvas)] text-[var(--color-fg)] lg:pl-[var(--layout-sidebar)]">
      <Sidebar role={role} userName={userName} onLogout={onLogout} />

      <div className="flex min-h-screen min-w-0 flex-col">
        <div className="sticky top-0 z-20 bg-[var(--color-canvas)] px-[var(--layout-inset)] pb-2 pt-[var(--layout-inset)]">
          <header className="flex h-14 items-center gap-3 rounded-[var(--radius-md)] bg-[var(--color-cream)] px-3 sm:px-4">
            <span className="font-display text-2xl leading-none lg:hidden">
              HUNAR<span className="text-[var(--color-magenta)]">.</span>
            </span>
            {pageTitle && (
              <h1 className="font-label sr-only text-lg xl:not-sr-only xl:block">{pageTitle}</h1>
            )}
            <CommandSearch role={role} />
            <div className="ml-auto flex items-center gap-2">
              {actions}
              <NotificationBell />
            </div>
          </header>
        </div>

        <main className="flex-1 px-[var(--layout-inset)] pb-24 pt-5 lg:pb-8">{children}</main>
      </div>

      <BottomNav role={role} />
    </div>
  );
}
