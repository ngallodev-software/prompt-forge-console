import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { listProjects, listTemplates, activateTemplate, llmAssist, qk, upsertTemplateLocal } from "@/services/promptforge";
import { PageBody, PageHeader } from "@/components/shell/PageHeader";
import { Card } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ScopeBadge } from "@/components/pf/ScopeBadge";
import { StatusBadge } from "@/components/pf/StatusBadge";
import { MarkdownPreview } from "@/components/pf/MarkdownPreview";
import { EmptyState } from "@/components/pf/EmptyState";
import { QueryInspector } from "@/components/pf/QueryInspector";
import { ConfirmationModal } from "@/components/pf/ConfirmationModal";
import { PermissionGuard } from "@/components/pf/PermissionGuard";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import type { PfScope, PromptTemplate, Project } from "@/services/promptforge/types";
import { toast } from "@/hooks/use-toast";
import { useAppStore } from "@/stores/app-store";
import { FilePlus2, PencilLine, Plus, Save, WandSparkles } from "lucide-react";

type TemplateDraft = {
  id?: string;
  name: string;
  prompt_type: string;
  scope: PfScope;
  project_id: string;
  version: number;
  is_active: boolean;
  template_family_key: string;
  body: string;
};

const makeDraft = (scope: PfScope, projectId: string | null, source?: PromptTemplate): TemplateDraft => ({
  id: source?.id,
  name: source?.name ?? "Untitled template",
  prompt_type: source?.prompt_type ?? "agent_task",
  scope: source?.scope ?? scope,
  project_id: source?.project_id ?? projectId ?? "",
  version: source?.version ?? 1,
  is_active: source?.is_active ?? false,
  template_family_key: source?.template_family_key ?? "",
  body: source?.body ?? "# Template\n\nDescribe the prompt here.",
});

function slugifyTemplateKey(name: string, promptType: string) {
  const slug = `${name}-${promptType}`
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
  return slug || `template_${Date.now().toString(36)}`;
}

export default function Templates() {
  const qc = useQueryClient();
  const workspace = useAppStore((s) => s.workspace);
  const scope = workspace.scope;
  const projectId = scope === "project" ? workspace.projectId ?? undefined : undefined;
  const queryFilters = { scope, projectId };
  const { data } = useQuery({ queryKey: qk.templates(queryFilters), queryFn: () => listTemplates(queryFilters) });
  const { data: projects = [] } = useQuery({ queryKey: qk.projects, queryFn: listProjects });
  const projectNameById = useMemo(() => new Map(projects.map((project: Project) => [project.id, project.name])), [projects]);

  const templates = data?.rows ?? [];
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected: PromptTemplate | undefined = templates.find((t) => t.id === selectedId) ?? templates[0];

  const [editorOpen, setEditorOpen] = useState(false);
  const [editorBusy, setEditorBusy] = useState(false);
  const [draft, setDraft] = useState<TemplateDraft>(() => makeDraft(scope, projectId ?? null));

  const [assistantPrompt, setAssistantPrompt] = useState("Help me write a template for:");
  const [assistantResult, setAssistantResult] = useState("");
  const [assistantLoading, setAssistantLoading] = useState(false);

  const openNewTemplate = () => {
    setDraft(makeDraft(scope, projectId ?? null));
    setEditorOpen(true);
  };

  const openEditTemplate = (template: PromptTemplate) => {
    setDraft(makeDraft(scope, projectId ?? null, template));
    setEditorOpen(true);
  };

  const openDuplicateTemplate = (template: PromptTemplate) => {
    setDraft({
      ...makeDraft(scope, projectId ?? null, template),
      id: undefined,
      name: `${template.name} copy`,
      version: template.version + 1,
      is_active: false,
      template_family_key: template.template_family_key,
    });
    setEditorOpen(true);
  };

  const onActivate = async () => {
    if (!selected) return;
    await activateTemplate(selected.id, selected.template_family_key);
    toast({ title: "Template activated", description: `${selected.name} v${selected.version}` });
    await qc.invalidateQueries({ queryKey: ["pf", "templates"] });
    await qc.invalidateQueries({ queryKey: ["pf", "prompts"] });
  };

  const saveDraft = async () => {
    setEditorBusy(true);
    try {
      const payload: Partial<PromptTemplate> = {
        id: draft.id,
        name: draft.name.trim(),
        prompt_type: draft.prompt_type.trim() || "agent_task",
        scope: draft.scope,
        project_id: draft.scope === "project" ? draft.project_id || workspace.projectId || null : null,
        version: draft.version,
        is_active: draft.is_active,
        template_family_key: draft.template_family_key.trim() || slugifyTemplateKey(draft.name, draft.prompt_type),
        body: draft.body,
      };
      const saved = await upsertTemplateLocal(payload);
      await qc.invalidateQueries({ queryKey: ["pf", "templates"] });
      toast({
        title: draft.id ? "Template draft updated" : "Template draft created",
        description: "Saved in the current session. Backend write endpoints are still missing.",
      });
      setSelectedId(saved.template.id);
      setEditorOpen(false);
    } catch (error) {
      toast({
        title: "Template save failed",
        description: error instanceof Error ? error.message : "Unable to save the draft.",
      });
    } finally {
      setEditorBusy(false);
    }
  };

  const onAskAssistant = async () => {
    setAssistantLoading(true);
    try {
      const response = await llmAssist({
        prompt: assistantPrompt,
        context_type: "template",
        context: selected ? { template_name: selected.name, template_body: selected.body } : undefined,
      });
      setAssistantResult(response.result);
    } catch (error) {
      toast({ title: "LLM assistant failed", description: error instanceof Error ? error.message : "Unable to generate a response." });
    } finally {
      setAssistantLoading(false);
    }
  };

  return (
    <>
      <PageHeader
        title="Prompt templates"
        description="Versioned templates with safe activation flow."
        actions={
          <PermissionGuard require="operator" inline>
            <Button size="sm" variant="outline" onClick={openNewTemplate}>
              <Plus className="h-3.5 w-3.5" />
              New template
            </Button>
          </PermissionGuard>
        }
      />
      <PageBody>
        <QueryInspector />
        <Alert>
          <AlertTitle>Write contract gap</AlertTitle>
          <AlertDescription>
            Create/edit now works as a local draft flow. The missing backend contract is `POST /console/templates` and `PATCH /console/templates/{id}`.
          </AlertDescription>
        </Alert>
        <div className="flex flex-wrap items-center gap-2 rounded-lg border bg-surface-sunken/40 px-3 py-2 text-xs text-muted-foreground">
          <span className="uppercase tracking-wider">Current workspace</span>
          <ScopeBadge value={scope} />
          <span>
            {scope === "project"
              ? projectNameById.get(projectId ?? "") ?? projectId ?? "Project selected"
              : "Global template view"}
          </span>
        </div>
        <div className="grid gap-4 lg:grid-cols-3">
          <Card className="p-2">
            {templates.length === 0 ? (
              <EmptyState className="my-2" title="No records returned" description="The backend returned no prompt templates." />
            ) : (
              <ul className="space-y-1">
                {templates.map((template) => (
                  <li key={template.id}>
                    <button
                      onClick={() => setSelectedId(template.id)}
                      className={`w-full rounded px-2 py-2 text-left text-sm hover:bg-accent ${selected?.id === template.id ? "bg-accent" : ""}`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-medium truncate">{template.name}</span>
                        {template.is_active && <StatusBadge value="active" tone="success" />}
                      </div>
                      <div className="flex flex-wrap items-center gap-1.5 mt-1 text-xs text-muted-foreground">
                        <span className="font-mono">v{template.version}</span>
                        <span>·</span>
                        <ScopeBadge value={template.scope} />
                        <span>·</span>
                        <span className="truncate">{template.prompt_type}</span>
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </Card>
          <Card className="p-4 lg:col-span-2 space-y-3">
            {selected ? (
              <>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h3 className="font-semibold">
                      {selected.name} <span className="font-mono text-sm text-muted-foreground">v{selected.version}</span>
                    </h3>
                    <div className="flex flex-wrap gap-2 mt-1">
                      <ScopeBadge value={selected.scope} />
                      <StatusBadge value={selected.prompt_type} tone="neutral" />
                      <span className="rounded-full border px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                        {selected.scope === "project"
                          ? projectNameById.get(selected.project_id ?? "") ?? selected.project_id ?? "Unassigned project"
                          : "Global"}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <PermissionGuard require="operator" inline>
                      <Button size="sm" variant="outline" onClick={() => openEditTemplate(selected)}>
                        <PencilLine className="h-3.5 w-3.5" />
                        Edit
                      </Button>
                    </PermissionGuard>
                    <PermissionGuard require="operator" inline>
                      <Button size="sm" variant="outline" onClick={() => openDuplicateTemplate(selected)}>
                        <FilePlus2 className="h-3.5 w-3.5" />
                        Duplicate
                      </Button>
                    </PermissionGuard>
                    {!selected.is_active && (
                      <PermissionGuard require="admin" inline>
                        <ConfirmationModal
                          trigger={<Button size="sm">Activate</Button>}
                          title="Activate this template version?"
                          description={<>Will deactivate other versions of <strong>{selected.template_family_key}</strong> in this scope.</>}
                          confirmLabel="Activate"
                          onConfirm={onActivate}
                        />
                      </PermissionGuard>
                    )}
                  </div>
                </div>
                <MarkdownPreview source={selected.body} />
              </>
            ) : (
              <EmptyState title="No records returned" description="The backend returned no prompt templates." />
            )}
          </Card>
        </div>

        <Collapsible defaultOpen>
          <Card className="p-4 space-y-3">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-sm font-semibold">LLM assistant</h3>
              <CollapsibleTrigger asChild>
                <Button size="sm" variant="outline">
                  Collapse
                </Button>
              </CollapsibleTrigger>
            </div>
            <CollapsibleContent className="space-y-3">
              <Textarea value={assistantPrompt} onChange={(e) => setAssistantPrompt(e.target.value)} className="font-mono text-xs min-h-[120px]" />
              <div className="flex justify-end">
                <Button size="sm" onClick={onAskAssistant} disabled={assistantLoading}>
                  <WandSparkles className="h-3.5 w-3.5" />
                  {assistantLoading ? "Asking..." : "Ask"}
                </Button>
              </div>
              {assistantResult && <Textarea value={assistantResult} readOnly className="font-mono text-xs min-h-[160px]" />}
            </CollapsibleContent>
          </Card>
        </Collapsible>

        <Sheet open={editorOpen} onOpenChange={setEditorOpen}>
          <SheetContent className="w-full overflow-auto sm:max-w-3xl">
            <SheetHeader>
              <SheetTitle>{draft.id ? "Edit template" : "New template"}</SheetTitle>
              <SheetDescription>Draft saves update the local template list immediately. The backend write contract is still missing.</SheetDescription>
            </SheetHeader>
            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="template-name">Name</Label>
                  <Input id="template-name" value={draft.name} onChange={(e) => setDraft((prev) => ({ ...prev, name: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="template-type">Prompt type</Label>
                  <Input id="template-type" value={draft.prompt_type} onChange={(e) => setDraft((prev) => ({ ...prev, prompt_type: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label>Scope</Label>
                  <Select
                    value={draft.scope}
                    onValueChange={(value) => setDraft((prev) => ({ ...prev, scope: value as PfScope, project_id: value === "project" ? prev.project_id || projectId || "" : "" }))}
                  >
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
                    value={draft.project_id || "none"}
                    onValueChange={(value) => setDraft((prev) => ({ ...prev, project_id: value === "none" ? "" : value }))}
                    disabled={draft.scope !== "project"}
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
                <div className="space-y-2">
                  <Label htmlFor="template-family">Family key</Label>
                  <Input id="template-family" value={draft.template_family_key} onChange={(e) => setDraft((prev) => ({ ...prev, template_family_key: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="template-version">Version</Label>
                  <Input
                    id="template-version"
                    type="number"
                    min={1}
                    value={draft.version}
                    onChange={(e) => setDraft((prev) => ({ ...prev, version: Number(e.target.value) || 1 }))}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="template-body">Body</Label>
                <Textarea
                  id="template-body"
                  value={draft.body}
                  onChange={(e) => setDraft((prev) => ({ ...prev, body: e.target.value }))}
                  className="min-h-[260px] font-mono text-xs"
                />
              </div>
              <div className="flex items-center justify-between rounded-md border bg-surface-sunken/30 px-3 py-2 text-xs text-muted-foreground">
                <span>{draft.is_active ? "Active in this draft" : "Inactive draft"}</span>
                <Button size="sm" variant="outline" onClick={() => setDraft((prev) => ({ ...prev, is_active: !prev.is_active }))}>
                  {draft.is_active ? "Unset active" : "Mark active"}
                </Button>
              </div>
            </div>
            <SheetFooter>
              <Button variant="outline" onClick={() => setEditorOpen(false)} disabled={editorBusy}>
                Cancel
              </Button>
              <Button onClick={saveDraft} disabled={editorBusy || !draft.name.trim() || !draft.body.trim()}>
                <Save className="h-3.5 w-3.5" />
                {editorBusy ? "Saving..." : "Save draft"}
              </Button>
            </SheetFooter>
          </SheetContent>
        </Sheet>
      </PageBody>
    </>
  );
}
