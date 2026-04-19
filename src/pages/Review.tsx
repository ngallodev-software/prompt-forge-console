import { useQuery } from "@tanstack/react-query";
import { listPromptGenerations, listDeliveries, listFailedProcessingRuns, qk } from "@/services/promptforge";
import { PageBody, PageHeader } from "@/components/shell/PageHeader";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { NeedsAttentionPanel } from "@/components/pf/NeedsAttentionPanel";
import { StatusBadge } from "@/components/pf/StatusBadge";
import { QueryInspector } from "@/components/pf/QueryInspector";

export default function Review() {
  const { data: review } = useQuery({ queryKey: qk.promptList({ requiresReview: true }), queryFn: () => listPromptGenerations({ requiresReview: true, pageSize: 50 }) });
  const { data: failedDel } = useQuery({ queryKey: qk.deliveriesList({ failedOnly: true }), queryFn: () => listDeliveries({ failedOnly: true, pageSize: 50 }) });
  const { data: failedRuns } = useQuery({ queryKey: qk.processingFailed, queryFn: listFailedProcessingRuns });
  const failedGen = (review?.rows ?? []).filter(p => p.status === "failed");

  return (
    <>
      <PageHeader title="Review queue" description="Unified recovery queue: review, failed generations, deliveries, and runs." />
      <PageBody>
        <QueryInspector />
        <Tabs defaultValue="review">
          <TabsList>
            <TabsTrigger value="review">Requires review ({review?.total ?? 0})</TabsTrigger>
            <TabsTrigger value="gen">Failed generations ({failedGen.length})</TabsTrigger>
            <TabsTrigger value="del">Failed deliveries ({failedDel?.total ?? 0})</TabsTrigger>
            <TabsTrigger value="run">Failed runs ({failedRuns?.length ?? 0})</TabsTrigger>
          </TabsList>
          <TabsContent value="review">
            <NeedsAttentionPanel title="Requires review" items={(review?.rows ?? []).map(p => ({ id: p.id, title: p.prompt_type, subtitle: p.id, to: `/pipeline/${p.intake_note_id}`, meta: <StatusBadge value={p.status} /> }))} />
          </TabsContent>
          <TabsContent value="gen">
            <NeedsAttentionPanel title="Failed generations" items={failedGen.map(p => ({ id: p.id, title: p.prompt_type, subtitle: p.validation_warnings[0] ?? p.id, to: `/pipeline/${p.intake_note_id}`, meta: <StatusBadge value="failed" /> }))} />
          </TabsContent>
          <TabsContent value="del">
            <NeedsAttentionPanel title="Failed deliveries" items={(failedDel?.rows ?? []).map(d => ({ id: d.id, title: `→ ${d.destination}`, subtitle: d.failure_text ?? d.id, to: "/deliveries", meta: <StatusBadge value="failed" /> }))} />
          </TabsContent>
          <TabsContent value="run">
            <NeedsAttentionPanel title="Failed runs" items={(failedRuns ?? []).map(r => ({ id: r.id, title: r.stage_name, subtitle: r.error_text ?? r.id, to: `/pipeline/${r.intake_note_id}`, meta: <StatusBadge value="failed" /> }))} />
          </TabsContent>
        </Tabs>
      </PageBody>
    </>
  );
}
