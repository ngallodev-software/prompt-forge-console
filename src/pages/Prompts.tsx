import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { changePromptPriority, clonePrompt, forceReview, listIntakeNotes, listPromptGenerations, qk } from "@/services/promptforge";
import { PageBody, PageHeader } from "@/components/shell/PageHeader";
import { DataTable, type Column } from "@/components/pf/DataTable";
import { HelpTip } from "@/components/pf/HelpTip";
import { StatusBadge } from "@/components/pf/StatusBadge";
import { PriorityBadge } from "@/components/pf/PriorityBadge";
import { OpsSurfaceIntro } from "@/components/pf/OpsSurfaceIntro";
import { QueryInspector } from "@/components/pf/QueryInspector";
import { MarkdownPreview } from "@/components/pf/MarkdownPreview";
import { JsonViewer } from "@/components/pf/JsonViewer";
import { ConfirmationModal } from "@/components/pf/ConfirmationModal";
import { PermissionGuard } from "@/components/pf/PermissionGuard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import type { PromptGeneration } from "@/services/promptforge/types";
import { Link } from "react-router-dom";
import { ArchiveRestore, Copy, FlagTriangleRight } from "lucide-react";
import { toast } from "@/hooks/use-toast";

const priorityOptions = ["low", "normal", "high", "urgent"] as const;

export default function Prompts() {
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<PromptGeneration | null>(null);
  const [priorityDraft, setPriorityDraft] = useState<PromptGeneration["priority"]>("normal");
  const [actionsBusy, setActionsBusy] = useState(false);
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: qk.promptList({ page }), queryFn: () => listPromptGenerations({ page }) });
  const { data: intakeIndex } = useQuery({ queryKey: qk.intakeList({ pageSize: 500 }), queryFn: () => listIntakeNotes({ pageSize: 500 }) });
  const noteById = useMemo(() => new Map((intakeIndex?.rows ?? []).map((note) => [note.id, note])), [intakeIndex]);
  const noteLabel = (noteId: string) => noteById.get(noteId)?.note_relative_path ?? noteId.slice(-8);
  const selectedNoteLabel = selected ? noteLabel(selected.intake_note_id) : "";

  useEffect(() => {
    if (selected) setPriorityDraft(selected.priority);
  }, [selected]);

  const refreshPrompts = async () => {
    await qc.invalidateQueries({ queryKey: ["pf", "prompts"] });
  };

  const rows = data?.rows ?? [];
  const reviewCount = rows.filter((row) => row.requires_review).length;
  const failedCount = rows.filter((row) => row.status === "failed").length;
  const renderedCount = rows.filter((row) => row.status === "rendered").length;

  const onForceReview = async () => {
    if (!selected) return;
    setActionsBusy(true);
    try {
      await forceReview(selected.id);
      toast({ title: "Force review queued", description: selected.id.slice(-8) });
      await refreshPrompts();
    } catch (error) {
      toast({
        title: "Force review failed",
        description: error instanceof Error ? error.message : "Unable to queue a review.",
      });
    } finally {
      setActionsBusy(false);
    }
  };

  const onClone = async () => {
    if (!selected) return;
    setActionsBusy(true);
    try {
      const result = await clonePrompt(selected.id);
      toast({ title: "Prompt cloned", description: result.newId ? `New id ${result.newId}` : selected.id.slice(-8) });
      await refreshPrompts();
    } catch (error) {
      toast({
        title: "Clone failed",
        description: error instanceof Error ? error.message : "Unable to clone the prompt.",
      });
    } finally {
      setActionsBusy(false);
    }
  };

  const onSavePriority = async () => {
    if (!selected) return;
    setActionsBusy(true);
    try {
      await changePromptPriority(selected.id, priorityDraft);
      toast({ title: "Priority updated", description: `${selected.id.slice(-8)} → ${priorityDraft}` });
      await refreshPrompts();
    } catch (error) {
      toast({
        title: "Priority update failed",
        description: error instanceof Error ? error.message : "Unable to change priority.",
      });
    } finally {
      setActionsBusy(false);
    }
  };

  const columns: Column<PromptGeneration>[] = [
    { key: "subject", header: <span className="inline-flex items-center gap-1.5">Subject<HelpTip label="Prompt subject help" content="The prompt type and originating note. Start here before the UUID." /></span>, cell: (r) => (
      <div className="min-w-0">
        <div className="font-medium truncate">{r.prompt_type} · {noteLabel(r.intake_note_id)}</div>
        <div className="text-xs text-muted-foreground truncate">{r.destination} · {r.mode}</div>
      </div>
    ) },
    { key: "status", header: <span className="inline-flex items-center gap-1.5">Status<HelpTip label="Prompt status help" content="Current generation or validation state for the prompt. Failed rows may still have useful artifacts to inspect." /></span>, cell: (r) => <StatusBadge value={r.status} /> },
    { key: "review", header: <span className="inline-flex items-center gap-1.5">Review<HelpTip label="Review flag help" content="Shows whether the prompt still needs operator review before it can be treated as finished." /></span>, hideOnMobile: true, cell: (r) => r.requires_review ? <StatusBadge value="required" tone="warn" /> : <span className="text-xs text-muted-foreground">—</span> },
    { key: "dest", header: <span className="inline-flex items-center gap-1.5">Destination<HelpTip label="Prompt destination help" content="The downstream target or route this prompt was prepared for." /></span>, hideOnMobile: true, cell: (r) => <StatusBadge value={r.destination} tone="neutral" /> },
    { key: "prio", header: <span className="inline-flex items-center gap-1.5">Priority<HelpTip label="Prompt priority help" content="Operator or pipeline priority for the generation. Higher values generally win ordering and attention." /></span>, hideOnMobile: true, cell: (r) => <PriorityBadge value={r.priority} /> },
    { key: "id", header: <span className="inline-flex items-center gap-1.5">ID<HelpTip label="Prompt ID help" content="Stable backend identifier for this prompt generation. The full id is more useful than the short suffix when cross-referencing logs." /></span>, hideOnMobile: true, cell: (r) => <span className="font-mono text-xs text-muted-foreground">{r.id.slice(-8)}</span> },
  ];

  return (
    <>
      <PageHeader title="Prompt generations" description="Rendered prompts, structured outputs, and review state." help={{ label: "Prompt generations help", content: "Use this page to inspect how a prompt was rendered, whether it needs review, and how it connects back to the originating intake note." }} />
      <PageBody>
        <QueryInspector />
        <OpsSurfaceIntro
          eyebrow="Generation ledger"
          title="What the prompts page is for"
          purpose="This page is the prompt generation ledger. It tells you what was rendered, whether it still needs review, and where the prompt came from."
          description="The best rows read like a short sentence: prompt type, originating note, destination, and status. That makes the UUID a cross-reference instead of the main event."
          steps={[
            "Read the subject first so you know which note and destination produced the prompt.",
            "Check review and status before opening rendered content.",
            "Use the lineage tab when you need the note trace, not as the first stop.",
          ]}
          metrics={[
            { label: "Visible", value: rows.length, detail: "Prompts on the current page" },
            { label: "Review", value: reviewCount, detail: "Rows still needing operator attention", tone: "warn" },
            { label: "Failed", value: failedCount, detail: "Rows that hit validation or rendering failures", tone: "danger" },
            { label: "Rendered", value: renderedCount, detail: "Rows that finished rendering" },
          ]}
          note="If two prompts look the same, compare the originating note and destination before you compare the UUID."
        />
        <DataTable
          columns={columns}
          rows={rows}
          isLoading={isLoading}
          total={data?.total}
          page={page}
          pageSize={25}
          onPageChange={setPage}
          onRowClick={(r) => setSelected(r)}
          isRowActive={(r) => r.id === selected?.id}
          rowKey={(r) => r.id}
        />
        <Sheet open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
          <SheetContent className="w-full sm:max-w-2xl overflow-auto">
            {selected && (
              <div className="space-y-4">
                <div>
                  <div className="text-xs font-mono text-muted-foreground">{selected.id}</div>
                  <h2 className="text-lg font-semibold">{selected.prompt_type} · {selectedNoteLabel}</h2>
                  <div className="flex gap-2 mt-2"><StatusBadge value={selected.status} /><PriorityBadge value={selected.priority} /></div>
                </div>
                <Card className="p-4 space-y-3">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <div className="text-xs uppercase tracking-wider text-muted-foreground">Source note</div>
                      <div className="text-sm font-medium">{selectedNoteLabel}</div>
                      <div className="font-mono text-xs text-muted-foreground">{selected.intake_note_id}</div>
                    </div>
                    <div>
                      <div className="text-xs uppercase tracking-wider text-muted-foreground">Destination</div>
                      <div className="text-sm">{selected.destination}</div>
                    </div>
                    <div>
                      <div className="text-xs uppercase tracking-wider text-muted-foreground">Mode</div>
                      <div className="text-sm">{selected.mode}</div>
                    </div>
                    <div>
                      <div className="text-xs uppercase tracking-wider text-muted-foreground">Review</div>
                      <div className="text-sm">{selected.requires_review ? "Review required" : "No review required"}</div>
                    </div>
                  </div>
                </Card>
                <PermissionGuard require="operator" inline>
                  <Card className="p-4 space-y-3">
                    <div className="flex items-center gap-2">
                      <FlagTriangleRight className="h-4 w-4 text-muted-foreground" />
                      <h3 className="text-sm font-semibold">Operator actions</h3>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <ConfirmationModal
                        trigger={<Button variant="outline" size="sm" disabled={actionsBusy}><ArchiveRestore className="h-3.5 w-3.5" /> Force review</Button>}
                        title="Force review prompt?"
                        description="Queue this prompt for another review pass before it is treated as complete."
                        confirmLabel="Queue review"
                        onConfirm={onForceReview}
                      />
                      <ConfirmationModal
                        trigger={<Button variant="outline" size="sm" disabled={actionsBusy}><Copy className="h-3.5 w-3.5" /> Clone prompt</Button>}
                        title="Clone prompt?"
                        description="Create a backend copy of this prompt generation for further edits or comparison."
                        confirmLabel="Clone"
                        onConfirm={onClone}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Priority</Label>
                      <Select value={priorityDraft} onValueChange={(value) => setPriorityDraft(value as PromptGeneration["priority"])}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select priority" />
                        </SelectTrigger>
                        <SelectContent>
                          {priorityOptions.map((priority) => (
                            <SelectItem key={priority} value={priority}>
                              {priority}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button size="sm" onClick={onSavePriority} disabled={actionsBusy || priorityDraft === selected.priority}>
                        Save priority
                      </Button>
                    </div>
                  </Card>
                </PermissionGuard>
                <Tabs defaultValue="render">
                  <TabsList><TabsTrigger value="render">Rendered</TabsTrigger><TabsTrigger value="structured">Structured</TabsTrigger><TabsTrigger value="lineage">Lineage</TabsTrigger></TabsList>
                  <TabsContent value="render"><MarkdownPreview source={selected.final_prompt_markdown} /></TabsContent>
                  <TabsContent value="structured"><JsonViewer data={selected.structured_output_json} /></TabsContent>
                  <TabsContent value="lineage">
                    <Card className="p-3 text-sm">
                      <Link to={`/pipeline/${selected.intake_note_id}`} className="text-primary hover:underline">Open pipeline trace →</Link>
                    </Card>
                  </TabsContent>
                </Tabs>
                {selected.validation_warnings.length > 0 && (
                  <Card className="p-3 border-status-warn/30 bg-status-warn-muted/40 text-sm">
                    <div className="font-semibold text-status-warn mb-1">Validation warnings</div>
                    <ul className="list-disc pl-5">{selected.validation_warnings.map((w,i) => <li key={i}>{w}</li>)}</ul>
                  </Card>
                )}
              </div>
            )}
          </SheetContent>
        </Sheet>
      </PageBody>
    </>
  );
}
