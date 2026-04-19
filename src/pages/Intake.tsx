import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { listIntakeNotes, listProjects, qk } from "@/services/promptforge";
import type { PfNoteStatus } from "@/services/promptforge/types";
import { PageBody, PageHeader } from "@/components/shell/PageHeader";
import { DataTable, type Column } from "@/components/pf/DataTable";
import { StatusBadge } from "@/components/pf/StatusBadge";
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

  const setParam = (k: string, v?: string) => {
    const next = new URLSearchParams(params);
    if (!v) next.delete(k); else next.set(k, v);
    if (k !== "page") next.delete("page");
    setParams(next, { replace: true });
  };

  const columns: Column<IntakeNote>[] = [
    { key: "path", header: "Path", cell: (r) => <span className="font-mono text-xs truncate block max-w-[36ch]">{r.note_relative_path}</span> },
    { key: "status", header: "Status", cell: (r) => <StatusBadge value={r.status} />, width: "120px" },
    { key: "watch", header: "Watch", hideOnMobile: true, cell: (r) => <StatusBadge value={r.watch_eligible ? "eligible" : "skipped"} tone={r.watch_eligible ? "success" : "neutral"} /> },
    { key: "device", header: "Device", hideOnMobile: true, cell: (r) => <span className="text-xs font-mono text-muted-foreground">{r.source_device ?? "—"}</span> },
    { key: "updated", header: "Updated", hideOnMobile: true, cell: (r) => <span className="text-xs tabular-nums text-muted-foreground">{format(new Date(r.updated_at), "MMM d HH:mm")}</span> },
    { key: "actions", header: "", width: "60px", cell: (r) => <Button size="icon" variant="ghost" className="h-7 w-7" onClick={(e) => { e.stopPropagation(); navigate(`/intake/${r.id}`); }}><Eye className="h-3.5 w-3.5" /></Button> },
  ];

  return (
    <>
      <PageHeader title="Intake explorer" description="Browse, filter, and inspect intake notes from the watcher." />
      <PageBody>
        <QueryInspector />
        <DataTable
          columns={columns}
          rows={data?.rows}
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
