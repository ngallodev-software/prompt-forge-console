import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { listTerms, qk } from "@/services/promptforge";
import { PageBody, PageHeader } from "@/components/shell/PageHeader";
import { DataTable, type Column } from "@/components/pf/DataTable";
import { ScopeBadge } from "@/components/pf/ScopeBadge";
import { QueryInspector } from "@/components/pf/QueryInspector";
import { Button } from "@/components/ui/button";
import { Download, Upload, Plus } from "lucide-react";
import type { TermDictionaryEntry } from "@/services/promptforge/types";
import { PermissionGuard } from "@/components/pf/PermissionGuard";

export default function Dictionary() {
  const [page, setPage] = useState(1);
  const { data, isLoading } = useQuery({ queryKey: qk.termDict({ page }), queryFn: () => listTerms({ page }) });

  const columns: Column<TermDictionaryEntry>[] = [
    { key: "src", header: "Source", cell: (r) => <span className="font-mono text-sm">{r.source_term}</span> },
    { key: "norm", header: "Normalized", cell: (r) => <span className="font-mono text-sm font-medium">{r.normalized_term}</span> },
    { key: "scope", header: "Scope", cell: (r) => <ScopeBadge value={r.scope} /> },
    { key: "desc", header: "Description", hideOnMobile: true, cell: (r) => <span className="text-xs text-muted-foreground">{r.description ?? "—"}</span> },
  ];

  return (
    <>
      <PageHeader
        title="Term dictionary"
        description="Normalize terminology across rules, templates, and renderers."
        actions={
          <PermissionGuard require="operator" inline>
            <Button size="sm" variant="outline"><Upload className="h-3.5 w-3.5" /> Import</Button>
            <Button size="sm" variant="outline"><Download className="h-3.5 w-3.5" /> Export</Button>
            <Button size="sm"><Plus className="h-3.5 w-3.5" /> New term</Button>
          </PermissionGuard>
        }
      />
      <PageBody>
        <QueryInspector />
        <DataTable columns={columns} rows={data?.rows} isLoading={isLoading} total={data?.total} page={page} pageSize={25} onPageChange={setPage} rowKey={(r) => r.id} />
      </PageBody>
    </>
  );
}
