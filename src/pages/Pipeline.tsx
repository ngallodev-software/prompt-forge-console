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
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Inbox } from "lucide-react";
import { listIntakeNotes } from "@/services/promptforge";

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

  const selectedRev = data?.revisions.find(r => r.id === selectedRevId);
  const prevRev = selectedRev ? data?.revisions.filter(r => r.utterance_id === selectedRev.utterance_id && r.created_at < selectedRev.created_at).slice(-1)[0] : undefined;
  const failedRun = data?.processingRuns.find(r => r.status === "failed");

  if (!targetId) return <PageBody><LoadingState /></PageBody>;
  if (isLoading) return <PageBody><LoadingState rows={10} /></PageBody>;

  return (
    <>
      <PageHeader
        breadcrumb={<Link to={`/intake/${targetId}`} className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"><ArrowLeft className="h-3 w-3" /> Note</Link>}
        title="Pipeline trace"
        description={<span className="font-mono text-xs">{data?.note?.note_relative_path}</span>}
        actions={<Button size="sm" variant="outline" onClick={() => navigate("/intake")}><Inbox className="h-3.5 w-3.5" /> All notes</Button>}
      />
      <PageBody>
        <QueryInspector />
        <div className="grid gap-4 lg:grid-cols-3">
          <Card className="lg:col-span-2 p-4">
            <h3 className="text-sm font-semibold mb-3">Timeline</h3>
            <TimelineTrace items={items} />
          </Card>
          <div className="space-y-4">
            {failedRun && <RootCausePanel failedStage={failedRun.stage_name} errorText={failedRun.error_text} />}
            <RelatedArtifactsPanel items={[
              { id: "intake", label: "Intake note", to: `/intake/${targetId}`, type: "note" },
              ...(data?.deliveries ?? []).map(d => ({ id: d.id, label: `Delivery ${d.id.slice(-6)}`, to: `/deliveries`, type: "del", meta: <StatusBadge value={d.status} /> })),
            ]} />
          </div>
        </div>
        {selectedRev && (
          <Card className="p-4 space-y-3">
            <h3 className="text-sm font-semibold">Revision diff · {selectedRev.revision_kind}</h3>
            <DiffViewer before={prevRev?.content_text ?? ""} after={selectedRev.content_text} beforeLabel={prevRev?.revision_kind ?? "(no previous)"} afterLabel={selectedRev.revision_kind} />
            <JsonViewer data={selectedRev.metadata_json} collapsed />
          </Card>
        )}
      </PageBody>
    </>
  );
}
