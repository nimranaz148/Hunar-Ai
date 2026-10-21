"use client";

import React, { useId, useMemo, useState } from "react";
import { ArrowDown, ArrowUp, ChevronLeft, ChevronRight, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { SearchInput } from "./SearchInput";
import { FilterChips, type FilterOption } from "./FilterChips";
import { EmptyState } from "./EmptyState";

export interface GridColumn<T> {
  key: string;
  header: string;
  render?: (row: T) => React.ReactNode;
  /** Makes the header sortable. Return a number or string to sort by. */
  sortValue?: (row: T) => string | number;
  align?: "left" | "right";
  className?: string;
}

export interface GridFilter<T> {
  id: string;
  label: string;
  /** Options besides the implicit "All". */
  options: { value: string; label: string }[];
  getValue: (row: T) => string;
}

export interface DataGridProps<T> {
  /** Accessible table name. */
  caption: string;
  columns: GridColumn<T>[];
  rows: T[];
  rowKey: (row: T) => string;
  /** Text the search box matches against. Omit to hide search. */
  searchText?: (row: T) => string;
  searchPlaceholder?: string;
  filters?: GridFilter<T>[];
  pageSize?: number;
  onRowClick?: (row: T) => void;
  emptyTitle?: string;
  emptyDescription?: string;
  toolbarExtra?: React.ReactNode;
  className?: string;
}

type SortState = { key: string; dir: "asc" | "desc" } | null;

/**
 * Searchable, filterable, sortable, paginated table. State lives here; the data does not,
 * so any screen can drop it in with rows it already fetched.
 */
export function DataGrid<T>({
  caption,
  columns,
  rows,
  rowKey,
  searchText,
  searchPlaceholder = "Search",
  filters = [],
  pageSize = 8,
  onRowClick,
  emptyTitle = "Nothing matches",
  emptyDescription = "Try a different search or clear a filter.",
  toolbarExtra,
  className,
}: DataGridProps<T>) {
  const liveId = useId();
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Record<string, string>>({});
  const [sort, setSort] = useState<SortState>(null);
  const [page, setPage] = useState(0);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows.filter((r) => {
      if (q && searchText && !searchText(r).toLowerCase().includes(q)) return false;
      return filters.every((f) => {
        const v = selected[f.id];
        return !v || v === "all" || f.getValue(r) === v;
      });
    });
  }, [rows, query, selected, filters, searchText]);

  const sorted = useMemo(() => {
    if (!sort) return filtered;
    const col = columns.find((c) => c.key === sort.key);
    if (!col?.sortValue) return filtered;
    const get = col.sortValue;
    const dir = sort.dir === "asc" ? 1 : -1;
    return [...filtered].sort((a, b) => {
      const av = get(a);
      const bv = get(b);
      if (typeof av === "number" && typeof bv === "number") return (av - bv) * dir;
      return String(av).localeCompare(String(bv)) * dir;
    });
  }, [filtered, sort, columns]);

  const pageCount = Math.max(1, Math.ceil(sorted.length / pageSize));
  const safePage = Math.min(page, pageCount - 1);
  const visible = sorted.slice(safePage * pageSize, safePage * pageSize + pageSize);
  const from = sorted.length === 0 ? 0 : safePage * pageSize + 1;
  const to = Math.min(sorted.length, safePage * pageSize + pageSize);

  const toggleSort = (key: string) => {
    setPage(0);
    setSort((s) => (s?.key !== key ? { key, dir: "asc" } : s.dir === "asc" ? { key, dir: "desc" } : null));
  };

  const filterOptions = (f: GridFilter<T>): FilterOption[] => [
    { value: "all", label: "All", count: rows.filter((r) => !searchText || searchText(r).toLowerCase().includes(query.trim().toLowerCase())).length },
    ...f.options.map((o) => ({
      ...o,
      count: rows.filter((r) => f.getValue(r) === o.value && (!searchText || searchText(r).toLowerCase().includes(query.trim().toLowerCase()))).length,
    })),
  ];

  return (
    <section className={cn("rounded-[var(--radius-lg)] border border-[var(--color-ink)] bg-[var(--color-surface)]", className)}>
      <div className="flex flex-wrap items-center gap-3 border-b border-[var(--color-ink)] p-3 sm:p-4">
        {searchText && (
          <SearchInput
            label={`Search ${caption}`}
            placeholder={searchPlaceholder}
            value={query}
            onChange={(v) => {
              setQuery(v);
              setPage(0);
            }}
            className="w-full sm:w-72"
          />
        )}
        {filters.map((f) => (
          <FilterChips
            key={f.id}
            label={f.label}
            options={filterOptions(f)}
            value={selected[f.id] ?? "all"}
            onChange={(v) => {
              setSelected((s) => ({ ...s, [f.id]: v }));
              setPage(0);
            }}
          />
        ))}
        {toolbarExtra && <div className="ml-auto flex items-center gap-2">{toolbarExtra}</div>}
      </div>

      {visible.length === 0 ? (
        <div className="p-4">
          <EmptyState title={emptyTitle} description={emptyDescription} className="py-10" />
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <caption className="sr-only">{caption}</caption>
            <thead>
              <tr className="border-b border-[var(--color-ink)] bg-[var(--color-surface-sunken)]">
                {columns.map((c) => {
                  const active = sort?.key === c.key;
                  return (
                    <th
                      key={c.key}
                      scope="col"
                      aria-sort={active ? (sort!.dir === "asc" ? "ascending" : "descending") : c.sortValue ? "none" : undefined}
                      className={cn("h-[var(--grid-header)] px-4 font-label text-sm", c.align === "right" && "text-right", c.className)}
                    >
                      {c.sortValue ? (
                        <button
                          type="button"
                          onClick={() => toggleSort(c.key)}
                          className="inline-flex items-center gap-1.5 hover:text-[var(--color-violet)]"
                        >
                          {c.header}
                          {active ? (
                            sort!.dir === "asc" ? <ArrowUp className="h-3.5 w-3.5" aria-hidden /> : <ArrowDown className="h-3.5 w-3.5" aria-hidden />
                          ) : (
                            <ChevronsUpDown className="h-3.5 w-3.5 opacity-50" aria-hidden />
                          )}
                        </button>
                      ) : (
                        c.header
                      )}
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {visible.map((row) => (
                <tr
                  key={rowKey(row)}
                  onClick={onRowClick ? () => onRowClick(row) : undefined}
                  className={cn(
                    "h-[var(--grid-row-comfortable)] border-b border-[var(--color-border)] last:border-b-0 transition-colors",
                    onRowClick ? "cursor-pointer hover:bg-[var(--color-surface-active)]" : "hover:bg-[var(--color-surface-hover)]",
                  )}
                >
                  {columns.map((c) => (
                    <td key={c.key} className={cn("px-4 py-2 align-middle text-sm", c.align === "right" && "text-right", c.className)}>
                      {c.render ? c.render(row) : String((row as Record<string, unknown>)[c.key] ?? "")}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[var(--color-ink)] px-4 py-3">
        <p id={liveId} role="status" aria-live="polite" className="text-sm text-[var(--color-fg-muted)]">
          {sorted.length === 0 ? "No results" : `Showing ${from}–${to} of ${sorted.length}`}
        </p>
        {pageCount > 1 && (
          <div className="flex items-center gap-2">
            <button
              type="button"
              aria-label="Previous page"
              disabled={safePage === 0}
              onClick={() => setPage(safePage - 1)}
              className="grid h-9 w-9 place-items-center rounded-full border-2 border-[var(--color-ink)] transition-colors hover:bg-[var(--color-marigold)] disabled:opacity-40 disabled:hover:bg-transparent"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="font-label min-w-16 text-center text-sm">
              {safePage + 1} / {pageCount}
            </span>
            <button
              type="button"
              aria-label="Next page"
              disabled={safePage >= pageCount - 1}
              onClick={() => setPage(safePage + 1)}
              className="grid h-9 w-9 place-items-center rounded-full border-2 border-[var(--color-ink)] transition-colors hover:bg-[var(--color-marigold)] disabled:opacity-40 disabled:hover:bg-transparent"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
