import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { listDeliveries, qk, retryDelivery, getQueueDepth } from "@/services/promptforge";
import { PageBody, PageHeader } from "@/components/shell/PageHeader";
import { DataTable, type Column } from "@/components/pf/DataTable";
import { StatusBadge } from "@/components/pf/StatusBadge";
import { PriorityBadge } from "@/components/pf/PriorityBadge";
import { QueryInspector } from "@/components/pf/QueryInspector";
import { ConfirmationModal } from "@/components/pf/ConfirmationModal";
import { PermissionGuard } from "@/components/pf/PermissionGuard";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RotateCw } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import type { Delivery } from "@/services/promptforge/types";

type DRow = Delivery & { retry_candidate: boolean };

export default function Deliveries() {
  const [page, setPage] = useState(1);
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: qk.deliveriesList({ page }), queryFn: () => listDeliveries({ page }) });
  const { data: queue } = useQuery({ queryKey: qk.queueDepth, queryFn: getQueueDepth });

  const onRetry = async (id: string) => {
    await retryDelivery(id);
    toast({ title: "Retry queued", description: id });
    qc.invalidateQueries({ queryKey: ["pf", "deliveries"] });
  };

  const columns: Column<DRow>[] = [
    { key: "status", header: "Status", cell: (r) => <StatusBadge value={r.status} /> },
    { key: "dest", header: "Destination", cell: (r) => <span className="text-sm">{r.destination}</span> },
    { key: "prio", header: "Priority", hideOnMobile: true, cell: (r) => <PriorityBadge value={r.priority} /> },
    { key: "retries", header: "Retries", hideOnMobile: true, cell: (r) => <span className="font-mono text-xs tabular-nums">{r.retry_count}</span> },
    { key: "id", header: "ID", hideOnMobile: true, cell: (r) => <span className="font-mono text-xs text-muted-foreground">{r.id.slice(-8)}</span> },
    { key: "fail", header: "Failure", hideOnMobile: true, cell: (r) => r.failure_text ? <span className="text-xs text-status-danger truncate block max-w-[28ch]">{r.failure_text}</span> : <span className="text-xs text-muted-foreground">—</span> },
    { key: "actions", header: "", cell: (r) => r.retry_candidate ? (
      <PermissionGuard require="operator" inline>
        <ConfirmationModal
          trigger={<Button size="sm" variant="outline" className="h-7 gap-1"><RotateCw className="h-3 w-3" /> Retry</Button>}
          title="Retry delivery?"
          description={<>This will create a new queued delivery for prompt <span className="font-mono">{r.prompt_generation_id.slice(-8)}</span>.</>}
          confirmLabel="Retry"
          onConfirm={() => onRetry(r.id)}
        />
      </PermissionGuard>
    ) : null },
  ];

  return (
    <>
      <PageHeader title="Deliveries" description="Queue depth, retry candidates, and per-delivery operational actions." />
      <PageBody>
        <QueryInspector />
        <Card className="p-4">
          <h3 className="text-sm font-semibold mb-2">Queue depth</h3>
          <div className="flex flex-wrap gap-2">
            {queue && queue.length > 0 ? queue.map(q => (
              <div key={`${q.priority}-${q.destination}`} className="rounded-md border bg-surface-sunken px-3 py-2 text-xs">
                <div className="font-medium">{q.destination}</div>
                <div className="text-muted-foreground">{q.priority} · <span className="font-mono tabular-nums">{q.queued_count}</span></div>
              </div>
            )) : <span className="text-sm text-muted-foreground">Empty</span>}
          </div>
        </Card>
        <DataTable columns={columns} rows={data?.rows} isLoading={isLoading} total={data?.total} page={page} pageSize={25} onPageChange={setPage} rowKey={(r) => r.id} />
      </PageBody>
    </>
  );
}
