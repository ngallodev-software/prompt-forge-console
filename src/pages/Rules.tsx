import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { listRulesets, listRules, llmAssist, qk } from "@/services/promptforge";
import { PageBody, PageHeader } from "@/components/shell/PageHeader";
import { Card } from "@/components/ui/card";
import { ScopeBadge } from "@/components/pf/ScopeBadge";
import { RulePrecedenceVisualizer } from "@/components/pf/RulePrecedenceVisualizer";
import { LoadingState } from "@/components/pf/LoadingState";
import { EmptyState } from "@/components/pf/EmptyState";
import { QueryInspector } from "@/components/pf/QueryInspector";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { PermissionGuard } from "@/components/pf/PermissionGuard";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";

export default function Rules() {
  const { data: rulesets, isLoading } = useQuery({ queryKey: qk.rulesets(), queryFn: () => listRulesets() });
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const activeId = selectedId ?? rulesets?.[0]?.id ?? null;
  const selectedRuleset = rulesets?.find(rs => rs.id === activeId) ?? null;
  const { data: rules } = useQuery({ queryKey: qk.rulesByRuleset(activeId ?? ""), queryFn: () => listRules(activeId!), enabled: !!activeId });
  const [sandboxInput, setSandboxInput] = useState("# Voice memo\n\nUm, like, refactor the dispatcher please.");
  const [assistantQuestion, setAssistantQuestion] = useState("Explain the effect of this ruleset:");
  const [assistantResult, setAssistantResult] = useState("");
  const [assistantLoading, setAssistantLoading] = useState(false);

  const onAskAssistant = async () => {
    setAssistantLoading(true);
    try {
      const response = await llmAssist({
        prompt: assistantQuestion,
        context_type: "rule",
        context: {
          ruleset_name: selectedRuleset?.name ?? null,
          rules_count: rules?.length ?? 0,
        },
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
      <PageHeader title="Rules & rulesets" description="Manage cleanup, expansion, routing, formatting, safety, and terminology rules." />
      <PageBody>
        <QueryInspector />
        <div className="grid gap-4 lg:grid-cols-3">
          <Card className="p-2">
            <div className="px-2 py-1.5 text-xs uppercase tracking-wider text-muted-foreground">Rulesets</div>
            {isLoading && <LoadingState rows={4} />}
            {!isLoading && (rulesets?.length ?? 0) === 0 ? (
              <EmptyState className="my-2" title="No records returned" description="The backend returned no rulesets." />
            ) : (
              <ul className="space-y-1">
                {rulesets?.map(rs => (
                  <li key={rs.id}>
                    <button onClick={() => setSelectedId(rs.id)} className={`w-full rounded px-2 py-1.5 text-left text-sm hover:bg-accent ${activeId === rs.id ? "bg-accent" : ""}`}>
                      <div className="flex items-center justify-between gap-2"><span className="font-medium truncate">{rs.name}</span><ScopeBadge value={rs.scope} /></div>
                      {rs.description && <div className="text-xs text-muted-foreground truncate">{rs.description}</div>}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </Card>
          <Card className="p-4 lg:col-span-2 space-y-3">
            <h3 className="text-sm font-semibold">Rule precedence</h3>
            {!activeId ? (
              <EmptyState title="No records returned" description="The backend returned no rulesets to inspect." />
            ) : rules && rules.length > 0 ? (
              <RulePrecedenceVisualizer rules={rules} />
            ) : (
              <EmptyState title="No records returned" description="The selected ruleset has no rules." />
            )}
          </Card>
        </div>

        <Card className="p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold">Sandbox · dry-run</h3>
            <span className="text-xs text-muted-foreground">Calls /preprocess /validate /render /prepare-delivery</span>
          </div>
          <Textarea value={sandboxInput} onChange={(e) => setSandboxInput(e.target.value)} className="font-mono text-xs min-h-[120px]" />
          <PermissionGuard require="operator" inline>
            <Button size="sm">Run dry-run</Button>
          </PermissionGuard>

          <div className="space-y-3 border-t pt-3">
            <Label className="text-xs uppercase tracking-wider text-muted-foreground">Ask LLM about this ruleset</Label>
            <Textarea
              value={assistantQuestion}
              onChange={(e) => setAssistantQuestion(e.target.value)}
              className="font-mono text-xs min-h-[120px]"
            />
            <div className="flex justify-end">
              <Button size="sm" onClick={onAskAssistant} disabled={assistantLoading}>
                {assistantLoading ? "Asking..." : "Ask"}
              </Button>
            </div>
            {assistantResult && <Textarea value={assistantResult} readOnly className="font-mono text-xs min-h-[160px]" />}
          </div>
        </Card>
      </PageBody>
    </>
  );
}
