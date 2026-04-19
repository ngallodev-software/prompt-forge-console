import { useEffect, useMemo, useRef, useState } from "react";
import { FixedSizeList as List } from "react-window";
import { format } from "date-fns";
import type { LogEntry } from "@/services/promptforge/types";
import { cn } from "@/lib/utils";
import { Link } from "react-router-dom";

const levelTone: Record<LogEntry["level"], string> = {
  debug: "text-muted-foreground",
  info: "text-status-info",
  warn: "text-status-warn",
  error: "text-status-danger",
};

export function LogStream({ logs }: { logs: LogEntry[] }) {
  const ref = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w: 0, h: 480 });
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setSize({ w: el.clientWidth, h: el.clientHeight }));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const items = useMemo(() => logs, [logs]);

  return (
    <div ref={ref} className="h-[60vh] rounded-md border bg-surface-sunken">
      {items.length === 0 && (
        <div className="flex h-full items-center justify-center px-6 text-center text-sm text-muted-foreground">
          No logs match the current filters.
        </div>
      )}
      {size.w > 0 && (
        <List height={size.h} width={size.w} itemCount={items.length} itemSize={32} overscanCount={12}>
          {({ index, style }) => {
            const l = items[index];
            return (
              <div style={style} className={cn("flex items-center gap-3 border-b border-border-subtle px-3 text-mono text-[12px]", index % 2 === 0 ? "bg-card" : "bg-surface-sunken")}>
                <time className="shrink-0 tabular-nums text-muted-foreground w-32">{format(new Date(l.timestamp), "MMM d HH:mm:ss")}</time>
                <span className="shrink-0 w-14 uppercase text-[10px] text-muted-foreground">{l.service}</span>
                <span className={cn("shrink-0 w-12 uppercase text-[10px] font-semibold", levelTone[l.level])}>{l.level}</span>
                <span className="flex-1 truncate">{l.message}</span>
                {l.intake_note_id && (
                  <Link to={`/pipeline/${l.intake_note_id}`} className="shrink-0 text-primary hover:underline" title="Open pipeline">
                    {l.intake_note_id.slice(-6)}
                  </Link>
                )}
              </div>
            );
          }}
        </List>
      )}
    </div>
  );
}
