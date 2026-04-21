import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Link } from "react-router-dom";
import type { ReactNode } from "react";
import { HelpTip } from "./HelpTip";

export interface AttentionItem {
  id: string;
  title: string;
  subtitle?: string;
  to?: string;
  meta?: ReactNode;
}

export function NeedsAttentionPanel({
  title,
  items,
  emptyMessage = "All clear",
  help,
  className,
}: {
  title: string;
  items: AttentionItem[];
  emptyMessage?: string;
  help?: { label: string; content: ReactNode };
  className?: string;
}) {
  return (
    <Card className={cn("flex flex-col", className)}>
      <div className="border-b px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <h3 className="text-sm font-semibold">{title}</h3>
          {help && <HelpTip label={help.label} content={help.content} />}
        </div>
        <span className="rounded-full bg-secondary px-2 py-0.5 text-[11px] tabular-nums text-muted-foreground">{items.length}</span>
      </div>
      <div className="flex-1 divide-y">
        {items.length === 0 && <div className="p-4 text-sm text-muted-foreground">{emptyMessage}</div>}
        {items.map((it) => {
          const inner = (
            <div className="flex items-start justify-between gap-3 px-4 py-2.5 hover:bg-accent/30">
              <div className="min-w-0">
                <div className="text-sm font-medium truncate">{it.title}</div>
                {it.subtitle && <div className="text-xs text-muted-foreground font-mono truncate">{it.subtitle}</div>}
              </div>
              {it.meta && <div className="shrink-0">{it.meta}</div>}
            </div>
          );
          return it.to ? (
            <Link key={it.id} to={it.to} className="block">
              {inner}
            </Link>
          ) : (
            <div key={it.id}>{inner}</div>
          );
        })}
      </div>
    </Card>
  );
}
