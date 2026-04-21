import { cn } from "@/lib/utils";
import type { ReactNode } from "react";
import { HelpTip } from "@/components/pf/HelpTip";

interface Props {
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  breadcrumb?: ReactNode;
  help?: { label: string; content: ReactNode };
  className?: string;
}

export function PageHeader({ title, description, actions, breadcrumb, help, className }: Props) {
  return (
    <div className={cn("border-b bg-card/40 px-4 sm:px-6 py-4 space-y-2", className)}>
      {breadcrumb}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 min-w-0">
            <h1 className="text-xl sm:text-2xl font-semibold tracking-tight truncate">{title}</h1>
            {help && <HelpTip label={help.label} content={help.content} side="bottom" />}
          </div>
          {description && <p className="text-sm text-muted-foreground mt-0.5">{description}</p>}
        </div>
        {actions && <div className="flex items-center gap-2 flex-wrap">{actions}</div>}
      </div>
    </div>
  );
}

export function PageBody({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("p-4 sm:p-6 space-y-4", className)}>{children}</div>;
}
