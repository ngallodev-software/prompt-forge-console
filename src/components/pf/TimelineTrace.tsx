import { cn } from "@/lib/utils";
import { format } from "date-fns";
import type { ReactNode } from "react";

export interface TimelineItem {
  id: string;
  title: string;
  subtitle?: string;
  timestamp?: string;
  tone?: "success" | "warn" | "danger" | "info" | "neutral";
  body?: ReactNode;
  badge?: ReactNode;
  onClick?: () => void;
  active?: boolean;
}

const toneDot: Record<NonNullable<TimelineItem["tone"]>, string> = {
  success: "bg-status-success",
  warn: "bg-status-warn",
  danger: "bg-status-danger",
  info: "bg-status-info",
  neutral: "bg-status-neutral",
};

export function TimelineTrace({ items, className }: { items: TimelineItem[]; className?: string }) {
  return (
    <ol className={cn("relative space-y-3", className)}>
      <div className="absolute left-[11px] top-1 bottom-1 w-px bg-border" aria-hidden />
      {items.map((it) => (
        <li key={it.id} className="relative pl-8">
          <span className={cn("absolute left-[7px] top-2 h-2.5 w-2.5 rounded-full ring-4 ring-background", toneDot[it.tone ?? "neutral"])} />
          <button
            type="button"
            onClick={it.onClick}
            disabled={!it.onClick}
            className={cn(
              "w-full rounded-md border bg-card p-3 text-left transition-colors",
              it.onClick && "hover:bg-accent/30 cursor-pointer",
              it.active && "ring-2 ring-primary/40 border-primary/40",
            )}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-medium text-sm">{it.title}</span>
                  {it.badge}
                </div>
                {it.subtitle && <div className="mt-0.5 text-xs text-muted-foreground font-mono truncate">{it.subtitle}</div>}
              </div>
              {it.timestamp && (
                <time className="shrink-0 text-[11px] tabular-nums text-muted-foreground" dateTime={it.timestamp}>
                  {format(new Date(it.timestamp), "MMM d, HH:mm:ss")}
                </time>
              )}
            </div>
            {it.body && <div className="mt-2 text-xs">{it.body}</div>}
          </button>
        </li>
      ))}
    </ol>
  );
}
