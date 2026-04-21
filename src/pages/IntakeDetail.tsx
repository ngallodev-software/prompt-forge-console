import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getIntakeNote, getNoteLineage, qk } from "@/services/promptforge";
import { PageBody, PageHeader } from "@/components/shell/PageHeader";
import { HelpTip } from "@/components/pf/HelpTip";
import { StatusBadge } from "@/components/pf/StatusBadge";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FrontmatterCompare } from "@/components/pf/FrontmatterCompare";
import { MarkdownPreview } from "@/components/pf/MarkdownPreview";
import { JsonViewer } from "@/components/pf/JsonViewer";
import { RelatedArtifactsPanel } from "@/components/pf/RelatedArtifactsPanel";
import { LoadingState } from "@/components/pf/LoadingState";
import { EmptyState } from "@/components/pf/EmptyState";
import { ArrowLeft, GitBranch, Download } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function IntakeDetail() {
  const { id = "" } = useParams();
  const { data: note, isLoading } = useQuery({ queryKey: qk.intake(id), queryFn: () => getIntakeNote(id) });
  const { data: lineage } = useQuery({ queryKey: ["pf", "lineage", id], queryFn: () => getNoteLineage(id) });

  if (isLoading) return <PageBody><LoadingState rows={8} /></PageBody>;
  if (!note) return <PageBody><EmptyState title="Note not found" /></PageBody>;

  const exportBundle = () => {
    const blob = new Blob([JSON.stringify({ note, ...lineage }, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `trace-${note.id}.json`; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <PageHeader
        breadcrumb={<Link to="/intake" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"><ArrowLeft className="h-3 w-3" /> Intake</Link>}
        title={<span className="font-mono text-base sm:text-lg">{note.note_relative_path}</span>}
        description={<span className="font-mono text-xs">{note.id}</span>}
        help={{ label: "Intake detail help", content: "This page shows the raw note, its frontmatter, metadata, and all downstream artifacts linked to the note." }}
        actions={
          <>
            <StatusBadge value={note.status} size="md" />
            <Button asChild size="sm" variant="outline"><Link to={`/pipeline/${note.id}`}><GitBranch className="h-3.5 w-3.5" /> Pipeline</Link></Button>
            <Button size="sm" variant="outline" onClick={exportBundle}><Download className="h-3.5 w-3.5" /> Export</Button>
          </>
        }
      />
      <PageBody>
        <div className="grid gap-4 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-4">
            <Tabs defaultValue="body">
              <TabsList><TabsTrigger value="body">Body</TabsTrigger><TabsTrigger value="frontmatter">Frontmatter</TabsTrigger><TabsTrigger value="metadata">Metadata</TabsTrigger></TabsList>
              <TabsContent value="body"><MarkdownPreview source={note.body_text} /></TabsContent>
              <TabsContent value="frontmatter"><FrontmatterCompare original={note.frontmatter_original} current={note.frontmatter_current} /></TabsContent>
              <TabsContent value="metadata"><JsonViewer data={note.metadata_json} /></TabsContent>
            </Tabs>
          </div>
          <div className="space-y-4">
            <Card className="p-4 space-y-2 text-sm">
              <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground">
                <span>Eligibility</span>
                <HelpTip label="Eligibility help" content="Explains whether the note qualifies for watch processing and why it may have been skipped." />
              </div>
              <div>Watch: <strong>{String(note.watch_eligible)}</strong></div>
              <div className="font-mono text-xs">{String(note.metadata_json?.eligibility_reason ?? "—")}</div>
              {note.metadata_json?.skip_cause && <div className="text-status-warn font-mono text-xs">Skip: {String(note.metadata_json.skip_cause)}</div>}
            </Card>
            <Card className="p-4 space-y-2">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold">Linked artifacts</h3>
                <HelpTip label="Linked artifacts help" content="Cross-links to utterances, prompt generations, and deliveries associated with this note." />
              </div>
              <RelatedArtifactsPanel items={[
                ...(lineage?.utterances ?? []).map(u => ({ id: u.id, label: u.id, to: `/pipeline/${note.id}`, type: "utt" })),
                ...(lineage?.promptGenerations ?? []).map(p => ({ id: p.id, label: p.prompt_type, to: `/prompts?id=${p.id}`, type: "prompt", meta: <StatusBadge value={p.status} /> })),
                ...(lineage?.deliveries ?? []).map(d => ({ id: d.id, label: `→ ${d.destination}`, to: `/deliveries?id=${d.id}`, type: "del", meta: <StatusBadge value={d.status} /> })),
              ]} />
            </Card>
          </div>
        </div>
      </PageBody>
    </>
  );
}
