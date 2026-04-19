import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { listPromptGenerations, qk } from "@/services/promptforge";
import { PageBody, PageHeader } from "@/components/shell/PageHeader";
import { DataTable, type Column } from "@/components/pf/DataTable";
import { StatusBadge } from "@/components/pf/StatusBadge";
import { PriorityBadge } from "@/components/pf/PriorityBadge";
import { QueryInspector } from "@/components/pf/QueryInspector";
import { MarkdownPreview } from "@/components/pf/MarkdownPreview";
import { JsonViewer } from "@/components/pf/JsonViewer";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import type { PromptGeneration } from "@/services/promptforge/types";
import { Link } from "react-router-dom";

export default function Prompts() {
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<PromptGeneration | null>(null);
  const { data, isLoading } = useQuery({ queryKey: qk.promptList({ page }), queryFn: () => listPromptGenerations({ page }) });

  const columns: Column<PromptGeneration>[] = [
    { key: "type", header: "Type", cell: (r) => <span className="font-medium">{r.prompt_type}</span> },
    { key: "status", header: "Status", cell: (r) => <StatusBadge value={r.status} /> },
    { key: "review", header: "Review", hideOnMobile: true, cell: (r) => r.requires_review ? <StatusBadge value="required" tone="warn" /> : <span className="text-xs text-muted-foreground">—</span> },
    { key: "dest", header: "Destination", hideOnMobile: true, cell: (r) => <StatusBadge value={r.destination} tone="neutral" /> },
    { key: "prio", header: "Priority", hideOnMobile: true, cell: (r) => <PriorityBadge value={r.priority} /> },
    { key: "id", header: "ID", hideOnMobile: true, cell: (r) => <span className="font-mono text-xs text-muted-foreground">{r.id.slice(-8)}</span> },
  ];

  return (
    <>
      <PageHeader title="Prompt generations" description="Inspect rendered prompts, structured outputs, and validation state." />
      <PageBody>
        <QueryInspector />
        <DataTable
          columns={columns}
          rows={data?.rows}
          isLoading={isLoading}
          total={data?.total}
          page={page}
          pageSize={25}
          onPageChange={setPage}
          onRowClick={setSelected}
          isRowActive={(r) => r.id === selected?.id}
          rowKey={(r) => r.id}
        />
        <Sheet open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
          <SheetContent className="w-full sm:max-w-2xl overflow-auto">
            {selected && (
              <div className="space-y-4">
                <div>
                  <div className="text-xs font-mono text-muted-foreground">{selected.id}</div>
                  <h2 className="text-lg font-semibold">{selected.prompt_type}</h2>
                  <div className="flex gap-2 mt-2"><StatusBadge value={selected.status} /><PriorityBadge value={selected.priority} /></div>
                </div>
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
