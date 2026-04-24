import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { DatabaseZap, RotateCcw, ServerCog, Trash2 } from "lucide-react";
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
import { discoverKanbanWorkspaces, getConsoleRuntimeSnapshot, getConsoleSettings, listProjects, patchConsoleRuntimeSettings, patchConsoleSecretSettings, purgeArchivedNotes, qk } from "@/services/promptforge";
import { RUNTIME_ENVIRONMENT } from "@/services/promptforge/config";
import { type Theme, useAppStore } from "@/stores/app-store";
import type { Role } from "@/services/promptforge/types";
import { toast } from "@/hooks/use-toast";
import type { PfScope } from "@/services/promptforge/types";

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
};

type SecretDraft = Record<string, string>;

function ReadOnlySettingRow({
  label,
  value,
  detail,
}: {
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <div className="rounded-md border px-3 py-2">
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm font-medium">{label}</span>
        <span className="font-mono text-xs text-muted-foreground">{value}</span>
      </div>
      <p className="mt-1 text-xs text-muted-foreground">{detail}</p>
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
  const [runtimeDraft, setRuntimeDraft] = useState<RuntimeDraft | null>(null);
  const [secretDraft, setSecretDraft] = useState<SecretDraft>({});
  const [runtimeBusy, setRuntimeBusy] = useState(false);
  const [secretBusy, setSecretBusy] = useState(false);
  const kanbanDiscoveryBaseUrl = runtimeDraft?.kanbanBaseUrl.trim() ?? "";
  const {
    data: discoveredKanbanWorkspaces,
    error: kanbanWorkspaceError,
    isFetching: isDiscoveringKanbanWorkspaces,
    refetch: refetchKanbanWorkspaces,
  } = useQuery({
    queryKey: qk.kanbanWorkspaces(kanbanDiscoveryBaseUrl),
    queryFn: () => discoverKanbanWorkspaces(kanbanDiscoveryBaseUrl),
    enabled: kanbanDiscoveryBaseUrl.length > 0,
    throwOnError: false,
  });

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
    });
    setSecretDraft({});
  }, [backendSettings]);

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
          kanbanBaseUrl: runtimeDraft.kanbanBaseUrl,
          kanbanWorkspaceId: runtimeDraft.kanbanWorkspaceId,
        },
        settingsScope,
        settingsProjectId,
      );
      toast({ title: "Runtime settings saved", description: "Backend-managed settings updated." });
      await qc.invalidateQueries({ queryKey: qk.settings(settingsScope, settingsProjectId) });
    } catch (error) {
      toast({
        title: "Runtime save failed",
        description: error instanceof Error ? error.message : "Unable to save runtime settings.",
      });
    } finally {
      setRuntimeBusy(false);
    }
  };

  const saveSecrets = async () => {
    const payload = Object.fromEntries(
      Object.entries(secretDraft).filter(([, value]) => value.trim().length > 0),
    );
    if (Object.keys(payload).length === 0) {
      toast({ title: "No secrets to rotate", description: "Enter at least one secret value before saving." });
      return;
    }
    setSecretBusy(true);
    try {
      await patchConsoleSecretSettings(payload, settingsScope, settingsProjectId);
      toast({ title: "Secrets rotated", description: `${Object.keys(payload).length} secret(s) updated.` });
      setSecretDraft({});
      await qc.invalidateQueries({ queryKey: qk.settings(settingsScope, settingsProjectId) });
    } catch (error) {
      toast({
        title: "Secret rotation failed",
        description: error instanceof Error ? error.message : "Unable to rotate secrets.",
      });
    } finally {
      setSecretBusy(false);
    }
  };

  return (
    <>
      <PageHeader
        title="Settings"
        description="Local console preferences are editable here. Backend runtime and secret-bearing settings are server-managed, so this console keeps those sections read-only for now."
        help={{ label: "Settings help", content: "Use this page to tune browser-only preferences and inspect backend/runtime values that are intentionally read-only in the console." }}
      />
      <PageBody>
        <div className="grid gap-4 xl:grid-cols-2">
          <Card className="space-y-4 p-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold">Local console connectivity</h3>
                <Badge variant="outline">Browser persisted</Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                These values are stored in the browser and now drive the frontend service layer directly.
              </p>
            </div>

            <div className="grid gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="apiBaseUrl" className="text-xs uppercase tracking-wider text-muted-foreground">
                  API base URL
                </Label>
                <HelpTip label="API base URL help" content="Base URL used by the frontend service layer. Point this at the reachable backend for the current environment." />
                <Input
                  id="apiBaseUrl"
                  value={consoleSettings.apiBaseUrl}
                  onChange={(e) => updateConsoleSettings({ apiBaseUrl: e.target.value })}
                  className="font-mono text-sm"
                />
                <p className="text-xs text-muted-foreground">Current default from env: <span className="font-mono">{runtime.defaultApiBaseUrl}</span></p>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="bootstrapPath" className="text-xs uppercase tracking-wider text-muted-foreground">
                  Bootstrap path
                </Label>
                <HelpTip label="Bootstrap path help" content="Path used to hydrate the console snapshot on load. This should resolve against the API base URL." />
                <Input
                  id="bootstrapPath"
                  value={consoleSettings.bootstrapPath}
                  onChange={(e) => updateConsoleSettings({ bootstrapPath: e.target.value })}
                  className="font-mono text-sm"
                />
                <p className="text-xs text-muted-foreground">Resolved against the API base. Env default: <span className="font-mono">{runtime.defaultBootstrapPath}</span></p>
              </div>

              <div className="flex items-center justify-between gap-3 rounded-md border px-3 py-2 sm:col-span-2">
                <Label htmlFor="useMockData" className="space-y-0.5">
                  <div>Use mock data</div>
                  <div className="text-xs text-muted-foreground">
                    When off, backend errors surface directly and the console does not substitute mock fallback data.
                  </div>
                </Label>
                <HelpTip label="Mock data help" content="When enabled, the console can fall back to seeded data. Turn this off when validating real backend behavior." />
                <Switch id="useMockData" checked={useMockData} onCheckedChange={setUseMockData} />
              </div>
            </div>

            <div className="grid gap-2 rounded-md border bg-muted/20 p-3 text-xs text-muted-foreground">
              <div className="flex items-center justify-between gap-3">
                <span>Effective request base</span>
                <span className="font-mono">{runtime.apiBaseUrl}</span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span>Effective bootstrap path</span>
                <span className="font-mono">{runtime.bootstrapPath}</span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span>Hydration cache TTL</span>
                <span className="font-mono">{runtime.hydrationTtlMs}ms</span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span>Mock data</span>
                <span className="font-mono">{runtime.mockDataEnabled ? "enabled" : "disabled"}</span>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 rounded-md border px-3 py-2">
              <p className="text-xs text-muted-foreground">Reset only the browser-owned connection values.</p>
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
              <p className="text-xs text-muted-foreground">Theme, role, workspace, environment, and inspection behavior are local UI state.</p>
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
                <HelpTip label="Role help" content="Controls which operator actions the console exposes. Higher roles unlock destructive or backend-managed controls." />
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
                <p className="text-xs text-muted-foreground">
                  {ROLE_OPTIONS.find((option) => option.value === role)?.hint}
                </p>
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
                    message={
                      projectsError instanceof Error
                        ? projectsError.message
                        : "The backend returned an empty projects list, so project-scoped workspace selection is unavailable."
                    }
                  />
                )}
              </div>

              <div className="space-y-1.5 sm:col-span-2">
                <Label className="text-xs uppercase tracking-wider text-muted-foreground">Environment badge</Label>
                <HelpTip label="Environment badge help" content="Purely a UI signal for the active environment. It does not change backend deployment state." />
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
                <Label htmlFor="polling" className="text-xs uppercase tracking-wider text-muted-foreground">
                  Polling interval (ms)
                </Label>
                <HelpTip label="Polling interval help" content="How often the UI refreshes live data. Lower values update faster but create more backend traffic." />
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
                  <div className="text-xs text-muted-foreground">Shows catalog query overlays and extra diagnostics.</div>
                </Label>
                <HelpTip label="Query inspector help" content="Shows the live query and response details used by the page, which helps when diagnosing backend mismatches." />
                <Switch id="debug" checked={debug} onCheckedChange={setDebug} />
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 rounded-md border px-3 py-2">
              <p className="text-xs text-muted-foreground">Reset theme, role, workspace, debug, polling, and environment to local defaults.</p>
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
            <p className="text-xs text-muted-foreground">
              These values describe the current frontend runtime. They are derived from env or code, not editable through this page.
            </p>
          </div>
          <div className="grid gap-2 md:grid-cols-3">
            <ReadOnlySettingRow
              label="Detected runtime"
              value={RUNTIME_ENVIRONMENT}
              detail="Computed from NODE_ENV or browser hostname detection."
            />
            <ReadOnlySettingRow
              label="Strict backend"
              value={runtime.strictBackend ? "enabled" : "disabled"}
              detail="When enabled, API failures stop mock-data fallback."
            />
            <ReadOnlySettingRow
              label="Bootstrap source"
              value={`${runtime.apiBaseUrl}${runtime.bootstrapPath}`}
              detail="Current endpoint used for hydration bootstrap requests."
            />
          </div>
        </Card>

        <Card className="space-y-4 p-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold">Backend-managed runtime configuration</h3>
              <Badge variant="outline">{canEditRuntime ? "Editable" : "Read-only"}</Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              These values persist through the backend. The form below is scoped to the current workspace and saves only the supported server-owned keys.
            </p>
          </div>
          {backendSettingsError instanceof Error && (
            <ErrorState
              title="Backend runtime settings unavailable"
              message={backendSettingsError.message}
            />
          )}
          <div className="grid gap-3 md:grid-cols-2">
            <div className="space-y-1.5 md:col-span-2">
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">Scope</Label>
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline">{settingsScope}</Badge>
                <span className="font-mono text-xs text-muted-foreground">{settingsProjectId ?? "global"}</span>
                <span className="text-xs text-muted-foreground">{backendSettings?.updated_at ? `Updated ${backendSettings.updated_at}` : ""}</span>
              </div>
            </div>
            <div className="space-y-1.5 md:col-span-2">
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">Obsidian vault path</Label>
              <Input
                value={runtimeDraft?.obsidianVaultPath ?? ""}
                disabled={!runtimeDraft || !canEditRuntime}
                onChange={(e) => setRuntimeDraft((cur) => (cur ? { ...cur, obsidianVaultPath: e.target.value } : cur))}
                className="font-mono text-sm"
              />
            </div>
            <div className="space-y-1.5 md:col-span-2">
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">Webhook URL</Label>
              <Input
                value={runtimeDraft?.webhookUrl ?? ""}
                disabled={!runtimeDraft || !canEditRuntime}
                onChange={(e) => setRuntimeDraft((cur) => (cur ? { ...cur, webhookUrl: e.target.value } : cur))}
                className="font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground">
                Blank inherits the backend default webhook instead of storing an empty override.
              </p>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">LLM mode</Label>
              <Select
                value={runtimeDraft?.llmMode ?? "deterministic_only"}
                onValueChange={(value) => setRuntimeDraft((cur) => (cur ? { ...cur, llmMode: value as RuntimeDraft["llmMode"] } : cur))}
                disabled={!runtimeDraft || !canEditRuntime}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select LLM mode" />
                </SelectTrigger>
                <SelectContent>
                  {LLM_MODE_OPTIONS.map((option) => (
                    <SelectItem key={option} value={option}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">Codex reasoning effort</Label>
              <Select
                value={runtimeDraft?.codexReasoningEffort ?? "medium"}
                onValueChange={(value) => setRuntimeDraft((cur) => (cur ? { ...cur, codexReasoningEffort: value as RuntimeDraft["codexReasoningEffort"] } : cur))}
                disabled={!runtimeDraft || !canEditRuntime}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select effort" />
                </SelectTrigger>
                <SelectContent>
                  {CODEX_REASONING_OPTIONS.map((option) => (
                    <SelectItem key={option} value={option}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">Codex binary</Label>
              <Input
                value={runtimeDraft?.codexBinary ?? ""}
                disabled={!runtimeDraft || !canEditRuntime}
                onChange={(e) => setRuntimeDraft((cur) => (cur ? { ...cur, codexBinary: e.target.value } : cur))}
                className="font-mono text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">OpenAI base URL</Label>
              <Input
                value={runtimeDraft?.openaiBaseUrl ?? ""}
                disabled={!runtimeDraft || !canEditRuntime}
                onChange={(e) => setRuntimeDraft((cur) => (cur ? { ...cur, openaiBaseUrl: e.target.value } : cur))}
                className="font-mono text-sm"
              />
            </div>
            <div className="space-y-1.5 md:col-span-2">
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">Anthropic base URL</Label>
              <Input
                value={runtimeDraft?.anthropicBaseUrl ?? ""}
                disabled={!runtimeDraft || !canEditRuntime}
                onChange={(e) => setRuntimeDraft((cur) => (cur ? { ...cur, anthropicBaseUrl: e.target.value } : cur))}
                className="font-mono text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">Kanban base URL</Label>
              <Input
                value={runtimeDraft?.kanbanBaseUrl ?? ""}
                disabled={!runtimeDraft || !canEditRuntime}
                onChange={(e) => setRuntimeDraft((cur) => (cur ? { ...cur, kanbanBaseUrl: e.target.value } : cur))}
                className="font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground">
                If Prompt Forge runs in Docker and Kanban runs on the host, prefer <span className="font-mono">http://host.docker.internal:3484</span> over <span className="font-mono">http://127.0.0.1:3484</span>.
              </p>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">Kanban workspace ID</Label>
              <Input
                value={runtimeDraft?.kanbanWorkspaceId ?? ""}
                disabled={!runtimeDraft || !canEditRuntime}
                onChange={(e) => setRuntimeDraft((cur) => (cur ? { ...cur, kanbanWorkspaceId: e.target.value } : cur))}
                className="font-mono text-sm"
              />
            </div>
            <div className="space-y-1.5 md:col-span-2">
              <div className="flex items-center justify-between gap-3">
                <Label className="text-xs uppercase tracking-wider text-muted-foreground">Discovered Kanban workspaces</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={!kanbanDiscoveryBaseUrl || isDiscoveringKanbanWorkspaces}
                  onClick={() => void refetchKanbanWorkspaces()}
                >
                  {isDiscoveringKanbanWorkspaces ? "Refreshing..." : "Refresh"}
                </Button>
              </div>
              <Select
                value={runtimeDraft?.kanbanWorkspaceId ?? ""}
                onValueChange={(value) => setRuntimeDraft((cur) => (cur ? { ...cur, kanbanWorkspaceId: value } : cur))}
                disabled={!runtimeDraft || !canEditRuntime || (discoveredKanbanWorkspaces?.workspaces.length ?? 0) === 0}
              >
                <SelectTrigger>
                  <SelectValue placeholder={kanbanDiscoveryBaseUrl ? "Select discovered workspace" : "Enter Kanban base URL first"} />
                </SelectTrigger>
                <SelectContent>
                  {(discoveredKanbanWorkspaces?.workspaces ?? []).map((workspace) => (
                    <SelectItem key={workspace.workspaceId} value={workspace.workspaceId}>
                      {workspace.name} · {workspace.workspaceId.slice(-8)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {kanbanWorkspaceError ? (
                <p className="text-xs text-destructive">
                  {kanbanWorkspaceError instanceof Error ? kanbanWorkspaceError.message : "Unable to discover Kanban workspaces."}
                </p>
              ) : kanbanDiscoveryBaseUrl && isDiscoveringKanbanWorkspaces ? (
                <p className="text-xs text-muted-foreground">Checking Kanban availability…</p>
              ) : discoveredKanbanWorkspaces && discoveredKanbanWorkspaces.workspaces.length === 0 ? (
                <p className="text-xs text-muted-foreground">Kanban reachable. No workspaces found for the current base URL.</p>
              ) : discoveredKanbanWorkspaces ? (
                <div className="grid gap-2 text-xs text-muted-foreground">
                  <div>
                    Kanban status: <span className="font-mono">reachable</span>
                  </div>
                  <div>
                    Current Kanban workspace: <span className="font-mono">{discoveredKanbanWorkspaces.currentWorkspaceId ?? "none"}</span>
                  </div>
                  <div>
                    {discoveredKanbanWorkspaces.workspaces.length} workspace(s) discovered.
                  </div>
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">Discovery runs against the current Kanban base URL.</p>
              )}
            </div>
          </div>
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs text-muted-foreground">
              {canEditRuntime ? "Backend runtime editor is live for the current workspace." : "Runtime editing is disabled by backend permissions."}
            </p>
            <Button onClick={saveRuntime} disabled={!runtimeDraft || !canEditRuntime || runtimeBusy}>
              {runtimeBusy ? "Saving..." : "Save runtime"}
            </Button>
          </div>
        </Card>

        <Card className="space-y-4 p-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold">Backend-managed secrets</h3>
              <Badge variant="outline">{canEditSecrets ? "Editable" : "Read-only"}</Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              Secret material stays server-side. Enter new values to rotate configured keys; empty inputs are ignored.
            </p>
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
            <Button onClick={saveSecrets} disabled={!canEditSecrets || secretBusy}>
              {secretBusy ? "Rotating..." : "Rotate secrets"}
            </Button>
          </div>
        </Card>

        <PermissionGuard require="admin">
          <DangerZoneCard title="Admin actions" description="Backend mutations are available for admin operators. The console now exposes the supported ones with confirmation gating.">
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-status-danger/20 bg-background/70 px-3 py-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <ServerCog className="h-4 w-4 text-status-danger" />
                  Purge archived notes
                </div>
                <p className="text-xs text-muted-foreground">
                  Permanently removes archived notes and their dependent rows from the backend, then refreshes the console caches.
                </p>
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
                  description="This is a destructive admin action. It removes archived notes and related artifacts from the backend."
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
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-md border px-3 py-3">
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
      </PageBody>
    </>
  );
}
