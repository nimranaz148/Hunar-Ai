"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Bell } from "lucide-react";
import { NotificationsService } from "@/lib/api";

export function NotificationBell() {
  const [unreadCount, setUnreadCount] = useState<number>(0);

  useEffect(() => {
    let ignore = false;

    NotificationsService.getNotificationsUnreadCountApiV1NotificationsUnreadCountGet()
      .then((res) => {
        if (!ignore && res && typeof res.unread_count === "number") {
          setUnreadCount(res.unread_count);
        }
      })
      .catch(() => {
        // Silently ignore if unauthenticated or network error
      });

    return () => {
      ignore = true;
    };
  }, []);

  return (
    <Link
      href="/notifications"
      data-testid="notification-bell-link"
      aria-label={
        unreadCount > 0
          ? `${unreadCount} unread notifications`
          : "Notifications inbox"
      }
      className="relative p-2 rounded-[var(--radius-md)] text-[var(--color-fg-muted)] hover:text-[var(--color-fg)] hover:bg-[var(--color-surface-hover)] transition-colors inline-flex items-center justify-center cursor-pointer"
      title="Notifications"
    >
      <Bell className="w-5 h-5" />
      {unreadCount > 0 && (
        <span
          data-testid="notification-unread-badge"
          className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 bg-[var(--color-danger)] text-white text-[10px] font-bold rounded-full flex items-center justify-center leading-none shadow-[var(--shadow-xs)]"
        >
          {unreadCount > 99 ? "99+" : unreadCount}
        </span>
      )}
    </Link>
  );
}
