import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { StatusBadge, statusTone } from "./StatusBadge";

interface Props {
  title: string;
  status: "ok" | "degraded" | "down";
  hint?: string;
  metric?: string;
  className?: string;
}

export function HealthCard({ title, status, hint, metric, className }: Props) {
  const dotTone =
    status === "ok"
      ? "bg-status-success"
      : status === "degraded"
      ? "bg-status-warn"
      : "bg-status-danger";
  return (
    <Card className={cn("p-4", className)}>
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className={cn("h-2 w-2 rounded-full animate-pulse-soft", dotTone)} />
          <div className="font-medium text-sm">{title}</div>
        </div>
        <StatusBadge value={status} tone={statusTone(status)} />
      </div>
      {metric !== undefined && <div className="mt-2 text-xl font-semibold tabular-nums">{metric}</div>}
      {hint && <div className="mt-1 text-xs text-muted-foreground">{hint}</div>}
    </Card>
  );
}
