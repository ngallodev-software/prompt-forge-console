import { useMemo, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { listProjects, listTerms, qk, upsertTerm } from "@/services/promptforge";
import { PageBody, PageHeader } from "@/components/shell/PageHeader";
import { DataTable, type Column } from "@/components/pf/DataTable";
import { ScopeBadge } from "@/components/pf/ScopeBadge";
import { QueryInspector } from "@/components/pf/QueryInspector";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Download, FileUp, Plus, Upload } from "lucide-react";
import type { PfScope, Project, TermDictionaryEntry } from "@/services/promptforge/types";
import { PermissionGuard } from "@/components/pf/PermissionGuard";
import { toast } from "@/hooks/use-toast";
import { useAppStore } from "@/stores/app-store";

type TermForm = {
  id?: string;
  source_term: string;
  normalized_term: string;
  description: string;
  scope: PfScope;
  project_id: string;
};

const makeDefaultForm = (scope: PfScope, projectId: string | null): TermForm => ({
  source_term: "",
  normalized_term: "",
  description: "",
  scope,
  project_id: projectId ?? "",
});

function downloadJson(filename: string, value: unknown) {
  const blob = new Blob([JSON.stringify(value, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function parseImportedTerms(raw: string): Partial<TermDictionaryEntry>[] {
  const parsed = JSON.parse(raw) as unknown;
  if (Array.isArray(parsed)) return parsed as Partial<TermDictionaryEntry>[];
  if (parsed && typeof parsed === "object") {
    const value = (parsed as { entries?: unknown; termDictionary?: unknown }).entries ?? (parsed as { termDictionary?: unknown }).termDictionary;
    if (Array.isArray(value)) return value as Partial<TermDictionaryEntry>[];
  }
  throw new Error("Expected a JSON array or { entries: [...] } payload.");
}

export default function Dictionary() {
  const [page, setPage] = useState(1);
  const qc = useQueryClient();
  const workspace = useAppStore((s) => s.workspace);
  const scope = workspace.scope;
  const projectId = scope === "project" ? workspace.projectId ?? undefined : undefined;
  const queryFilters = { page, scope, projectId };
  const { data, isLoading } = useQuery({
    queryKey: qk.termDict(queryFilters),
    queryFn: () => listTerms(queryFilters),
  });
  const { data: projects = [] } = useQuery({ queryKey: qk.projects, queryFn: listProjects });
  const projectNameById = useMemo(() => new Map(projects.map((project: Project) => [project.id, project.name])), [projects]);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [termOpen, setTermOpen] = useState(false);
  const [termBusy, setTermBusy] = useState(false);
  const [termForm, setTermForm] = useState<TermForm>(() => makeDefaultForm(scope, projectId ?? null));

  const [importOpen, setImportOpen] = useState(false);
  const [importText, setImportText] = useState("");
  const [importBusy, setImportBusy] = useState(false);

  const rows = data?.rows ?? [];

  const openNewTerm = () => {
    setTermForm(makeDefaultForm(scope, projectId ?? null));
    setTermOpen(true);
  };

  const openEditTerm = (row: TermDictionaryEntry) => {
    setTermForm({
      id: row.id,
      source_term: row.source_term,
      normalized_term: row.normalized_term,
      description: row.description ?? "",
      scope: row.scope,
      project_id: row.project_id ?? "",
    });
    setTermOpen(true);
  };

  const saveTerm = async () => {
    setTermBusy(true);
    try {
      const payload: Partial<TermDictionaryEntry> = {
        id: termForm.id,
        source_term: termForm.source_term.trim(),
        normalized_term: termForm.normalized_term.trim(),
        description: termForm.description.trim() || undefined,
        scope: termForm.scope,
        project_id: termForm.scope === "project" ? termForm.project_id || workspace.projectId || null : null,
      };
      await upsertTerm(payload);
      await qc.invalidateQueries({ queryKey: ["pf", "dict"] });
      toast({ title: termForm.id ? "Term updated" : "Term created", description: payload.source_term });
      setTermOpen(false);
    } catch (error) {
      toast({
        title: "Term save failed",
        description: error instanceof Error ? error.message : "Unable to save the term.",
      });
    } finally {
      setTermBusy(false);
    }
  };

  const exportTerms = async () => {
    try {
      const exportResult = await listTerms({ page: 1, pageSize: 1000, scope, projectId });
      downloadJson(`promptforge-terms-${scope}${projectId ? `-${projectId.slice(0, 8)}` : ""}.json`, {
        exported_at: new Date().toISOString(),
        filters: { scope, project_id: projectId ?? null },
        entries: exportResult.rows,
      });
      toast({ title: "Export ready", description: `${exportResult.rows.length} term(s) downloaded.` });
    } catch (error) {
      toast({
        title: "Export failed",
        description: error instanceof Error ? error.message : "Unable to export terms.",
      });
    }
  };

  const onPickImportFile = async (file: File | null) => {
    if (!file) return;
    const text = await file.text();
    setImportText(text);
    setImportOpen(true);
  };

  const runImport = async () => {
    setImportBusy(true);
    try {
      const entries = parseImportedTerms(importText);
      for (const entry of entries) {
        await upsertTerm({
          id: entry.id,
          source_term: entry.source_term ?? "",
          normalized_term: entry.normalized_term ?? "",
          description: entry.description,
          scope: entry.scope ?? scope,
          project_id: entry.scope === "project" ? entry.project_id ?? projectId ?? null : null,
        });
      }
      await qc.invalidateQueries({ queryKey: ["pf", "dict"] });
      toast({ title: "Import complete", description: `${entries.length} term(s) loaded.` });
      setImportOpen(false);
    } catch (error) {
      toast({
        title: "Import failed",
        description: error instanceof Error ? error.message : "Unable to import terms.",
      });
    } finally {
      setImportBusy(false);
    }
  };

  const columns: Column<TermDictionaryEntry>[] = [
    { key: "src", header: "Source", cell: (r) => <span className="font-mono text-sm">{r.source_term}</span> },
    { key: "norm", header: "Normalized", cell: (r) => <span className="font-mono text-sm font-medium">{r.normalized_term}</span> },
    { key: "scope", header: "Scope", cell: (r) => <ScopeBadge value={r.scope} /> },
    {
      key: "project",
      header: "Project",
      cell: (r) => (
        <span className="text-sm text-muted-foreground">
          {r.scope === "project" ? projectNameById.get(r.project_id ?? "") ?? r.project_id ?? "Unassigned" : "—"}
        </span>
      ),
    },
    { key: "desc", header: "Description", hideOnMobile: true, cell: (r) => <span className="text-xs text-muted-foreground">{r.description ?? "—"}</span> },
    { key: "edit", header: "", cell: (r) => <span className="text-xs text-muted-foreground">Edit</span> },
  ];

  return (
    <>
      <PageHeader
        title="Term dictionary"
        description="Normalize terminology across rules, templates, and renderers."
        actions={
          <PermissionGuard require="operator" inline>
            <Button size="sm" variant="outline" onClick={() => setImportOpen(true)}>
              <Upload className="h-3.5 w-3.5" />
              Import
            </Button>
            <Button size="sm" variant="outline" onClick={exportTerms}>
              <Download className="h-3.5 w-3.5" />
              Export
            </Button>
            <Button size="sm" onClick={openNewTerm}>
              <Plus className="h-3.5 w-3.5" />
              New term
            </Button>
          </PermissionGuard>
        }
      />
      <PageBody>
        <QueryInspector />
        <div className="flex flex-wrap items-center gap-2 rounded-lg border bg-surface-sunken/40 px-3 py-2 text-xs text-muted-foreground">
          <span className="uppercase tracking-wider">Current workspace</span>
          <ScopeBadge value={scope} />
          <span>
            {scope === "project"
              ? projectNameById.get(projectId ?? "") ?? projectId ?? "Project selected"
              : "Global dictionary view"}
          </span>
        </div>
        <DataTable
          columns={columns}
          rows={rows}
          isLoading={isLoading}
          total={data?.total}
          page={page}
          pageSize={25}
          onPageChange={setPage}
          rowKey={(r) => r.id}
          onRowClick={openEditTerm}
          isRowActive={(r) => r.id === termForm.id && termOpen}
          emptyDescription="Use import or New term to add entries for the current workspace."
        />

        <input
          ref={fileInputRef}
          type="file"
          accept="application/json,.json"
          className="hidden"
          onChange={(e) => {
            void onPickImportFile(e.target.files?.[0] ?? null);
            e.currentTarget.value = "";
          }}
        />

        <Dialog open={termOpen} onOpenChange={setTermOpen}>
          <DialogContent className="sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle>{termForm.id ? "Edit term" : "New term"}</DialogTitle>
              <DialogDescription>Terms are saved against the current workspace scope unless you move them to another project.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="source_term">Source term</Label>
                <Input id="source_term" value={termForm.source_term} onChange={(e) => setTermForm((prev) => ({ ...prev, source_term: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="normalized_term">Normalized term</Label>
                <Input id="normalized_term" value={termForm.normalized_term} onChange={(e) => setTermForm((prev) => ({ ...prev, normalized_term: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Scope</Label>
                <Select value={termForm.scope} onValueChange={(value) => setTermForm((prev) => ({ ...prev, scope: value as PfScope, project_id: value === "project" ? prev.project_id || projectId || "" : "" }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select scope" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="global">global</SelectItem>
                    <SelectItem value="user">user</SelectItem>
                    <SelectItem value="project">project</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Project</Label>
                <Select
                  value={termForm.project_id || "none"}
                  onValueChange={(value) => setTermForm((prev) => ({ ...prev, project_id: value === "none" ? "" : value }))}
                  disabled={termForm.scope !== "project"}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select project" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No project</SelectItem>
                    {projects.map((project) => (
                      <SelectItem key={project.id} value={project.id}>
                        {project.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="sm:col-span-2 space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={termForm.description}
                  onChange={(e) => setTermForm((prev) => ({ ...prev, description: e.target.value }))}
                  className="min-h-[110px]"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setTermOpen(false)} disabled={termBusy}>
                Cancel
              </Button>
              <Button onClick={saveTerm} disabled={termBusy || !termForm.source_term.trim() || !termForm.normalized_term.trim()}>
                {termBusy ? "Saving..." : termForm.id ? "Save term" : "Create term"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={importOpen} onOpenChange={setImportOpen}>
          <DialogContent className="sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle>Import terms</DialogTitle>
              <DialogDescription>Paste the export JSON or load a file. Entries without a scope will use the current workspace.</DialogDescription>
            </DialogHeader>
            <div className="space-y-3">
              <div className="flex flex-wrap gap-2">
                <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()}>
                  <FileUp className="h-3.5 w-3.5" />
                  Pick JSON file
                </Button>
                <span className="text-xs text-muted-foreground self-center">JSON array or {`{ entries: [...] }`}</span>
              </div>
              <Textarea
                value={importText}
                onChange={(e) => setImportText(e.target.value)}
                placeholder='[{ "source_term": "pf", "normalized_term": "PromptForge" }]'
                className="min-h-[260px] font-mono text-xs"
              />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setImportOpen(false)} disabled={importBusy}>
                Cancel
              </Button>
              <Button onClick={runImport} disabled={importBusy || !importText.trim()}>
                {importBusy ? "Importing..." : "Import"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </PageBody>
    </>
  );
}
