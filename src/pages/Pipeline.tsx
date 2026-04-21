import { useParams, Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useState, useMemo } from "react";
import { getNoteLineage } from "@/services/promptforge";
import { PageBody, PageHeader } from "@/components/shell/PageHeader";
import { TimelineTrace, type TimelineItem } from "@/components/pf/TimelineTrace";
import { DiffViewer } from "@/components/pf/DiffViewer";
import { JsonViewer } from "@/components/pf/JsonViewer";
import { RootCausePanel } from "@/components/pf/RootCausePanel";
import { RelatedArtifactsPanel } from "@/components/pf/RelatedArtifactsPanel";
import { LoadingState } from "@/components/pf/LoadingState";
import { StatusBadge, statusTone } from "@/components/pf/StatusBadge";
import { QueryInspector } from "@/components/pf/QueryInspector";
import { OpsSurfaceIntro } from "@/components/pf/OpsSurfaceIntro";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Inbox } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { listIntakeNotes } from "@/services/promptforge";
import { cn } from "@/lib/utils";
import { HelpTip } from "@/components/pf/HelpTip";

const expectedProcessingStages = ["preprocess", "validate", "render", "prepare-delivery"] as const;

function parseRuleId(errorText?: string | null) {
  return errorText?.match(/rule_id=([^\s]+)/)?.[1];
}

export default function Pipeline() {
  const { intakeNoteId } = useParams();
  const navigate = useNavigate();
  const { data: list } = useQuery({ queryKey: ["pf","intake","first"], queryFn: () => listIntakeNotes({ pageSize: 1 }) });
  const targetId = intakeNoteId ?? list?.rows[0]?.id;

  const { data, isLoading } = useQuery({
    queryKey: ["pf", "lineage", targetId],
    queryFn: () => getNoteLineage(targetId!),
    enabled: !!targetId,
  });

  const [selectedRevId, setSelectedRevId] = useState<string | null>(null);
  const selectedRev = data?.revisions.find(r => r.id === selectedRevId);
  const prevRev = selectedRev ? data?.revisions.filter(r => r.utterance_id === selectedRev.utterance_id && r.created_at < selectedRev.created_at).slice(-1)[0] : undefined;
  const failedRun = data?.processingRuns.find(r => r.status === "failed");

  const items: TimelineItem[] = useMemo(() => {
    if (!data) return [];
    const list: TimelineItem[] = [];
    if (data.note) list.push({ id: data.note.id, title: "Intake note imported", subtitle: data.note.note_relative_path, timestamp: data.note.created_at, tone: statusTone(data.note.status), badge: <StatusBadge value={data.note.status} /> });
    data.revisions.forEach(r => list.push({
      id: r.id, title: `Revision · ${r.revision_kind}`, subtitle: `${r.producer_type}/${r.producer_name}`, timestamp: r.created_at, tone: "info",
      onClick: () => setSelectedRevId(r.id), active: selectedRevId === r.id,
    }));
    data.promptGenerations.forEach(p => list.push({ id: p.id, title: `Prompt generated · ${p.prompt_type}`, subtitle: p.id, timestamp: p.created_at, tone: statusTone(p.status), badge: <StatusBadge value={p.status} /> }));
    data.deliveries.forEach(d => list.push({ id: d.id, title: `Delivery → ${d.destination}`, subtitle: d.id, timestamp: d.created_at, tone: statusTone(d.status), badge: <StatusBadge value={d.status} /> }));
    data.processingRuns.forEach(r => list.push({ id: r.id, title: `Run · ${r.stage_name}`, subtitle: r.error_text ?? "completed", timestamp: r.created_at, tone: statusTone(r.status), badge: <StatusBadge value={r.status} />, body: r.trace_json ? <JsonViewer data={r.trace_json} collapsed /> : null }));
    return list.sort((a, b) => (a.timestamp ?? "") < (b.timestamp ?? "") ? -1 : 1);
  }, [data, selectedRevId]);

  const diagnostics = useMemo(() => {
    if (!data) return null;

    const utteranceIds = new Set(data.utterances.map((u) => u.id));
    const promptGenerationIds = new Set(data.promptGenerations.map((pg) => pg.id));
    const deliveryByPromptGeneration = new Map<string, number>();

    data.deliveries.forEach((delivery) => {
      deliveryByPromptGeneration.set(delivery.prompt_generation_id, (deliveryByPromptGeneration.get(delivery.prompt_generation_id) ?? 0) + 1);
    });

    const missingStages = expectedProcessingStages.filter((stage) => !data.processingRuns.some((run) => run.stage_name === stage));
    const orphanRevisions = data.revisions.filter((revision) => !utteranceIds.has(revision.utterance_id));
    const missingRulesets = data.promptGenerations.filter((pg) => !pg.ruleset_id);
    const missingTemplates = data.promptGenerations.filter((pg) => !pg.template_id);
    const promptGenerationsWithoutDelivery = data.promptGenerations.filter((pg) => !deliveryByPromptGeneration.has(pg.id));
    const orphanDeliveries = data.deliveries.filter((delivery) => !promptGenerationIds.has(delivery.prompt_generation_id));
    const ruleMatch = parseRuleId(failedRun?.error_text);

    const gaps: Array<{ id: string; title: string; detail: string; tone: "warn" | "danger" | "info" }> = [];

    if (!data.note) {
      gaps.push({ id: "missing-note", title: "Note missing from lineage", detail: "The intake note did not resolve for this lineage lookup.", tone: "danger" });
    }
    if (data.note && data.utterances.length === 0) {
      gaps.push({ id: "missing-utterances", title: "No utterances recorded", detail: "The note exists, but there are no utterance records to anchor revisions.", tone: "danger" });
    }
    if (data.utterances.length > 0 && data.revisions.length === 0) {
      gaps.push({ id: "missing-revisions", title: "No transcript revisions", detail: "Utterances exist, but no revision chain was produced.", tone: "danger" });
    }
    if (data.promptGenerations.length === 0) {
      gaps.push({ id: "missing-prompts", title: "No prompt generations", detail: "The lineage stopped before prompt generation.", tone: "danger" });
    }
    if (promptGenerationsWithoutDelivery.length > 0) {
      gaps.push({ id: "missing-deliveries", title: "Prompt generations without deliveries", detail: `${promptGenerationsWithoutDelivery.length} prompt generation${promptGenerationsWithoutDelivery.length === 1 ? "" : "s"} have no downstream delivery record.`, tone: "warn" });
    }
    if (data.processingRuns.length === 0) {
      gaps.push({ id: "missing-runs", title: "No processing runs", detail: "No stage execution records were found for this note.", tone: "danger" });
    } else if (missingStages.length > 0) {
      gaps.push({ id: "missing-run-stages", title: "Missing processing stages", detail: `Absent stages: ${missingStages.join(", ")}.`, tone: "warn" });
    }
    if (missingRulesets.length > 0) {
      gaps.push({ id: "missing-rulesets", title: "Missing ruleset links", detail: `${missingRulesets.length} prompt generation${missingRulesets.length === 1 ? "" : "s"} do not point at a ruleset.`, tone: "warn" });
    }
    if (missingTemplates.length > 0) {
      gaps.push({ id: "missing-templates", title: "Missing template links", detail: `${missingTemplates.length} prompt generation${missingTemplates.length === 1 ? "" : "s"} do not point at a template.`, tone: "warn" });
    }
    if (orphanRevisions.length > 0) {
      gaps.push({ id: "orphan-revisions", title: "Orphan revisions", detail: `${orphanRevisions.length} revision${orphanRevisions.length === 1 ? "" : "s"} do not resolve back to an utterance.`, tone: "warn" });
    }
    if (orphanDeliveries.length > 0) {
      gaps.push({ id: "orphan-deliveries", title: "Orphan deliveries", detail: `${orphanDeliveries.length} delivery${orphanDeliveries.length === 1 ? "" : "s"} do not resolve back to a prompt generation.`, tone: "warn" });
    }

    const lineageCoverage = [
      !!data.note,
      data.utterances.length > 0,
      data.revisions.length > 0,
      data.promptGenerations.length > 0,
      data.deliveries.length > 0,
      data.processingRuns.length > 0,
    ].filter(Boolean).length;

    return {
      gaps,
      ruleMatch,
      lineageCoverage,
      totalStops: expectedProcessingStages.length,
      counts: {
        utterances: data.utterances.length,
        revisions: data.revisions.length,
        promptGenerations: data.promptGenerations.length,
        deliveries: data.deliveries.length,
        processingRuns: data.processingRuns.length,
      },
      missingStages,
    };
  }, [data, failedRun?.error_text]);

  if (!targetId) return <PageBody><LoadingState /></PageBody>;
  if (isLoading) return <PageBody><LoadingState rows={10} /></PageBody>;

  return (
    <TooltipProvider delayDuration={120}>
      <>
        <PageHeader
          breadcrumb={(
            <Tooltip>
              <TooltipTrigger asChild>
                <Link to={`/intake/${targetId}`} className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
                  <ArrowLeft className="h-3 w-3" /> Note
                </Link>
              </TooltipTrigger>
              <TooltipContent side="bottom">Back to the intake note that anchors this lineage trace.</TooltipContent>
            </Tooltip>
          )}
          title="Pipeline trace"
          description={<span className="font-mono text-xs">{data?.note?.note_relative_path}</span>}
          help={{
            label: "Pipeline trace help",
            content: "Trace the note through revisions, prompt generations, deliveries, and processing runs. Gaps show where backend state is missing or the pipeline stopped.",
          }}
          actions={(
            <Tooltip>
              <TooltipTrigger asChild>
                <Button size="sm" variant="outline" onClick={() => navigate("/intake")}><Inbox className="h-3.5 w-3.5" /> All notes</Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">Return to the intake index and pick a different note.</TooltipContent>
            </Tooltip>
          )}
        />
        <PageBody>
          <QueryInspector />
          <OpsSurfaceIntro
            eyebrow="Workflow guide"
            title="How to use the pipeline trace"
            purpose="Start here when you need to understand where one intake note stopped, what it produced, and which downstream record is broken."
            description="This page is a guided lineage view. Use the summary to find the break, then drill into the specific revision, prompt, delivery, or run that explains it."
            steps={[
              "Read the diagnostics panel first to see which stages exist and which are missing.",
              "Open a failed run or delivery only after you know whether the problem is in transcription, rendering, dispatch, or execution.",
              "Use the revision diff when you need wording detail, not as the first step.",
            ]}
            metrics={[
              { label: "Coverage", value: diagnostics ? `${diagnostics.lineageCoverage}/6` : "—", detail: "Stages present in the lineage chain", tone: diagnostics && diagnostics.lineageCoverage === 6 ? "success" : "warn" },
              { label: "Prompts", value: diagnostics?.counts.promptGenerations ?? "—", detail: "Prompt generations attached to this note" },
              { label: "Deliveries", value: diagnostics?.counts.deliveries ?? "—", detail: "Dispatch attempts tied to the lineage" },
              { label: "Runs", value: diagnostics?.counts.processingRuns ?? "—", detail: "Pipeline stage executions recorded" },
            ]}
            note="If the trace looks complete but the note still failed, the problem is usually in the last stage that turned red rather than the whole chain."
          />
          <div className="grid gap-4 lg:grid-cols-3">
            <Card className="lg:col-span-2 p-4 space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-semibold">Lineage diagnostics</h3>
                    <HelpTip
                      label="Lineage diagnostics help"
                      content="This block summarizes the chain from intake note through revisions, prompt generation, deliveries, and processing runs. It highlights where the lineage stops and which links are missing."
                    />
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Coverage: {diagnostics ? `${diagnostics.lineageCoverage}/6 stages present` : "unavailable"}
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-2 text-right sm:grid-cols-5">
                  {diagnostics && (
                    <>
                      <div className="rounded border bg-muted/30 px-2 py-1">
                        <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Utterances</div>
                        <div className="text-sm font-semibold tabular-nums">{diagnostics.counts.utterances}</div>
                      </div>
                      <div className="rounded border bg-muted/30 px-2 py-1">
                        <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Revisions</div>
                        <div className="text-sm font-semibold tabular-nums">{diagnostics.counts.revisions}</div>
                      </div>
                      <div className="rounded border bg-muted/30 px-2 py-1">
                        <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Prompts</div>
                        <div className="text-sm font-semibold tabular-nums">{diagnostics.counts.promptGenerations}</div>
                      </div>
                      <div className="rounded border bg-muted/30 px-2 py-1">
                        <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Deliveries</div>
                        <div className="text-sm font-semibold tabular-nums">{diagnostics.counts.deliveries}</div>
                      </div>
                      <div className="rounded border bg-muted/30 px-2 py-1 sm:col-span-1">
                        <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Runs</div>
                        <div className="text-sm font-semibold tabular-nums">{diagnostics.counts.processingRuns}</div>
                      </div>
                    </>
                  )}
                </div>
              </div>
              {diagnostics && diagnostics.gaps.length > 0 && (
                <div className="grid gap-2 md:grid-cols-2">
                  {diagnostics.gaps.map((gap) => (
                    <div key={gap.id} className={cn("rounded-md border px-3 py-2 text-sm", gap.tone === "danger" && "border-status-danger/30 bg-status-danger-muted/30", gap.tone === "warn" && "border-status-warn/30 bg-status-warn-muted/25", gap.tone === "info" && "border-status-info/20 bg-status-info-muted/25")}>
                      <div className="font-medium">{gap.title}</div>
                      <div className="mt-0.5 text-xs text-muted-foreground">{gap.detail}</div>
                    </div>
                  ))}
                </div>
              )}
              <TimelineTrace items={items} />
            </Card>
            <div className="space-y-4">
              {failedRun && (
                <RootCausePanel
                  failedStage={failedRun.stage_name}
                  errorText={failedRun.error_text}
                  matchedRule={diagnostics?.ruleMatch}
                  fallbackPath={diagnostics?.missingStages.length ? `Missing stages: ${diagnostics.missingStages.join(", ")}` : undefined}
                  warnings={[
                    ...(diagnostics?.gaps.map((gap) => gap.title) ?? []),
                    ...(failedRun.trace_json?.steps ? [`Trace steps recorded: ${(failedRun.trace_json.steps as Array<{ name?: string }>).length}`] : []),
                  ]}
                />
              )}
              <Card className="p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-semibold">Related artifacts</h3>
                  <HelpTip
                    label="Related artifacts help"
                    content="Cross-links into the intake note and downstream deliveries tied to this lineage trace."
                  />
                </div>
                <RelatedArtifactsPanel items={[
                  { id: "intake", label: "Intake note", to: `/intake/${targetId}`, type: "note" },
                  ...(data?.deliveries ?? []).map(d => ({ id: d.id, label: `Delivery ${d.id.slice(-6)}`, to: `/deliveries`, type: "del", meta: <StatusBadge value={d.status} /> })),
                ]} />
              </Card>
            </div>
          </div>
          {selectedRev && (
            <Card className="p-4 space-y-3">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold">Revision diff · {selectedRev.revision_kind}</h3>
                <HelpTip
                  label="Revision diff help"
                  content="This compares the selected revision against the previous revision for the same utterance. If no previous revision exists, the left side is intentionally empty."
                />
              </div>
              <DiffViewer before={prevRev?.content_text ?? ""} after={selectedRev.content_text} beforeLabel={prevRev?.revision_kind ?? "(no previous)"} afterLabel={selectedRev.revision_kind} />
              <JsonViewer data={selectedRev.metadata_json} collapsed />
            </Card>
          )}
        </PageBody>
      </>
    </TooltipProvider>
  );
}
