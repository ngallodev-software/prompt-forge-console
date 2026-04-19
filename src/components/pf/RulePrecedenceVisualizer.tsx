import type { Rule } from "@/services/promptforge/types";
import { cn } from "@/lib/utils";
import { GripVertical } from "lucide-react";
import { StatusBadge } from "./StatusBadge";

export function RulePrecedenceVisualizer({ rules, className }: { rules: Rule[]; className?: string }) {
  const sorted = [...rules].sort((a, b) => b.priority - a.priority);
  return (
    <ol className={cn("space-y-1.5", className)}>
      {sorted.map((r, i) => (
        <li key={r.id} className={cn("flex items-center gap-2 rounded border bg-card px-3 py-2", !r.enabled && "opacity-50")}>
          <GripVertical className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="font-mono text-[11px] tabular-nums text-muted-foreground w-6">#{i + 1}</span>
          <span className="font-medium text-sm flex-1 truncate">{r.name}</span>
          <span className="rounded bg-secondary px-1.5 py-0.5 text-[10px] uppercase tracking-wider text-muted-foreground">{r.rule_type}</span>
          <span className="font-mono text-[11px] tabular-nums text-muted-foreground">prio {r.priority}</span>
          <StatusBadge value={r.enabled ? "enabled" : "disabled"} tone={r.enabled ? "success" : "neutral"} />
        </li>
      ))}
    </ol>
  );
}
