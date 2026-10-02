import React from "react";
import { FolderOpen } from "lucide-react";
import { cn } from "@/lib/utils";

export interface EmptyStateProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
  description?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
}

export function EmptyState({
  title = "No data found",
  description = "There are no records matching your criteria or currently available.",
  icon,
  action,
  className,
  ...props
}: EmptyStateProps) {
  return (
    <div
      role="region"
      aria-label={title}
      className={cn(
        "flex flex-col items-center justify-center py-12 px-6 text-center rounded-[var(--radius-lg)] border border-dashed border-[var(--color-border-strong)] bg-[var(--color-surface)]",
        className
      )}
      {...props}
    >
      <div className="w-12 h-12 rounded-full bg-[var(--color-neutral-subtle)] text-[var(--color-neutral)] flex items-center justify-center mb-4">
        {icon || <FolderOpen className="w-6 h-6" />}
      </div>
      <h3 className="text-[var(--text-md)] font-semibold text-[var(--color-fg)] mb-1">
        {title}
      </h3>
      <p className="text-[var(--text-sm)] text-[var(--color-fg-muted)] max-w-md mb-5">
        {description}
      </p>
      {action && <div className="mt-1">{action}</div>}
    </div>
  );
}
