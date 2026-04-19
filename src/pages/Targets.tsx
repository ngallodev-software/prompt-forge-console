import { useQuery } from "@tanstack/react-query";
import { listTargets, qk } from "@/services/promptforge";
import { PageBody, PageHeader } from "@/components/shell/PageHeader";
import { DataTable, type Column } from "@/components/pf/DataTable";
import { StatusBadge } from "@/components/pf/StatusBadge";
import { ScopeBadge } from "@/components/pf/ScopeBadge";
import { QueryInspector } from "@/components/pf/QueryInspector";
import { ShieldAlert } from "lucide-react";
import type { DeliveryTarget } from "@/services/promptforge/types";

export default function Targets() {
  const { data, isLoading } = useQuery({ queryKey: qk.targets(), queryFn: () => listTargets() });

  const columns: Column<DeliveryTarget>[] = [
    { key: "name", header: "Name", cell: (r) => (
      <div className="flex items-center gap-1.5">
        <span className="font-medium">{r.name}</span>
        {r.is_sensitive && <ShieldAlert className="h-3.5 w-3.5 text-status-warn" aria-label="sensitive" />}
      </div>
    ) },
    { key: "type", header: "Type", cell: (r) => <span className="font-mono text-xs">{r.target_type}</span> },
    { key: "dest", header: "Destination", hideOnMobile: true, cell: (r) => <span className="text-sm">{r.destination}</span> },
    { key: "scope", header: "Scope", hideOnMobile: true, cell: (r) => <ScopeBadge value={r.scope} /> },
    { key: "env", header: "Env", hideOnMobile: true, cell: (r) => <StatusBadge value={r.environment} tone="neutral" /> },
    { key: "valid", header: "Health", cell: (r) => <StatusBadge value={r.validation_status} /> },
    { key: "enabled", header: "Enabled", cell: (r) => <StatusBadge value={r.enabled ? "enabled" : "disabled"} tone={r.enabled ? "success" : "neutral"} /> },
  ];

  return (
    <>
      <PageHeader title="Delivery targets" description="Chat sessions, CLI sessions, queues, and Obsidian write-back targets." />
      <PageBody>
        <QueryInspector />
        <DataTable columns={columns} rows={data} isLoading={isLoading} rowKey={(r) => r.id} />
      </PageBody>
    </>
  );
}
