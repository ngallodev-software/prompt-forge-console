import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

interface Props {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  Icon?: LucideIcon;
  trend?: { value: string; positive?: boolean };
  className?: string;
}

export function MetricCard({ label, value, hint, Icon, trend, className }: Props) {
  return (
    <Card className={cn("p-4", className)}>
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1.5">
          <div className="text-xs uppercase tracking-wider text-muted-foreground">{label}</div>
          <div className="text-2xl font-semibold tabular-nums tracking-tight">{value}</div>
          {hint && <div className="text-xs text-muted-foreground">{hint}</div>}
        </div>
        {Icon && (
          <div className="rounded-md border bg-surface-sunken p-2 text-muted-foreground">
            <Icon className="h-4 w-4" />
          </div>
        )}
      </div>
      {trend && (
        <div className={cn("mt-3 text-xs font-medium", trend.positive ? "text-status-success" : "text-status-danger")}>{trend.value}</div>
      )}
    </Card>
  );
}
