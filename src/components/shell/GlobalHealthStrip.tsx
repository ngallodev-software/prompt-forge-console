import { useQuery } from "@tanstack/react-query";
import { getHealth, qk } from "@/services/promptforge";
import { useAppStore } from "@/stores/app-store";
import { Link } from "react-router-dom";
import { AlertTriangle } from "lucide-react";

export function GlobalHealthStrip() {
  const polling = useAppStore((s) => s.pollingMs);
  const { data, error, isError } = useQuery({
    queryKey: qk.health,
    queryFn: getHealth,
    refetchInterval: polling,
    throwOnError: false,
  });
  if (isError) {
    return (
      <Link to="/health" className="flex items-center justify-center gap-2 border-b border-status-danger/30 bg-status-danger-muted px-4 py-1 text-xs font-medium text-status-danger">
        <AlertTriangle className="h-3.5 w-3.5" />
        Health unavailable: {error instanceof Error ? error.message : "Unknown error"}
        <span className="opacity-70">→ open Health</span>
      </Link>
    );
  }
  if (!data) return null;
  const degraded = data.providers.filter((p) => p.status !== "ok");
  const failures = data.failures_24h;
  const critical = data.api.status === "down" || data.db.status === "down";

  if (!degraded.length && !failures && !critical) return null;

  const tone = critical ? "bg-status-danger text-status-danger-foreground" : "bg-status-warn-muted text-status-warn border-b border-status-warn/30";

  return (
    <Link to="/health" className={`flex items-center justify-center gap-2 px-4 py-1 text-xs font-medium ${tone}`}>
      <AlertTriangle className="h-3.5 w-3.5" />
      {critical
        ? "Critical: API or DB unreachable"
        : `${degraded.length ? `${degraded.length} provider(s) degraded` : ""}${degraded.length && failures ? " · " : ""}${failures ? `${failures} failures in last 24h` : ""}`}
      <span className="opacity-70">→ open Health</span>
    </Link>
  );
}
