"use client";

import React, { useEffect, useState, useMemo } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { LoadingState } from "@/components/ui/LoadingState";
import { EmptyState } from "@/components/ui/EmptyState";
import { AdminService, ApiError } from "@/lib/api";
import type { FeatureFlagResponse } from "@/lib/api";
import {
  Flag,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Search,
  ShieldCheck,
  Power,
  Info,
  Clock,
  Layers,
} from "lucide-react";

export default function FeatureFlagsPage() {
  const [flags, setFlags] = useState<FeatureFlagResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [updatingKey, setUpdatingKey] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  // Auto-dismiss toast
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  useEffect(() => {
    let ignore = false;

    AdminService.getAdminFeatureFlagsApiV1AdminFeatureFlagsGet()
      .then((data) => {
        if (!ignore) {
          setFlags(data);
          setIsLoading(false);
          setIsRefreshing(false);
        }
      })
      .catch(() => {
        if (!ignore) {
          setToast({
            message: "Failed to load feature flags. Please try again.",
            type: "error",
          });
          setIsLoading(false);
          setIsRefreshing(false);
        }
      });

    return () => {
      ignore = true;
    };
  }, [refreshKey]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setRefreshKey((k) => k + 1);
  };

  const handleToggle = async (flag: FeatureFlagResponse) => {
    const nextState = !flag.is_enabled;
    setUpdatingKey(flag.key);

    try {
      const updatedList = await AdminService.modifyAdminFeatureFlagsApiV1AdminFeatureFlagsPatch({
        requestBody: {
          flags: [{ key: flag.key, is_enabled: nextState }],
        },
      });
      setFlags(updatedList);
      setToast({
        message: `Flag "${flag.name}" is now ${nextState ? "Active" : "Inactive"}. Audit entry recorded.`,
        type: "success",
      });
    } catch (err: unknown) {
      let detailMsg = "Failed to update feature flag.";
      if (err instanceof ApiError && err.body && typeof err.body === "object" && "detail" in err.body) {
        detailMsg = String((err.body as { detail: string }).detail);
      }
      setToast({
        message: detailMsg,
        type: "error",
      });
    } finally {
      setUpdatingKey(null);
    }
  };

  const filteredFlags = useMemo(() => {
    return flags.filter((f) => {
      const matchesSearch =
        f.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        f.key.toLowerCase().includes(searchTerm.toLowerCase()) ||
        f.description.toLowerCase().includes(searchTerm.toLowerCase());

      if (!matchesSearch) return false;

      if (statusFilter === "active") return f.is_enabled;
      if (statusFilter === "inactive") return !f.is_enabled;
      return true;
    });
  }, [flags, searchTerm, statusFilter]);

  const activeCount = useMemo(() => flags.filter((f) => f.is_enabled).length, [flags]);
  const inactiveCount = flags.length - activeCount;

  return (
    <AppShell
      role="super_admin"
      userName="Super Admin"
      pageTitle="Feature Flags (F-036)"
      actions={
        <button
          onClick={handleRefresh}
          disabled={isRefreshing || isLoading}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-fg-muted)] hover:text-[var(--color-fg)] hover:bg-[var(--color-surface-hover)] transition-colors disabled:opacity-50"
          title="Refresh feature flags"
          aria-label="Refresh feature flags"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
          <span>Refresh</span>
        </button>
      }
    >
      <div className="space-y-6 max-w-6xl">
        {/* Toast Alert */}
        {toast && (
          <div
            role="alert"
            className={`flex items-center justify-between p-4 rounded-[var(--radius-md)] border transition-all animate-in fade-in slide-in-from-top-2 ${
              toast.type === "success"
                ? "bg-[var(--color-success-subtle)] border-[var(--color-success-border)] text-[var(--color-success)]"
                : "bg-[var(--color-danger-subtle)] border-[var(--color-danger-border)] text-[var(--color-danger)]"
            }`}
          >
            <div className="flex items-center gap-2">
              {toast.type === "success" ? (
                <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
              ) : (
                <AlertTriangle className="w-5 h-5 flex-shrink-0" />
              )}
              <span className="text-sm font-medium">{toast.message}</span>
            </div>
            <button
              onClick={() => setToast(null)}
              className="text-xs underline font-medium hover:opacity-80 ml-4"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Header & Subtitle */}
        <div>
          <h2 className="text-xl font-bold text-[var(--color-fg)] flex items-center gap-2">
            <Flag className="w-5 h-5 text-[var(--color-accent)]" />
            System Feature Flags
          </h2>
          <p className="text-sm text-[var(--color-fg-muted)] mt-1">
            Toggle platform capabilities and runtime integrations without redeploying. State changes write append-only audit rows immediately.
          </p>
        </div>

        {/* KPI Counter Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--shadow-sm)]">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-[var(--color-fg-muted)]">
                Total Feature Flags
              </span>
              <Layers className="w-4 h-4 text-[var(--color-fg-subtle)]" />
            </div>
            <p className="text-2xl font-bold text-[var(--color-fg)] mt-2">
              {flags.length}
            </p>
          </div>

          <div className="p-4 rounded-[var(--radius-lg)] border border-[var(--color-success-border)] bg-[var(--color-success-subtle)]/30 shadow-[var(--shadow-sm)]">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-[var(--color-success)]">
                Active Features
              </span>
              <Power className="w-4 h-4 text-[var(--color-success)]" />
            </div>
            <p className="text-2xl font-bold text-[var(--color-success)] mt-2">
              {activeCount}
            </p>
          </div>

          <div className="p-4 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface-sunken)] shadow-[var(--shadow-sm)]">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-[var(--color-fg-muted)]">
                Inactive / Disabled
              </span>
              <Power className="w-4 h-4 text-[var(--color-fg-subtle)]" />
            </div>
            <p className="text-2xl font-bold text-[var(--color-fg-muted)] mt-2">
              {inactiveCount}
            </p>
          </div>
        </div>

        {/* Controls: Search and Status Filters */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-[var(--color-fg-subtle)] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Search flags by name, key, or description..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-md)] text-[var(--color-fg)] placeholder:text-[var(--color-fg-subtle)] focus:outline-none focus:border-[var(--color-border-focus)] transition-colors"
            />
          </div>

          <div className="inline-flex rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-sunken)] p-1">
            <button
              onClick={() => setStatusFilter("all")}
              className={`px-3 py-1 text-xs font-medium rounded-[var(--radius-sm)] transition-colors ${
                statusFilter === "all"
                  ? "bg-[var(--color-surface)] text-[var(--color-fg)] shadow-[var(--shadow-xs)]"
                  : "text-[var(--color-fg-muted)] hover:text-[var(--color-fg)]"
              }`}
            >
              All ({flags.length})
            </button>
            <button
              onClick={() => setStatusFilter("active")}
              className={`px-3 py-1 text-xs font-medium rounded-[var(--radius-sm)] transition-colors ${
                statusFilter === "active"
                  ? "bg-[var(--color-surface)] text-[var(--color-success)] shadow-[var(--shadow-xs)]"
                  : "text-[var(--color-fg-muted)] hover:text-[var(--color-fg)]"
              }`}
            >
              Active ({activeCount})
            </button>
            <button
              onClick={() => setStatusFilter("inactive")}
              className={`px-3 py-1 text-xs font-medium rounded-[var(--radius-sm)] transition-colors ${
                statusFilter === "inactive"
                  ? "bg-[var(--color-surface)] text-[var(--color-fg)] shadow-[var(--shadow-xs)]"
                  : "text-[var(--color-fg-muted)] hover:text-[var(--color-fg)]"
              }`}
            >
              Inactive ({inactiveCount})
            </button>
          </div>
        </div>

        {/* Flag Cards List */}
        {isLoading ? (
          <div className="p-12">
            <LoadingState message="Loading feature flags configuration..." />
          </div>
        ) : filteredFlags.length === 0 ? (
          <div className="p-8 border border-dashed border-[var(--color-border)] rounded-[var(--radius-lg)] bg-[var(--color-surface)]">
            <EmptyState
              title="No feature flags match your search"
              description="Try adjusting your filter keyword or check back later."
              action={
                searchTerm ? (
                  <button
                    onClick={() => setSearchTerm("")}
                    className="px-3 py-1.5 text-xs font-medium rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] hover:bg-[var(--color-surface-hover)] transition-colors"
                  >
                    Clear Search
                  </button>
                ) : undefined
              }
            />
          </div>
        ) : (
          <div className="space-y-3">
            {filteredFlags.map((flag) => {
              const isUpdating = updatingKey === flag.key;
              return (
                <div
                  key={flag.key}
                  data-testid={`feature-flag-${flag.key}`}
                  className="p-5 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--shadow-xs)] hover:border-[var(--color-border-subtle)] transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="space-y-1.5 flex-1 pr-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-base font-bold text-[var(--color-fg)]">
                        {flag.name}
                      </h3>
                      <code className="px-2 py-0.5 text-xs font-mono bg-[var(--color-surface-sunken)] border border-[var(--color-border-subtle)] rounded text-[var(--color-fg-muted)]">
                        {flag.key}
                      </code>
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-2xs font-semibold uppercase tracking-wider ${
                          flag.is_enabled
                            ? "bg-[var(--color-success-subtle)] text-[var(--color-success)] border border-[var(--color-success-border)]"
                            : "bg-[var(--color-neutral-subtle)] text-[var(--color-neutral)] border border-[var(--color-border)]"
                        }`}
                      >
                        {flag.is_enabled ? "Active" : "Disabled"}
                      </span>
                    </div>

                    <p className="text-sm text-[var(--color-fg-muted)] leading-relaxed">
                      {flag.description}
                    </p>

                    <div className="flex flex-wrap items-center gap-4 text-2xs text-[var(--color-fg-subtle)] pt-1">
                      {flag.updated_at && (
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          Last modified: {new Date(flag.updated_at).toLocaleString()}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <ShieldCheck className="w-3 h-3" />
                        Super Admin audited
                      </span>
                    </div>
                  </div>

                  {/* Toggle Switch */}
                  <div className="flex items-center gap-3 md:self-center">
                    <button
                      type="button"
                      role="switch"
                      aria-checked={flag.is_enabled}
                      aria-label={`Toggle ${flag.name}`}
                      disabled={isUpdating}
                      onClick={() => void handleToggle(flag)}
                      className={`relative inline-flex h-7 w-13 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${
                        flag.is_enabled
                          ? "bg-[var(--color-success)]"
                          : "bg-[var(--color-border)]"
                      }`}
                    >
                      <span className="sr-only">Toggle {flag.name}</span>
                      <span
                        className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                          flag.is_enabled ? "translate-x-6" : "translate-x-0"
                        }`}
                      />
                    </button>
                    <span className="text-xs font-medium text-[var(--color-fg)] w-16">
                      {isUpdating ? (
                        <span className="inline-flex items-center gap-1 text-[var(--color-fg-subtle)]">
                          <RefreshCw className="w-3 h-3 animate-spin" />
                          Saving
                        </span>
                      ) : flag.is_enabled ? (
                        <span className="text-[var(--color-success)] font-semibold">Enabled</span>
                      ) : (
                        <span className="text-[var(--color-fg-muted)]">Disabled</span>
                      )}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Information Callout */}
        <div className="p-4 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface-sunken)] flex items-start gap-3">
          <Info className="w-5 h-5 text-[var(--color-accent)] flex-shrink-0 mt-0.5" />
          <div className="text-xs text-[var(--color-fg-muted)] space-y-1">
            <p className="font-semibold text-[var(--color-fg)]">
              Operational Safety Guidelines (PRD §14.1)
            </p>
            <p>
              Disabling core capabilities like <code>weekly_coach_agent</code> or <code>mentor_marketplace</code> will immediately prevent client requests from triggering those workflows. All changes are logged to the append-only audit trail with the administrator identity and timestamp.
            </p>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
