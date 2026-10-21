"use client";

import React, { useState } from "react";
import {
  Calendar,
  DollarSign,
  TrendingUp,
  MessageCircle,
  ShoppingBag,
  Eye,
  Heart,
  Share2,
  Bookmark,
  Users,
  X,
  Loader2,
  AlertCircle,
  Layers,
} from "lucide-react";
import {
  MetricsService,
  MetricsSnapshotCreate,
  MetricsSnapshotResponse,
  ApiError,
} from "@/lib/api";

function InstagramIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
    </svg>
  );
}

function FacebookIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
    </svg>
  );
}

export interface MetricsEntryModalProps {
  isOpen: boolean;
  businessId: string;
  recentContentItems?: Array<{
    id: string;
    day: number;
    format: string;
    hook: string;
  }>;
  onClose: () => void;
  onSuccess: (newSnapshot: MetricsSnapshotResponse) => void;
}

export function MetricsEntryModal({
  isOpen,
  businessId,
  recentContentItems = [],
  onClose,
  onSuccess,
}: MetricsEntryModalProps): React.ReactElement | null {
  const todayStr = new Date().toISOString().split("T")[0];

  const [platform, setPlatform] = useState<"instagram" | "facebook">("instagram");
  const [periodStart, setPeriodStart] = useState<string>(todayStr);
  const [periodEnd, setPeriodEnd] = useState<string>(todayStr);
  const [contentItemId, setContentItemId] = useState<string>("");

  // Engagement
  const [views, setViews] = useState<string>("0");
  const [reach, setReach] = useState<string>("0");
  const [likes, setLikes] = useState<string>("0");
  const [comments, setComments] = useState<string>("0");
  const [shares, setShares] = useState<string>("0");
  const [saves, setSaves] = useState<string>("0");

  // Conversion & Growth
  const [followerDelta, setFollowerDelta] = useState<string>("0");
  const [inquiries, setInquiries] = useState<string>("0");
  const [orders, setOrders] = useState<string>("0");
  const [revenuePkr, setRevenuePkr] = useState<string>("0");

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    // Validate date order
    if (periodEnd < periodStart) {
      setErrorMessage("End date cannot be earlier than start date.");
      return;
    }

    const payload: MetricsSnapshotCreate = {
      platform,
      period_start: periodStart,
      period_end: periodEnd,
      content_item_id: contentItemId ? contentItemId : null,
      views: Math.max(0, parseInt(views || "0", 10) || 0),
      reach: Math.max(0, parseInt(reach || "0", 10) || 0),
      likes: Math.max(0, parseInt(likes || "0", 10) || 0),
      comments: Math.max(0, parseInt(comments || "0", 10) || 0),
      shares: Math.max(0, parseInt(shares || "0", 10) || 0),
      saves: Math.max(0, parseInt(saves || "0", 10) || 0),
      follower_delta: parseInt(followerDelta || "0", 10) || 0,
      inquiries: Math.max(0, parseInt(inquiries || "0", 10) || 0),
      orders: Math.max(0, parseInt(orders || "0", 10) || 0),
      revenue_pkr: Math.max(0, parseInt(revenuePkr || "0", 10) || 0),
    };

    setIsSubmitting(true);
    try {
      const res = await MetricsService.logMetricsSnapshotApiV1BusinessesBusinessIdMetricsPost({
        businessId,
        requestBody: payload,
      });
      onSuccess(res);
      onClose();
    } catch (err) {
      const apiErr = err as ApiError;
      const detail =
        (apiErr.body as { detail?: string })?.detail ||
        apiErr.message ||
        "Failed to log metrics snapshot. Please check inputs and try again.";
      setErrorMessage(detail);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="metrics-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 animate-in fade-in duration-200"
    >
      <div className="relative w-full max-w-2xl bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-lg)] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-[var(--color-border)]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-[var(--color-accent-subtle)] text-[var(--color-accent)] flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
            <div>
              <h3
                id="metrics-modal-title"
                className="font-bold text-base text-[var(--color-fg)] leading-tight"
              >
                Log Performance Metrics
              </h3>
              <p className="text-xs text-[var(--color-fg-muted)]">
                F-015 Manual Marketing &amp; Sales Snapshot
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            aria-label="Close modal"
            className="p-1 rounded-md text-[var(--color-fg-subtle)] hover:text-[var(--color-fg)] hover:bg-[var(--color-surface-hover)] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="overflow-y-auto p-5 space-y-5">
          {errorMessage && (
            <div
              role="alert"
              className="p-3 rounded-[var(--radius-md)] bg-[var(--color-danger-subtle)] border border-[var(--color-danger-border)] text-xs text-[var(--color-danger)] flex items-start gap-2 animate-in fade-in"
            >
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Platform Selector Tabs */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-[var(--color-fg)] uppercase tracking-wider block">
              Channel / Platform *
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setPlatform("instagram")}
                className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-[var(--radius-md)] border text-xs font-semibold transition-all cursor-pointer ${
                  platform === "instagram"
                    ? "bg-pink-500/10 border-pink-500 text-pink-600 dark:text-pink-400 shadow-xs"
                    : "border-[var(--color-border)] text-[var(--color-fg-muted)] hover:bg-[var(--color-surface-hover)]"
                }`}
              >
                <InstagramIcon className="w-4 h-4 text-pink-600" />
                <span>Instagram</span>
              </button>

              <button
                type="button"
                onClick={() => setPlatform("facebook")}
                className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-[var(--radius-md)] border text-xs font-semibold transition-all cursor-pointer ${
                  platform === "facebook"
                    ? "bg-blue-500/10 border-blue-500 text-blue-600 dark:text-blue-400 shadow-xs"
                    : "border-[var(--color-border)] text-[var(--color-fg-muted)] hover:bg-[var(--color-surface-hover)]"
                }`}
              >
                <FacebookIcon className="w-4 h-4 text-blue-600" />
                <span>Facebook</span>
              </button>
            </div>
          </div>

          {/* Date Range Fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label
                htmlFor="period-start"
                className="text-xs font-semibold text-[var(--color-fg)] flex items-center gap-1"
              >
                <Calendar className="w-3.5 h-3.5 text-[var(--color-accent)]" />
                <span>Period Start *</span>
              </label>
              <input
                id="period-start"
                type="date"
                required
                value={periodStart}
                onChange={(e) => setPeriodStart(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-canvas)] text-[var(--color-fg)] focus:outline-hidden focus:border-[var(--color-accent)] transition-all"
              />
            </div>

            <div className="space-y-1">
              <label
                htmlFor="period-end"
                className="text-xs font-semibold text-[var(--color-fg)] flex items-center gap-1"
              >
                <Calendar className="w-3.5 h-3.5 text-[var(--color-accent)]" />
                <span>Period End *</span>
              </label>
              <input
                id="period-end"
                type="date"
                required
                value={periodEnd}
                onChange={(e) => setPeriodEnd(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-canvas)] text-[var(--color-fg)] focus:outline-hidden focus:border-[var(--color-accent)] transition-all"
              />
            </div>
          </div>

          {/* Optional Post Linkage */}
          {recentContentItems.length > 0 && (
            <div className="space-y-1">
              <label
                htmlFor="content-item-select"
                className="text-xs font-semibold text-[var(--color-fg)] flex items-center gap-1"
              >
                <Layers className="w-3.5 h-3.5 text-[var(--color-fg-muted)]" />
                <span>Link to Specific Post (Optional)</span>
              </label>
              <select
                id="content-item-select"
                value={contentItemId}
                onChange={(e) => setContentItemId(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-canvas)] text-[var(--color-fg)] focus:outline-hidden focus:border-[var(--color-accent)] transition-all"
              >
                <option value="">Channel-level (Overall account performance)</option>
                {recentContentItems.map((item) => (
                  <option key={item.id} value={item.id}>
                    Day {item.day} [{item.format.toUpperCase()}]: {item.hook.slice(0, 50)}...
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Section 1: Audience & Engagement */}
          <div className="space-y-2 pt-1 border-t border-[var(--color-border)]">
            <h4 className="text-xs font-bold text-[var(--color-fg)] uppercase tracking-wider flex items-center gap-1.5">
              <Eye className="w-3.5 h-3.5 text-[var(--color-accent)]" />
              <span>Engagement Metrics</span>
            </h4>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              <div className="space-y-1">
                <label htmlFor="input-views" className="text-[11px] font-medium text-[var(--color-fg-muted)]">
                  Views / Impressions
                </label>
                <input
                  id="input-views"
                  type="number"
                  min="0"
                  value={views}
                  onChange={(e) => setViews(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-canvas)] text-[var(--color-fg)] font-mono"
                />
              </div>

              <div className="space-y-1">
                <label htmlFor="input-reach" className="text-[11px] font-medium text-[var(--color-fg-muted)]">
                  Reach (Accounts)
                </label>
                <input
                  id="input-reach"
                  type="number"
                  min="0"
                  value={reach}
                  onChange={(e) => setReach(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-canvas)] text-[var(--color-fg)] font-mono"
                />
              </div>

              <div className="space-y-1">
                <label htmlFor="input-likes" className="text-[11px] font-medium text-[var(--color-fg-muted)] flex items-center gap-1">
                  <Heart className="w-2.5 h-2.5 text-red-500 fill-red-500" />
                  <span>Likes</span>
                </label>
                <input
                  id="input-likes"
                  type="number"
                  min="0"
                  value={likes}
                  onChange={(e) => setLikes(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-canvas)] text-[var(--color-fg)] font-mono"
                />
              </div>

              <div className="space-y-1">
                <label htmlFor="input-comments" className="text-[11px] font-medium text-[var(--color-fg-muted)]">
                  Comments
                </label>
                <input
                  id="input-comments"
                  type="number"
                  min="0"
                  value={comments}
                  onChange={(e) => setComments(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-canvas)] text-[var(--color-fg)] font-mono"
                />
              </div>

              <div className="space-y-1">
                <label htmlFor="input-shares" className="text-[11px] font-medium text-[var(--color-fg-muted)] flex items-center gap-1">
                  <Share2 className="w-2.5 h-2.5 text-blue-500" />
                  <span>Shares</span>
                </label>
                <input
                  id="input-shares"
                  type="number"
                  min="0"
                  value={shares}
                  onChange={(e) => setShares(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-canvas)] text-[var(--color-fg)] font-mono"
                />
              </div>

              <div className="space-y-1">
                <label htmlFor="input-saves" className="text-[11px] font-medium text-[var(--color-fg-muted)] flex items-center gap-1">
                  <Bookmark className="w-2.5 h-2.5 text-amber-500" />
                  <span>Saves</span>
                </label>
                <input
                  id="input-saves"
                  type="number"
                  min="0"
                  value={saves}
                  onChange={(e) => setSaves(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-canvas)] text-[var(--color-fg)] font-mono"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Conversions, Sales & Audience Growth */}
          <div className="space-y-2 pt-1 border-t border-[var(--color-border)]">
            <h4 className="text-xs font-bold text-[var(--color-fg)] uppercase tracking-wider flex items-center gap-1.5">
              <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
              <span>Sales &amp; Business Conversions</span>
            </h4>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <div className="space-y-1">
                <label htmlFor="input-follower-delta" className="text-[11px] font-medium text-[var(--color-fg-muted)] flex items-center gap-1">
                  <Users className="w-2.5 h-2.5 text-[var(--color-accent)]" />
                  <span>Follower +/-</span>
                </label>
                <input
                  id="input-follower-delta"
                  type="number"
                  value={followerDelta}
                  onChange={(e) => setFollowerDelta(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-canvas)] text-[var(--color-fg)] font-mono"
                  placeholder="+/- 0"
                />
              </div>

              <div className="space-y-1">
                <label htmlFor="input-inquiries" className="text-[11px] font-medium text-[var(--color-fg-muted)] flex items-center gap-1">
                  <MessageCircle className="w-2.5 h-2.5 text-indigo-500" />
                  <span>DMs / Inquiries</span>
                </label>
                <input
                  id="input-inquiries"
                  type="number"
                  min="0"
                  value={inquiries}
                  onChange={(e) => setInquiries(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-canvas)] text-[var(--color-fg)] font-mono"
                />
              </div>

              <div className="space-y-1">
                <label htmlFor="input-orders" className="text-[11px] font-medium text-[var(--color-fg-muted)] flex items-center gap-1">
                  <ShoppingBag className="w-2.5 h-2.5 text-emerald-600" />
                  <span>Orders</span>
                </label>
                <input
                  id="input-orders"
                  type="number"
                  min="0"
                  value={orders}
                  onChange={(e) => setOrders(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-canvas)] text-[var(--color-fg)] font-mono"
                />
              </div>

              <div className="space-y-1">
                <label htmlFor="input-revenue" className="text-[11px] font-medium text-[var(--color-fg-muted)]">
                  Revenue (PKR)
                </label>
                <input
                  id="input-revenue"
                  type="number"
                  min="0"
                  value={revenuePkr}
                  onChange={(e) => setRevenuePkr(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-canvas)] text-[var(--color-fg)] font-mono font-bold"
                />
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-4 border-t border-[var(--color-border)] flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-semibold rounded-[var(--radius-md)] text-[var(--color-fg-muted)] hover:text-[var(--color-fg)] hover:bg-[var(--color-surface-hover)] border border-[var(--color-border)] transition-colors cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-[var(--radius-md)] bg-[var(--color-accent)] text-[var(--color-fg-inverse)] hover:bg-[var(--color-accent-hover)] transition-all shadow-xs disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Saving Metrics...</span>
                </>
              ) : (
                <>
                  <TrendingUp className="w-3.5 h-3.5" />
                  <span>Save Metrics Snapshot</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
