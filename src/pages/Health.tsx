import { useQuery } from "@tanstack/react-query";
import { getHealth, getLlmRunAggregate, qk } from "@/services/promptforge";
import { PageBody, PageHeader } from "@/components/shell/PageHeader";
import { HealthCard } from "@/components/pf/HealthCard";
import { Card } from "@/components/ui/card";
import { QueryInspector } from "@/components/pf/QueryInspector";

export default function Health() {
  const { data } = useQuery({ queryKey: qk.health, queryFn: getHealth, refetchInterval: 10000 });
  const { data: llm } = useQuery({ queryKey: qk.llmRunsAgg, queryFn: getLlmRunAggregate });

  return (
    <>
      <PageHeader title="System health" description="API, providers, dependencies, and LLM run summary." />
      <PageBody>
        <QueryInspector />
        <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
          <HealthCard title="API" status={data?.api.status ?? "ok"} metric={data ? `${data.api.latency_ms}ms` : "—"} />
          <HealthCard title="Database" status={data?.db.status ?? "ok"} metric={data ? `${data.db.latency_ms}ms` : "—"} />
          {data?.providers.map(p => <HealthCard key={p.name} title={p.name} status={p.status} metric={`${p.latency_ms}ms`} />)}
        </div>
        <Card className="p-4">
          <h3 className="text-sm font-semibold mb-2">LLM run aggregate (Q11)</h3>
          <div className="overflow-auto">
            <table className="w-full text-sm">
              <thead className="text-xs uppercase tracking-wider text-muted-foreground">
                <tr><th className="text-left py-1.5">Provider</th><th className="text-left">Model</th><th className="text-right">Runs</th><th className="text-right">Avg ms</th><th className="text-right">Max ms</th><th className="text-right">In tokens</th><th className="text-right">Out tokens</th></tr>
              </thead>
              <tbody>
                {llm?.map(r => (
                  <tr key={`${r.provider}-${r.model}`} className="border-t">
                    <td className="py-2 font-mono text-xs">{r.provider}</td>
                    <td className="font-mono text-xs">{r.model}</td>
                    <td className="text-right tabular-nums">{r.runs}</td>
                    <td className="text-right tabular-nums">{r.avg_latency_ms}</td>
                    <td className="text-right tabular-nums">{r.max_latency_ms}</td>
                    <td className="text-right tabular-nums">{r.input_tokens.toLocaleString()}</td>
                    <td className="text-right tabular-nums">{r.output_tokens.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </PageBody>
    </>
  );
}
