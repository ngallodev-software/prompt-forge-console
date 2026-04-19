import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { AlertOctagon } from "lucide-react";

interface Props {
  failedStage?: string;
  errorText?: string | null;
  matchedRule?: string;
  fallbackPath?: string;
  warnings?: string[];
  className?: string;
}

export function RootCausePanel({ failedStage, errorText, matchedRule, fallbackPath, warnings, className }: Props) {
  return (
    <Card className={cn("border-status-danger/30", className)}>
      <div className="border-b border-status-danger/20 bg-status-danger-muted/40 px-4 py-3 flex items-center gap-2">
        <AlertOctagon className="h-4 w-4 text-status-danger" />
        <h3 className="text-sm font-semibold text-status-danger">Root cause</h3>
      </div>
      <div className="p-4 space-y-3 text-sm">
        {failedStage && (
          <div>
            <div className="text-xs uppercase text-muted-foreground tracking-wider">Failed stage</div>
            <div className="font-mono">{failedStage}</div>
          </div>
        )}
        {errorText && (
          <div>
            <div className="text-xs uppercase text-muted-foreground tracking-wider">Error</div>
            <pre className="mt-1 rounded bg-surface-sunken p-2 text-mono text-foreground/85 overflow-auto">{errorText}</pre>
          </div>
        )}
        {matchedRule && (
          <div>
            <div className="text-xs uppercase text-muted-foreground tracking-wider">Matched rule</div>
            <div className="font-mono">{matchedRule}</div>
          </div>
        )}
        {fallbackPath && (
          <div>
            <div className="text-xs uppercase text-muted-foreground tracking-wider">Fallback path</div>
            <div className="font-mono">{fallbackPath}</div>
          </div>
        )}
        {warnings && warnings.length > 0 && (
          <div>
            <div className="text-xs uppercase text-muted-foreground tracking-wider">Warnings</div>
            <ul className="mt-1 list-disc pl-5 space-y-0.5 text-status-warn">
              {warnings.map((w, i) => (
                <li key={i}>{w}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </Card>
  );
}
