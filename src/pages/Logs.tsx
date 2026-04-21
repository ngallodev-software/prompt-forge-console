import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { listLogs, getErrorFingerprints, qk } from "@/services/promptforge";
import { PageBody, PageHeader } from "@/components/shell/PageHeader";
import { LogStream } from "@/components/pf/LogStream";
import { HelpTip } from "@/components/pf/HelpTip";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { QueryInspector } from "@/components/pf/QueryInspector";
import { OpsSurfaceIntro } from "@/components/pf/OpsSurfaceIntro";
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
      <PageHeader title="Log center" description="Structured activity logs across watcher, api, n8n, and postgres." help={{ label: "Log center help", content: "Use this page to narrow activity logs by service and severity, then jump from an error fingerprint into the exact problem area. The stream is built from persisted backend activity, not raw container stdout." }} />
      <PageBody>
        <QueryInspector />
        <OpsSurfaceIntro
          eyebrow="Observability"
          title="What the logs page is for"
          purpose="This is the operational activity stream. It is built from persisted backend records, not raw container stdout, so it tells you what happened in the workflow."
          description="Use the service and severity filters to narrow the stream, then jump from repeated fingerprints into the underlying page or trace."
          steps={[
            "Filter by service when you already know whether the issue belongs to watcher, api, n8n, or postgres.",
            "Use severity when you are chasing a failure mode and need to ignore routine chatter.",
            "Use the error fingerprints list when the same failure repeats across multiple records.",
          ]}
          metrics={[
            { label: "Visible logs", value: data?.rows.length ?? 0, detail: "Rows returned for the current filter set" },
            { label: "Fingerprints", value: fps?.length ?? 0, detail: "Repeated error shapes currently ranked at the top" },
          ]}
          note="If you need raw container logs, that is a different feature. This page is intentionally centered on workflow activity."
        />
        <Card className="p-3 space-y-3">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold">Log filters</h3>
            <HelpTip label="Log filters help" content="Service and severity filters shrink the activity stream to the slice you are actively debugging." />
          </div>
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
          <div className="mb-2 flex items-center gap-2">
            <h3 className="text-sm font-semibold">Top error fingerprints (Q19)</h3>
            <HelpTip label="Error fingerprints help" content="Grouped error signatures from logs. Useful for spotting repeated failures without reading every line." />
          </div>
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
