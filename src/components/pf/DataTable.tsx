import { useMemo, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { LoadingState } from "./LoadingState";
import { EmptyState } from "./EmptyState";

export interface Column<T> {
  key: string;
  header: ReactNode;
  cell: (row: T) => ReactNode;
  className?: string;
  hideOnMobile?: boolean;
  width?: string;
}

interface Props<T> {
  columns: Column<T>[];
  rows: T[] | undefined;
  isLoading?: boolean;
  total?: number;
  page?: number;
  pageSize?: number;
  onPageChange?: (p: number) => void;
  onRowClick?: (row: T) => void;
  isRowActive?: (row: T) => boolean;
  rowKey: (row: T) => string;
  emptyTitle?: string;
  emptyDescription?: string;
  toolbar?: ReactNode;
  density?: "comfortable" | "compact";
  className?: string;
}

export function DataTable<T>({
  columns,
  rows,
  isLoading,
  total,
  page = 1,
  pageSize = 25,
  onPageChange,
  onRowClick,
  isRowActive,
  rowKey,
  emptyTitle,
  emptyDescription,
  toolbar,
  density = "comfortable",
  className,
}: Props<T>) {
  const pageCount = useMemo(() => (total ? Math.max(1, Math.ceil(total / pageSize)) : 1), [total, pageSize]);
  const cellPad = density === "compact" ? "px-3 py-1.5" : "px-3 py-2.5";

  return (
    <div className={cn("rounded-lg border bg-card overflow-hidden flex flex-col", className)}>
      {toolbar && <div className="border-b bg-surface-sunken/40 p-2.5">{toolbar}</div>}
      <div className="overflow-auto">
        <table className="w-full text-sm">
          <thead className="sticky top-0 z-10 bg-surface-sunken/95 backdrop-blur supports-[backdrop-filter]:bg-surface-sunken/70">
            <tr className="border-b">
              {columns.map((c) => (
                <th
                  key={c.key}
                  scope="col"
                  className={cn(
                    "text-left text-xs font-medium uppercase tracking-wider text-muted-foreground",
                    cellPad,
                    c.hideOnMobile && "hidden md:table-cell",
                    c.className,
                  )}
                  style={c.width ? { width: c.width } : undefined}
                >
                  {c.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr>
                <td colSpan={columns.length} className="p-3">
                  <LoadingState rows={6} />
                </td>
              </tr>
            )}
            {!isLoading && rows && rows.length === 0 && (
              <tr>
                <td colSpan={columns.length} className="p-4">
                  <EmptyState title={emptyTitle ?? "No records returned"} description={emptyDescription ?? "Try adjusting filters or check backend data."} />
                </td>
              </tr>
            )}
            {!isLoading &&
              rows?.map((row) => {
                const active = isRowActive?.(row);
                return (
                  <tr
                    key={rowKey(row)}
                    onClick={() => onRowClick?.(row)}
                    className={cn(
                      "border-b last:border-0 transition-colors",
                      onRowClick && "cursor-pointer hover:bg-accent/30",
                      active && "bg-accent/40",
                    )}
                  >
                    {columns.map((c) => (
                      <td
                        key={c.key}
                        className={cn(cellPad, "align-middle", c.hideOnMobile && "hidden md:table-cell", c.className)}
                      >
                        {c.cell(row)}
                      </td>
                    ))}
                  </tr>
                );
              })}
          </tbody>
        </table>
      </div>
      {onPageChange && total !== undefined && total > pageSize && (
        <div className="flex items-center justify-between border-t bg-surface-sunken/40 px-3 py-2 text-xs">
          <span className="text-muted-foreground tabular-nums">
            {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, total)} of {total}
          </span>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="sm" disabled={page <= 1} onClick={() => onPageChange(page - 1)} className="h-7 px-2">
              <ChevronLeft className="h-3.5 w-3.5" />
            </Button>
            <span className="px-2 tabular-nums text-muted-foreground">
              {page} / {pageCount}
            </span>
            <Button variant="ghost" size="sm" disabled={page >= pageCount} onClick={() => onPageChange(page + 1)} className="h-7 px-2">
              <ChevronRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
