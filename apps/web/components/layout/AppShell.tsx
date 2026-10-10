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
    <div className="min-h-screen flex flex-col lg:flex-row text-[var(--color-fg)] relative">
      {/* Visible background pattern overlay */}
      <div className="fixed inset-0 pointer-events-none z-0">
        {/* Geometric pattern base */}
        <div className="absolute inset-0 bg-geometric-purple"></div>
        {/* Dot pattern overlay */}
        <div className="absolute inset-0 bg-pattern-dots opacity-50"></div>
        {/* Animated gradient orbs */}
        <div className="absolute top-20 right-20 w-[500px] h-[500px] bg-purple-300 rounded-full filter blur-3xl opacity-25 animate-float-shapes"></div>
        <div className="absolute bottom-20 left-20 w-[400px] h-[400px] bg-pink-300 rounded-full filter blur-3xl opacity-25 animate-float-shapes" style={{ animationDelay: '3s' }}></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[350px] bg-purple-200 rounded-full filter blur-3xl opacity-20 animate-float-shapes" style={{ animationDelay: '1.5s' }}></div>
      </div>

      {/* Desktop Sidebar (lg+) */}
      <div className="relative z-10">
        <Sidebar role={role} userName={userName} onLogout={onLogout} />
      </div>

      {/* Main Body */}
      <div className="flex-1 flex flex-col min-w-0 relative z-10">
        {/* Top Header */}
        <header className="h-[var(--layout-topbar)] px-4 lg:px-8 border-b border-[var(--color-border)] glass-strong flex items-center justify-between sticky top-0 z-20 shadow-purple-md">
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
