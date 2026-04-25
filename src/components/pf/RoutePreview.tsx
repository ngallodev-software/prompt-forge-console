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
    backgroundColor: "var(--status-green)",
    color: "var(--surface-0)",
  },
  warn: {
    backgroundColor: "var(--status-orange)",
    color: "var(--surface-0)",
  },
  danger: {
    backgroundColor: "var(--status-red)",
    color: "var(--surface-0)",
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
    <div className={`rounded-md border border-[color:var(--border-vf)] px-[var(--space-3)] py-[var(--space-3)] ${className}`.trim()}>
      <div
        className="text-[length:var(--type-label-size)] font-[var(--type-label-weight)] leading-[var(--type-label-line)] uppercase tracking-[0.18em]"
      >
        {label}
      </div>
      <div
        className={
          code
            ? "mt-[var(--space-1)] text-[length:var(--type-code-size)] leading-[var(--type-code-line)]"
            : "mt-[var(--space-1)] text-[length:var(--type-body-size)] leading-[var(--type-body-line)]"
        }
        style={code ? { fontFamily: "var(--font-mono-vf)" } : undefined}
      >
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
      className="inline-flex items-center rounded-full px-[var(--space-3)] py-1 text-[length:var(--type-label-size)] font-[var(--type-label-weight)] leading-[var(--type-label-line)] uppercase tracking-[0.16em]"
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
    <section className="rounded-xl border border-[color:var(--border-vf)] bg-[var(--surface-2)] p-[var(--space-3)]">
      <div className="space-y-[var(--space-4)]">
        <header className="flex flex-wrap items-start justify-between gap-[var(--space-3)]">
          <div className="flex items-center gap-[var(--space-3)]">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-[color:var(--border-vf)] bg-[var(--surface-1)]">
              <Route className="h-4 w-4" />
            </div>
            <div className="space-y-1">
              <h3 className="text-[length:var(--type-body-size)] font-[var(--type-body-weight)] leading-[var(--type-body-line)]">
                Route preview
              </h3>
              <p className="text-[length:var(--type-body-size)] leading-[var(--type-body-line)]">
                {emptyValue(route.routeSummary, "—")}
              </p>
            </div>
          </div>
          <Badge tone={statusTone}>{emptyValue(route.routeStatusLabel, route.routeStatus || "unknown")}</Badge>
        </header>

        <div className="grid gap-[var(--space-4)] sm:grid-cols-2">
          <Cell label="Source folder" value={emptyValue(route.sourceFolder, "—")} code />
          <Cell label="Route family" value={emptyValue(route.routeFamily, "unsupported")} code />
          <Cell label="Route target" value={emptyValue(route.routeTarget, "—")} code />
          <Cell label="Route context" value={emptyValue(route.routeContext, "—")} code />
        </div>

        <div className="grid gap-[var(--space-4)] sm:grid-cols-2">
          <Cell
            label="Replay state"
            value={`${emptyValue(route.replayState, "—")}${route.replayable ? " · replayable" : " · not replayable"}`}
            className="bg-[var(--surface-1)]"
          />
          <Cell
            label="Kanban binding"
            value={
              kanbanReady
                ? `${emptyValue(kanbanBinding.baseUrl, "unset")} · ${emptyValue(kanbanBinding.workspaceId, "unset")}`
                : `Unavailable · ${emptyValue(kanbanBinding.baseUrl, "unset")} · ${emptyValue(kanbanBinding.workspaceId, "unset")}`
            }
            className="bg-[var(--surface-1)]"
          />
        </div>

        <div className="flex flex-wrap gap-[var(--space-3)]">
          <a
            className="inline-flex min-h-9 items-center justify-center rounded-md border border-[color:var(--border-vf)] bg-transparent px-[var(--space-3)] text-[length:var(--type-label-size)] font-[var(--type-label-weight)] leading-[var(--type-label-line)] no-underline transition-colors hover:bg-[var(--surface-1)]"
            href={`/pipeline/${encodeURIComponent(note.id)}`}
          >
            Open pipeline
          </a>
          {reviewHref ? (
            <a
              className="inline-flex min-h-9 items-center justify-center rounded-md border border-[color:var(--border-vf)] bg-transparent px-[var(--space-3)] text-[length:var(--type-label-size)] font-[var(--type-label-weight)] leading-[var(--type-label-line)] no-underline transition-colors hover:bg-[var(--surface-1)]"
              href={reviewHref}
            >
              Review delivery
            </a>
          ) : null}
        </div>

        <footer className="flex flex-wrap items-center gap-[var(--space-3)]">
          <Badge tone={scope.kind === "project" ? "success" : "warn"}>{scope.kind}</Badge>
          <div className="text-[length:var(--type-label-size)] font-[var(--type-label-weight)] leading-[var(--type-label-line)] uppercase tracking-[0.16em]">
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
