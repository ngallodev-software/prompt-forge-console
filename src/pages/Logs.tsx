import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { listLogs, getErrorFingerprints, qk } from "@/services/promptforge";
import { PageBody, PageHeader } from "@/components/shell/PageHeader";
import { LogStream } from "@/components/pf/LogStream";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { QueryInspector } from "@/components/pf/QueryInspector";
import type { LogEntry } from "@/services/promptforge/types";

export default function Logs() {
  const [service, setService] = useState<LogEntry["service"] | undefined>(undefined);
  const [level, setLevel] = useState<LogEntry["level"] | undefined>(undefined);
  const [search, setSearch] = useState("");

  const filters = { service, level, search, pageSize: 500 };
  const { data } = useQuery({ queryKey: qk.logsList(filters), queryFn: () => listLogs(filters), refetchInterval: 6000 });
  const { data: fps } = useQuery({ queryKey: qk.errorFingerprints, queryFn: () => getErrorFingerprints(8) });

  return (
    <>
      <PageHeader title="Log center" description="Structured logs across watcher, api, n8n, and postgres." />
      <PageBody>
        <QueryInspector />
        <Card className="p-3 space-y-3">
          <Tabs value={service ?? "all"} onValueChange={(v) => setService(v === "all" ? undefined : (v as LogEntry["service"]))}>
            <TabsList>
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="watcher">watcher</TabsTrigger>
              <TabsTrigger value="api">api</TabsTrigger>
              <TabsTrigger value="n8n">n8n</TabsTrigger>
              <TabsTrigger value="postgres">postgres</TabsTrigger>
            </TabsList>
          </Tabs>
          <div className="flex flex-wrap gap-2">
            <Input placeholder="Search messages…" value={search} onChange={(e) => setSearch(e.target.value)} className="h-8 max-w-xs" />
            <Select value={level ?? "all"} onValueChange={(v) => setLevel(v === "all" ? undefined : (v as LogEntry["level"]))}>
              <SelectTrigger className="h-8 w-[120px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All levels</SelectItem>
                <SelectItem value="debug">debug</SelectItem>
                <SelectItem value="info">info</SelectItem>
                <SelectItem value="warn">warn</SelectItem>
                <SelectItem value="error">error</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <LogStream logs={data?.rows ?? []} />
        </Card>
        <Card className="p-4">
          <h3 className="text-sm font-semibold mb-2">Top error fingerprints (Q19)</h3>
          <ul className="divide-y">
            {fps?.map(f => (
              <li key={f.fingerprint} className="flex items-center gap-3 py-2 text-sm">
                <span className="font-mono text-xs text-muted-foreground w-20 truncate">{f.fingerprint}</span>
                <span className="flex-1 truncate font-mono text-xs">{f.error_text}</span>
                <span className="rounded bg-status-danger-muted text-status-danger px-2 py-0.5 text-xs tabular-nums">×{f.count}</span>
              </li>
            ))}
          </ul>
        </Card>
      </PageBody>
    </>
  );
}
