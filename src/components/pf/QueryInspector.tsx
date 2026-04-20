import { useState } from "react";
import { Database, ChevronDown, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/stores/app-store";
import { getQueriesForPage } from "@/services/promptforge";
import { useLocation } from "react-router-dom";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

export function QueryInspector({ className }: { className?: string }) {
  const debug = useAppStore((s) => s.debug);
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);
  if (!debug) return null;
  const queries = getQueriesForPage(pathname);
  if (queries.length === 0) return null;
  return (
    <div className={cn("rounded-md border border-status-info/30 bg-status-info-muted/40 text-xs", className)}>
      <Tooltip>
        <TooltipTrigger asChild>
          <button onClick={() => setOpen((o) => !o)} className="flex w-full items-center justify-between gap-2 px-3 py-2 text-status-info">
            <span className="flex items-center gap-2 font-medium">
              <Database className="h-3.5 w-3.5" />
              Query inspector — {queries.length} catalog quer{queries.length === 1 ? "y" : "ies"} on this page
            </span>
            {open ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
          </button>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs text-xs leading-5">
          Debug-only panel. Expand it to see which catalog queries support this page and which parameters they expect.
        </TooltipContent>
      </Tooltip>
      {open && (
        <div className="border-t border-status-info/20 p-3 space-y-2">
          {queries.map((q) => (
            <div key={q.id} className="rounded border bg-background/60 p-2">
              <div className="flex items-center gap-2">
                <span className="font-mono text-[10px] rounded bg-primary/10 text-primary px-1.5 py-0.5">{q.id}</span>
                <span className="font-medium text-foreground">{q.title}</span>
              </div>
              <div className="mt-1 text-muted-foreground">{q.description}</div>
              {q.params.length > 0 && (
                <div className="mt-1 font-mono text-[11px] text-muted-foreground">params: {q.params.join(", ")}</div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
