"use client";

import React from "react";
import Link from "next/link";
import { AlertTriangle, Clock, ArrowRight, ShieldCheck, Mail } from "lucide-react";
import type { StalledBusinessItem } from "@/lib/api";

export interface StalledPreviewCardProps {
  stalledItems: StalledBusinessItem[];
  totalStalledCount: number;
}

export function StalledPreviewCard({
  stalledItems,
  totalStalledCount,
}: StalledPreviewCardProps) {
  return (
    <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-[var(--shadow-sm)] flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between border-b border-[var(--color-border-subtle)] pb-4 mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-[var(--radius-md)] bg-[var(--color-warning-subtle)] text-[var(--color-warning)] flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[var(--color-fg)]">
                Stalled Businesses
              </h3>
              <p className="text-xs text-[var(--color-fg-muted)]">
                Entrepreneurs needing coach check-in or intervention
              </p>
            </div>
          </div>
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-[var(--color-warning-subtle)] text-[var(--color-warning)]">
            {totalStalledCount} flagged
          </span>
        </div>

        {stalledItems.length === 0 ? (
          <div className="py-8 text-center space-y-2">
            <div className="w-10 h-10 rounded-full bg-[var(--color-success-subtle)] text-[var(--color-success)] flex items-center justify-center mx-auto">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <p className="text-sm font-semibold text-[var(--color-fg)]">
              All entrepreneurs on track!
            </p>
            <p className="text-xs text-[var(--color-fg-muted)] max-w-xs mx-auto">
              No businesses in this cohort currently exceed inactivity thresholds.
            </p>
          </div>
        ) : (
          <div className="space-y-3" role="list" aria-label="Stalled businesses list">
            {stalledItems.map((item) => (
              <div
                key={item.business_id}
                role="listitem"
                className="p-3.5 rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-sunken)] hover:border-[var(--color-border)] transition-colors"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h4 className="text-sm font-bold text-[var(--color-fg)] leading-tight">
                      {item.business_name}
                    </h4>
                    <p className="text-xs text-[var(--color-fg-muted)] mt-0.5 flex items-center gap-1.5">
                      <span>{item.owner_name}</span>
                      {item.program_name && (
                        <>
                          <span>•</span>
                          <span className="text-[var(--color-fg-subtle)]">{item.program_name}</span>
                        </>
                      )}
                    </p>
                  </div>
                  {item.days_since_last_post !== null && item.days_since_last_post !== undefined && (
                    <span className="text-2xs font-semibold text-[var(--color-fg-subtle)] bg-[var(--color-surface)] px-2 py-0.5 rounded border border-[var(--color-border-subtle)] flex items-center gap-1 shrink-0">
                      <Clock className="w-2.5 h-2.5" />
                      {item.days_since_last_post}d idle
                    </span>
                  )}
                </div>

                <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                  {item.reason.split(" · ").map((tag, i) => (
                    <span
                      key={i}
                      className="inline-flex items-center text-2xs font-medium px-2 py-0.5 rounded bg-[var(--color-danger-subtle)] text-[var(--color-danger)]"
                    >
                      {tag}
                    </span>
                  ))}
                  {Boolean(item.overdue_task_count && item.overdue_task_count > 0) && (
                    <span className="inline-flex items-center text-2xs font-medium px-2 py-0.5 rounded bg-[var(--color-warning-subtle)] text-[var(--color-warning)]">
                      {item.overdue_task_count} overdue
                    </span>
                  )}
                </div>

                <div className="mt-2.5 pt-2 border-t border-[var(--color-border-subtle)] flex items-center justify-between text-2xs">
                  <span className="text-[var(--color-fg-subtle)] flex items-center gap-1">
                    <Mail className="w-2.5 h-2.5" />
                    {item.owner_email}
                  </span>
                  <Link
                    href={`/admin/users?search=${encodeURIComponent(item.owner_email)}`}
                    className="font-medium text-[var(--color-accent)] hover:underline"
                  >
                    View User &rarr;
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="mt-5 pt-4 border-t border-[var(--color-border-subtle)] flex items-center justify-between">
        <span className="text-xs text-[var(--color-fg-muted)]">
          {totalStalledCount > 5 ? `Showing top 5 of ${totalStalledCount} businesses` : `Showing ${stalledItems.length} businesses`}
        </span>
        <Link
          href="/admin/cohort/stalled"
          className="text-xs font-bold text-[var(--color-accent)] hover:underline inline-flex items-center gap-1"
        >
          <span>View Stalled List</span>
          <ArrowRight className="w-3 h-3" />
        </Link>
      </div>
    </div>
  );
}
