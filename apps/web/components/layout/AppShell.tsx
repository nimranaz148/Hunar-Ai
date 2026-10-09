import { Sidebar } from "./Sidebar";
import { BottomNav } from "./BottomNav";
import { NotificationBell } from "./NotificationBell";
import type { UserRole } from "@/lib/permissions";

export interface AppShellProps {
  role: UserRole;
  userName?: string;
  pageTitle?: string;
  onLogout?: () => void;
  actions?: React.ReactNode;
  children: React.ReactNode;
}

export function AppShell({
  role,
  userName,
  pageTitle,
  onLogout,
  actions,
  children,
}: AppShellProps) {
  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-[var(--color-canvas)] text-[var(--color-fg)]">
      {/* Desktop Sidebar (lg+) */}
      <Sidebar role={role} userName={userName} onLogout={onLogout} />

      {/* Main Body */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <header className="h-[var(--layout-topbar)] px-4 lg:px-8 border-b border-[var(--color-border)] bg-[var(--color-surface)] flex items-center justify-between sticky top-0 z-20 shadow-[var(--shadow-sm)]">
          <div className="flex items-center gap-3">
            {pageTitle && (
              <h1 className="text-[var(--text-lg)] font-bold text-[var(--color-fg)] tracking-tight">
                {pageTitle}
              </h1>
            )}
          </div>
          <div className="flex items-center gap-3">
            <NotificationBell />
            {actions && <div className="flex items-center gap-2">{actions}</div>}
          </div>
        </header>

        {/* Content Container */}
        <main className="flex-1 p-4 lg:p-8 pb-20 lg:pb-8 max-w-[var(--layout-page-max)] mx-auto w-full">
          {children}
        </main>
      </div>

      {/* Mobile Bottom Navigation (<lg) */}
      <BottomNav role={role} />
    </div>
  );
}
