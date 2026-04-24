import { useQuery } from "@tanstack/react-query";
import {
  getHealth, qk, listIntakeNotes, listPromptGenerations, listDeliveries,
  listFailedProcessingRuns, getQueueDepth, getSlaSummary, getProjectThroughput,
} from "@/services/promptforge";
import { PageBody, PageHeader } from "@/components/shell/PageHeader";
import { HealthCard } from "@/components/pf/HealthCard";
import { MetricCard } from "@/components/pf/MetricCard";
import { NeedsAttentionPanel } from "@/components/pf/NeedsAttentionPanel";
import { QueryInspector } from "@/components/pf/QueryInspector";
import { StatusBadge } from "@/components/pf/StatusBadge";
import { HelpTip } from "@/components/pf/HelpTip";
import { Activity, Inbox, Send, AlertTriangle, Layers, Clock } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Link } from "react-router-dom";

export default function Dashboard() {
  const { data: health } = useQuery({ queryKey: qk.health, queryFn: getHealth });
  const { data: review } = useQuery({ queryKey: qk.promptList({ requiresReview: true, pageSize: 5 }), queryFn: () => listPromptGenerations({ requiresReview: true, pageSize: 5 }) });
  const { data: failedDel } = useQuery({ queryKey: qk.deliveriesList({ failedOnly: true, pageSize: 5 }), queryFn: () => listDeliveries({ failedOnly: true, pageSize: 5 }) });
  const { data: failedRuns } = useQuery({ queryKey: qk.processingFailed, queryFn: listFailedProcessingRuns });
  const { data: stuck } = useQuery({ queryKey: qk.intakeList({ status: "error", pageSize: 5 }), queryFn: () => listIntakeNotes({ status: "error", pageSize: 5 }) });
  const { data: intakeIndex } = useQuery({ queryKey: qk.intakeList({ pageSize: 500 }), queryFn: () => listIntakeNotes({ pageSize: 500 }) });
  const { data: promptIndex } = useQuery({ queryKey: qk.promptList({ pageSize: 500 }), queryFn: () => listPromptGenerations({ pageSize: 500 }) });
  const { data: queueDepth } = useQuery({ queryKey: qk.queueDepth, queryFn: getQueueDepth });
  const { data: sla } = useQuery({ queryKey: qk.slaSummary, queryFn: getSlaSummary });
  const { data: throughput } = useQuery({ queryKey: qk.projectThroughput, queryFn: getProjectThroughput });
  const noteById = new Map((intakeIndex?.rows ?? []).map((note) => [note.id, note]));
  const promptById = new Map((promptIndex?.rows ?? []).map((prompt) => [prompt.id, prompt]));
  const noteLabel = (noteId: string) => noteById.get(noteId)?.note_relative_path ?? noteId.slice(-8);
  const promptLabel = (promptId: string) => {
    const prompt = promptById.get(promptId);
    return prompt ? `${prompt.prompt_type} · ${noteLabel(prompt.intake_note_id)}` : promptId.slice(-8);
  };

  const totalQueue = queueDepth?.reduce((a, b) => a + b.queued_count, 0) ?? 0;
  const latencySamples = (sla ?? []).filter((s) => s.latency_ms !== null && s.latency_ms !== undefined);
  const avgLatency = latencySamples.length
    ? Math.round(latencySamples.reduce((a, b) => a + (b.latency_ms || 0), 0) / latencySamples.length / 1000)
    : 0;
  const totalNotes = throughput?.reduce((a, b) => a + b.notes, 0) ?? 0;
  const totalPrompts = throughput?.reduce((a, b) => a + b.prompts, 0) ?? 0;
  const totalDeliveries = throughput?.reduce((a, b) => a + b.deliveries, 0) ?? 0;

  return (
    <>
      <PageHeader
        title="Operations dashboard"
        description="Live health, throughput, and recovery queues across PromptForge."
        help={{
          label: "Dashboard help",
          content: "Start here for live system state. Health cards show backend reachability, metric cards show counts, and attention queues surface items that need action.",
        }}
      />
      <PageBody>
        <QueryInspector />
        <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
          <HealthCard title="API" status={health?.api.status ?? "ok"} metric={health ? `${health.api.latency_ms}ms` : "—"} hint="last probe" help={{ label: "API health", content: "Live API reachability and latency for console requests." }} />
          <HealthCard title="Database" status={health?.db.status ?? "ok"} metric={health ? `${health.db.latency_ms}ms` : "—"} hint="proxy probe" help={{ label: "Database health", content: "Backend database probe used to judge storage reachability and query health." }} />
          <MetricCard label="Queue depth" value={totalQueue} Icon={Layers} hint={`${queueDepth?.length ?? 0} groups`} help={{ label: "Queue depth", content: "Queued and dispatching deliveries grouped by priority and destination." }} />
          <MetricCard label="Failures 24h" value={health?.failures_24h ?? 0} Icon={AlertTriangle} hint="processing + delivery" help={{ label: "Failure count", content: "Processing and delivery failures recorded in the last 24 hours." }} />
        </div>

        <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
          <MetricCard label="Avg E2E latency" value={`${avgLatency}s`} Icon={Clock} hint="recent terminal deliveries" help={{ label: "Latency metric", content: "Average note-to-terminal-delivery latency from recent completed deliveries." }} />
          <MetricCard label="Notes" value={totalNotes} Icon={Inbox} help={{ label: "Note count", content: "Total intake notes across current projects in the loaded snapshot." }} />
          <MetricCard label="Prompts" value={totalPrompts} Icon={Activity} help={{ label: "Prompt count", content: "Prompt generations created from imported intake notes." }} />
          <MetricCard label="Deliveries" value={totalDeliveries} Icon={Send} help={{ label: "Delivery count", content: "Downstream dispatch attempts, including completed and failed deliveries." }} />
        </div>

        <div className="grid gap-3 lg:grid-cols-2 xl:grid-cols-4">
          <NeedsAttentionPanel
            title="Requires review"
            help={{ label: "Review queue", content: "Prompt generations that still need operator or admin attention before they can be treated as done." }}
            items={(review?.rows ?? []).map(p => ({
              id: p.id,
              title: `${p.prompt_type} · ${noteLabel(p.intake_note_id)}`,
              subtitle: "Prompt generation awaiting operator review",
              to: `/pipeline/${p.intake_note_id}`,
              meta: <StatusBadge value={p.status} />,
            }))}
          />
          <NeedsAttentionPanel
            title="Failed deliveries"
            help={{ label: "Delivery failures", content: "Dispatch attempts that failed and may need retry, reroute, or target inspection." }}
            items={(failedDel?.rows ?? []).map(d => ({
              id: d.id,
              title: `${d.destination} · ${promptLabel(d.prompt_generation_id)}`,
              subtitle: d.failure_text ?? "Failed dispatch",
              to: `/deliveries`,
              meta: <StatusBadge value="failed" />,
            }))}
          />
          <NeedsAttentionPanel
            title="Failed processing"
            help={{ label: "Processing failures", content: "Pipeline stages that stopped before completion and need trace inspection." }}
            items={(failedRuns ?? []).slice(0, 5).map(r => ({
              id: r.id,
              title: `${r.stage_name} · ${noteLabel(r.intake_note_id)}`,
              subtitle: r.error_text ?? "Run stopped early",
              to: `/pipeline/${r.intake_note_id}`,
              meta: <StatusBadge value="failed" />,
            }))}
          />
          <NeedsAttentionPanel
            title="Stuck notes"
            help={{ label: "Stuck notes", content: "Intake notes stuck in error state without normal progression through the pipeline." }}
            items={(stuck?.rows ?? []).map(n => ({ id: n.id, title: n.note_relative_path.split("/").pop()!, subtitle: n.note_relative_path, to: `/intake/${n.id}`, meta: <StatusBadge value={n.status} /> }))}
          />
        </div>

        <Card className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-1.5">
              <h3 className="text-sm font-semibold">Project throughput</h3>
              <HelpTip label="Project throughput help" content="Rollup of notes, prompts, and deliveries by project. Use this to spot hot projects or failing paths." />
            </div>
            <Link to="/intake" className="text-xs text-primary hover:underline">View intake →</Link>
          </div>
          <div className="overflow-auto">
            <table className="w-full text-sm">
              <thead className="text-xs uppercase tracking-wider text-muted-foreground">
                <tr><th className="text-left py-1.5">Project</th><th className="text-right">Notes</th><th className="text-right">Prompts</th><th className="text-right">Deliveries</th><th className="text-right">Failed del.</th><th className="text-right">Failed runs</th></tr>
              </thead>
              <tbody>
                {throughput?.map(t => (
                  <tr key={t.project_id} className="border-t">
                    <td className="py-2 font-medium">{t.project_name}</td>
                    <td className="text-right tabular-nums">{t.notes}</td>
                    <td className="text-right tabular-nums">{t.prompts}</td>
                    <td className="text-right tabular-nums">{t.deliveries}</td>
                    <td className="text-right tabular-nums text-status-danger">{t.failed_deliveries}</td>
                    <td className="text-right tabular-nums text-status-danger">{t.failed_processing}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </PageBody>
    </>
  );
}
