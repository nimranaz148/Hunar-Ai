"use client";

import React, { useEffect, useState, useMemo } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { FormField } from "@/components/ui/FormField";
import { formatDate } from "@/lib/format";
import {
  AdminService,
  ApiError,
  type PendingMentorApplicationItem,
} from "@/lib/api";
import {
  Search,
  CheckCircle,
  XCircle,
  Clock,
  MapPin,
  Tag,
  AlertTriangle,
  RefreshCw,
  X,
  Send,
} from "lucide-react";

export default function MentorApprovalsPage() {
  const [applications, setApplications] = useState<PendingMentorApplicationItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState("");
  const [nicheFilter, setNicheFilter] = useState("");

  // Decline Modal
  const [declineTarget, setDeclineTarget] = useState<PendingMentorApplicationItem | null>(null);
  const [declineReason, setDeclineReason] = useState("");
  const [isSubmittingDecline, setIsSubmittingDecline] = useState(false);

  // Approving state (tracking which item is being approved)
  const [approvingId, setApprovingId] = useState<string | null>(null);

  const [refreshKey, setRefreshKey] = useState(0);
  const triggerRefresh = () => {
    setIsLoading(true);
    setRefreshKey((k) => k + 1);
  };

  useEffect(() => {
    let ignore = false;

    AdminService.getPendingMentorApplicationsApiV1AdminMentorsPendingGet()
      .then((data) => {
        if (!ignore) {
          setApplications(data);
          setError(null);
          setIsLoading(false);
        }
      })
      .catch((err: unknown) => {
        if (!ignore) {
          if (err instanceof ApiError) {
            setError(err.message || "Failed to load pending mentor applications.");
          } else {
            setError("Unable to connect to the administration service.");
          }
          setIsLoading(false);
        }
      });

    return () => {
      ignore = true;
    };
  }, [refreshKey]);

  // Derived filtered items
  const filteredApplications = useMemo(() => {
    return applications.filter((app) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        app.name.toLowerCase().includes(q) ||
        app.email.toLowerCase().includes(q) ||
        (app.city && app.city.toLowerCase().includes(q)) ||
        (app.bio && app.bio.toLowerCase().includes(q)) ||
        app.niches.some((n) => n.toLowerCase().includes(q));

      const matchesNiche =
        !nicheFilter ||
        app.niches.some((n) => n.toLowerCase() === nicheFilter.toLowerCase());

      return matchesSearch && matchesNiche;
    });
  }, [applications, searchQuery, nicheFilter]);

  // All unique niches for dropdown filter
  const allNiches = useMemo(() => {
    const set = new Set<string>();
    applications.forEach((a) => a.niches.forEach((n) => set.add(n)));
    return Array.from(set).sort();
  }, [applications]);

  // 1-Click Approve Handler
  const handleApprove = async (app: PendingMentorApplicationItem) => {
    setApprovingId(app.id);
    setActionSuccess(null);
    setError(null);
    try {
      const res = await AdminService.approveMentorApplicationApiV1AdminMentorsMentorIdApprovePost({
        mentorId: app.id,
      });
      setActionSuccess(res.message || `Mentor "${app.name}" approved successfully.`);
      triggerRefresh();
    } catch (err: unknown) {
      if (err instanceof ApiError && err.body && typeof err.body === "object" && "detail" in err.body) {
        setError(String((err.body as { detail: string }).detail));
      } else {
        setError(`Failed to approve mentor "${app.name}".`);
      }
    } finally {
      setApprovingId(null);
    }
  };

  // Submit Decline
  const handleConfirmDecline = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!declineTarget) return;

    setIsSubmittingDecline(true);
    setError(null);
    try {
      const res = await AdminService.declineMentorApplicationApiV1AdminMentorsMentorIdDeclinePost({
        mentorId: declineTarget.id,
        reason: declineReason.trim() || undefined,
      });
      setActionSuccess(res.message || `Application for "${declineTarget.name}" has been declined.`);
      setDeclineTarget(null);
      setDeclineReason("");
      triggerRefresh();
    } catch (err: unknown) {
      if (err instanceof ApiError && err.body && typeof err.body === "object" && "detail" in err.body) {
        setError(String((err.body as { detail: string }).detail));
      } else {
        setError(`Failed to decline mentor application.`);
      }
    } finally {
      setIsSubmittingDecline(false);
    }
  };

  return (
    <AppShell
      role="super_admin"
      userName="Super Admin"
      pageTitle="Mentor Approvals"
      actions={
        <button
          onClick={triggerRefresh}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[var(--text-xs)] font-medium text-[var(--color-fg)] bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-md)] hover:bg-[var(--color-canvas)] transition-colors"
          title="Refresh Applications"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Refresh
        </button>
      }
    >
      <div className="space-y-6">
        {/* Header Banner */}
        <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-[var(--shadow-sm)]">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-[var(--text-xl)] font-bold text-[var(--color-fg)]">
                Pending Mentor Applications
              </h2>
              <p className="text-[var(--text-sm)] text-[var(--color-fg-muted)] mt-1">
                Review and approve expert mentors to unlock their public profile and pro panel (W-006).
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="px-3 py-2 bg-[var(--color-canvas)] border border-[var(--color-border)] rounded-[var(--radius-md)] text-center">
                <span className="block text-[var(--text-xs)] text-[var(--color-fg-muted)]">Pending</span>
                <span className="text-[var(--text-lg)] font-bold text-[var(--color-accent)]">
                  {applications.length}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Feedback Alerts */}
        {actionSuccess && (
          <div className="p-4 rounded-[var(--radius-md)] bg-[var(--color-success-subtle)] border border-[var(--color-success)] text-[var(--color-success-fg)] text-[var(--text-sm)] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 flex-shrink-0" />
              <span>{actionSuccess}</span>
            </div>
            <button
              onClick={() => setActionSuccess(null)}
              className="text-[var(--color-success-fg)] hover:opacity-80"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {error && (
          <div className="p-4 rounded-[var(--radius-md)] bg-[var(--color-danger-subtle)] border border-[var(--color-danger)] text-[var(--color-danger-fg)] text-[var(--text-sm)] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 flex-shrink-0" />
              <span>{error}</span>
            </div>
            <button
              onClick={() => setError(null)}
              className="text-[var(--color-danger-fg)] hover:opacity-80"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Filters and Search Bar */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-fg-subtle)]" />
            <input
              type="text"
              placeholder="Search by name, email, niche, or city..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-[var(--text-sm)] bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-md)] focus:outline-none focus:border-[var(--color-border-focus)] text-[var(--color-fg)]"
            />
          </div>

          {allNiches.length > 0 && (
            <select
              value={nicheFilter}
              onChange={(e) => setNicheFilter(e.target.value)}
              className="px-3 py-2 text-[var(--text-sm)] bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-md)] focus:outline-none focus:border-[var(--color-border-focus)] text-[var(--color-fg)]"
            >
              <option value="">All Niches</option>
              {allNiches.map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Loading State */}
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-32 rounded-[var(--radius-lg)] bg-[var(--color-surface)] border border-[var(--color-border)] animate-pulse"
              />
            ))}
          </div>
        ) : filteredApplications.length === 0 ? (
          /* Empty State */
          <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-12 text-center">
            <div className="w-12 h-12 rounded-full bg-[var(--color-canvas)] text-[var(--color-fg-muted)] mx-auto flex items-center justify-center mb-4">
              <CheckCircle className="w-6 h-6 text-[var(--color-success)]" />
            </div>
            <h3 className="text-[var(--text-base)] font-bold text-[var(--color-fg)]">
              No Pending Applications
            </h3>
            <p className="text-[var(--text-sm)] text-[var(--color-fg-muted)] mt-1 max-w-sm mx-auto">
              {searchQuery || nicheFilter
                ? "No applications matched your search criteria."
                : "All mentor registration applications have been reviewed and approved."}
            </p>
          </div>
        ) : (
          /* List of Applications */
          <div className="space-y-4">
            {filteredApplications.map((app) => (
              <div
                key={app.id}
                className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-[var(--shadow-sm)] hover:border-[var(--color-border-focus)] transition-colors"
              >
                <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                  {/* Left info column */}
                  <div className="space-y-3 flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-[var(--text-base)] font-bold text-[var(--color-fg)]">
                        {app.name}
                      </h3>
                      <StatusBadge status={app.mentor_status} />
                      <span className="text-[var(--text-xs)] text-[var(--color-fg-muted)] flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        Applied {formatDate(app.created_at)}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-4 text-[var(--text-xs)] text-[var(--color-fg-muted)]">
                      <span>{app.email}</span>
                      {app.city && (
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {app.city}
                        </span>
                      )}
                    </div>

                    {app.bio && (
                      <p className="text-[var(--text-sm)] text-[var(--color-fg)] leading-relaxed line-clamp-3">
                        {app.bio}
                      </p>
                    )}

                    {/* Niches and Languages */}
                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      {app.niches.map((niche) => (
                        <span
                          key={niche}
                          className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-[var(--radius-full)] text-[var(--text-2xs)] font-medium bg-[var(--color-accent-subtle)] text-[var(--color-accent)]"
                        >
                          <Tag className="w-3 h-3" />
                          {niche}
                        </span>
                      ))}

                      {app.languages.length > 0 && (
                        <span className="text-[var(--text-2xs)] text-[var(--color-fg-subtle)] ml-2">
                          Speaks: {app.languages.join(", ")}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Right Action buttons */}
                  <div className="flex sm:flex-row lg:flex-col items-stretch gap-2 shrink-0 pt-2 lg:pt-0">
                    <button
                      onClick={() => handleApprove(app)}
                      disabled={approvingId === app.id}
                      className="inline-flex items-center justify-center gap-1.5 px-4 py-2 text-[var(--text-xs)] font-semibold text-[var(--color-fg-inverse)] bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] rounded-[var(--radius-md)] transition-colors disabled:opacity-50 shadow-[var(--shadow-sm)]"
                    >
                      <CheckCircle className="w-4 h-4" />
                      {approvingId === app.id ? "Approving..." : "Approve Application"}
                    </button>

                    <button
                      onClick={() => {
                        setDeclineTarget(app);
                        setDeclineReason("");
                      }}
                      disabled={approvingId === app.id}
                      className="inline-flex items-center justify-center gap-1.5 px-4 py-2 text-[var(--text-xs)] font-semibold text-[var(--color-danger-fg)] bg-[var(--color-surface)] border border-[var(--color-danger)] hover:bg-[var(--color-danger-subtle)] rounded-[var(--radius-md)] transition-colors disabled:opacity-50"
                    >
                      <XCircle className="w-4 h-4" />
                      Decline
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Decline Reason Modal */}
        {declineTarget && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-md bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-lg)] p-6 shadow-xl">
              <div className="flex items-center justify-between pb-3 border-b border-[var(--color-border)]">
                <h3 className="text-[var(--text-base)] font-bold text-[var(--color-fg)]">
                  Decline Mentor Application
                </h3>
                <button
                  onClick={() => setDeclineTarget(null)}
                  className="text-[var(--color-fg-muted)] hover:text-[var(--color-fg)]"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleConfirmDecline} className="mt-4 space-y-4">
                <p className="text-[var(--text-sm)] text-[var(--color-fg-muted)]">
                  Are you sure you want to decline the mentor application for{" "}
                  <strong className="text-[var(--color-fg)]">{declineTarget.name}</strong>?
                  They will be able to update and resubmit their application.
                </p>

                <FormField
                  label="Decline Reason (Optional)"
                  name="decline_reason"
                  hint="Provide feedback to help the applicant understand what is missing"
                >
                  <textarea
                    id="decline-reason"
                    rows={3}
                    value={declineReason}
                    onChange={(e) => setDeclineReason(e.target.value)}
                    placeholder="e.g. Please provide more details on your industry experience or complete your profile bio."
                    className="w-full p-2.5 text-[var(--text-sm)] bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-md)] focus:outline-none focus:border-[var(--color-border-focus)] text-[var(--color-fg)]"
                  />
                </FormField>

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-[var(--color-border)]">
                  <button
                    type="button"
                    onClick={() => setDeclineTarget(null)}
                    className="px-4 py-2 text-[var(--text-xs)] font-medium text-[var(--color-fg)] bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-md)] hover:bg-[var(--color-canvas)]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingDecline}
                    className="inline-flex items-center gap-1.5 px-4 py-2 text-[var(--text-xs)] font-semibold text-white bg-[var(--color-danger)] hover:opacity-90 rounded-[var(--radius-md)] disabled:opacity-50"
                  >
                    <Send className="w-3.5 h-3.5" />
                    {isSubmittingDecline ? "Declining..." : "Confirm Decline"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
