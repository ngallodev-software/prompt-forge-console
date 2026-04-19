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
import { Activity, Inbox, Send, AlertTriangle, Layers, Clock } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Link } from "react-router-dom";

export default function Dashboard() {
  const { data: health } = useQuery({ queryKey: qk.health, queryFn: getHealth });
  const { data: review } = useQuery({ queryKey: qk.promptList({ requiresReview: true, pageSize: 5 }), queryFn: () => listPromptGenerations({ requiresReview: true, pageSize: 5 }) });
  const { data: failedDel } = useQuery({ queryKey: qk.deliveriesList({ failedOnly: true, pageSize: 5 }), queryFn: () => listDeliveries({ failedOnly: true, pageSize: 5 }) });
  const { data: failedRuns } = useQuery({ queryKey: qk.processingFailed, queryFn: listFailedProcessingRuns });
  const { data: stuck } = useQuery({ queryKey: qk.intakeList({ status: "error", pageSize: 5 }), queryFn: () => listIntakeNotes({ status: "error", pageSize: 5 }) });
  const { data: queueDepth } = useQuery({ queryKey: qk.queueDepth, queryFn: getQueueDepth });
  const { data: sla } = useQuery({ queryKey: qk.slaSummary, queryFn: getSlaSummary });
  const { data: throughput } = useQuery({ queryKey: qk.projectThroughput, queryFn: getProjectThroughput });

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
      <PageHeader title="Operations dashboard" description="Live health, throughput, and recovery queues across PromptForge." />
      <PageBody>
        <QueryInspector />
        <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
          <HealthCard title="API" status={health?.api.status ?? "ok"} metric={health ? `${health.api.latency_ms}ms` : "—"} hint="last probe" />
          <HealthCard title="Database" status={health?.db.status ?? "ok"} metric={health ? `${health.db.latency_ms}ms` : "—"} hint="proxy probe" />
          <MetricCard label="Queue depth" value={totalQueue} Icon={Layers} hint={`${queueDepth?.length ?? 0} groups`} />
          <MetricCard label="Failures 24h" value={health?.failures_24h ?? 0} Icon={AlertTriangle} hint="processing + delivery" />
        </div>

        <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
          <MetricCard label="Avg E2E latency" value={`${avgLatency}s`} Icon={Clock} hint="recent terminal deliveries" />
          <MetricCard label="Notes" value={totalNotes} Icon={Inbox} />
          <MetricCard label="Prompts" value={totalPrompts} Icon={Activity} />
          <MetricCard label="Deliveries" value={totalDeliveries} Icon={Send} />
        </div>

        <div className="grid gap-3 lg:grid-cols-2 xl:grid-cols-4">
          <NeedsAttentionPanel
            title="Requires review"
            items={(review?.rows ?? []).map(p => ({ id: p.id, title: p.prompt_type, subtitle: p.id, to: `/pipeline/${p.intake_note_id}`, meta: <StatusBadge value={p.status} /> }))}
          />
          <NeedsAttentionPanel
            title="Failed deliveries"
            items={(failedDel?.rows ?? []).map(d => ({ id: d.id, title: `→ ${d.destination}`, subtitle: d.id, to: `/deliveries`, meta: <StatusBadge value="failed" /> }))}
          />
          <NeedsAttentionPanel
            title="Failed processing"
            items={(failedRuns ?? []).slice(0, 5).map(r => ({ id: r.id, title: r.stage_name, subtitle: r.error_text ?? "", to: `/pipeline/${r.intake_note_id}`, meta: <StatusBadge value="failed" /> }))}
          />
          <NeedsAttentionPanel
            title="Stuck notes"
            items={(stuck?.rows ?? []).map(n => ({ id: n.id, title: n.note_relative_path.split("/").pop()!, subtitle: n.note_relative_path, to: `/intake/${n.id}`, meta: <StatusBadge value={n.status} /> }))}
          />
        </div>

        <Card className="p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold">Project throughput</h3>
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
