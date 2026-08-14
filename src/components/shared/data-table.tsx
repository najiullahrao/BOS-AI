"use client";

import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export interface DataTableColumn<T> {
  key: string;
  header: string;
  sortable?: boolean;
  /** Renders a free-text input in the filter row for this column. Omit to skip filtering. */
  filterPlaceholder?: string;
  /** Renders a select in the filter row instead of a text input. Takes precedence over filterPlaceholder. */
  filterOptions?: { label: string; value: string }[];
  accessor: (row: T) => React.ReactNode;
  className?: string;
}

const FILTER_ALL_VALUE = "__all__";

function ColumnFilterControl<T>({
  col,
  value,
  onChange,
  className,
}: {
  col: DataTableColumn<T>;
  value: string;
  onChange: (value: string) => void;
  className?: string;
}) {
  if (col.filterOptions) {
    return (
      <Select value={value || FILTER_ALL_VALUE} onValueChange={(next) => onChange(next === FILTER_ALL_VALUE ? "" : next)}>
        <SelectTrigger className={cn("h-7 text-xs", className)} aria-label={`Filter ${col.header}`}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={FILTER_ALL_VALUE}>All {col.header.toLowerCase()}</SelectItem>
          {col.filterOptions.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  }

  return (
    <Input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={col.filterPlaceholder}
      className={cn("h-7 text-xs", className)}
      aria-label={`Filter ${col.header}`}
    />
  );
}

export interface DataTableSort {
  key: string;
  direction: "asc" | "desc";
}

/** Matches the API envelope: { data, meta: { cursor, hasMore } }. */
export interface DataTableProps<T> {
  columns: DataTableColumn<T>[];
  data: T[];
  getRowId: (row: T) => string;
  onRowClick?: (row: T) => void;
  sort?: DataTableSort;
  onSortChange?: (key: string) => void;
  filters?: Record<string, string>;
  onFilterChange?: (key: string, value: string) => void;
  cursor?: string | null;
  hasMore: boolean;
  onLoadMore?: () => void;
  isLoading?: boolean;
  emptyState?: React.ReactNode;
  className?: string;
}

export function DataTable<T>({
  columns,
  data,
  getRowId,
  onRowClick,
  sort,
  onSortChange,
  filters,
  onFilterChange,
  hasMore,
  onLoadMore,
  isLoading,
  emptyState,
  className,
}: DataTableProps<T>) {
  const hasFilters = columns.some((col) => col.filterPlaceholder !== undefined || col.filterOptions !== undefined);

  if (!isLoading && data.length === 0 && emptyState) {
    return <>{emptyState}</>;
  }

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      {/* Desktop / tablet: table layout, md and up */}
      <div className="hidden overflow-hidden rounded-md border border-border md:block">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-border bg-neutral-50">
              {columns.map((col) => (
                <th key={col.key} className={cn("px-3 py-2 text-left text-xs font-medium text-neutral-600", col.className)}>
                  {col.sortable ? (
                    <button
                      type="button"
                      onClick={() => onSortChange?.(col.key)}
                      className="inline-flex items-center gap-1 hover:text-neutral-950"
                    >
                      {col.header}
                      {sort?.key === col.key ? (
                        sort.direction === "asc" ? (
                          <ArrowUp className="size-3.5" aria-hidden="true" />
                        ) : (
                          <ArrowDown className="size-3.5" aria-hidden="true" />
                        )
                      ) : (
                        <ArrowUpDown className="size-3.5 text-neutral-200" aria-hidden="true" />
                      )}
                    </button>
                  ) : (
                    col.header
                  )}
                </th>
              ))}
            </tr>
            {hasFilters && (
              <tr className="border-b border-border bg-surface">
                {columns.map((col) => (
                  <th key={col.key} className="px-3 py-2 font-normal">
                    {(col.filterPlaceholder !== undefined || col.filterOptions !== undefined) && (
                      <ColumnFilterControl
                        col={col}
                        value={filters?.[col.key] ?? ""}
                        onChange={(value) => onFilterChange?.(col.key, value)}
                      />
                    )}
                  </th>
                ))}
              </tr>
            )}
          </thead>
          <tbody>
            {isLoading && data.length === 0
              ? Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b border-border last:border-0">
                    {columns.map((col) => (
                      <td key={col.key} className="px-3 py-3">
                        <Skeleton className="h-4 w-full max-w-32" />
                      </td>
                    ))}
                  </tr>
                ))
              : data.map((row) => {
                  const rowId = getRowId(row);
                  return (
                    <tr
                      key={rowId}
                      onClick={() => onRowClick?.(row)}
                      className={cn(
                        "border-b border-border last:border-0",
                        onRowClick && "cursor-pointer hover:bg-neutral-50"
                      )}
                    >
                      {columns.map((col) => (
                        <td key={col.key} className={cn("px-3 py-3 text-neutral-950", col.className)}>
                          {col.accessor(row)}
                        </td>
                      ))}
                    </tr>
                  );
                })}
          </tbody>
        </table>
      </div>

      {/* Mobile: stacked card per row, below md */}
      <div className="flex flex-col gap-2 md:hidden">
        {hasFilters && (
          <div className="flex flex-col gap-2 rounded-md border border-border bg-neutral-50 p-2">
            {columns
              .filter((col) => col.filterPlaceholder !== undefined || col.filterOptions !== undefined)
              .map((col) => (
                <ColumnFilterControl
                  key={col.key}
                  col={col}
                  value={filters?.[col.key] ?? ""}
                  onChange={(value) => onFilterChange?.(col.key, value)}
                  className="h-8 text-sm"
                />
              ))}
          </div>
        )}

        {isLoading && data.length === 0
          ? Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex flex-col gap-2 rounded-md border border-border p-3">
                <Skeleton className="h-4 w-2/3" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            ))
          : data.map((row) => {
              const rowId = getRowId(row);
              return (
                <div
                  key={rowId}
                  onClick={() => onRowClick?.(row)}
                  className={cn(
                    "flex flex-col gap-1.5 rounded-md border border-border p-3",
                    onRowClick && "cursor-pointer active:bg-neutral-50"
                  )}
                >
                  {columns.map((col) => (
                    <div key={col.key} className="flex items-baseline justify-between gap-3 text-sm">
                      <span className="shrink-0 text-xs font-medium text-neutral-600">{col.header}</span>
                      <span className="text-right text-neutral-950">{col.accessor(row)}</span>
                    </div>
                  ))}
                </div>
              );
            })}
      </div>

      {hasMore && (
        <div className="flex justify-center pt-2">
          <Button variant="outline" size="sm" onClick={onLoadMore} disabled={isLoading}>
            {isLoading ? "Loading…" : "Load more"}
          </Button>
        </div>
      )}
    </div>
  );
}
