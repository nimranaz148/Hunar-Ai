import React from "react";
import { cn } from "@/lib/utils";

export type StatusType =
  | "draft"
  | "not_submitted"
  | "pending"
  | "queued"
  | "submitted"
  | "in_progress"
  | "running"
  | "requested"
  | "approved"
  | "posted"
  | "accepted"
  | "active"
  | "completed"
  | "paid"
  | "succeeded"
  | "warning"
  | "partial"
  | "awaiting_approval"
  | "skipped"
  | "rejected"
  | "failed"
  | "cancelled"
  | "declined"
  | "inactive"
  | "suspended";

export type SemanticVariant = "neutral" | "info" | "success" | "warning" | "danger";

const STATUS_MAP: Record<string, SemanticVariant> = {
  // Neutral
  draft: "neutral",
  not_submitted: "neutral",
  pending: "neutral",
  queued: "neutral",

  // Info
  submitted: "info",
  submitting: "info",
  in_progress: "info",
  running: "info",
  requested: "info",

  // Success
  approved: "success",
  posted: "success",
  accepted: "success",
  reconciled: "success",
  active: "success",
  completed: "success",
  paid: "success",
  succeeded: "success",

  // Warning
  warning: "warning",
  partial: "warning",
  awaiting_approval: "warning",
  skipped: "warning",
  low_stock: "warning",

  // Danger
  rejected: "danger",
  failed: "danger",
  cancelled: "danger",
  declined: "danger",
  void: "danger",
  expired: "danger",
  inactive: "danger",
  suspended: "danger",
};

const VARIANT_CLASSES: Record<SemanticVariant, string> = {
  neutral: "bg-[var(--color-neutral-subtle)] text-[var(--color-neutral)] border-[var(--color-neutral-border)]",
  info: "bg-[var(--color-info-subtle)] text-[var(--color-info)] border-[var(--color-info-border)]",
  success: "bg-[var(--color-success-subtle)] text-[var(--color-success)] border-[var(--color-success-border)]",
  warning: "bg-[var(--color-warning-subtle)] text-[var(--color-warning)] border-[var(--color-warning-border)]",
  danger: "bg-[var(--color-danger-subtle)] text-[var(--color-danger)] border-[var(--color-danger-border)]",
};

export interface StatusBadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  status: string;
  variant?: SemanticVariant;
  label?: string;
}

export function StatusBadge({ status, variant, label, className, ...props }: StatusBadgeProps) {
  const normalizedKey = status.toLowerCase().replace(/[\s-]/g, "_");
  const semantic = variant || STATUS_MAP[normalizedKey] || "neutral";
  const displayLabel = label || status.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-0.5 rounded-[var(--radius-sm)] border text-[var(--text-2xs)] font-medium uppercase tracking-wide",
        VARIANT_CLASSES[semantic],
        className
      )}
      {...props}
    >
      <span className="w-1.5 h-1.5 rounded-full mr-1.5 bg-current opacity-80" />
      {displayLabel}
    </span>
  );
}
