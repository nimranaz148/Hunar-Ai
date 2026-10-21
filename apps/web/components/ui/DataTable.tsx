import React from "react";
import { cn } from "@/lib/utils";
import { LoadingState } from "./LoadingState";
import { EmptyState } from "./EmptyState";
import { ErrorState } from "./ErrorState";

export interface Column<T> {
  key: string;
  header: string;
  render?: (item: T) => React.ReactNode;
  align?: "left" | "center" | "right";
  className?: string;
}

export interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyExtractor: (item: T, index: number) => string | number;
  isLoading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  emptyTitle?: string;
  emptyDescription?: string;
  onRowClick?: (item: T) => void;
  className?: string;
}

export function DataTable<T>({
  columns,
  data,
  keyExtractor,
  isLoading = false,
  error = null,
  onRetry,
  emptyTitle,
  emptyDescription,
  onRowClick,
  className,
}: DataTableProps<T>) {
  if (isLoading) {
    return <LoadingState message="Loading data..." className="my-4" />;
  }

  if (error) {
    return <ErrorState message={error} onRetry={onRetry} className="my-4" />;
  }

  if (!data || data.length === 0) {
    return (
      <EmptyState
        title={emptyTitle || "No records"}
        description={emptyDescription || "No records found in this view."}
        className="my-4"
      />
    );
  }

  return (
    <div
      className={cn(
        "w-full overflow-x-auto rounded-[var(--radius-lg)] border border-[var(--color-ink)] bg-[var(--color-surface)]",
        className
      )}
    >
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="border-b border-[var(--color-ink)] bg-[var(--color-surface-sunken)]">
            {columns.map((col) => (
              <th
                key={col.key}
                className={cn(
                  "h-[var(--grid-header)] px-3 font-label text-sm text-[var(--color-fg)]",
                  col.align === "right" && "text-right",
                  col.align === "center" && "text-center",
                  col.className
                )}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-[var(--color-border)]">
          {data.map((item, index) => {
            const key = keyExtractor(item, index);
            return (
              <tr
                key={key}
                onClick={() => onRowClick?.(item)}
                className={cn(
                  "h-[var(--grid-row-default)] transition-colors",
                  onRowClick
                    ? "cursor-pointer hover:bg-[var(--color-surface-hover)] active:bg-[var(--color-surface-active)]"
                    : "hover:bg-[var(--color-surface-hover)]"
                )}
              >
                {columns.map((col) => (
                  <td
                    key={col.key}
                    className={cn(
                      "px-3 text-sm text-[var(--color-fg)] align-middle",
                      col.align === "right" && "text-right",
                      col.align === "center" && "text-center",
                      col.className
                    )}
                  >
                    {col.render
                      ? col.render(item)
                      : (item as Record<string, unknown>)[col.key] !== undefined
                      ? String((item as Record<string, unknown>)[col.key])
                      : null}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
