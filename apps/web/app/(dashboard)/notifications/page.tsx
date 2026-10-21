"use client";

import React, { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { LoadingState } from "@/components/ui/LoadingState";
import { ErrorState } from "@/components/ui/ErrorState";
import { EmptyState } from "@/components/ui/EmptyState";
import {
  AuthService,
  NotificationsService,
  type NotificationItemResponse,
} from "@/lib/api";
import type { UserRole } from "@/lib/permissions";
import {
  Bell,
  CheckCheck,
  Check,
  Sparkles,
  Calendar,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  RotateCw,
  Clock,
  Filter,
} from "lucide-react";

function getNotificationTypeIcon(type: string) {
  switch (type.toLowerCase()) {
    case "agent":
      return <Sparkles className="w-4 h-4 text-[var(--color-accent)]" />;
    case "booking":
      return <Calendar className="w-4 h-4 text-[var(--color-info)]" />;
    case "milestone":
      return <CheckCircle2 className="w-4 h-4 text-[var(--color-success)]" />;
    case "system":
    default:
      return <Bell className="w-4 h-4 text-[var(--color-warning)]" />;
  }
}

function formatNotificationTime(isoString: string): string {
  try {
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return "Recently";

    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays}d ago`;

    return date.toLocaleDateString("en-PK", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "Recently";
  }
}

export default function NotificationsInboxPage() {
  const [role, setRole] = useState<UserRole>("entrepreneur");
  const [userName, setUserName] = useState<string>("User");
  const [items, setItems] = useState<NotificationItemResponse[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [filter, setFilter] = useState<"all" | "unread">("all");
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [isMarkingAll, setIsMarkingAll] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState<number>(0);
  const [page, setPage] = useState<number>(1);
  const pageSize = 20;

  // Load current user details to present appropriate AppShell role
  useEffect(() => {
    let ignore = false;
    AuthService.getMeApiV1AuthMeGet()
      .then((user) => {
        if (!ignore && user) {
          setRole(user.role as UserRole);
          setUserName(user.name);
        }
      })
      .catch(() => {
        // Silently default to entrepreneur if offline or mock
      });
    return () => {
      ignore = true;
    };
  }, []);

  // Fetch notifications list
  useEffect(() => {
    let ignore = false;

    NotificationsService.listNotificationsApiV1NotificationsGet({
      unreadOnly: filter === "unread",
      page,
      pageSize,
    })
      .then((res) => {
        if (!ignore) {
          setItems(res.items);
          setTotalCount(res.total);
          setUnreadCount(res.unread_count);
          setIsLoading(false);
          setIsRefreshing(false);
          setError(null);
        }
      })
      .catch((err: unknown) => {
        if (!ignore) {
          const msg =
            err instanceof Error
              ? err.message
              : "Failed to load notifications. Please try again.";
          setError(msg);
          setIsLoading(false);
          setIsRefreshing(false);
        }
      });

    return () => {
      ignore = true;
    };
  }, [filter, page, refreshKey]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setRefreshKey((k) => k + 1);
  };

  const handleMarkSingleRead = async (notificationId: number) => {
    try {
      await NotificationsService.markSingleNotificationReadApiV1NotificationsNotificationIdReadPatch({
        notificationId,
      });

      setItems((prev) =>
        prev.map((item) =>
          item.id === notificationId
            ? { ...item, is_read: true, read_at: new Date().toISOString() }
            : item
        )
      );
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch {
      // Ignore
    }
  };

  const handleMarkAllRead = async () => {
    if (unreadCount === 0 || isMarkingAll) return;
    setIsMarkingAll(true);

    try {
      await NotificationsService.markAllNotificationsReadApiV1NotificationsReadAllPost();
      setItems((prev) =>
        prev.map((item) => ({
          ...item,
          is_read: true,
          read_at: new Date().toISOString(),
        }))
      );
      setUnreadCount(0);
    } catch {
      // Ignore
    } finally {
      setIsMarkingAll(false);
    }
  };

  const visibleItems = useMemo(() => {
    if (filter === "unread") {
      return items.filter((n) => !n.is_read);
    }
    return items;
  }, [items, filter]);

  return (
    <AppShell role={role} userName={userName} pageTitle="Notifications">
      <div className="space-y-6 max-w-4xl mx-auto">
        {/* Header Control Bar */}
        <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 sm:p-6 shadow-[var(--shadow-sm)] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-[var(--radius-md)] bg-[var(--color-accent-subtle)] text-[var(--color-accent)]">
                <Bell className="w-5 h-5" />
              </div>
              <h2 className="text-lg font-bold text-[var(--color-fg)]">
                Notifications Inbox
              </h2>
            </div>
            <p className="text-xs text-[var(--color-fg-muted)] mt-1">
              Real-time in-app updates, agent completions, session bookings, and system alerts (PRD F-038).
            </p>
          </div>

          <div className="flex items-center gap-2.5 self-end sm:self-auto">
            <button
              type="button"
              onClick={handleRefresh}
              disabled={isRefreshing || isLoading}
              aria-label="Refresh notifications"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] hover:bg-[var(--color-surface-sunken)] text-xs font-medium text-[var(--color-fg)] transition-colors disabled:opacity-50 cursor-pointer shadow-[var(--shadow-sm)]"
              title="Refresh inbox"
            >
              <RotateCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
              Refresh
            </button>

            <button
              type="button"
              onClick={handleMarkAllRead}
              disabled={unreadCount === 0 || isMarkingAll}
              data-testid="mark-all-read-button"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[var(--radius-md)] bg-[var(--color-accent)] text-[var(--color-fg-inverse)] hover:bg-[var(--color-accent)]/90 text-xs font-semibold transition-colors disabled:opacity-50 cursor-pointer shadow-[var(--shadow-sm)]"
            >
              <CheckCheck className={`w-3.5 h-3.5 ${isMarkingAll ? "animate-pulse" : ""}`} />
              Mark all as read
            </button>
          </div>
        </div>

        {/* Filter Navigation Tabs */}
        <div className="flex items-center gap-2 border-b border-[var(--color-border)] pb-2">
          <button
            type="button"
            onClick={() => setFilter("all")}
            data-testid="filter-tab-all"
            className={`px-3 py-1.5 text-xs font-semibold rounded-[var(--radius-md)] transition-colors cursor-pointer flex items-center gap-1.5 ${
              filter === "all"
                ? "bg-[var(--color-accent-subtle)] text-[var(--color-accent)]"
                : "text-[var(--color-fg-muted)] hover:text-[var(--color-fg)] hover:bg-[var(--color-surface-hover)]"
            }`}
          >
            All
            <span className="text-2xs px-1.5 py-0.2 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-full">
              {totalCount}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setFilter("unread")}
            data-testid="filter-tab-unread"
            className={`px-3 py-1.5 text-xs font-semibold rounded-[var(--radius-md)] transition-colors cursor-pointer flex items-center gap-1.5 ${
              filter === "unread"
                ? "bg-[var(--color-accent-subtle)] text-[var(--color-accent)]"
                : "text-[var(--color-fg-muted)] hover:text-[var(--color-fg)] hover:bg-[var(--color-surface-hover)]"
            }`}
          >
            Unread
            {unreadCount > 0 && (
              <span className="text-2xs px-1.5 py-0.2 bg-[var(--color-danger)] text-white rounded-full font-bold">
                {unreadCount}
              </span>
            )}
          </button>
        </div>

        {/* Loading State */}
        {isLoading && (
          <LoadingState message="Loading notifications..." className="my-8" />
        )}

        {/* Error State */}
        {error && !isLoading && (
          <ErrorState
            title="Failed to load notifications"
            message={error}
            onRetry={handleRefresh}
            className="my-8"
          />
        )}

        {/* Empty State */}
        {!isLoading && !error && visibleItems.length === 0 && (
          <EmptyState
            title="You're all caught up!"
            description={
              filter === "unread"
                ? "You have no unread notifications at this time."
                : "No notifications found in your inbox."
            }
            icon={<Bell className="w-6 h-6 text-[var(--color-fg-subtle)]" />}
            className="my-8"
          />
        )}

        {/* Notification Cards List */}
        {!isLoading && !error && visibleItems.length > 0 && (
          <div className="space-y-3" data-testid="notifications-list">
            {visibleItems.map((item) => (
              <div
                key={item.id}
                data-testid={`notification-item-${item.id}`}
                className={`p-4 rounded-[var(--radius-lg)] border transition-all ${
                  item.is_read
                    ? "bg-[var(--color-surface)] border-[var(--color-border)] opacity-85"
                    : "bg-[var(--color-surface)] border-[var(--color-accent)] shadow-[var(--shadow-sm)]"
                }`}
              >
                <div className="flex items-start gap-3.5">
                  {/* Category Icon */}
                  <div className="p-2 rounded-[var(--radius-md)] bg-[var(--color-surface-sunken)] border border-[var(--color-border)] shrink-0 mt-0.5">
                    {getNotificationTypeIcon(item.type)}
                  </div>

                  {/* Body Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-bold text-[var(--color-fg)]">
                          {item.title}
                        </h3>
                        {!item.is_read && (
                          <span
                            data-testid="unread-dot"
                            className="w-2 h-2 rounded-full bg-[var(--color-accent)] inline-block"
                            title="Unread"
                          />
                        )}
                      </div>

                      <div className="flex items-center gap-1.5 text-2xs text-[var(--color-fg-subtle)]">
                        <Clock className="w-3 h-3" />
                        <time dateTime={item.created_at}>
                          {formatNotificationTime(item.created_at)}
                        </time>
                      </div>
                    </div>

                    <p className="text-xs text-[var(--color-fg-muted)] mt-1.5 leading-relaxed">
                      {item.message}
                    </p>

                    {/* Footer Actions */}
                    <div className="mt-3 flex items-center justify-between pt-2 border-t border-[var(--color-border-subtle)]">
                      <div className="flex items-center gap-2">
                        <span className="text-2xs font-medium uppercase tracking-wider text-[var(--color-fg-subtle)] bg-[var(--color-surface-sunken)] px-2 py-0.5 rounded-[var(--radius-sm)] border border-[var(--color-border)]">
                          {item.type}
                        </span>

                        {item.link && (
                          <Link
                            href={item.link}
                            className="inline-flex items-center gap-1 text-2xs font-semibold text-[var(--color-accent)] hover:underline"
                          >
                            View Details <ExternalLink className="w-2.5 h-2.5" />
                          </Link>
                        )}
                      </div>

                      {!item.is_read && (
                        <button
                          type="button"
                          onClick={() => handleMarkSingleRead(item.id)}
                          data-testid={`mark-read-btn-${item.id}`}
                          aria-label={`Mark ${item.title} as read`}
                          className="inline-flex items-center gap-1 text-2xs font-medium text-[var(--color-fg-muted)] hover:text-[var(--color-fg)] hover:underline cursor-pointer"
                        >
                          <Check className="w-3 h-3" />
                          Mark read
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
