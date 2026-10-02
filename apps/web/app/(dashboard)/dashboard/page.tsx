import { AppShell } from "@/components/layout/AppShell";
import { EmptyState } from "@/components/ui/EmptyState";
import { Sparkles, ArrowRight } from "lucide-react";
import Link from "next/link";

export default function EntrepreneurDashboardPage() {
  return (
    <AppShell
      role="entrepreneur"
      userName="Ayesha Khan"
      pageTitle="Business Dashboard"
    >
      <div className="space-y-6">
        <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
          <h2 className="text-[var(--text-lg)] font-bold text-[var(--color-fg)]">
            Welcome to Hunar v2
          </h2>
          <p className="text-[var(--text-sm)] text-[var(--color-fg-muted)] mt-1">
            Let&apos;s turn your craft into a thriving home business.
          </p>
        </div>

        <EmptyState
          title="No business plan yet"
          description="You haven't created your launch plan yet. Start the AI onboarding to generate your validated business profile, pricing, and 30-day content calendar."
          icon={<Sparkles className="w-6 h-6 text-[var(--color-accent)]" />}
          action={
            <Link
              href="/onboarding"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-[var(--radius-md)] bg-[var(--color-accent)] text-[var(--color-fg-inverse)] text-[var(--text-sm)] font-semibold hover:bg-[var(--color-accent-hover)] transition-colors"
            >
              Start AI Onboarding
              <ArrowRight className="w-4 h-4" />
            </Link>
          }
        />
      </div>
    </AppShell>
  );
}
