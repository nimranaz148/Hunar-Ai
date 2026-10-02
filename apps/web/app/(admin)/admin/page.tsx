import { AppShell } from "@/components/layout/AppShell";
import { Users, FileText, Sparkles, Settings } from "lucide-react";
import Link from "next/link";

export default function AdminDashboardPage() {
  const cards = [
    {
      title: "User Management",
      description: "Manage entrepreneurs, mentors, and administrators. Create accounts, change roles, and reset passwords.",
      href: "/admin/users",
      icon: <Users className="w-6 h-6 text-[var(--color-accent)]" />,
      action: "Manage Users",
    },
    {
      title: "Audit Log Viewer",
      description: "Immutable security audit log with actor tracking, before/after states, and CSV export.",
      href: "/admin/audit",
      icon: <FileText className="w-6 h-6 text-[var(--color-info)]" />,
      action: "View Logs",
    },
    {
      title: "Agent Explorer",
      description: "Inspect multi-agent workflow runs, live span timelines, token usage, and system performance.",
      href: "/admin/runs",
      icon: <Sparkles className="w-6 h-6 text-[var(--color-chart-3)]" />,
      action: "Explore Traces",
    },
    {
      title: "System Settings",
      description: "Configure concurrency quotas, per-user limits, and the emergency agent kill switch.",
      href: "/admin/settings",
      icon: <Settings className="w-6 h-6 text-[var(--color-neutral)]" />,
      action: "Edit Settings",
    },
  ];

  return (
    <AppShell
      role="super_admin"
      userName="Super Admin"
      pageTitle="Super Admin Portal"
    >
      <div className="space-y-6">
        <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
          <h2 className="text-[var(--text-lg)] font-bold text-[var(--color-fg)]">
            Administration & Oversight
          </h2>
          <p className="text-[var(--text-sm)] text-[var(--color-fg-muted)] mt-1">
            System administration, cohort monitoring, audit trails, and AI agent execution controls.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {cards.map((card) => (
            <div
              key={card.title}
              className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 flex flex-col justify-between hover:border-[var(--color-border-focus)] transition-colors shadow-[var(--shadow-sm)]"
            >
              <div>
                <div className="w-10 h-10 rounded-[var(--radius-md)] bg-[var(--color-canvas)] flex items-center justify-center mb-4">
                  {card.icon}
                </div>
                <h3 className="text-[var(--text-base)] font-bold text-[var(--color-fg)]">
                  {card.title}
                </h3>
                <p className="text-[var(--text-xs)] text-[var(--color-fg-muted)] mt-1.5 leading-relaxed">
                  {card.description}
                </p>
              </div>

              <div className="mt-5 pt-4 border-t border-[var(--color-border)]">
                <Link
                  href={card.href}
                  className="text-[var(--text-xs)] font-semibold text-[var(--color-accent)] hover:underline"
                >
                  {card.action} &rarr;
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
