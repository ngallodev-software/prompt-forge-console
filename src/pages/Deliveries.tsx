import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getDeliveryHistory, getQueueDepth, listDeliveries, listPromptGenerations, listIntakeNotes, listTargets, qk, rerouteDelivery, retryDelivery, updateDeliveryStatus } from "@/services/promptforge";
import { PageBody, PageHeader } from "@/components/shell/PageHeader";
import { DataTable, type Column } from "@/components/pf/DataTable";
import { HelpTip } from "@/components/pf/HelpTip";
import { StatusBadge } from "@/components/pf/StatusBadge";
import { PriorityBadge } from "@/components/pf/PriorityBadge";
import { OpsSurfaceIntro } from "@/components/pf/OpsSurfaceIntro";
import { QueryInspector } from "@/components/pf/QueryInspector";
import { ConfirmationModal } from "@/components/pf/ConfirmationModal";
import { PermissionGuard } from "@/components/pf/PermissionGuard";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { RotateCw, Send, Route } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import type { Delivery, PfDeliveryStatus } from "@/services/promptforge/types";

type DRow = Delivery & { retry_candidate: boolean };

const deliveryStatusOptions: PfDeliveryStatus[] = ["not_started", "queued", "dispatching", "delivered", "acked", "failed"];

export default function Deliveries() {
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<DRow | null>(null);
  const [rerouteTargetId, setRerouteTargetId] = useState("");
  const [statusDraft, setStatusDraft] = useState<PfDeliveryStatus>("queued");
  const [rerouteBusy, setRerouteBusy] = useState(false);
  const [statusBusy, setStatusBusy] = useState(false);
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: qk.deliveriesList({ page }), queryFn: () => listDeliveries({ page }) });
  const { data: promptIndex } = useQuery({ queryKey: qk.promptList({ pageSize: 500 }), queryFn: () => listPromptGenerations({ pageSize: 500 }) });
  const { data: intakeIndex } = useQuery({ queryKey: qk.intakeList({ pageSize: 500 }), queryFn: () => listIntakeNotes({ pageSize: 500 }) });
  const { data: queue } = useQuery({ queryKey: qk.queueDepth, queryFn: getQueueDepth });
  const { data: targets = [] } = useQuery({ queryKey: qk.targets(), queryFn: () => listTargets() });
  const { data: history = [] } = useQuery({
    queryKey: qk.deliveryHistory(selected?.id ?? "none"),
    queryFn: () => (selected ? getDeliveryHistory(selected.id) : Promise.resolve([])),
    enabled: !!selected,
  });
  const promptById = useMemo(() => new Map((promptIndex?.rows ?? []).map((prompt) => [prompt.id, prompt])), [promptIndex]);
  const noteById = useMemo(() => new Map((intakeIndex?.rows ?? []).map((note) => [note.id, note])), [intakeIndex]);
  const selectedPrompt = selected ? promptById.get(selected.prompt_generation_id) : undefined;

  const noteLabel = (noteId: string) => noteById.get(noteId)?.note_relative_path ?? noteId.slice(-8);
  const promptLabel = (promptId: string) => {
    const prompt = promptById.get(promptId);
    return prompt ? `${prompt.prompt_type} · ${noteLabel(prompt.intake_note_id)}` : promptId.slice(-8);
  };

  const onRetry = async (id: string) => {
    await retryDelivery(id);
    toast({ title: "Retry queued", description: id });
    qc.invalidateQueries({ queryKey: ["pf", "deliveries"] });
  };

  const onReroute = async () => {
    if (!selected || !rerouteTargetId) return;
    setRerouteBusy(true);
    try {
      await rerouteDelivery(selected.id, rerouteTargetId);
      toast({ title: "Delivery rerouted", description: `${selected.id.slice(-8)} → ${rerouteTargetId.slice(-8)}` });
      await qc.invalidateQueries({ queryKey: ["pf", "deliveries"] });
      await qc.invalidateQueries({ queryKey: qk.queueDepth });
    } catch (error) {
      toast({
        title: "Reroute failed",
        description: error instanceof Error ? error.message : "Unable to reroute the delivery.",
      });
    } finally {
      setRerouteBusy(false);
    }
  };

  const onUpdateStatus = async () => {
    if (!selected) return;
    setStatusBusy(true);
    try {
      await updateDeliveryStatus(selected.id, statusDraft);
      toast({ title: "Status updated", description: `${selected.id.slice(-8)} → ${statusDraft}` });
      await qc.invalidateQueries({ queryKey: ["pf", "deliveries"] });
    } catch (error) {
      toast({
        title: "Status update failed",
        description: error instanceof Error ? error.message : "Unable to update the delivery status.",
      });
    } finally {
      setStatusBusy(false);
    }
  };

  const columns: Column<DRow>[] = [
    { key: "subject", header: <span className="inline-flex items-center gap-1.5">Subject<HelpTip label="Delivery subject help" content="The prompt and note that produced this delivery. Start here before looking at the delivery id." /></span>, cell: (r) => (
      <div className="min-w-0">
        <div className="font-medium truncate">{promptLabel(r.prompt_generation_id)}</div>
        <div className="text-xs text-muted-foreground truncate">To {r.destination} · {r.mode}</div>
      </div>
    ) },
    { key: "status", header: <span className="inline-flex items-center gap-1.5">Status<HelpTip label="Delivery status help" content="Current delivery state. Failed and retryable statuses are the best candidates for follow-up actions." /></span>, cell: (r) => <StatusBadge value={r.status} /> },
    { key: "dest", header: <span className="inline-flex items-center gap-1.5">Destination<HelpTip label="Delivery destination help" content="Target destination or routing label for the delivery. Use it to see where a prompt was sent." /></span>, cell: (r) => <span className="text-sm">{r.destination}</span> },
    { key: "prio", header: <span className="inline-flex items-center gap-1.5">Priority<HelpTip label="Delivery priority help" content="Queue priority used by the dispatch layer when multiple deliveries are waiting." /></span>, hideOnMobile: true, cell: (r) => <PriorityBadge value={r.priority} /> },
    { key: "retries", header: <span className="inline-flex items-center gap-1.5">Retries<HelpTip label="Retry count help" content="How many times the delivery has been attempted. Higher counts usually mean the target is unstable or unavailable." /></span>, hideOnMobile: true, cell: (r) => <span className="font-mono text-xs tabular-nums">{r.retry_count}</span> },
    { key: "id", header: <span className="inline-flex items-center gap-1.5">ID<HelpTip label="Delivery ID help" content="Stable backend identifier for this delivery record." /></span>, hideOnMobile: true, cell: (r) => <span className="font-mono text-xs text-muted-foreground">{r.id.slice(-8)}</span> },
    { key: "fail", header: <span className="inline-flex items-center gap-1.5">Failure<HelpTip label="Delivery failure help" content="Last recorded failure text. Useful for deciding whether to retry, reroute, or inspect the target." /></span>, hideOnMobile: true, cell: (r) => r.failure_text ? <span className="text-xs text-status-danger truncate block max-w-[28ch]">{r.failure_text}</span> : <span className="text-xs text-muted-foreground">—</span> },
    { key: "actions", header: "", cell: (r) => r.retry_candidate ? (
      <PermissionGuard require="operator" inline>
        <ConfirmationModal
          trigger={<Button size="sm" variant="outline" className="h-7 gap-1"><RotateCw className="h-3 w-3" /> Retry</Button>}
          title="Retry delivery?"
          description={<>This will create a new queued delivery for prompt <span className="font-mono">{r.prompt_generation_id.slice(-8)}</span>.</>}
          confirmLabel="Retry"
          onConfirm={() => onRetry(r.id)}
        />
      </PermissionGuard>
    ) : null },
  ];

  return (
    <>
      <PageHeader title="Deliveries" description="Dispatch records, retry candidates, and target-specific recovery actions." help={{ label: "Deliveries help", content: "Use this page to inspect where a prompt was sent, whether it failed, and which delivery can be retried or rerouted." }} />
      <PageBody>
        <QueryInspector />
        <OpsSurfaceIntro
          eyebrow="Dispatch ledger"
          title="What the deliveries page is for"
          purpose="This page is the dispatch ledger. Each row is a prompt delivery, and the main question is whether the delivery succeeded, needs retry, or should be rerouted to a different target."
          description="The prompt and originating note should be obvious before the delivery id. The id is still there for cross-referencing, but it is not the headline."
          steps={[
            "Read the subject column first to see which prompt and note produced the delivery.",
            "Check the status and failure text to decide between retry, reroute, or do nothing.",
            "Use the detail sheet for target-level recovery only after the row tells you which delivery matters.",
          ]}
          metrics={[
            { label: "Visible", value: data?.rows.length ?? 0, detail: "Deliveries on the current page" },
            { label: "Retryable", value: data?.rows.filter((r) => r.retry_candidate).length ?? 0, detail: "Rows that expose a retry action", tone: "warn" },
            { label: "Queue depth", value: queue?.length ?? 0, detail: "Destination and priority buckets waiting for dispatch" },
            { label: "Targets", value: targets.length, detail: "Configured delivery targets" },
          ]}
          note="If many rows look the same, use the subject and failure text first. The delivery id is only for a precise handoff or audit trail."
        />
        <Card className="p-4">
          <div className="mb-2 flex items-center gap-2">
            <h3 className="text-sm font-semibold">Queue depth</h3>
            <HelpTip label="Queue depth help" content="Shows how many deliveries are waiting for each destination and priority bucket." />
          </div>
          <div className="flex flex-wrap gap-2">
            {queue && queue.length > 0 ? queue.map(q => (
              <div key={`${q.priority}-${q.destination}`} className="rounded-md border bg-surface-sunken px-3 py-2 text-xs">
                <div className="font-medium">{q.destination}</div>
                <div className="text-muted-foreground">{q.priority} · <span className="font-mono tabular-nums">{q.queued_count}</span></div>
              </div>
            )) : <span className="text-sm text-muted-foreground">Empty</span>}
          </div>
        </Card>
        <DataTable
          columns={columns}
          rows={data?.rows}
          isLoading={isLoading}
          total={data?.total}
          page={page}
          pageSize={25}
          onPageChange={setPage}
          rowKey={(r) => r.id}
          onRowClick={(r) => {
            setSelected(r);
            setStatusDraft(r.status);
            setRerouteTargetId("");
          }}
          isRowActive={(r) => r.id === selected?.id}
        />
        <Sheet open={!!selected} onOpenChange={(open) => !open && setSelected(null)}>
          <SheetContent className="w-full overflow-auto sm:max-w-3xl">
            {selected && (
              <div className="space-y-4">
                <SheetHeader className="space-y-2">
                  <SheetTitle>{promptLabel(selected.prompt_generation_id)}</SheetTitle>
                  <SheetDescription>
                    {selected.destination} · {selected.mode} · {selected.priority} · {selected.id.slice(-8)}
                  </SheetDescription>
                </SheetHeader>

                <Card className="p-4 space-y-4">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <div className="text-xs uppercase tracking-wider text-muted-foreground">Prompt</div>
                      <div className="text-sm font-medium">{promptLabel(selected.prompt_generation_id)}</div>
                      <div className="font-mono text-xs text-muted-foreground">{selected.prompt_generation_id}</div>
                    </div>
                    <div>
                      <div className="text-xs uppercase tracking-wider text-muted-foreground">Target</div>
                      <div className="font-mono text-sm">{selected.target_id ?? "—"}</div>
                    </div>
                    <div>
                      <div className="text-xs uppercase tracking-wider text-muted-foreground">Source note</div>
                      <div className="text-sm">{selectedPrompt ? noteLabel(selectedPrompt.intake_note_id) : "—"}</div>
                    </div>
                    <div>
                      <div className="text-xs uppercase tracking-wider text-muted-foreground">Failure</div>
                      <div className="text-sm text-status-danger">{selected.failure_text ?? "—"}</div>
                    </div>
                    <div>
                      <div className="text-xs uppercase tracking-wider text-muted-foreground">Ack</div>
                      <div className="text-sm">{selected.ack_text ?? "—"}</div>
                    </div>
                  </div>
                </Card>

                <div className="grid gap-4 lg:grid-cols-2">
                  <Card className="p-4 space-y-3">
                    <div className="flex items-center gap-2">
                      <Route className="h-4 w-4 text-muted-foreground" />
                      <h3 className="text-sm font-semibold">Reroute</h3>
                    </div>
                    <div className="space-y-2">
                      <Label>Target</Label>
                      <Select value={rerouteTargetId} onValueChange={setRerouteTargetId}>
                        <SelectTrigger>
                          <SelectValue placeholder="Pick a target" />
                        </SelectTrigger>
                        <SelectContent>
                          {targets.map((target) => (
                            <SelectItem key={target.id} value={target.id}>
                              {target.name} · {target.target_type} · {target.enabled ? "enabled" : "disabled"}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <Button onClick={onReroute} disabled={rerouteBusy || !rerouteTargetId}>
                      <Send className="h-3.5 w-3.5" />
                      {rerouteBusy ? "Rerouting..." : "Reroute delivery"}
                    </Button>
                  </Card>

                  <Card className="p-4 space-y-3">
                    <div className="flex items-center gap-2">
                      <RotateCw className="h-4 w-4 text-muted-foreground" />
                      <h3 className="text-sm font-semibold">Status update</h3>
                    </div>
                    <div className="space-y-2">
                      <Label>Status</Label>
                      <Select value={statusDraft} onValueChange={(value) => setStatusDraft(value as PfDeliveryStatus)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                        <SelectContent>
                          {deliveryStatusOptions.map((status) => (
                            <SelectItem key={status} value={status}>
                              {status.replace(/_/g, " ")}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <Button variant="outline" onClick={onUpdateStatus} disabled={statusBusy || statusDraft === selected.status}>
                      {statusBusy ? "Updating..." : "Save status"}
                    </Button>
                  </Card>
                </div>

                <Card className="p-4 space-y-3">
                  <div className="text-sm font-semibold">History</div>
                  <div className="space-y-2">
                    {history.length > 0 ? history.map((entry) => (
                      <div key={entry.id} className="rounded-md border bg-surface-sunken px-3 py-2 text-sm">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-medium">{entry.status}</span>
                          <span className="font-mono text-xs text-muted-foreground">{entry.updated_at}</span>
                        </div>
                        <div className="mt-1 flex flex-wrap gap-3 text-xs text-muted-foreground">
                          <span>{promptLabel(entry.prompt_generation_id)}</span>
                          <span>Target {entry.target_id ?? "—"}</span>
                          <span>Retry {entry.retry_count}</span>
                        </div>
                        {entry.failure_text && <div className="mt-1 text-xs text-status-danger">{entry.failure_text}</div>}
                      </div>
                    )) : <div className="text-sm text-muted-foreground">No delivery history yet.</div>}
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
