import React from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export interface LoadingStateProps extends React.HTMLAttributes<HTMLDivElement> {
  message?: string;
  description?: string;
}

export function LoadingState({
  message = "Loading...",
  description,
  className,
  ...props
}: LoadingStateProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "flex flex-col items-center justify-center py-14 px-4 text-center rounded-[var(--radius-lg)] border border-[var(--color-ink)] bg-[var(--color-surface)]",
        className
      )}
      {...props}
    >
      <Loader2 className="w-8 h-8 text-[var(--color-accent)] animate-spin mb-3" />
      <p className="text-base font-medium text-[var(--color-fg)]">{message}</p>
      {description && (
        <p className="text-xs text-[var(--color-fg-muted)] mt-1 max-w-sm">
          {description}
        </p>
      )}
    </div>
  );
}
