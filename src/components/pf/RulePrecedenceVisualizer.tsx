import type { Rule } from "@/services/promptforge/types";
import { cn } from "@/lib/utils";
import { GripVertical } from "lucide-react";
import { StatusBadge } from "./StatusBadge";

interface Props {
  rules: Rule[];
  className?: string;
  selectedRuleId?: string | null;
  onSelectRule?: (rule: Rule) => void;
  onReorderRule?: (sourceRuleId: string, targetRuleId: string) => void | Promise<void>;
  disabled?: boolean;
}

export function RulePrecedenceVisualizer({
  rules,
  className,
  selectedRuleId,
  onSelectRule,
  onReorderRule,
  disabled,
}: Props) {
  const sorted = [...rules].sort((a, b) => b.priority - a.priority);
  const canReorder = Boolean(onReorderRule) && !disabled;

  return (
    <ol className={cn("space-y-1.5", className)}>
      {sorted.map((r, i) => (
        <li
          key={r.id}
          draggable={canReorder}
          onDragStart={(e) => {
            if (!canReorder) return;
            e.dataTransfer.effectAllowed = "move";
            e.dataTransfer.setData("text/plain", r.id);
          }}
          onDragOver={(e) => {
            if (!canReorder) return;
            e.preventDefault();
            e.dataTransfer.dropEffect = "move";
          }}
          onDrop={async (e) => {
            if (!canReorder || !onReorderRule) return;
            e.preventDefault();
            const sourceId = e.dataTransfer.getData("text/plain");
            if (sourceId) await onReorderRule(sourceId, r.id);
          }}
          onClick={() => onSelectRule?.(r)}
          className={cn(
            "flex items-center gap-2 rounded border bg-card px-3 py-2 transition-colors",
            canReorder && "cursor-grab active:cursor-grabbing",
            selectedRuleId === r.id && "border-primary/60 bg-primary/5",
            !r.enabled && "opacity-50",
          )}
        >
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
