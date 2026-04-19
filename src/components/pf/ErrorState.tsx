import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface Props {
  title?: string;
  message?: string;
  onRetry?: () => void;
  className?: string;
}

export function ErrorState({ title = "Something went wrong", message = "An error occurred while loading this view.", onRetry, className }: Props) {
  return (
    <div className={cn("flex flex-col items-center justify-center gap-3 rounded-lg border border-status-danger/30 bg-status-danger-muted/40 p-8 text-center", className)}>
      <div className="rounded-full bg-status-danger/10 p-3 text-status-danger">
        <AlertTriangle className="h-5 w-5" />
      </div>
      <div className="space-y-1">
        <div className="font-medium">{title}</div>
        <div className="text-sm text-muted-foreground max-w-md">{message}</div>
      </div>
      {onRetry && (
        <Button size="sm" variant="outline" onClick={onRetry}>
          Retry
        </Button>
      )}
    </div>
  );
}
