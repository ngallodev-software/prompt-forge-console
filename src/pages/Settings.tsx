import { useQuery } from "@tanstack/react-query";
import { DatabaseZap, Lock, RotateCcw, ServerCog } from "lucide-react";
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
import { PermissionGuard } from "@/components/pf/PermissionGuard";
import { QUERY_CATALOG, getConsoleRuntimeSnapshot, listProjects, qk } from "@/services/promptforge";
import { RUNTIME_ENVIRONMENT } from "@/services/promptforge/config";
import { type Theme, useAppStore } from "@/stores/app-store";
import type { Role } from "@/services/promptforge/types";

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

const BACKEND_MANAGED_SETTINGS = [
  {
    key: "obsidianVaultPath",
    label: "Obsidian vault path",
    owner: "Backend delivery config",
    reason: "Used by note delivery infrastructure, not by the browser.",
  },
  {
    key: "webhookUrl",
    label: "Webhook URL",
    owner: "Backend integration config",
    reason: "Outbound delivery target must stay server-side for auditability and secrets hygiene.",
  },
  {
    key: "llmMode",
    label: "LLM mode",
    owner: "Backend processing policy",
    reason: "The browser can display the mode, but processing policy must be enforced by the API.",
  },
  {
    key: "codexBinary",
    label: "Codex binary",
    owner: "Backend worker runtime",
    reason: "CLI execution happens on the backend host, not in the frontend.",
  },
  {
    key: "codexReasoningEffort",
    label: "Codex reasoning effort",
    owner: "Backend worker runtime",
    reason: "Worker defaults should be centralized with the backend executor.",
  },
  {
    key: "openaiBaseUrl",
    label: "OpenAI base URL",
    owner: "Backend provider config",
    reason: "Provider routing belongs with server-side credentials and request policy.",
  },
  {
    key: "anthropicBaseUrl",
    label: "Anthropic base URL",
    owner: "Backend provider config",
    reason: "Provider routing belongs with server-side credentials and request policy.",
  },
];

const SECRET_STATUS = [
  { key: "OPENAI_API_KEY", owner: "Backend secret store" },
  { key: "ANTHROPIC_API_KEY", owner: "Backend secret store" },
  { key: "PROMPTFORGE_OPENAI_COMPAT_API_KEY", owner: "Backend secret store" },
  { key: "PROMPTFORGE_OLLAMA_API_KEY", owner: "Backend secret store" },
];

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
  const { data: projects = [] } = useQuery({ queryKey: qk.projects, queryFn: listProjects });
  const hasProjects = projects.length > 0;

  return (
    <>
      <PageHeader
        title="Settings"
        description="Local console preferences are editable here. Backend runtime and secret-bearing settings stay read-only until server support exists."
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
                    message="The backend returned an empty projects list, so project-scoped workspace selection is unavailable."
                  />
                )}
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
                <Label htmlFor="polling" className="text-xs uppercase tracking-wider text-muted-foreground">
                  Polling interval (ms)
                </Label>
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
              <Badge variant="outline">Read-only until API exists</Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              These values should not be faked in the browser. The frontend needs a settings API before any of them become editable here.
            </p>
          </div>
          <div className="grid gap-2 md:grid-cols-2">
            {BACKEND_MANAGED_SETTINGS.map((item) => (
              <div key={item.key} className="rounded-md border px-3 py-2">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-sm font-medium">{item.label}</div>
                    <div className="text-xs text-muted-foreground">{item.owner}</div>
                  </div>
                  <span className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">Not exposed</span>
                </div>
                <p className="mt-2 text-xs text-muted-foreground">{item.reason}</p>
              </div>
            ))}
          </div>
        </Card>

        <Card className="space-y-4 p-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold">Backend-managed secrets</h3>
              <Badge variant="outline">Read-only</Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              Secret material stays server-side. The console should only read masked metadata after backend support is added.
            </p>
          </div>
          <div className="grid gap-2 md:grid-cols-2">
            {SECRET_STATUS.map((item) => (
              <div key={item.key} className="flex items-center justify-between gap-3 rounded-md border px-3 py-2 text-xs">
                <span className="font-mono text-muted-foreground">{item.key}</span>
                <span className="inline-flex items-center gap-1 text-muted-foreground">
                  <Lock className="h-3.5 w-3.5" />
                  {item.owner}
                </span>
              </div>
            ))}
          </div>
        </Card>

        <Card className="space-y-4 p-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold">Query catalog</h3>
              <Badge variant="outline">Reference</Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              These query IDs still define the frontend’s backend expectations. Use them when wiring read models and diagnostics.
            </p>
          </div>
          <div className="overflow-auto">
            <table className="w-full text-sm">
              <thead className="text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="py-1.5 text-left">ID</th>
                  <th className="text-left">Title</th>
                  <th className="text-left">Pages</th>
                  <th className="text-left">Params</th>
                </tr>
              </thead>
              <tbody>
                {QUERY_CATALOG.map((query) => (
                  <tr key={query.id} className="border-t">
                    <td className="py-1.5 font-mono text-xs">{query.id}</td>
                    <td>{query.title}</td>
                    <td className="font-mono text-xs text-muted-foreground">{query.pages.join(", ")}</td>
                    <td className="font-mono text-xs text-muted-foreground">{query.params.join(", ") || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <PermissionGuard require="admin">
          <DangerZoneCard title="Admin actions" description="Server mutations stay disabled until backend endpoints and audit logging exist.">
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-status-danger/20 bg-background/70 px-3 py-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <ServerCog className="h-4 w-4 text-status-danger" />
                  Purge archived notes
                </div>
                <p className="text-xs text-muted-foreground">
                  The previous button was presentation-only. It is now blocked until a real admin endpoint and audit trail exist.
                </p>
              </div>
              <Button variant="destructive" size="sm" disabled>
                Pending backend support
              </Button>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-md border px-3 py-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <DatabaseZap className="h-4 w-4" />
                  Backend handoff required
                </div>
                <p className="text-xs text-muted-foreground">
                  Implement settings read/write APIs before turning backend-managed sections editable in the console.
                </p>
              </div>
              <code className="rounded bg-muted px-2 py-1 text-xs">docs/phased-impl/settings-backend-support-prompt.md</code>
            </div>
          </DangerZoneCard>
        </PermissionGuard>
      </PageBody>
    </>
  );
}
