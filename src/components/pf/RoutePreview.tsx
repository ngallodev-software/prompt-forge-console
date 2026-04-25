import type { CSSProperties, ReactNode } from "react";
import { Route } from "lucide-react";
import { getRouteStatusTone, type StatusTone } from "@/lib/route-status-utils";

export interface RoutePreviewProps {
  note: {
    id: string;
    deliveryId?: string | null;
    // intake-note fields from voice routing
  };
  route: {
    routeStatus: string;
    routeStatusLabel: string;
    routeSummary: string;
    sourceFolder: string;
    routeFamily: string | null;
    routeTarget: string | null;
    routeContext: string;
    replayState: string;
    replayable: boolean;
  };
  kanbanReady: boolean;
  kanbanBinding: {
    baseUrl: string | null;
    workspaceId: string | null;
  };
  scope: {
    kind: "global" | "project";
    projectId: string | null;
    projectName: string | null;
  };
}

type Tone = StatusTone;

const toneStyles: Record<StatusTone, CSSProperties> = {
  success: {
    backgroundColor: "var(--color-status-green)",
    color: "#FFFFFF",
  },
  warn: {
    backgroundColor: "var(--color-status-orange)",
    color: "#FFFFFF",
  },
  danger: {
    backgroundColor: "var(--color-status-red)",
    color: "#FFFFFF",
  },
};

function emptyValue(value: string | null | undefined, fallback: string) {
  const trimmed = typeof value === "string" ? value.trim() : "";
  return trimmed ? trimmed : fallback;
}

function Cell({
  label,
  value,
  code = false,
  className = "",
}: {
  label: string;
  value: string;
  code?: boolean;
  className?: string;
}) {
  return (
    <div className={`rounded-md border border-border px-3 py-3 ${className}`.trim()}>
      <div className="text-xs font-medium leading-tight uppercase tracking-wider">
        {label}
      </div>
      <div className={code ? "mt-1 text-[13px] leading-snug font-mono" : "mt-1 text-sm leading-normal"}>
        {value}
      </div>
    </div>
  );
}

function Badge({
  tone,
  children,
}: {
  tone: Tone;
  children: ReactNode;
}) {
  return (
    <span
      className="inline-flex items-center rounded-full px-3 py-1 text-xs font-medium leading-tight uppercase tracking-wider"
      style={toneStyles[tone]}
    >
      {children}
    </span>
  );
}

export function RoutePreview({
  note,
  route,
  kanbanReady,
  kanbanBinding,
  scope,
}: RoutePreviewProps) {
  const statusTone = getRouteStatusTone(route.routeStatus);
  const reviewHref = note.deliveryId ? `/deliveries?id=${encodeURIComponent(note.deliveryId)}` : null;

  return (
    <section className="rounded-xl border border-border bg-surface-2 p-3">
      <div className="space-y-4">
        <header className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-surface-1">
              <Route className="h-4 w-4" />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-normal leading-normal">
                Route preview
              </h3>
              <p className="text-sm leading-normal">
                {emptyValue(route.routeSummary, "—")}
              </p>
            </div>
          </div>
          <Badge tone={statusTone}>{emptyValue(route.routeStatusLabel, route.routeStatus || "unknown")}</Badge>
        </header>

        <div className="grid gap-4 sm:grid-cols-2">
          <Cell label="Source folder" value={emptyValue(route.sourceFolder, "—")} code />
          <Cell label="Route family" value={emptyValue(route.routeFamily, "unsupported")} code />
          <Cell label="Route target" value={emptyValue(route.routeTarget, "—")} code />
          <Cell label="Route context" value={emptyValue(route.routeContext, "—")} code />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Cell
            label="Replay state"
            value={`${emptyValue(route.replayState, "—")}${route.replayable ? " · replayable" : " · not replayable"}`}
            className="bg-surface-1"
          />
          <Cell
            label="Kanban binding"
            value={
              kanbanReady
                ? `${emptyValue(kanbanBinding.baseUrl, "unset")} · ${emptyValue(kanbanBinding.workspaceId, "unset")}`
                : `Unavailable · ${emptyValue(kanbanBinding.baseUrl, "unset")} · ${emptyValue(kanbanBinding.workspaceId, "unset")}`
            }
            className="bg-surface-1"
          />
        </div>

        <div className="flex flex-wrap gap-3">
          <a
            className="inline-flex min-h-9 items-center justify-center rounded-md border border-border bg-transparent px-3 text-xs font-medium leading-tight no-underline transition-colors hover:bg-surface-1"
            href={`/pipeline/${encodeURIComponent(note.id)}`}
          >
            Open pipeline
          </a>
          {reviewHref ? (
            <a
              className="inline-flex min-h-9 items-center justify-center rounded-md border border-border bg-transparent px-3 text-xs font-medium leading-tight no-underline transition-colors hover:bg-surface-1"
              href={reviewHref}
            >
              Review delivery
            </a>
          ) : null}
        </div>

        <footer className="flex flex-wrap items-center gap-3">
          <Badge tone={scope.kind === "project" ? "success" : "warn"}>{scope.kind}</Badge>
          <div className="text-xs font-medium leading-tight uppercase tracking-wider">
            {scope.kind === "project"
              ? `${emptyValue(scope.projectName, "Untitled project")} · ${emptyValue(scope.projectId, "unset")}`
              : "Global fallback scope"}
          </div>
        </footer>
      </div>
    </section>
  );
}

export default RoutePreview;
