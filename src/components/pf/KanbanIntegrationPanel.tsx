import { useState, type ChangeEvent, type FormEvent } from "react";

import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { useKanbanWorkspaceDiscovery } from "@/lib/kanban-discovery";
import { sanitizeErrorMessage } from "@/lib/error-utils";

export interface KanbanIntegrationPanelProps {
  initialDraft: {
    baseUrl: string;
    workspaceId: string;
    passcode: string;
  };
  binding: {
    scope: "global" | "project";
    projectId: string | null;
    projectName: string | null;
  };
  onSubmit: (draft: { baseUrl: string; workspaceId: string; passcode: string }) => void;
}

export function KanbanIntegrationPanel({ initialDraft, binding, onSubmit }: KanbanIntegrationPanelProps) {
  const [draft, setDraft] = useState(initialDraft);
  const discovery = useKanbanWorkspaceDiscovery(draft.baseUrl, draft.passcode);

  const handleBaseUrlChange = (event: ChangeEvent<HTMLInputElement>) => {
    setDraft((current) => ({ ...current, baseUrl: event.target.value }));
  };

  const handleWorkspaceIdChange = (event: ChangeEvent<HTMLInputElement>) => {
    setDraft((current) => ({ ...current, workspaceId: event.target.value }));
  };

  const handlePasscodeChange = (event: ChangeEvent<HTMLInputElement>) => {
    setDraft((current) => ({ ...current, passcode: event.target.value }));
  };

  const handleSave = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onSubmit(draft);
  };

  const scopeLabel = binding.scope === "global" ? "Global fallback scope" : (binding.projectName ?? "Project scope");

  return (
    <form
      onSubmit={handleSave}
      className={cn(
        "rounded-lg border border-[border] bg-[surface-2] p-[4]",
        "space-y-[4]",
      )}
    >
      <div className="flex items-start justify-between gap-[4]">
        <div className="min-w-0 space-y-1">
          <div className="flex items-center gap-2">
            <Badge
              variant="outline"
              className={cn(
                "border-[border] bg-[surface-3] text-[var(--foreground)]",
                "px-2 py-0.5 text-[10px] uppercase tracking-[0.18em]",
              )}
            >
              {binding.scope}
            </Badge>
            <span
              className={cn(
                "text-xs font-medium leading-tight",
                "text-text-primary",
              )}
            >
              Kanban binding scope
            </span>
          </div>
          <p className="truncate text-sm text-muted-foreground">{scopeLabel}</p>
          {binding.projectId ? <p className="truncate font-mono text-xs text-muted-foreground">{binding.projectId}</p> : null}
        </div>
      </div>

      <div className="space-y-[4]">
        <div className="space-y-1.5">
          <label
            htmlFor="kanban-base-url"
            className={cn(
              "block text-xs font-medium leading-tight",
              "text-text-primary",
            )}
          >
            baseUrl
          </label>
          <input
            id="kanban-base-url"
            name="baseUrl"
            type="text"
            value={draft.baseUrl}
            onChange={handleBaseUrlChange}
            className={cn(
              "w-full rounded-[rounded-md] border border-[border] bg-[surface-1] px-3 py-2",
              "text-sm text-text-primary outline-none transition-colors",
              "focus:border-[border-focus] focus:ring-0",
            )}
          />
        </div>

        <div className="space-y-1.5">
          <label
            htmlFor="kanban-workspace-id"
            className={cn(
              "block text-xs font-medium leading-tight",
              "text-text-primary",
            )}
          >
            workspaceId
          </label>
          <input
            id="kanban-workspace-id"
            name="workspaceId"
            type="text"
            value={draft.workspaceId}
            onChange={handleWorkspaceIdChange}
            className={cn(
              "w-full rounded-[rounded-md] border border-[border] bg-[surface-1] px-3 py-2",
              "text-sm text-text-primary outline-none transition-colors",
              "focus:border-[border-focus] focus:ring-0",
            )}
          />
        </div>

        <div className="space-y-1.5">
          <label
            htmlFor="kanban-passcode"
            className={cn(
              "block text-xs font-medium leading-tight",
              "text-text-primary",
            )}
          >
            passcode
          </label>
          <input
            id="kanban-passcode"
            name="passcode"
            type="password"
            value={draft.passcode}
            onChange={handlePasscodeChange}
            className={cn(
              "w-full rounded-[rounded-md] border border-[border] bg-[surface-1] px-3 py-2",
              "text-sm text-text-primary outline-none transition-colors",
              "focus:border-[border-focus] focus:ring-0",
            )}
          />
        </div>

        {discovery.data && discovery.data.workspaces.length > 0 && (
          <div>
            <label className="text-xs">Discovered workspaces</label>
            <select
              className="bg-[surface-3] border border-[border] rounded-[rounded-md] px-2 py-1 w-full"
              value={draft.workspaceId}
              onChange={(e) => {
                const workspace = discovery.data.workspaces.find((w) => w.workspaceId === e.target.value);
                if (workspace) {
                  setDraft((prev) => ({ ...prev, workspaceId: workspace.workspaceId }));
                }
              }}
            >
              <option value="">Select a workspace</option>
              {discovery.data.workspaces.map((ws) => (
                <option key={ws.workspaceId} value={ws.workspaceId}>
                  {ws.name} ({ws.path})
                </option>
              ))}
            </select>
          </div>
        )}

        {discovery.data && draft.workspaceId && (
          <div className="text-sm">
            Current: {discovery.data.workspaces.find((w) => w.workspaceId === draft.workspaceId)?.name ?? draft.workspaceId}
          </div>
        )}

        {discovery.error && (
          <div className="text-sm text-status-red">
            {sanitizeErrorMessage(discovery.error, draft.passcode)}
          </div>
        )}
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          className={cn(
            "inline-flex h-10 items-center justify-center rounded-[rounded-md]",
            "border border-[border] bg-[surface-3] px-4 text-sm font-medium text-text-primary transition-colors",
            "hover:bg-[surface-1] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[border-focus] focus-visible:ring-offset-2",
          )}
        >
          Save
        </button>
      </div>
    </form>
  );
}
