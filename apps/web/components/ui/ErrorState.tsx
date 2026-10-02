import React from "react";
import { AlertCircle, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ErrorStateProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
  message?: string;
  onRetry?: () => void;
  retryLabel?: string;
}

export function ErrorState({
  title = "Unable to load data",
  message = "A connection error occurred while loading this section. Please try again.",
  onRetry,
  retryLabel = "Try Again",
  className,
  ...props
}: ErrorStateProps) {
  return (
    <div
      role="alert"
      className={cn(
        "flex flex-col items-center justify-center py-10 px-6 text-center rounded-[var(--radius-lg)] border border-[var(--color-danger-border)] bg-[var(--color-danger-subtle)]",
        className
      )}
      {...props}
    >
      <div className="w-10 h-10 rounded-full bg-[var(--color-surface)] text-[var(--color-danger)] flex items-center justify-center mb-3 shadow-[var(--shadow-sm)]">
        <AlertCircle className="w-5 h-5" />
      </div>
      <h3 className="text-[var(--text-base)] font-semibold text-[var(--color-danger)] mb-1">
        {title}
      </h3>
      <p className="text-[var(--text-xs)] text-[var(--color-fg-muted)] max-w-md mb-4">
        {message}
      </p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[var(--radius-md)] bg-[var(--color-surface)] border border-[var(--color-danger-border)] text-[var(--text-xs)] font-medium text-[var(--color-danger)] hover:bg-[var(--color-surface-hover)] transition-colors shadow-[var(--shadow-sm)] cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          {retryLabel}
        </button>
      )}
    </div>
  );
}
