import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { listTemplates, activateTemplate, llmAssist, qk } from "@/services/promptforge";
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
import type { PromptTemplate } from "@/services/promptforge/types";
import { toast } from "@/hooks/use-toast";

export default function Templates() {
  const { data } = useQuery({ queryKey: qk.templates({}), queryFn: () => listTemplates({}) });
  const templates = data?.rows ?? [];
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected: PromptTemplate | undefined = templates.find(t => t.id === selectedId) ?? templates[0];
  const [assistantPrompt, setAssistantPrompt] = useState("Help me write a template for:");
  const [assistantResult, setAssistantResult] = useState("");
  const [assistantLoading, setAssistantLoading] = useState(false);

  const onActivate = async () => {
    if (!selected) return;
    await activateTemplate(selected.id, selected.template_family_key);
    toast({ title: "Template activated", description: `${selected.name} v${selected.version}` });
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
      <PageHeader title="Prompt templates" description="Versioned templates with safe activation flow." />
      <PageBody>
        <QueryInspector />
        <div className="grid gap-4 lg:grid-cols-3">
          <Card className="p-2">
            {templates.length === 0 ? (
              <EmptyState className="my-2" title="No records returned" description="The backend returned no prompt templates." />
            ) : (
              <ul className="space-y-1">
                {templates.map(t => (
                  <li key={t.id}>
                    <button onClick={() => setSelectedId(t.id)} className={`w-full rounded px-2 py-2 text-left text-sm hover:bg-accent ${selected?.id === t.id ? "bg-accent" : ""}`}>
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-medium truncate">{t.name}</span>
                        {t.is_active && <StatusBadge value="active" tone="success" />}
                      </div>
                      <div className="flex items-center gap-1.5 mt-1 text-xs text-muted-foreground">
                        <span className="font-mono">v{t.version}</span>·<ScopeBadge value={t.scope} />·<span>{t.prompt_type}</span>
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
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-semibold">{selected.name} <span className="font-mono text-sm text-muted-foreground">v{selected.version}</span></h3>
                    <div className="flex gap-2 mt-1"><ScopeBadge value={selected.scope} /><StatusBadge value={selected.prompt_type} tone="neutral" /></div>
                  </div>
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
                <Button size="sm" variant="outline">Collapse</Button>
              </CollapsibleTrigger>
            </div>
            <CollapsibleContent className="space-y-3">
              <Textarea
                value={assistantPrompt}
                onChange={(e) => setAssistantPrompt(e.target.value)}
                className="font-mono text-xs min-h-[120px]"
              />
              <div className="flex justify-end">
                <Button size="sm" onClick={onAskAssistant} disabled={assistantLoading}>
                  {assistantLoading ? "Asking..." : "Ask"}
                </Button>
              </div>
              {assistantResult && <Textarea value={assistantResult} readOnly className="font-mono text-xs min-h-[160px]" />}
            </CollapsibleContent>
          </Card>
        </Collapsible>
      </PageBody>
    </>
  );
}
