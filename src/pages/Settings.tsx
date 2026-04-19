import { PageBody, PageHeader } from "@/components/shell/PageHeader";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useAppStore } from "@/stores/app-store";
import { DangerZoneCard } from "@/components/pf/DangerZoneCard";
import { Button } from "@/components/ui/button";
import { QUERY_CATALOG } from "@/services/promptforge";
import { ConfirmationModal } from "@/components/pf/ConfirmationModal";
import { PermissionGuard } from "@/components/pf/PermissionGuard";

export default function Settings() {
  const { debug, setDebug, pollingMs, setPollingMs, environment, setEnvironment } = useAppStore();

  const redacted = {
    LOVABLE_CLOUD_API_URL: "https://api.example.com",
    OBSIDIAN_VAULT_PATH: "/Users/operator/Vault",
    LLM_PROVIDER_MODE: "deterministic_only",
    OPENAI_API_KEY: "sk-••••••••••••••••",
    ANTHROPIC_API_KEY: "sk-ant-••••••••••••",
    WEBHOOK_URL: "https://n8n.example.com/webhook/pf",
  };

  return (
    <>
      <PageHeader title="Settings" description="Environment, feature flags, query catalog, and admin controls." />
      <PageBody>
        <div className="grid gap-4 lg:grid-cols-2">
          <Card className="p-4 space-y-3">
            <h3 className="text-sm font-semibold">Environment</h3>
            <div className="grid grid-cols-3 gap-2">
              {(["dev", "staging", "prod"] as const).map(e => (
                <button key={e} onClick={() => setEnvironment(e)} className={`rounded border px-3 py-2 text-xs uppercase font-mono ${environment === e ? "border-primary bg-primary/10 text-primary" : "border-border"}`}>{e}</button>
              ))}
            </div>
            <div className="space-y-1 mt-2">
              {Object.entries(redacted).map(([k, v]) => (
                <div key={k} className="flex justify-between gap-2 text-xs">
                  <span className="font-mono text-muted-foreground">{k}</span>
                  <span className="font-mono">{v}</span>
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-4 space-y-3">
            <h3 className="text-sm font-semibold">Operator preferences</h3>
            <div className="flex items-center justify-between">
              <Label htmlFor="debug" className="space-y-0.5">
                <div>Query Inspector</div>
                <div className="text-xs text-muted-foreground">Show catalog query overlays on each page</div>
              </Label>
              <Switch id="debug" checked={debug} onCheckedChange={setDebug} />
            </div>
            <div>
              <Label className="text-sm">Polling interval (ms)</Label>
              <input type="number" value={pollingMs} onChange={(e) => setPollingMs(Number(e.target.value))} className="mt-1 w-full rounded border bg-background px-2 py-1 font-mono text-sm" />
            </div>
          </Card>
        </div>

        <Card className="p-4">
          <h3 className="text-sm font-semibold mb-2">Query catalog (Q1–Q20)</h3>
          <p className="text-xs text-muted-foreground mb-3">Each catalog query maps to one or more pages. Use this list when wiring the real backend.</p>
          <div className="overflow-auto">
            <table className="w-full text-sm">
              <thead className="text-xs uppercase tracking-wider text-muted-foreground">
                <tr><th className="text-left py-1.5">ID</th><th className="text-left">Title</th><th className="text-left">Pages</th><th className="text-left">Params</th></tr>
              </thead>
              <tbody>
                {QUERY_CATALOG.map(q => (
                  <tr key={q.id} className="border-t">
                    <td className="py-1.5 font-mono text-xs">{q.id}</td>
                    <td>{q.title}</td>
                    <td className="font-mono text-xs text-muted-foreground">{q.pages.join(", ")}</td>
                    <td className="font-mono text-xs text-muted-foreground">{q.params.join(", ") || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <PermissionGuard require="admin">
          <DangerZoneCard title="Danger zone" description="Irreversible operations. Confirmation required.">
            <ConfirmationModal
              trigger={<Button variant="destructive" size="sm">Purge archived notes</Button>}
              title="Purge archived intake notes?"
              description="This permanently removes all archived notes and their lineage."
              confirmLabel="Purge"
              destructive
              onConfirm={() => Promise.resolve()}
            />
          </DangerZoneCard>
        </PermissionGuard>
      </PageBody>
    </>
  );
}
