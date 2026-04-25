import { useEffect, useState, type Dispatch, type SetStateAction } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { DatabaseZap, RotateCcw, ServerCog, Trash2 } from "lucide-react";

import { cn } from "@/lib/utils";
import { PageBody, PageHeader } from "@/components/shell/PageHeader";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DangerZoneCard } from "@/components/pf/DangerZoneCard";
import { ErrorState } from "@/components/pf/ErrorState";
import { ConfirmationModal } from "@/components/pf/ConfirmationModal";
import { PermissionGuard } from "@/components/pf/PermissionGuard";
import { HelpTip } from "@/components/pf/HelpTip";
import { ScopeBadge } from "@/components/pf/ScopeBadge";
import { KanbanIntegrationPanel } from "@/components/pf/KanbanIntegrationPanel";
import {
  getConsoleRuntimeSnapshot,
  getConsoleSettings,
  listProjects,
  patchConsoleRuntimeSettings,
  patchConsoleSecretSettings,
  purgeArchivedNotes,
  qk,
} from "@/services/promptforge";
import { RUNTIME_ENVIRONMENT } from "@/services/promptforge/config";
import type { BackendConsoleSettingsResponse, PfScope, Project, Role } from "@/services/promptforge/types";
import { type Theme, useAppStore } from "@/stores/app-store";
import { toast } from "@/hooks/use-toast";
import { sanitizeErrorMessage } from "@/lib/error-utils";

const ROLE_OPTIONS: Array<{ value: Role; label: string; hint: string }> = [
  { value: "viewer", label: "Viewer", hint: "Read-only access." },
  { value: "operator", label: "Operator", hint: "Operational mutations and retries." },
  { value: "admin", label: "Admin", hint: "Admin-only controls and destructive actions." },
];

const THEME_OPTIONS: Array<{ value: Theme; label: string }> = [
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
];

const ENV_OPTIONS = ["dev", "staging", "prod"] as const;

const LLM_MODE_OPTIONS = [
  "deterministic_only",
  "deterministic_plus_review",
  "llm_inference_optional",
] as const;

const CODEX_REASONING_OPTIONS = ["low", "medium", "high"] as const;

const SECRET_STATUS = [
  { key: "OPENAI_API_KEY", owner: "Backend secret store" },
  { key: "ANTHROPIC_API_KEY", owner: "Backend secret store" },
  { key: "PROMPTFORGE_OPENAI_COMPAT_API_KEY", owner: "Backend secret store" },
  { key: "PROMPTFORGE_OLLAMA_API_KEY", owner: "Backend secret store" },
];

type SettingsTab = "runtime" | "secrets" | "integrations" | "projects";

type RuntimeDraft = {
  obsidianVaultPath: string;
  webhookUrl: string;
  llmMode: (typeof LLM_MODE_OPTIONS)[number];
  codexBinary: string;
  codexReasoningEffort: (typeof CODEX_REASONING_OPTIONS)[number];
  openaiBaseUrl: string;
  anthropicBaseUrl: string;
  kanbanBaseUrl: string;
  kanbanWorkspaceId: string;
  kanbanPasscode: string;
};

type SecretDraft = Record<string, string>;

type IntegrationsDraft = {
  baseUrl: string;
  workspaceId: string;
  passcode: string;
};

type ProjectsDraft = {
  rows: Project[];
  newName: string;
  newSlug: string;
  newDescription: string;
};

function RuntimeTab({
  runtime,
  backendSettings,
  backendSettingsError,
  projects,
  hasProjects,
  projectsError,
  selectedProject,
  settingsScope,
  settingsProjectId,
  canEditRuntime,
  runtimeDraft,
  runtimeBusy,
  onRuntimeDraftChange,
  onSaveRuntime,
  theme,
  setTheme,
  role,
  setRole,
  workspace,
  setWorkspace,
  environment,
  setEnvironment,
  pollingMs,
  setPollingMs,
  debug,
  setDebug,
  useMockData,
  setUseMockData,
  consoleSettings,
  updateConsoleSettings,
  resetConsoleSettings,
  resetOperatorPreferences,
}: {
  runtime: ReturnType<typeof getConsoleRuntimeSnapshot>;
  backendSettings: BackendConsoleSettingsResponse | undefined;
  backendSettingsError: unknown;
  projects: Project[];
  hasProjects: boolean;
  projectsError: unknown;
  selectedProject: Project | null;
  settingsScope: PfScope;
  settingsProjectId: string | null;
  canEditRuntime: boolean;
  runtimeDraft: RuntimeDraft | null;
  runtimeBusy: boolean;
  onRuntimeDraftChange: (next: RuntimeDraft | null) => void;
  onSaveRuntime: () => Promise<void>;
  theme: Theme;
  setTheme: (value: Theme) => void;
  role: Role;
  setRole: (value: Role) => void;
  workspace: { scope: "global" | "project"; projectId: string | null };
  setWorkspace: (value: { scope: "global" | "project"; projectId: string | null }) => void;
  environment: "dev" | "staging" | "prod";
  setEnvironment: (value: "dev" | "staging" | "prod") => void;
  pollingMs: number;
  setPollingMs: (value: number) => void;
  debug: boolean;
  setDebug: (value: boolean) => void;
  useMockData: boolean;
  setUseMockData: (value: boolean) => void;
  consoleSettings: { apiBaseUrl: string; bootstrapPath: string };
  updateConsoleSettings: (patch: Partial<{ apiBaseUrl: string; bootstrapPath: string }>) => void;
  resetConsoleSettings: () => void;
  resetOperatorPreferences: () => void;
}) {
  return (
    <div className="space-y-4">
      <div className="grid gap-4 xl:grid-cols-2">
        <Card className="space-y-4 p-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold">Binding scope</h3>
              <ScopeBadge value={settingsScope} />
            </div>
            <p className="text-xs text-muted-foreground">
              Kanban binding is edited in the same scope that owns the current console settings. Project-scoped settings stay attached to the selected project.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-md border px-3 py-2">
              <div className="text-xs uppercase tracking-wider text-muted-foreground">Current scope</div>
              <div className="mt-1 text-sm font-medium capitalize">{settingsScope}</div>
            </div>
            <div className="rounded-md border px-3 py-2">
              <div className="text-xs uppercase tracking-wider text-muted-foreground">Project</div>
              <div className="mt-1 text-sm font-medium">{settingsScope === "project" ? selectedProject?.name ?? "Project missing" : "Not project-scoped"}</div>
            </div>
          </div>

          <div className="space-y-1.5 sm:col-span-2">
            <Label className="text-xs uppercase tracking-wider text-muted-foreground">Workspace</Label>
            <HelpTip label="Workspace help" content="Chooses whether the console operates globally or within a specific project scope." />
            <Select
              value={workspace.scope === "global" ? "global" : workspace.projectId ?? "global"}
              onValueChange={(value) =>
                setWorkspace(value === "global" ? { scope: "global", projectId: null } : { scope: "project", projectId: value })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select workspace" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="global">Global workspace</SelectItem>
                {projects.map((project) => (
                  <SelectItem key={project.id} value={project.id}>
                    {project.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {!hasProjects && (
              <ErrorState
                className="mt-3"
                title="No projects returned"
                message={projectsError ? sanitizeErrorMessage(projectsError) : "The backend returned an empty projects list, so project-scoped workspace selection is unavailable."}
              />
            )}
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold">Local console connectivity</h3>
              <Badge variant="outline">Browser persisted</Badge>
            </div>
          </div>

          <div className="grid gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="apiBaseUrl" className="text-xs uppercase tracking-wider text-muted-foreground">API base URL</Label>
              <Input
                id="apiBaseUrl"
                value={consoleSettings.apiBaseUrl}
                onChange={(e) => updateConsoleSettings({ apiBaseUrl: e.target.value })}
                className="font-mono text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="bootstrapPath" className="text-xs uppercase tracking-wider text-muted-foreground">Bootstrap path</Label>
              <Input
                id="bootstrapPath"
                value={consoleSettings.bootstrapPath}
                onChange={(e) => updateConsoleSettings({ bootstrapPath: e.target.value })}
                className="font-mono text-sm"
              />
            </div>
            <div className="flex items-center justify-between gap-3 rounded-md border px-3 py-2 sm:col-span-2">
              <Label htmlFor="useMockData" className="space-y-0.5">
                <div>Use mock data</div>
                <div className="text-xs text-muted-foreground">Disable to surface backend errors directly.</div>
              </Label>
              <Switch id="useMockData" checked={useMockData} onCheckedChange={setUseMockData} />
            </div>
          </div>

          <div className="grid gap-2 rounded-md border bg-muted/20 p-3 text-xs text-muted-foreground">
            <div className="flex items-center justify-between gap-3">
              <span>Effective request base</span>
              <span className="font-mono">{runtime.apiBaseUrl}</span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span>Hydration cache TTL</span>
              <span className="font-mono">{runtime.hydrationTtlMs}ms</span>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 rounded-md border px-3 py-2">
            <p className="text-xs text-muted-foreground">Reset browser-owned connection values.</p>
            <Button variant="outline" size="sm" onClick={resetConsoleSettings}>
              <RotateCcw className="mr-1 h-3.5 w-3.5" />
              Reset connection defaults
            </Button>
          </div>
        </Card>

        <Card className="space-y-4 p-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold">Operator preferences</h3>
              <Badge variant="outline">Browser persisted</Badge>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">Theme</Label>
              <Select value={theme} onValueChange={(value) => setTheme(value as Theme)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select theme" />
                </SelectTrigger>
                <SelectContent>
                  {THEME_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">Role</Label>
              <Select value={role} onValueChange={(value) => setRole(value as Role)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  {ROLE_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">{ROLE_OPTIONS.find((option) => option.value === role)?.hint}</p>
            </div>

            <div className="space-y-1.5 sm:col-span-2">
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">Environment badge</Label>
              <div className="grid grid-cols-3 gap-2">
                {ENV_OPTIONS.map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => setEnvironment(option)}
                    className={`rounded border px-3 py-2 text-xs font-mono uppercase ${
                      environment === option ? "border-primary bg-primary/10 text-primary" : "border-border"
                    }`}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="polling" className="text-xs uppercase tracking-wider text-muted-foreground">Polling interval (ms)</Label>
              <Input
                id="polling"
                type="number"
                min={1000}
                step={500}
                value={pollingMs}
                onChange={(e) => setPollingMs(Number(e.target.value))}
                className="font-mono text-sm"
              />
            </div>

            <div className="flex items-center justify-between gap-3 rounded-md border px-3 py-2 sm:col-span-2">
              <Label htmlFor="debug" className="space-y-0.5">
                <div>Query inspector</div>
                <div className="text-xs text-muted-foreground">Shows query overlays and diagnostics.</div>
              </Label>
              <Switch id="debug" checked={debug} onCheckedChange={setDebug} />
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 rounded-md border px-3 py-2">
            <p className="text-xs text-muted-foreground">Reset theme, role, workspace, debug, polling, and environment.</p>
            <Button variant="outline" size="sm" onClick={resetOperatorPreferences}>
              <RotateCcw className="mr-1 h-3.5 w-3.5" />
              Reset operator defaults
            </Button>
          </div>
        </Card>
      </div>

      <Card className="space-y-4 p-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold">Runtime status</h3>
            <Badge variant="outline">Read-only</Badge>
          </div>
        </div>
        <div className="grid gap-2 md:grid-cols-3">
          <div className="rounded-md border px-3 py-2">
            <div className="text-sm font-medium">Detected runtime</div>
            <div className="font-mono text-xs text-muted-foreground">{RUNTIME_ENVIRONMENT}</div>
          </div>
          <div className="rounded-md border px-3 py-2">
            <div className="text-sm font-medium">Strict backend</div>
            <div className="font-mono text-xs text-muted-foreground">{runtime.strictBackend ? "enabled" : "disabled"}</div>
          </div>
          <div className="rounded-md border px-3 py-2">
            <div className="text-sm font-medium">Bootstrap source</div>
            <div className="font-mono text-xs text-muted-foreground">{`${runtime.apiBaseUrl}${runtime.bootstrapPath}`}</div>
          </div>
        </div>
      </Card>

      <Card className="space-y-4 p-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold">Backend-managed runtime configuration</h3>
            <Badge variant="outline">{canEditRuntime ? "Editable" : "Read-only"}</Badge>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <span>Active scope:</span>
            <ScopeBadge value={settingsScope} />
            <span className="font-mono">{settingsProjectId ?? "global"}</span>
          </div>
        </div>

        {backendSettingsError && (
          <ErrorState
            title="Backend runtime settings unavailable"
            message={sanitizeErrorMessage(backendSettingsError)}
          />
        )}

        <div className="grid gap-3 md:grid-cols-2">
          <div className="space-y-1.5 md:col-span-2">
            <Label className="text-xs uppercase tracking-wider text-muted-foreground">Obsidian vault path</Label>
            <Input
              value={runtimeDraft?.obsidianVaultPath ?? ""}
              disabled={!runtimeDraft || !canEditRuntime}
              onChange={(e) => onRuntimeDraftChange(runtimeDraft ? { ...runtimeDraft, obsidianVaultPath: e.target.value } : runtimeDraft)}
              className="font-mono text-sm"
            />
          </div>
          <div className="space-y-1.5 md:col-span-2">
            <Label className="text-xs uppercase tracking-wider text-muted-foreground">Webhook URL</Label>
            <Input
              value={runtimeDraft?.webhookUrl ?? ""}
              disabled={!runtimeDraft || !canEditRuntime}
              onChange={(e) => onRuntimeDraftChange(runtimeDraft ? { ...runtimeDraft, webhookUrl: e.target.value } : runtimeDraft)}
              className="font-mono text-sm"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs uppercase tracking-wider text-muted-foreground">LLM mode</Label>
            <Select
              value={runtimeDraft?.llmMode ?? "deterministic_only"}
              onValueChange={(value) => onRuntimeDraftChange(runtimeDraft ? { ...runtimeDraft, llmMode: value as RuntimeDraft["llmMode"] } : runtimeDraft)}
              disabled={!runtimeDraft || !canEditRuntime}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select LLM mode" />
              </SelectTrigger>
              <SelectContent>
                {LLM_MODE_OPTIONS.map((option) => (
                  <SelectItem key={option} value={option}>{option}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs uppercase tracking-wider text-muted-foreground">Codex reasoning effort</Label>
            <Select
              value={runtimeDraft?.codexReasoningEffort ?? "medium"}
              onValueChange={(value) => onRuntimeDraftChange(runtimeDraft ? { ...runtimeDraft, codexReasoningEffort: value as RuntimeDraft["codexReasoningEffort"] } : runtimeDraft)}
              disabled={!runtimeDraft || !canEditRuntime}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select effort" />
              </SelectTrigger>
              <SelectContent>
                {CODEX_REASONING_OPTIONS.map((option) => (
                  <SelectItem key={option} value={option}>{option}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs uppercase tracking-wider text-muted-foreground">Codex binary</Label>
            <Input
              value={runtimeDraft?.codexBinary ?? ""}
              disabled={!runtimeDraft || !canEditRuntime}
              onChange={(e) => onRuntimeDraftChange(runtimeDraft ? { ...runtimeDraft, codexBinary: e.target.value } : runtimeDraft)}
              className="font-mono text-sm"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs uppercase tracking-wider text-muted-foreground">OpenAI base URL</Label>
            <Input
              value={runtimeDraft?.openaiBaseUrl ?? ""}
              disabled={!runtimeDraft || !canEditRuntime}
              onChange={(e) => onRuntimeDraftChange(runtimeDraft ? { ...runtimeDraft, openaiBaseUrl: e.target.value } : runtimeDraft)}
              className="font-mono text-sm"
            />
          </div>
          <div className="space-y-1.5 md:col-span-2">
            <Label className="text-xs uppercase tracking-wider text-muted-foreground">Anthropic base URL</Label>
            <Input
              value={runtimeDraft?.anthropicBaseUrl ?? ""}
              disabled={!runtimeDraft || !canEditRuntime}
              onChange={(e) => onRuntimeDraftChange(runtimeDraft ? { ...runtimeDraft, anthropicBaseUrl: e.target.value } : runtimeDraft)}
              className="font-mono text-sm"
            />
          </div>
        </div>

        <div className="flex items-center justify-between gap-3">
          <p className="text-xs text-muted-foreground">
            {canEditRuntime ? "Backend runtime editor is live for the current workspace." : "Runtime editing is disabled by backend permissions."}
          </p>
          <Button onClick={() => void onSaveRuntime()} disabled={!runtimeDraft || !canEditRuntime || runtimeBusy}>
            {runtimeBusy ? "Saving..." : "Save runtime"}
          </Button>
        </div>
      </Card>
    </div>
  );
}

function SecretsTab({
  secretDraft,
  setSecretDraft,
  backendSettings,
  canEditSecrets,
  secretBusy,
  onSaveSecrets,
}: {
  secretDraft: SecretDraft;
  setSecretDraft: Dispatch<SetStateAction<SecretDraft>>;
  backendSettings: BackendConsoleSettingsResponse | undefined;
  canEditSecrets: boolean;
  secretBusy: boolean;
  onSaveSecrets: () => Promise<void>;
}) {
  return (
    <Card className="space-y-4 p-4">
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold">Backend-managed secrets</h3>
          <Badge variant="outline">{canEditSecrets ? "Editable" : "Read-only"}</Badge>
        </div>
        <p className="text-xs text-muted-foreground">Secret material stays server-side. Enter new values to rotate configured keys.</p>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        {SECRET_STATUS.map((item) => (
          <div key={item.key} className="rounded-md border px-3 py-2">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-sm font-medium">{item.key}</div>
                <div className="text-xs text-muted-foreground">{item.owner}</div>
              </div>
              <Badge variant={backendSettings?.secrets[item.key]?.configured ? "default" : "outline"}>
                {backendSettings?.secrets[item.key]?.configured ? "configured" : "missing"}
              </Badge>
            </div>
            <div className="mt-2 space-y-1.5">
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">Rotate value</Label>
              <Input
                type="password"
                value={secretDraft[item.key] ?? ""}
                disabled={!canEditSecrets}
                onChange={(e) => setSecretDraft((cur) => ({ ...cur, [item.key]: e.target.value }))}
                placeholder="Enter new secret value"
              />
            </div>
          </div>
        ))}
      </div>
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs text-muted-foreground">
          {canEditSecrets ? "Rotation writes encrypted values to the backend." : "Secret rotation is disabled by backend permissions."}
        </p>
        <Button onClick={() => void onSaveSecrets()} disabled={!canEditSecrets || secretBusy}>
          {secretBusy ? "Rotating..." : "Rotate secrets"}
        </Button>
      </div>
    </Card>
  );
}

function IntegrationsTab({
  draft,
  binding,
  canEditRuntime,
  integrationsBusy,
  onSubmit,
}: {
  draft: IntegrationsDraft;
  binding: { scope: "global" | "project"; projectId: string | null; projectName: string | null };
  canEditRuntime: boolean;
  integrationsBusy: boolean;
  onSubmit: (next: IntegrationsDraft) => Promise<void>;
}) {
  return (
    <div className="space-y-3">
      {!canEditRuntime && (
        <ErrorState
          title="Integrations are read-only"
          message="Runtime update permissions are disabled for the current scope."
        />
      )}
      <div className={cn(!canEditRuntime && "pointer-events-none opacity-70")}>
        <KanbanIntegrationPanel
          initialDraft={draft}
          binding={binding}
          onSubmit={(next) => void onSubmit(next)}
        />
      </div>
      {integrationsBusy && <p className="text-xs text-muted-foreground">Saving integration settings…</p>}
    </div>
  );
}

function ProjectsTab({
  draft,
  setDraft,
  workspace,
  setWorkspace,
}: {
  draft: ProjectsDraft;
  setDraft: Dispatch<SetStateAction<ProjectsDraft>>;
  workspace: { scope: "global" | "project"; projectId: string | null };
  setWorkspace: (value: { scope: "global" | "project"; projectId: string | null }) => void;
}) {
  return (
    <div className="space-y-4">
      <Card className="space-y-4 p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold">Projects draft CRUD</h3>
            <p className="text-xs text-muted-foreground">Draft-only foundation for create/update/delete workflows.</p>
          </div>
          <Badge variant="outline">Draft only</Badge>
        </div>

        <div className="grid gap-2 md:grid-cols-3">
          <Input
            placeholder="Project name"
            value={draft.newName}
            onChange={(e) => setDraft((cur) => ({ ...cur, newName: e.target.value }))}
          />
          <Input
            placeholder="Slug"
            value={draft.newSlug}
            onChange={(e) => setDraft((cur) => ({ ...cur, newSlug: e.target.value }))}
          />
          <Input
            placeholder="Description"
            value={draft.newDescription}
            onChange={(e) => setDraft((cur) => ({ ...cur, newDescription: e.target.value }))}
          />
        </div>

        <div className="flex justify-end">
          <Button
            variant="secondary"
            onClick={() => {
              if (!draft.newName.trim() || !draft.newSlug.trim()) return;
              const id = `draft-${Date.now()}`;
              setDraft((cur) => ({
                ...cur,
                rows: [
                  ...cur.rows,
                  {
                    id,
                    name: cur.newName.trim(),
                    slug: cur.newSlug.trim(),
                    description: cur.newDescription.trim(),
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                  },
                ],
                newName: "",
                newSlug: "",
                newDescription: "",
              }));
            }}
          >
            Add draft project
          </Button>
        </div>
      </Card>

      <Card className="space-y-3 p-4">
        {draft.rows.length === 0 && <p className="text-sm text-muted-foreground">No projects in draft.</p>}
        {draft.rows.map((project) => (
          <div key={project.id} className="grid gap-2 rounded-md border p-3 md:grid-cols-[1fr_1fr_auto_auto]">
            <Input
              value={project.name}
              onChange={(e) =>
                setDraft((cur) => ({
                  ...cur,
                  rows: cur.rows.map((row) => (row.id === project.id ? { ...row, name: e.target.value, updated_at: new Date().toISOString() } : row)),
                }))
              }
            />
            <Input
              value={project.slug}
              onChange={(e) =>
                setDraft((cur) => ({
                  ...cur,
                  rows: cur.rows.map((row) => (row.id === project.id ? { ...row, slug: e.target.value, updated_at: new Date().toISOString() } : row)),
                }))
              }
            />
            <Button
              variant="outline"
              onClick={() => setWorkspace({ scope: "project", projectId: project.id })}
            >
              {workspace.scope === "project" && workspace.projectId === project.id ? "Active" : "Set scope"}
            </Button>
            <Button
              variant="destructive"
              onClick={() =>
                setDraft((cur) => ({
                  ...cur,
                  rows: cur.rows.filter((row) => row.id !== project.id),
                }))
              }
            >
              Delete
            </Button>
          </div>
        ))}
      </Card>
    </div>
  );
}

export default function Settings() {
  const runtime = getConsoleRuntimeSnapshot();
  const qc = useQueryClient();
  const {
    theme,
    setTheme,
    role,
    setRole,
    workspace,
    setWorkspace,
    debug,
    setDebug,
    pollingMs,
    setPollingMs,
    environment,
    setEnvironment,
    useMockData,
    setUseMockData,
    consoleSettings,
    updateConsoleSettings,
    resetConsoleSettings,
    resetOperatorPreferences,
  } = useAppStore();

  const settingsScope: PfScope = workspace.scope;
  const settingsProjectId = workspace.scope === "project" ? workspace.projectId ?? null : null;

  const {
    data: projects = [],
    error: projectsError,
  } = useQuery({
    queryKey: qk.projects,
    queryFn: listProjects,
    throwOnError: false,
  });

  const {
    data: backendSettings,
    error: backendSettingsError,
  } = useQuery({
    queryKey: qk.settings(settingsScope, settingsProjectId),
    queryFn: () => getConsoleSettings(settingsScope, settingsProjectId),
    throwOnError: false,
  });

  const hasProjects = projects.length > 0;
  const selectedProject = workspace.scope === "project" ? projects.find((project) => project.id === workspace.projectId) ?? null : null;

  const [activeTab, setActiveTab] = useState<SettingsTab>("runtime");
  const [runtimeDraft, setRuntimeDraft] = useState<RuntimeDraft | null>(null);
  const [secretsDraft, setSecretsDraft] = useState<SecretDraft>({});
  const [integrationsDraft, setIntegrationsDraft] = useState<IntegrationsDraft>({ baseUrl: "", workspaceId: "", passcode: "" });
  const [projectsDraft, setProjectsDraft] = useState<ProjectsDraft>({ rows: [], newName: "", newSlug: "", newDescription: "" });

  const [runtimeBusy, setRuntimeBusy] = useState(false);
  const [secretBusy, setSecretBusy] = useState(false);
  const [integrationsBusy, setIntegrationsBusy] = useState(false);

  useEffect(() => {
    if (!backendSettings) return;
    setRuntimeDraft({
      obsidianVaultPath: backendSettings.runtime.obsidianVaultPath,
      webhookUrl: backendSettings.runtime.webhookUrl,
      llmMode: backendSettings.runtime.llmMode as RuntimeDraft["llmMode"],
      codexBinary: backendSettings.runtime.codexBinary,
      codexReasoningEffort: backendSettings.runtime.codexReasoningEffort as RuntimeDraft["codexReasoningEffort"],
      openaiBaseUrl: backendSettings.runtime.openaiBaseUrl,
      anthropicBaseUrl: backendSettings.runtime.anthropicBaseUrl,
      kanbanBaseUrl: backendSettings.runtime.kanbanBaseUrl,
      kanbanWorkspaceId: backendSettings.runtime.kanbanWorkspaceId,
      kanbanPasscode: backendSettings.runtime.kanbanPasscode,
    });
    setIntegrationsDraft({
      baseUrl: backendSettings.runtime.kanbanBaseUrl,
      workspaceId: backendSettings.runtime.kanbanWorkspaceId,
      passcode: backendSettings.runtime.kanbanPasscode,
    });
    setSecretsDraft({});
  }, [backendSettings]);

  useEffect(() => {
    setProjectsDraft((cur) => {
      if (cur.rows.length > 0) return cur;
      return { ...cur, rows: projects };
    });
  }, [projects]);

  const canEditRuntime = backendSettings?.permissions.can_update_runtime ?? false;
  const canEditSecrets = backendSettings?.permissions.can_rotate_secrets ?? false;

  const saveRuntime = async () => {
    if (!runtimeDraft) return;
    setRuntimeBusy(true);
    try {
      await patchConsoleRuntimeSettings(
        {
          obsidianVaultPath: runtimeDraft.obsidianVaultPath,
          webhookUrl: runtimeDraft.webhookUrl,
          llmMode: runtimeDraft.llmMode,
          codexBinary: runtimeDraft.codexBinary,
          codexReasoningEffort: runtimeDraft.codexReasoningEffort,
          openaiBaseUrl: runtimeDraft.openaiBaseUrl,
          anthropicBaseUrl: runtimeDraft.anthropicBaseUrl,
        },
        settingsScope,
        settingsProjectId,
      );
      toast({ title: "Runtime settings saved", description: "Backend-managed settings updated." });
      await qc.invalidateQueries({ queryKey: qk.settings(settingsScope, settingsProjectId) });
    } catch (error) {
      toast({ title: "Runtime save failed", description: sanitizeErrorMessage(error) });
    } finally {
      setRuntimeBusy(false);
    }
  };

  const saveSecrets = async () => {
    const payload = Object.fromEntries(Object.entries(secretsDraft).filter(([, value]) => value.trim().length > 0));
    if (Object.keys(payload).length === 0) {
      toast({ title: "No secrets to rotate", description: "Enter at least one secret value before saving." });
      return;
    }
    setSecretBusy(true);
    try {
      await patchConsoleSecretSettings(payload, settingsScope, settingsProjectId);
      toast({ title: "Secrets rotated", description: `${Object.keys(payload).length} secret(s) updated.` });
      setSecretsDraft({});
      await qc.invalidateQueries({ queryKey: qk.settings(settingsScope, settingsProjectId) });
    } catch (error) {
      toast({ title: "Secret rotation failed", description: sanitizeErrorMessage(error) });
    } finally {
      setSecretBusy(false);
    }
  };

  const saveIntegrations = async (next: IntegrationsDraft) => {
    setIntegrationsDraft(next);
    setIntegrationsBusy(true);
    try {
      await patchConsoleRuntimeSettings(
        {
          kanbanBaseUrl: next.baseUrl,
          kanbanWorkspaceId: next.workspaceId,
          kanbanPasscode: next.passcode,
        },
        settingsScope,
        settingsProjectId,
      );
      setRuntimeDraft((cur) => (cur ? { ...cur, kanbanBaseUrl: next.baseUrl, kanbanWorkspaceId: next.workspaceId, kanbanPasscode: next.passcode } : cur));
      toast({ title: "Integration settings saved", description: "Kanban binding updated." });
      await qc.invalidateQueries({ queryKey: qk.settings(settingsScope, settingsProjectId) });
    } catch (error) {
      toast({ title: "Integration save failed", description: sanitizeErrorMessage(error) });
    } finally {
      setIntegrationsBusy(false);
    }
  };

  const bindingScope = {
    scope: settingsScope === "project" ? "project" : "global",
    projectId: settingsProjectId,
    projectName: settingsScope === "project" ? selectedProject?.name ?? null : null,
  } as const;

  return (
    <>
      <PageHeader
        title="Settings"
        description="Local console preferences and backend settings."
        help={{ label: "Settings help", content: "Use tabs to edit runtime, secrets, integrations, and project drafts." }}
      />
      <PageBody>
        <div className="rounded-[var(--radius-lg)] border border-[var(--divider)] bg-[var(--surface-1)]">
          <div className="border-b border-[var(--divider)]">
            <div className="flex flex-wrap gap-[var(--space-2)] p-[var(--space-2)]">
              {(["runtime", "secrets", "integrations", "projects"] as const).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setActiveTab(tab)}
                  className={cn(
                    "px-[var(--space-4)] py-[var(--space-2)] border-b-2 text-sm",
                    activeTab === tab
                      ? "bg-[var(--surface-3)] border-[var(--border-bright)]"
                      : "bg-[var(--surface-2)] border-transparent",
                  )}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <div className="p-[var(--space-4)]">
            <section className={activeTab === "runtime" ? "block" : "hidden"}>
              <RuntimeTab
                runtime={runtime}
                backendSettings={backendSettings}
                backendSettingsError={backendSettingsError}
                projects={projects}
                hasProjects={hasProjects}
                projectsError={projectsError}
                selectedProject={selectedProject}
                settingsScope={settingsScope}
                settingsProjectId={settingsProjectId}
                canEditRuntime={canEditRuntime}
                runtimeDraft={runtimeDraft}
                runtimeBusy={runtimeBusy}
                onRuntimeDraftChange={setRuntimeDraft}
                onSaveRuntime={saveRuntime}
                theme={theme}
                setTheme={setTheme}
                role={role}
                setRole={setRole}
                workspace={workspace}
                setWorkspace={setWorkspace}
                environment={environment}
                setEnvironment={setEnvironment}
                pollingMs={pollingMs}
                setPollingMs={setPollingMs}
                debug={debug}
                setDebug={setDebug}
                useMockData={useMockData}
                setUseMockData={setUseMockData}
                consoleSettings={consoleSettings}
                updateConsoleSettings={updateConsoleSettings}
                resetConsoleSettings={resetConsoleSettings}
                resetOperatorPreferences={resetOperatorPreferences}
              />
            </section>

            <section className={activeTab === "secrets" ? "block" : "hidden"}>
              <SecretsTab
                secretDraft={secretsDraft}
                setSecretDraft={setSecretsDraft}
                backendSettings={backendSettings}
                canEditSecrets={canEditSecrets}
                secretBusy={secretBusy}
                onSaveSecrets={saveSecrets}
              />
            </section>

            <section className={activeTab === "integrations" ? "block" : "hidden"}>
              <IntegrationsTab
                draft={integrationsDraft}
                binding={bindingScope}
                canEditRuntime={canEditRuntime}
                integrationsBusy={integrationsBusy}
                onSubmit={saveIntegrations}
              />
            </section>

            <section className={activeTab === "projects" ? "block" : "hidden"}>
              <ProjectsTab
                draft={projectsDraft}
                setDraft={setProjectsDraft}
                workspace={workspace}
                setWorkspace={setWorkspace}
              />

              <div className="mt-4">
                <PermissionGuard require="admin">
                  <DangerZoneCard title="Admin actions" description="Backend mutations available for admin operators.">
                    <div className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-status-danger/20 bg-background/70 px-3 py-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-sm font-medium">
                          <ServerCog className="h-4 w-4 text-status-danger" />
                          Purge archived notes
                        </div>
                        <p className="text-xs text-muted-foreground">Permanently removes archived notes and dependent rows from the backend.</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">
                          Allowed: <span className="font-mono">{backendSettings?.permissions.can_purge_archived_notes ? "yes" : "no"}</span>
                        </span>
                        <ConfirmationModal
                          trigger={
                            <Button variant="destructive" size="sm" disabled={!backendSettings?.permissions.can_purge_archived_notes}>
                              <Trash2 className="mr-1 h-3.5 w-3.5" />
                              Purge
                            </Button>
                          }
                          title="Purge archived notes?"
                          description="This removes archived notes and related artifacts from the backend."
                          confirmLabel="Purge"
                          destructive
                          onConfirm={async () => {
                            const result = await purgeArchivedNotes();
                            toast({
                              title: "Archived notes purged",
                              description: `Deleted ${Object.values(result.deletedCounts ?? {}).reduce((sum, value) => sum + (value ?? 0), 0)} row(s).`,
                            });
                            await qc.invalidateQueries({ queryKey: ["pf"] });
                          }}
                        />
                      </div>
                    </div>
                    <div className="mt-3 flex flex-wrap items-center justify-between gap-3 rounded-md border px-3 py-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-sm font-medium">
                          <DatabaseZap className="h-4 w-4" />
                          Backend permission summary
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Runtime editing: <span className="font-mono">{canEditRuntime ? "allowed" : "blocked"}</span> · Secret rotation: <span className="font-mono">{canEditSecrets ? "allowed" : "blocked"}</span>
                        </p>
                      </div>
                    </div>
                  </DangerZoneCard>
                </PermissionGuard>
              </div>
            </section>
          </div>
        </div>
      </PageBody>
    </>
  );
}
