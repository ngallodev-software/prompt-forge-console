import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { dispatchTarget, getTargetHealth, listTargets, qk } from "@/services/promptforge";
import { PageBody, PageHeader } from "@/components/shell/PageHeader";
import { DataTable, type Column } from "@/components/pf/DataTable";
import { HelpTip } from "@/components/pf/HelpTip";
import { StatusBadge } from "@/components/pf/StatusBadge";
import { ScopeBadge } from "@/components/pf/ScopeBadge";
import { QueryInspector } from "@/components/pf/QueryInspector";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { ShieldAlert, Send, RefreshCcw } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import type { DeliveryTarget } from "@/services/promptforge/types";

export default function Targets() {
  const qc = useQueryClient();
  const [selectedTargetId, setSelectedTargetId] = useState<string | null>(null);
  const [dispatchOpen, setDispatchOpen] = useState(false);
  const [dispatchBusy, setDispatchBusy] = useState(false);
  const [promptGenerationId, setPromptGenerationId] = useState("");
  const [payloadContent, setPayloadContent] = useState("");
  const [targetSessionIdentifier, setTargetSessionIdentifier] = useState("");
  const { data, isLoading } = useQuery({ queryKey: qk.targets(), queryFn: () => listTargets() });
  const selectedTarget = useMemo(() => data?.find((row) => row.id === selectedTargetId) ?? null, [data, selectedTargetId]);
  const { data: targetHealth, isFetching: healthLoading } = useQuery({
    queryKey: qk.targetHealth(selectedTargetId ?? "none"),
    queryFn: () => getTargetHealth(selectedTargetId ?? ""),
    enabled: !!selectedTargetId,
  });

  const openTarget = (target: DeliveryTarget) => {
    setSelectedTargetId(target.id);
    setDispatchOpen(true);
    setPromptGenerationId("");
    setPayloadContent("");
    setTargetSessionIdentifier("");
  };

  const onDispatch = async () => {
    if (!selectedTarget || !promptGenerationId.trim() || !payloadContent.trim()) {
      toast({ title: "Missing fields", description: "Prompt generation id and payload content are required." });
      return;
    }
    setDispatchBusy(true);
    try {
      const result = await dispatchTarget(selectedTarget.id, {
        promptGenerationId: promptGenerationId.trim(),
        payloadContent: payloadContent.trim(),
        targetSessionIdentifier: targetSessionIdentifier.trim() || undefined,
      });
      await qc.invalidateQueries({ queryKey: ["pf", "targets"] });
      toast({
        title: result.accepted ? "Dispatch accepted" : "Dispatch rejected",
        description: `${result.targetType} · ${result.status}`,
      });
      setDispatchOpen(false);
    } catch (error) {
      toast({ title: "Dispatch failed", description: error instanceof Error ? error.message : "Unable to dispatch to the target." });
    } finally {
      setDispatchBusy(false);
    }
  };

  const columns: Column<DeliveryTarget>[] = [
    { key: "name", header: <span className="inline-flex items-center gap-1.5">Name<HelpTip label="Target name help" content="Human-readable label for the delivery target. Sensitive targets are marked with the warning icon." /></span>, cell: (r) => (
      <div className="flex items-center gap-1.5">
        <span className="font-medium">{r.name}</span>
        {r.is_sensitive && <ShieldAlert className="h-3.5 w-3.5 text-status-warn" aria-label="sensitive" />}
      </div>
    ) },
    { key: "type", header: <span className="inline-flex items-center gap-1.5">Type<HelpTip label="Target type help" content="Execution class for the target, such as session, queue, or write-back destination." /></span>, cell: (r) => <span className="font-mono text-xs">{r.target_type}</span> },
    { key: "dest", header: <span className="inline-flex items-center gap-1.5">Destination<HelpTip label="Target destination help" content="Concrete backend destination or route used when dispatching to this target." /></span>, hideOnMobile: true, cell: (r) => <span className="text-sm">{r.destination}</span> },
    { key: "scope", header: <span className="inline-flex items-center gap-1.5">Scope<HelpTip label="Target scope help" content="Which workspace scope owns the target. This determines where the target can be used." /></span>, hideOnMobile: true, cell: (r) => <ScopeBadge value={r.scope} /> },
    { key: "env", header: <span className="inline-flex items-center gap-1.5">Env<HelpTip label="Target environment help" content="Runtime environment where the target is expected to be reachable or valid." /></span>, hideOnMobile: true, cell: (r) => <StatusBadge value={r.environment} tone="neutral" /> },
    { key: "valid", header: <span className="inline-flex items-center gap-1.5">Health<HelpTip label="Target health help" content="Validation state for the target. Healthy targets should be usable; degraded or unknown targets need review." /></span>, cell: (r) => <StatusBadge value={r.validation_status} /> },
    { key: "enabled", header: <span className="inline-flex items-center gap-1.5">Enabled<HelpTip label="Target enabled help" content="Whether the target can accept dispatches from the console." /></span>, cell: (r) => <StatusBadge value={r.enabled ? "enabled" : "disabled"} tone={r.enabled ? "success" : "neutral"} /> },
  ];

  return (
    <>
      <PageHeader
        title="Delivery targets"
        description="Configured targets for chat sessions, CLI sessions, queues, and Obsidian write-back."
        help={{ label: "Delivery targets help", content: "Use this page to inspect which targets are defined, whether they are enabled, and whether the backend considers them healthy." }}
      />
      <PageBody>
        <QueryInspector />
        <DataTable columns={columns} rows={data} isLoading={isLoading} rowKey={(r) => r.id} onRowClick={openTarget} isRowActive={(r) => r.id === selectedTargetId} />
        <Sheet open={dispatchOpen} onOpenChange={setDispatchOpen}>
          <SheetContent className="w-full overflow-auto sm:max-w-3xl">
            <SheetHeader>
              <SheetTitle>{selectedTarget?.name ?? "Dispatch target"}</SheetTitle>
              <SheetDescription>Inspect target health and send a real delivery attempt to the backend.</SheetDescription>
            </SheetHeader>
            {selectedTarget && (
              <div className="space-y-4">
                <Card className="p-4 space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="text-xs uppercase tracking-wider text-muted-foreground">Target details</div>
                      <div className="font-medium">{selectedTarget.name}</div>
                    </div>
                    <StatusBadge value={selectedTarget.validation_status} />
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2 text-sm">
                    <div>
                      <div className="text-xs uppercase tracking-wider text-muted-foreground">Type</div>
                      <div className="font-mono">{selectedTarget.target_type}</div>
                    </div>
                    <div>
                      <div className="text-xs uppercase tracking-wider text-muted-foreground">Destination</div>
                      <div>{selectedTarget.destination}</div>
                    </div>
                    <div>
                      <div className="text-xs uppercase tracking-wider text-muted-foreground">Scope</div>
                      <ScopeBadge value={selectedTarget.scope} />
                    </div>
                    <div>
                      <div className="text-xs uppercase tracking-wider text-muted-foreground">Environment</div>
                      <div>{selectedTarget.environment}</div>
                    </div>
                  </div>
                  <div className="rounded-md border bg-surface-sunken/40 p-3 text-xs text-muted-foreground">
                    <div className="flex items-center gap-2 font-medium text-foreground">
                      <RefreshCcw className="h-3.5 w-3.5" />
                      Live health
                    </div>
                    <div className="mt-1 font-mono">{healthLoading ? "Checking..." : targetHealth?.healthStatus ?? selectedTarget.validation_status}</div>
                    <div className="mt-1">{targetHealth?.detail ?? "No additional detail returned yet."}</div>
                  </div>
                </Card>

                <Card className="p-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <Send className="h-4 w-4" />
                    <h3 className="text-sm font-semibold">Dispatch</h3>
                  </div>
                  <div className="grid gap-3">
                    <div className="space-y-2">
                      <Label htmlFor="prompt-generation-id">Prompt generation id</Label>
                      <HelpTip label="Prompt generation id help" content="Stable backend id for the prompt generation you want to send." />
                      <Input id="prompt-generation-id" value={promptGenerationId} onChange={(e) => setPromptGenerationId(e.target.value)} className="font-mono text-sm" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="payload-content">Payload content</Label>
                      <HelpTip label="Payload content help" content="Prompt text or payload body that will be delivered to the selected target." />
                      <Textarea id="payload-content" value={payloadContent} onChange={(e) => setPayloadContent(e.target.value)} className="min-h-[140px] font-mono text-xs" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="target-session-identifier">Target session identifier</Label>
                      <HelpTip label="Target session identifier help" content="Optional live session id for targets that bind to a running Claude or Codex session." />
                      <Input id="target-session-identifier" value={targetSessionIdentifier} onChange={(e) => setTargetSessionIdentifier(e.target.value)} className="font-mono text-sm" />
                    </div>
                    <div className="rounded-md border border-dashed px-3 py-2 text-xs text-muted-foreground">
                      Dispatch attempts are persisted by the backend and reflected in delivery history.
                    </div>
                    <div className="flex justify-end">
                      <Button onClick={onDispatch} disabled={dispatchBusy}>
                        <Send className="mr-1 h-3.5 w-3.5" />
                        {dispatchBusy ? "Dispatching..." : "Dispatch"}
                      </Button>
                    </div>
                  </div>
                </Card>
              </div>
            )}
          </SheetContent>
        </Sheet>
      </PageBody>
    </>
  );
}
