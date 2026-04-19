import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { listTemplates, activateTemplate, qk } from "@/services/promptforge";
import { PageBody, PageHeader } from "@/components/shell/PageHeader";
import { Card } from "@/components/ui/card";
import { ScopeBadge } from "@/components/pf/ScopeBadge";
import { StatusBadge } from "@/components/pf/StatusBadge";
import { MarkdownPreview } from "@/components/pf/MarkdownPreview";
import { QueryInspector } from "@/components/pf/QueryInspector";
import { ConfirmationModal } from "@/components/pf/ConfirmationModal";
import { PermissionGuard } from "@/components/pf/PermissionGuard";
import { Button } from "@/components/ui/button";
import type { PromptTemplate } from "@/services/promptforge/types";
import { toast } from "@/hooks/use-toast";

export default function Templates() {
  const { data } = useQuery({ queryKey: qk.templates({}), queryFn: () => listTemplates({}) });
  const templates = data?.rows ?? [];
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected: PromptTemplate | undefined = templates.find(t => t.id === selectedId) ?? templates[0];

  const onActivate = async () => {
    if (!selected) return;
    await activateTemplate(selected.id, selected.template_family_key);
    toast({ title: "Template activated", description: `${selected.name} v${selected.version}` });
  };

  return (
    <>
      <PageHeader title="Prompt templates" description="Versioned templates with safe activation flow." />
      <PageBody>
        <QueryInspector />
        <div className="grid gap-4 lg:grid-cols-3">
          <Card className="p-2">
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
          </Card>
          <Card className="p-4 lg:col-span-2 space-y-3">
            {selected && (
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
            )}
          </Card>
        </div>
      </PageBody>
    </>
  );
}
