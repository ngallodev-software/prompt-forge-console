import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";
import { ShieldAlert } from "lucide-react";

export function DangerZoneCard({ title, description, children, className }: { title: string; description?: string; children: ReactNode; className?: string }) {
  return (
    <Card className={cn("border-status-danger/40 bg-status-danger-muted/30", className)}>
      <div className="border-b border-status-danger/30 px-4 py-3 flex items-center gap-2">
        <ShieldAlert className="h-4 w-4 text-status-danger" />
        <div>
          <div className="font-semibold text-status-danger">{title}</div>
          {description && <div className="text-xs text-muted-foreground">{description}</div>}
        </div>
      </div>
      <div className="p-4 space-y-3">{children}</div>
    </Card>
  );
}
