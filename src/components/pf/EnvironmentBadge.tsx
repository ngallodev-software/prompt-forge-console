import { cn } from "@/lib/utils";
import { useAppStore } from "@/stores/app-store";

export function EnvironmentBadge({ className }: { className?: string }) {
  const env = useAppStore((s) => s.environment);
  const tone =
    env === "prod"
      ? "bg-status-danger-muted text-status-danger border-status-danger/30"
      : env === "staging"
      ? "bg-status-warn-muted text-status-warn border-status-warn/30"
      : "bg-status-info-muted text-status-info border-status-info/20";
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded border px-2 py-0.5 font-mono text-[11px] uppercase tracking-wider", tone, className)}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {env}
    </span>
  );
}
