import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { listPromptGenerations, listDeliveries, listFailedProcessingRuns, listIntakeNotes, qk } from "@/services/promptforge";
import { PageBody, PageHeader } from "@/components/shell/PageHeader";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { NeedsAttentionPanel } from "@/components/pf/NeedsAttentionPanel";
import { StatusBadge } from "@/components/pf/StatusBadge";
import { QueryInspector } from "@/components/pf/QueryInspector";
import { OpsSurfaceIntro } from "@/components/pf/OpsSurfaceIntro";
import { Badge } from "@/components/ui/badge";

export default function Review() {
  const { data: review } = useQuery({ queryKey: qk.promptList({ requiresReview: true }), queryFn: () => listPromptGenerations({ requiresReview: true, pageSize: 50 }) });
  const { data: failedDel } = useQuery({ queryKey: qk.deliveriesList({ failedOnly: true }), queryFn: () => listDeliveries({ failedOnly: true, pageSize: 50 }) });
  const { data: failedRuns } = useQuery({ queryKey: qk.processingFailed, queryFn: listFailedProcessingRuns });
  const { data: promptIndex } = useQuery({ queryKey: qk.promptList({ pageSize: 500 }), queryFn: () => listPromptGenerations({ pageSize: 500 }) });
  const { data: intakeIndex } = useQuery({ queryKey: qk.intakeList({ pageSize: 500 }), queryFn: () => listIntakeNotes({ pageSize: 500 }) });
  const failedGen = (review?.rows ?? []).filter(p => p.status === "failed");
  const promptById = useMemo(() => new Map((promptIndex?.rows ?? []).map((prompt) => [prompt.id, prompt])), [promptIndex]);
  const noteById = useMemo(() => new Map((intakeIndex?.rows ?? []).map((note) => [note.id, note])), [intakeIndex]);

  const noteLabel = (noteId: string) => noteById.get(noteId)?.note_relative_path ?? noteId.slice(-8);
  const promptLabel = (promptId: string) => {
    const prompt = promptById.get(promptId);
    return prompt ? `${prompt.prompt_type} · ${noteLabel(prompt.intake_note_id)}` : promptId.slice(-8);
  };

  return (
    <>
      <PageHeader title="Review queue" description="Triage items that need a human decision before the workflow can move on." help={{ label: "Review queue help", content: "This page groups items by why they need attention. Use it to decide whether to review, retry, reroute, or trace the underlying note." }} />
      <PageBody>
        <OpsSurfaceIntro
          eyebrow="Triage"
          title="What this page is for"
          purpose="The review queue is the operator's decision surface. It collects prompt generations that need review, failed generations that need attention, failed deliveries that may need reroute or retry, and failed runs that point to a pipeline break."
          description="Rows should tell you why an item exists and what action is likely next. UUIDs are still available, but they are not the main story."
          steps={[
            "Start with the tab that matches the failure mode.",
            "Use the row summary to decide whether the item belongs in review, delivery recovery, or trace inspection.",
            "Open the trace only after you know which note or delivery needs context.",
          ]}
          metrics={[
            { label: "Review", value: review?.rows.length ?? 0, detail: "Prompt generations awaiting operator review", tone: "warn" },
            { label: "Failed gens", value: failedGen.length, detail: "Prompt generations that failed validation or rendering", tone: "danger" },
            { label: "Deliveries", value: failedDel?.total ?? 0, detail: "Failed deliveries that may need retry or reroute", tone: "danger" },
            { label: "Runs", value: failedRuns?.length ?? 0, detail: "Pipeline runs that stopped early", tone: "danger" },
          ]}
        />
        <QueryInspector />
        <Tabs defaultValue="review">
          <TabsList>
            <TabsTrigger value="review">Requires review ({review?.total ?? 0})</TabsTrigger>
            <TabsTrigger value="gen">Failed generations ({failedGen.length})</TabsTrigger>
            <TabsTrigger value="del">Failed deliveries ({failedDel?.total ?? 0})</TabsTrigger>
            <TabsTrigger value="run">Failed runs ({failedRuns?.length ?? 0})</TabsTrigger>
          </TabsList>
          <TabsContent value="review">
            <NeedsAttentionPanel
              title="Requires review"
              help={{ label: "Review items help", content: "Prompt generations that still need operator or admin review before they can be considered done." }}
              items={(review?.rows ?? []).map((p) => ({
                id: p.id,
                title: `${p.prompt_type} · ${noteLabel(p.intake_note_id)}`,
                subtitle: "Prompt generation awaiting operator review",
                to: `/pipeline/${p.intake_note_id}`,
                meta: (
                  <div className="flex flex-col items-end gap-1">
                    <Badge variant="outline" className="text-[10px] uppercase tracking-wider">review required</Badge>
                    <StatusBadge value={p.status} />
                  </div>
                ),
              }))}
            />
          </TabsContent>
          <TabsContent value="gen">
            <NeedsAttentionPanel
              title="Failed generations"
              help={{ label: "Failed generations help", content: "Prompt generations that failed validation or rendering and may still contain useful warnings or lineage links." }}
              items={failedGen.map((p) => ({
                id: p.id,
                title: `${p.prompt_type} · ${noteLabel(p.intake_note_id)}`,
                subtitle: `${noteLabel(p.intake_note_id)} · ${p.validation_warnings[0] ?? "validation failed"}`,
                to: `/pipeline/${p.intake_note_id}`,
                meta: <StatusBadge value="failed" />,
              }))}
            />
          </TabsContent>
          <TabsContent value="del">
            <NeedsAttentionPanel
              title="Failed deliveries"
              help={{ label: "Failed deliveries help", content: "Dispatch attempts that failed and may need retry, reroute, or target inspection." }}
              items={(failedDel?.rows ?? []).map((d) => ({
                id: d.id,
                title: `${d.destination} · ${promptLabel(d.prompt_generation_id)}`,
                subtitle: `${promptLabel(d.prompt_generation_id)} · ${d.failure_text ?? "failed dispatch"}`,
                to: "/deliveries",
                meta: <StatusBadge value="failed" />,
              }))}
            />
          </TabsContent>
          <TabsContent value="run">
            <NeedsAttentionPanel
              title="Failed runs"
              help={{ label: "Failed runs help", content: "Pipeline stage runs that stopped early and usually need trace inspection or backend fixes." }}
              items={(failedRuns ?? []).map((r) => ({
                id: r.id,
                title: `${r.stage_name} · ${noteLabel(r.intake_note_id)}`,
                subtitle: `${noteLabel(r.intake_note_id)} · ${r.error_text ?? "run stopped early"}`,
                to: `/pipeline/${r.intake_note_id}`,
                meta: <StatusBadge value="failed" />,
              }))}
            />
          </TabsContent>
        </Tabs>
      </PageBody>
    </>
  );
}
