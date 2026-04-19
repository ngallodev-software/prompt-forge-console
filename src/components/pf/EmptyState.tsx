import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";
import { Inbox } from "lucide-react";
import type { ReactNode } from "react";

interface Props {
  title?: string;
  description?: string;
  Icon?: LucideIcon;
  action?: ReactNode;
  className?: string;
}

export function EmptyState({ title = "Nothing here yet", description, Icon = Inbox, action, className }: Props) {
  return (
    <div className={cn("flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed bg-surface-sunken/50 p-10 text-center", className)}>
      <div className="rounded-full border bg-background p-3 text-muted-foreground">
        <Icon className="h-5 w-5" />
      </div>
      <div className="space-y-1">
        <div className="font-medium">{title}</div>
        {description && <div className="text-sm text-muted-foreground max-w-sm">{description}</div>}
      </div>
      {action}
    </div>
  );
}
