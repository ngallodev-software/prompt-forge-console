import { cn } from "@/lib/utils";
import { ArrowDown, ArrowUp, Equal, Zap } from "lucide-react";
import type { PfPriority } from "@/services/promptforge/types";

const map: Record<PfPriority, { className: string; Icon: typeof ArrowUp; label: string }> = {
  low: { className: "bg-status-neutral-muted text-foreground/70 border-border", Icon: ArrowDown, label: "Low" },
  normal: { className: "bg-secondary text-secondary-foreground border-border", Icon: Equal, label: "Normal" },
  high: { className: "bg-status-warn-muted text-status-warn border-status-warn/30", Icon: ArrowUp, label: "High" },
  urgent: { className: "bg-status-danger-muted text-status-danger border-status-danger/30", Icon: Zap, label: "Urgent" },
};

export function PriorityBadge({ value, className }: { value: PfPriority; className?: string }) {
  const cfg = map[value];
  const Icon = cfg.Icon;
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium", cfg.className, className)}>
      <Icon className="h-3 w-3" />
      {cfg.label}
    </span>
  );
}
