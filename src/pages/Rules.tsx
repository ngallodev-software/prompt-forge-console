import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, RotateCcw, Save } from "lucide-react";
import { createRule, listRulesets, listRules, llmAssist, qk, runRulesetDryRun, updateRule } from "@/services/promptforge";
import { RULE_MUTATION_KEYS } from "@/services/promptforge/mutation-invalidation";
import type { Rule } from "@/services/promptforge/types";
import { PageBody, PageHeader } from "@/components/shell/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { EmptyState } from "@/components/pf/EmptyState";
import { LoadingState } from "@/components/pf/LoadingState";
import { HelpTip } from "@/components/pf/HelpTip";
import { PermissionGuard } from "@/components/pf/PermissionGuard";
import { QueryInspector } from "@/components/pf/QueryInspector";
import { RulePrecedenceVisualizer } from "@/components/pf/RulePrecedenceVisualizer";
import { ScopeBadge } from "@/components/pf/ScopeBadge";
import { toast } from "@/hooks/use-toast";

type RuleDraft = {
  name: string;
  rule_type: Rule["rule_type"];
  pattern: string;
  replacement: string;
  description: string;
  enabled: boolean;
  priority: string;
};

const RULE_TYPE_OPTIONS: Rule["rule_type"][] = ["cleanup", "expansion", "routing", "formatting", "safety", "terminology"];

const EMPTY_RULE_DRAFT: RuleDraft = {
  name: "",
  rule_type: "cleanup",
  pattern: "",
  replacement: "",
  description: "",
  enabled: true,
  priority: "100",
};

function draftFromRule(rule: Rule): RuleDraft {
  return {
    name: rule.name,
    rule_type: rule.rule_type,
    pattern: rule.pattern ?? "",
    replacement: rule.replacement ?? "",
    description: rule.description ?? "",
    enabled: rule.enabled,
    priority: String(rule.priority),
  };
}

function reorderRules(rows: Rule[], sourceRuleId: string, targetRuleId: string): Rule[] {
  const next = [...rows];
  const sourceIndex = next.findIndex((row) => row.id === sourceRuleId);
  const targetIndex = next.findIndex((row) => row.id === targetRuleId);
  if (sourceIndex < 0 || targetIndex < 0 || sourceIndex === targetIndex) return next;
  const [source] = next.splice(sourceIndex, 1);
  const insertAt = sourceIndex < targetIndex ? targetIndex - 1 : targetIndex;
  next.splice(insertAt, 0, source);
  return next;
}

export default function Rules() {
  const qc = useQueryClient();
  const { data: rulesets, isLoading } = useQuery({ queryKey: qk.rulesets(), queryFn: () => listRulesets() });
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const activeId = selectedId ?? rulesets?.[0]?.id ?? null;
  const selectedRuleset = rulesets?.find((rs) => rs.id === activeId) ?? null;
  const { data: rules } = useQuery({ queryKey: qk.rulesByRuleset(activeId ?? ""), queryFn: () => listRules(activeId!), enabled: !!activeId });
  const sortedRules = useMemo(() => [...(rules ?? [])].sort((a, b) => b.priority - a.priority), [rules]);
  const [selectedRuleId, setSelectedRuleId] = useState<string | null>(null);
  const selectedRule = sortedRules.find((rule) => rule.id === selectedRuleId) ?? sortedRules[0] ?? null;
  const [editorMode, setEditorMode] = useState<"edit" | "create">("edit");
  const [draft, setDraft] = useState<RuleDraft>(EMPTY_RULE_DRAFT);
  const [busyRuleId, setBusyRuleId] = useState<string | null>(null);
  const [reordering, setReordering] = useState(false);
  const [sandboxInput, setSandboxInput] = useState("# Voice memo\n\nUm, like, refactor the dispatcher please.");
  const [dryRunResult, setDryRunResult] = useState("");
  const [dryRunSummary, setDryRunSummary] = useState<string | null>(null);
  const [dryRunLoading, setDryRunLoading] = useState(false);
  const [assistantQuestion, setAssistantQuestion] = useState("Explain the effect of this ruleset:");
  const [assistantResult, setAssistantResult] = useState("");
  const [assistantLoading, setAssistantLoading] = useState(false);

  useEffect(() => {
    setSelectedRuleId(null);
    setEditorMode("edit");
  }, [activeId]);

  useEffect(() => {
    if (!sortedRules.length) return;
    if (!selectedRuleId) setSelectedRuleId(sortedRules[0].id);
  }, [selectedRuleId, sortedRules]);

  useEffect(() => {
    if (editorMode === "create") {
      setDraft(EMPTY_RULE_DRAFT);
      return;
    }
    if (selectedRule) setDraft(draftFromRule(selectedRule));
  }, [editorMode, selectedRule]);

  const invalidateRuleQueries = async () => {
    await Promise.all(RULE_MUTATION_KEYS.map((queryKey) => qc.invalidateQueries({ queryKey })));
  };

  const onSaveRule = async () => {
    if (!selectedRule) return;
    const priority = Number.parseInt(draft.priority, 10);
    if (Number.isNaN(priority)) {
      toast({ title: "Invalid priority", description: "Priority must be a number." });
      return;
    }

    setBusyRuleId(selectedRule.id);
    try {
      await updateRule(selectedRule.id, { enabled: draft.enabled, priority });
      await invalidateRuleQueries();
      toast({ title: "Rule updated", description: `${selectedRule.name} precedence saved.` });
    } catch (error) {
      toast({ title: "Rule update failed", description: error instanceof Error ? error.message : "Unable to save rule." });
    } finally {
      setBusyRuleId(null);
    }
  };

  const onCreateRule = async () => {
    if (!activeId) return;
    const priority = Number.parseInt(draft.priority, 10);
    if (Number.isNaN(priority)) {
      toast({ title: "Invalid priority", description: "Priority must be a number." });
      return;
    }

    setBusyRuleId("create");
    try {
      const created = await createRule({
        rulesetId: activeId,
        ruleType: draft.rule_type,
        priority,
        enabled: draft.enabled,
        matchConditionsJson: {
          ...(draft.name.trim() ? { name: draft.name.trim() } : {}),
          ...(draft.pattern.trim() ? { pattern: draft.pattern.trim() } : {}),
        },
        actionJson: draft.replacement.trim() ? { replacement: draft.replacement.trim() } : {},
        notes: draft.description.trim() || draft.name.trim() || undefined,
      });
      await invalidateRuleQueries();
      setEditorMode("edit");
      setSelectedRuleId(created.id);
      toast({ title: "Rule created", description: created.name });
    } catch (error) {
      toast({ title: "Rule create failed", description: error instanceof Error ? error.message : "Unable to create rule." });
    } finally {
      setBusyRuleId(null);
    }
  };

  const onRunDryRun = async () => {
    if (!activeId) return;
    setDryRunLoading(true);
    try {
      const result = await runRulesetDryRun(activeId, sandboxInput, {});
      setDryRunResult(result.transformedOutput);
      setDryRunSummary(`matched ${result.summary.matchedRules} of ${result.summary.totalRules} rules · failed ${result.summary.failedRules}`);
      toast({ title: "Dry-run complete", description: result.summary.metadata?.ruleset_id ? `Ruleset ${result.summary.metadata.ruleset_id}` : "Ruleset evaluated." });
    } catch (error) {
      toast({ title: "Dry-run failed", description: error instanceof Error ? error.message : "Unable to run dry-run." });
    } finally {
      setDryRunLoading(false);
    }
  };

  const onReorderRule = async (sourceRuleId: string, targetRuleId: string) => {
    if (!sortedRules.length) return;
    setReordering(true);
    try {
      const reordered = reorderRules(sortedRules, sourceRuleId, targetRuleId);
      await Promise.all(
        reordered
          .map((rule, index) => {
            const nextPriority = (reordered.length - index) * 10;
            if (rule.priority === nextPriority) return null;
            return updateRule(rule.id, { priority: nextPriority });
          })
          .filter(Boolean) as Promise<unknown>[],
      );
      await invalidateRuleQueries();
      setSelectedRuleId(sourceRuleId);
      toast({ title: "Precedence reordered", description: "Rule priorities were persisted." });
    } catch (error) {
      toast({ title: "Reorder failed", description: error instanceof Error ? error.message : "Unable to persist precedence." });
    } finally {
      setReordering(false);
    }
  };

  const onAskAssistant = async () => {
    setAssistantLoading(true);
    try {
      const response = await llmAssist({
        prompt: assistantQuestion,
        context_type: "rule",
        context: {
          ruleset_name: selectedRuleset?.name ?? null,
          rules_count: sortedRules.length,
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
      <PageHeader title="Rules & rulesets" description="Manage cleanup, expansion, routing, formatting, safety, and terminology rules." help={{ label: "Rules help", content: "Use this page to inspect ruleset precedence, edit writable rule fields, and understand which controls are read-only today." }} />
      <PageBody>
        <QueryInspector />
        <div className="grid gap-4 lg:grid-cols-[280px_minmax(0,1fr)_360px]">
          <Card className="p-2">
            <div className="flex items-center gap-2 px-2 py-1.5 text-xs uppercase tracking-wider text-muted-foreground">
              <span>Rulesets</span>
              <HelpTip label="Rulesets help" content="Ruleset list for the current workspace. Select one to inspect its precedence and individual rules." />
            </div>
            {isLoading && <LoadingState rows={4} />}
            {!isLoading && (rulesets?.length ?? 0) === 0 ? (
              <EmptyState className="my-2" title="No records returned" description="The backend returned no rulesets." />
            ) : (
              <ul className="space-y-1">
                {rulesets?.map((rs) => (
                  <li key={rs.id}>
                    <button
                      onClick={() => setSelectedId(rs.id)}
                      className={`w-full rounded px-2 py-1.5 text-left text-sm hover:bg-accent ${activeId === rs.id ? "bg-accent" : ""}`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-medium truncate">{rs.name}</span>
                        <ScopeBadge value={rs.scope} />
                      </div>
                      {rs.description && <div className="text-xs text-muted-foreground truncate">{rs.description}</div>}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <div className="space-y-4 lg:col-span-2">
            <Card className="p-4 space-y-3">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-semibold">Rule precedence</h3>
                    <HelpTip label="Rule precedence help" content="Drag rules to change ordering. Higher priority rules are evaluated first." />
                  </div>
                  <p className="text-xs text-muted-foreground">Drag the grip to reorder and persist numeric precedence.</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{reordering ? "Saving" : "Ready"}</Badge>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setEditorMode("create");
                      setSelectedRuleId(null);
                      setDraft(EMPTY_RULE_DRAFT);
                    }}
                  >
                    <Plus className="mr-1 h-3.5 w-3.5" />
                    New rule
                  </Button>
                </div>
              </div>
              {!activeId ? (
                <EmptyState title="No records returned" description="The backend returned no rulesets to inspect." />
              ) : sortedRules.length > 0 ? (
                <RulePrecedenceVisualizer
                  rules={sortedRules}
                  selectedRuleId={selectedRule?.id}
                  onSelectRule={(rule) => {
                    setEditorMode("edit");
                    setSelectedRuleId(rule.id);
                    setDraft(draftFromRule(rule));
                  }}
                  onReorderRule={onReorderRule}
                  disabled={reordering}
                />
              ) : (
                <EmptyState title="No records returned" description="The selected ruleset has no rules." />
              )}
            </Card>

            <Card className="p-4 space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-sm font-semibold">{editorMode === "create" ? "Create rule" : "Rule details"}</h3>
                  <p className="text-xs text-muted-foreground">
                    {editorMode === "create" ? "Create a new rule in the selected ruleset." : "Only enabled and priority are writable today."}
                  </p>
                </div>
                {editorMode === "edit" && selectedRule ? (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setDraft(draftFromRule(selectedRule));
                      setSelectedRuleId(selectedRule.id);
                    }}
                  >
                    <RotateCcw className="mr-1 h-3.5 w-3.5" />
                    Reset
                  </Button>
                ) : null}
              </div>

              {editorMode === "create" ? (
                <div className="space-y-3">
                  <div className="grid gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs uppercase tracking-wider text-muted-foreground">Name</Label>
                      <HelpTip label="Rule name help" content="Human-readable name for the rule. Useful when scanning the precedence list." />
                      <Input value={draft.name} onChange={(e) => setDraft((cur) => ({ ...cur, name: e.target.value }))} placeholder="New rule name" />
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="space-y-1.5">
                        <Label className="text-xs uppercase tracking-wider text-muted-foreground">Rule type</Label>
                        <HelpTip label="Rule type help" content="High-level category describing what this rule changes or protects." />
                        <Select value={draft.rule_type} onValueChange={(value) => setDraft((cur) => ({ ...cur, rule_type: value as Rule["rule_type"] }))}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {RULE_TYPE_OPTIONS.map((option) => (
                              <SelectItem key={option} value={option}>
                                {option}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs uppercase tracking-wider text-muted-foreground">Priority</Label>
                        <HelpTip label="Rule priority help" content="Numeric precedence for the rule. Larger numbers are evaluated earlier." />
                        <Input value={draft.priority} onChange={(e) => setDraft((cur) => ({ ...cur, priority: e.target.value }))} inputMode="numeric" />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs uppercase tracking-wider text-muted-foreground">Pattern</Label>
                      <HelpTip label="Rule pattern help" content="Pattern matched by the rule. For read-only rules this shows the current backend value." />
                      <Input value={draft.pattern} onChange={(e) => setDraft((cur) => ({ ...cur, pattern: e.target.value }))} className="font-mono text-sm" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs uppercase tracking-wider text-muted-foreground">Replacement</Label>
                      <HelpTip label="Rule replacement help" content="Replacement applied when the rule matches. Often empty for non-transform rules." />
                      <Input value={draft.replacement} onChange={(e) => setDraft((cur) => ({ ...cur, replacement: e.target.value }))} className="font-mono text-sm" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs uppercase tracking-wider text-muted-foreground">Description</Label>
                      <HelpTip label="Rule description help" content="Short explanation of why the rule exists and what it is meant to catch." />
                      <Textarea value={draft.description} onChange={(e) => setDraft((cur) => ({ ...cur, description: e.target.value }))} className="min-h-[100px]" />
                    </div>
                    <div className="flex items-center justify-between rounded-md border px-3 py-2">
                      <div>
                        <div className="text-sm font-medium">Enabled</div>
                        <div className="text-xs text-muted-foreground">Draft state will persist to the selected ruleset.</div>
                      </div>
                      <Switch checked={draft.enabled} onCheckedChange={(checked) => setDraft((cur) => ({ ...cur, enabled: checked }))} />
                    </div>
                    <div className="flex items-center justify-between rounded-md border border-dashed px-3 py-2 text-xs text-muted-foreground">
                      <span>Backend-backed create writes a new rule under the selected ruleset.</span>
                      <Button size="sm" onClick={onCreateRule} disabled={busyRuleId === "create"}>
                        <Save className="mr-1 h-3.5 w-3.5" />
                        {busyRuleId === "create" ? "Creating..." : "Create rule"}
                      </Button>
                    </div>
                  </div>
                </div>
              ) : selectedRule ? (
                <div className="space-y-3">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <Label className="text-xs uppercase tracking-wider text-muted-foreground">Name</Label>
                      <HelpTip label="Rule name help" content="Human-readable name for the rule. Useful when scanning the precedence list." />
                      <Input value={selectedRule.name} readOnly className="bg-muted/40" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs uppercase tracking-wider text-muted-foreground">Type</Label>
                      <HelpTip label="Rule type help" content="High-level category describing what this rule changes or protects." />
                      <Input value={selectedRule.rule_type} readOnly className="bg-muted/40" />
                    </div>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <Label className="text-xs uppercase tracking-wider text-muted-foreground">Priority</Label>
                      <HelpTip label="Rule priority help" content="Numeric precedence for the rule. Larger numbers are evaluated earlier." />
                      <Input value={draft.priority} onChange={(e) => setDraft((cur) => ({ ...cur, priority: e.target.value }))} inputMode="numeric" />
                    </div>
                    <div className="flex items-center justify-between rounded-md border px-3 py-2">
                      <div>
                        <div className="text-sm font-medium">Enabled</div>
                        <div className="text-xs text-muted-foreground">This is the only state toggle the backend stores.</div>
                      </div>
                      <Switch checked={draft.enabled} onCheckedChange={(checked) => setDraft((cur) => ({ ...cur, enabled: checked }))} />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs uppercase tracking-wider text-muted-foreground">Pattern</Label>
                    <HelpTip label="Rule pattern help" content="Pattern matched by the rule. Read-only here because the backend only persists enabled and priority today." />
                    <Input value={selectedRule.pattern ?? ""} readOnly className="font-mono text-sm bg-muted/40" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs uppercase tracking-wider text-muted-foreground">Replacement</Label>
                    <HelpTip label="Rule replacement help" content="Replacement applied when the rule matches. Read-only until create/edit contracts exist." />
                    <Input value={selectedRule.replacement ?? ""} readOnly className="font-mono text-sm bg-muted/40" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs uppercase tracking-wider text-muted-foreground">Description</Label>
                    <HelpTip label="Rule description help" content="Short explanation of why the rule exists and what it is meant to catch." />
                    <Textarea value={selectedRule.description ?? ""} readOnly className="min-h-[100px] bg-muted/40" />
                  </div>

                  <div className="flex items-center justify-between rounded-md border px-3 py-2 text-xs">
                    <div className="text-muted-foreground">
                      <span className="font-medium text-foreground">Persisted fields:</span> `enabled`, `priority`
                    </div>
                    <Button size="sm" onClick={onSaveRule} disabled={busyRuleId === selectedRule.id}>
                      <Save className="mr-1 h-3.5 w-3.5" />
                      {busyRuleId === selectedRule.id ? "Saving..." : "Save precedence"}
                    </Button>
                  </div>
                </div>
              ) : (
                <EmptyState title="No rule selected" description="Pick a rule to inspect or start a new draft." />
              )}
            </Card>

            <Card className="p-4 space-y-3">
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-sm font-semibold">Sandbox · dry-run</h3>
                <HelpTip label="Dry-run help" content="Send a sample string through the selected ruleset and inspect the transformed result." />
                <span className="text-xs text-muted-foreground">Backend-backed</span>
              </div>
              <div className="rounded-md border bg-surface-sunken/40 p-3 text-xs text-muted-foreground">
                {activeId ? "Run the selected ruleset against a sample input." : "Select a ruleset to enable the dry-run sandbox."}
              </div>
              <Textarea value={sandboxInput} onChange={(e) => setSandboxInput(e.target.value)} className="font-mono text-xs min-h-[120px]" />
              <PermissionGuard require="operator" inline>
                <Button size="sm" onClick={onRunDryRun} disabled={dryRunLoading || !activeId}>
                  {dryRunLoading ? "Running..." : "Run dry-run"}
                </Button>
              </PermissionGuard>
              {dryRunSummary && (
                <div className="rounded-md border bg-card p-3 text-xs text-muted-foreground">
                  <div className="font-medium text-foreground">Summary</div>
                  <div className="mt-1">{dryRunSummary}</div>
                </div>
              )}
              {dryRunResult && <Textarea value={dryRunResult} readOnly className="font-mono text-xs min-h-[120px]" />}

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
          </div>
        </div>
      </PageBody>
    </>
  );
}
