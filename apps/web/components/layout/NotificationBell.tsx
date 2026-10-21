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
      className="relative inline-flex h-[var(--control-md)] w-[var(--control-md)] cursor-pointer items-center justify-center rounded-[var(--radius-md)] border-2 border-[var(--color-ink)] text-[var(--color-ink)] transition-colors hover:bg-[var(--color-marigold)]"
      title="Notifications"
    >
      <Bell className="w-5 h-5" />
      {unreadCount > 0 && (
        <span
          data-testid="notification-unread-badge"
          className="absolute -right-1.5 -top-1.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-[var(--color-magenta)] px-1 text-[10px] font-bold leading-none text-white"
        >
          {unreadCount > 99 ? "99+" : unreadCount}
        </span>
      )}
    </Link>
  );
}
