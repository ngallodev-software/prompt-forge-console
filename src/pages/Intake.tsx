import { useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { listIntakeNotes, listProjects, qk } from "@/services/promptforge";
import type { PfNoteStatus } from "@/services/promptforge/types";
import { PageBody, PageHeader } from "@/components/shell/PageHeader";
import { DataTable, type Column } from "@/components/pf/DataTable";
import { HelpTip } from "@/components/pf/HelpTip";
import { StatusBadge } from "@/components/pf/StatusBadge";
import { OpsSurfaceIntro } from "@/components/pf/OpsSurfaceIntro";
import { QueryInspector } from "@/components/pf/QueryInspector";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import type { IntakeNote } from "@/services/promptforge/types";
import { Eye } from "lucide-react";

export default function Intake() {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const page = Number(params.get("page") ?? 1);
  const status = (params.get("status") as PfNoteStatus) || undefined;
  const projectId = params.get("project") || undefined;
  const search = params.get("q") || "";
  const [searchInput, setSearchInput] = useState(search);

  const { data: projects = [] } = useQuery({ queryKey: qk.projects, queryFn: listProjects });
  const filters = { page, pageSize: 25, status, projectId, search };
  const { data, isLoading } = useQuery({ queryKey: qk.intakeList(filters), queryFn: () => listIntakeNotes(filters) });
  const projectById = useMemo(() => new Map(projects.map((project) => [project.id, project])), [projects]);
  const rows = data?.rows ?? [];
  const eligibleCount = rows.filter((row) => row.watch_eligible).length;
  const excludedCount = rows.length - eligibleCount;

  const projectLabel = (id: string | null) => (id ? projectById.get(id)?.name ?? id.slice(-8) : "—");
  const pathLabel = (path: string) => {
    const parts = path.split("/").filter(Boolean);
    return {
      leaf: parts[parts.length - 1] ?? path,
      path,
    };
  };

  const setParam = (k: string, v?: string) => {
    const next = new URLSearchParams(params);
    if (!v) next.delete(k); else next.set(k, v);
    if (k !== "page") next.delete("page");
    setParams(next, { replace: true });
  };

  const columns: Column<IntakeNote>[] = [
    { key: "path", header: <span className="inline-flex items-center gap-1.5">Source note<HelpTip label="Intake source help" content="The note that entered the workflow. The path is shown as a detail, not the whole story." /></span>, cell: (r) => {
      const label = pathLabel(r.note_relative_path);
      return (
        <div className="min-w-0">
          <div className="font-medium truncate">{label.leaf}</div>
          <div className="font-mono text-xs truncate block max-w-[36ch] text-muted-foreground">{label.path}</div>
        </div>
      );
    } },
    { key: "status", header: <span className="inline-flex items-center gap-1.5">Status<HelpTip label="Intake status help" content="Current import state for the note. Use this to tell whether the note has entered the pipeline or stopped early." /></span>, cell: (r) => <StatusBadge value={r.status} />, width: "120px" },
    { key: "watch", header: <span className="inline-flex items-center gap-1.5">Watch handling<HelpTip label="Watch handling help" content="Whether the watcher should keep tracking this note. Included notes can continue into downstream processing; excluded notes are intentionally left out." /></span>, hideOnMobile: true, cell: (r) => <StatusBadge value={r.watch_eligible ? "watching" : "skipped"} tone={r.watch_eligible ? "success" : "neutral"} /> },
    { key: "project", header: <span className="inline-flex items-center gap-1.5">Project<HelpTip label="Project help" content="Which project owns the note. This gives the path context instead of showing a bare folder name." /></span>, hideOnMobile: true, cell: (r) => <span className="text-sm">{projectLabel(r.project_id)}</span> },
    { key: "device", header: <span className="inline-flex items-center gap-1.5">Source<HelpTip label="Source device help" content="Device or source identity attached to the intake note. Often useful when the same project produces multiple note streams." /></span>, hideOnMobile: true, cell: (r) => <span className="text-xs font-mono text-muted-foreground">{r.source_device ?? "—"}</span> },
    { key: "updated", header: <span className="inline-flex items-center gap-1.5">Updated<HelpTip label="Updated time help" content="Last observed change time for the note record. Use this to sort by recency when chasing live failures." /></span>, hideOnMobile: true, cell: (r) => <span className="text-xs tabular-nums text-muted-foreground">{format(new Date(r.updated_at), "MMM d HH:mm")}</span> },
    { key: "actions", header: "", width: "60px", cell: (r) => <Button size="icon" variant="ghost" className="h-7 w-7" onClick={(e) => { e.stopPropagation(); navigate(`/intake/${r.id}`); }}><Eye className="h-3.5 w-3.5" /></Button> },
  ];

  return (
    <>
      <PageHeader title="Intake explorer" description="Browse, filter, and inspect intake notes from the watcher." help={{ label: "Intake explorer help", content: "Use this page to find imported notes, see whether the watcher will keep tracking them, and jump into the full lineage." }} />
      <PageBody>
        <QueryInspector />
        <OpsSurfaceIntro
          eyebrow="Inventory"
          title="What the intake page is for"
          purpose="This page is the intake inventory. It shows which notes were picked up, which ones the watcher will continue tracking, and which project they belong to."
          description="The path is only useful when it is attached to a project and a watch decision. That is the context this page should surface first."
          steps={[
            "Start with the source note and project so the row has an identity before you open it.",
            "Use the watch-handling column to tell whether the note is part of the active watcher flow.",
            "Open the detail view only after the row tells you which note is worth tracing.",
          ]}
          metrics={[
            { label: "Visible", value: rows.length, detail: "Notes on the current page" },
            { label: "Watching", value: eligibleCount, detail: "Notes included in watcher handling", tone: "success" },
            { label: "Skipped", value: excludedCount, detail: "Notes intentionally left out", tone: "neutral" },
          ]}
          note="A note path can look repetitive by itself. The project and watch state are what make it meaningful."
        />
        <DataTable
          columns={columns}
          rows={rows}
          isLoading={isLoading}
          total={data?.total}
          page={page}
          pageSize={25}
          onPageChange={(p) => setParam("page", String(p))}
          onRowClick={(r) => navigate(`/intake/${r.id}`)}
          rowKey={(r) => r.id}
          toolbar={
            <div className="flex flex-wrap items-center gap-2">
              <form onSubmit={(e) => { e.preventDefault(); setParam("q", searchInput || undefined); }} className="flex-1 min-w-[200px]">
                <Input placeholder="Search path or body…" value={searchInput} onChange={(e) => setSearchInput(e.target.value)} className="h-8" />
              </form>
              <Select value={status ?? "all"} onValueChange={(v) => setParam("status", v === "all" ? undefined : v)}>
                <SelectTrigger className="h-8 w-[140px]"><SelectValue placeholder="Status" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  {(["new", "imported", "processing", "processed", "error", "archived"] as PfNoteStatus[]).map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={projectId ?? "all"} onValueChange={(v) => setParam("project", v === "all" ? undefined : v)}>
                <SelectTrigger className="h-8 w-[180px]"><SelectValue placeholder="Project" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All projects</SelectItem>
                  {projects.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          }
        />
      </PageBody>
    </>
  );
}
