// Typed service layer. Currently backed by mock data.
// To wire to real backend: replace each function body with fetch() to your API.
// Query keys are structured per entity for predictable invalidation.

import {
  intakeNotes,
  utterances,
  transcriptRevisions,
  promptGenerations,
  deliveries,
  deliveryHistory,
  processingRuns,
  llmRuns,
  rulesets,
  rules,
  termDictionary,
  promptTemplates,
  deliveryTargets,
  projects,
  logs,
  healthSnapshot,
} from "./mock-data";
import type {
  Delivery,
  DeliveryTarget,
  HealthSnapshot,
  IntakeNote,
  LlmRun,
  LogEntry,
  PageParams,
  PageResult,
  ProcessingRun,
  Project,
  PromptGeneration,
  PromptTemplate,
  Rule,
  Ruleset,
  TermDictionaryEntry,
  TranscriptRevision,
  Utterance,
  PfNoteStatus,
  PfDeliveryStatus,
  PfPromptGenerationStatus,
  PfScope,
  PfTargetType,
} from "./types";

// Simulated network delay
const delay = (ms = 180) => new Promise((r) => setTimeout(r, ms));

function paginate<T>(rows: T[], { page = 1, pageSize = 25 }: PageParams): PageResult<T> {
  const start = (page - 1) * pageSize;
  return { rows: rows.slice(start, start + pageSize), total: rows.length, page, pageSize };
}

// ──────────────────────────── Query keys
export const qk = {
  health: ["pf", "health"] as const,
  projects: ["pf", "projects"] as const,
  intakeList: (params: unknown) => ["pf", "intake", "list", params] as const,
  intake: (id: string) => ["pf", "intake", id] as const,
  intakeStatusCounts: ["pf", "intake", "statusCounts"] as const,
  utterancesByNote: (id: string) => ["pf", "utterances", "note", id] as const,
  revisionsByUtterance: (id: string) => ["pf", "revisions", "utterance", id] as const,
  promptList: (params: unknown) => ["pf", "prompts", "list", params] as const,
  prompt: (id: string) => ["pf", "prompts", id] as const,
  promptByNote: (id: string) => ["pf", "prompts", "note", id] as const,
  reviewList: ["pf", "review", "list"] as const,
  deliveriesList: (params: unknown) => ["pf", "deliveries", "list", params] as const,
  delivery: (id: string) => ["pf", "deliveries", id] as const,
  deliveryByPrompt: (id: string) => ["pf", "deliveries", "prompt", id] as const,
  deliveryHistory: (id: string) => ["pf", "deliveries", "history", id] as const,
  queueDepth: ["pf", "deliveries", "queueDepth"] as const,
  processingByNote: (id: string) => ["pf", "processing", "note", id] as const,
  processingFailed: ["pf", "processing", "failed"] as const,
  rulesets: (scope?: PfScope, projectId?: string) => ["pf", "rulesets", scope, projectId] as const,
  rulesByRuleset: (id: string) => ["pf", "rules", "ruleset", id] as const,
  termDict: (params: unknown) => ["pf", "dict", "list", params] as const,
  templates: (params: unknown) => ["pf", "templates", "list", params] as const,
  targets: (type?: PfTargetType) => ["pf", "targets", type] as const,
  logsList: (params: unknown) => ["pf", "logs", "list", params] as const,
  errorFingerprints: ["pf", "logs", "fingerprints"] as const,
  llmRunsAgg: ["pf", "llm", "agg"] as const,
  slaSummary: ["pf", "sla"] as const,
  projectThroughput: ["pf", "throughput"] as const,
};

// ──────────────────────────── Health
export async function getHealth(): Promise<HealthSnapshot> {
  await delay(80);
  return healthSnapshot;
}

// ──────────────────────────── Projects
export async function listProjects(): Promise<Project[]> {
  await delay();
  return projects;
}

// ──────────────────────────── Intake (Q1, Q2, Q18)
export interface IntakeFilters extends PageParams {
  projectId?: string;
  status?: PfNoteStatus;
  watchEligible?: boolean;
  sourceDevice?: string;
  withSkipReason?: boolean;
}

export async function listIntakeNotes(f: IntakeFilters = {}): Promise<PageResult<IntakeNote>> {
  await delay();
  let rows = [...intakeNotes];
  if (f.projectId) rows = rows.filter((r) => r.project_id === f.projectId);
  if (f.status) rows = rows.filter((r) => r.status === f.status);
  if (typeof f.watchEligible === "boolean") rows = rows.filter((r) => r.watch_eligible === f.watchEligible);
  if (f.sourceDevice) rows = rows.filter((r) => (r.source_device || "").includes(f.sourceDevice!));
  if (f.search) {
    const q = f.search.toLowerCase();
    rows = rows.filter((r) => r.note_relative_path.toLowerCase().includes(q) || r.body_text.toLowerCase().includes(q));
  }
  if (f.withSkipReason) {
    rows = rows.filter((r) => r.metadata_json?.eligibility_reason || r.metadata_json?.skip_cause);
  }
  rows.sort((a, b) => (a.created_at < b.created_at ? 1 : -1));
  return paginate(rows, f);
}

export async function getIntakeNote(id: string): Promise<IntakeNote | undefined> {
  await delay(60);
  return intakeNotes.find((n) => n.id === id);
}

export async function getIntakeStatusCounts() {
  await delay();
  const win = (hours: number) => {
    const cutoff = Date.now() - hours * 3600_000;
    return intakeNotes.filter((n) => new Date(n.created_at).getTime() >= cutoff);
  };
  const count = (rows: IntakeNote[]) => {
    const m = new Map<PfNoteStatus, number>();
    rows.forEach((r) => m.set(r.status, (m.get(r.status) || 0) + 1));
    return Object.fromEntries(m);
  };
  return {
    "24h": count(win(24)),
    "7d": count(win(24 * 7)),
    "30d": count(win(24 * 30)),
  };
}

// ──────────────────────────── Utterances + Revisions (Q7, Q8, Q9)
export async function listUtterancesForNote(noteId: string): Promise<Utterance[]> {
  await delay(60);
  return utterances.filter((u) => u.intake_note_id === noteId);
}

export async function listRevisionsForUtterance(utteranceId: string): Promise<TranscriptRevision[]> {
  await delay(60);
  return transcriptRevisions
    .filter((r) => r.utterance_id === utteranceId)
    .sort((a, b) => (a.created_at < b.created_at ? -1 : 1));
}

export async function getNoteLineage(noteId: string) {
  await delay(80);
  const note = intakeNotes.find((n) => n.id === noteId);
  const utts = utterances.filter((u) => u.intake_note_id === noteId);
  const revs = utts.flatMap((u) => transcriptRevisions.filter((r) => r.utterance_id === u.id));
  const pgs = promptGenerations.filter((p) => p.intake_note_id === noteId);
  const dels = pgs.flatMap((pg) => deliveries.filter((d) => d.prompt_generation_id === pg.id));
  const runs = processingRuns.filter((r) => r.intake_note_id === noteId);
  return { note, utterances: utts, revisions: revs, promptGenerations: pgs, deliveries: dels, processingRuns: runs };
}

// ──────────────────────────── Prompt generations (Q3, Q10)
export interface PromptFilters extends PageParams {
  status?: PfPromptGenerationStatus;
  requiresReview?: boolean;
}

export async function listPromptGenerations(f: PromptFilters = {}): Promise<PageResult<PromptGeneration>> {
  await delay();
  let rows = [...promptGenerations];
  if (f.status) rows = rows.filter((r) => r.status === f.status);
  if (typeof f.requiresReview === "boolean") rows = rows.filter((r) => r.requires_review === f.requiresReview);
  if (f.search) {
    const q = f.search.toLowerCase();
    rows = rows.filter((r) => r.id.includes(q) || r.prompt_type.includes(q) || r.intake_note_id.includes(q));
  }
  rows.sort((a, b) => (a.updated_at < b.updated_at ? 1 : -1));
  return paginate(rows, f);
}

export async function getPromptGeneration(id: string): Promise<PromptGeneration | undefined> {
  await delay(50);
  return promptGenerations.find((p) => p.id === id);
}

export async function getLatestPromptForNote(noteId: string): Promise<PromptGeneration | undefined> {
  await delay(40);
  return promptGenerations.find((p) => p.intake_note_id === noteId);
}

// ──────────────────────────── Deliveries (Q5, Q6)
export interface DeliveryFilters extends PageParams {
  status?: PfDeliveryStatus;
  failedOnly?: boolean;
}

export async function listDeliveries(f: DeliveryFilters = {}): Promise<PageResult<Delivery & { retry_candidate: boolean }>> {
  await delay();
  let rows = deliveries.map((d) => ({ ...d, retry_candidate: d.status === "failed" && d.retry_count < 5 }));
  if (f.status) rows = rows.filter((r) => r.status === f.status);
  if (f.failedOnly) rows = rows.filter((r) => r.status === "failed");
  if (f.search) {
    const q = f.search.toLowerCase();
    rows = rows.filter((r) => r.id.includes(q) || r.prompt_generation_id.includes(q));
  }
  rows.sort((a, b) => (a.updated_at < b.updated_at ? 1 : -1));
  return paginate(rows, f);
}

export async function getDelivery(id: string): Promise<Delivery | undefined> {
  await delay(40);
  return deliveries.find((d) => d.id === id);
}

export async function getDeliveryHistory(id: string): Promise<Delivery[]> {
  await delay(40);
  const base = deliveries.find((d) => d.id === id);
  if (!base) return [];
  return [base, ...deliveryHistory.filter((d) => d.prompt_generation_id === base.prompt_generation_id)];
}

export async function getQueueDepth() {
  await delay();
  const groups = new Map<string, number>();
  deliveries
    .filter((d) => ["queued", "dispatching"].includes(d.status))
    .forEach((d) => {
      const key = `${d.priority}|${d.destination}`;
      groups.set(key, (groups.get(key) || 0) + 1);
    });
  return Array.from(groups.entries()).map(([k, count]) => {
    const [priority, destination] = k.split("|");
    return { priority, destination, queued_count: count };
  });
}

// ──────────────────────────── Processing runs (Q4)
export async function listProcessingRunsForNote(noteId: string): Promise<ProcessingRun[]> {
  await delay(50);
  return processingRuns.filter((r) => r.intake_note_id === noteId);
}

export async function listFailedProcessingRuns(): Promise<ProcessingRun[]> {
  await delay();
  return processingRuns.filter((r) => r.status === "failed");
}

// ──────────────────────────── LLM runs (Q11)
export async function getLlmRunAggregate() {
  await delay();
  const map = new Map<string, { provider: string; model: string; runs: number; latency: number; max: number; in: number; out: number }>();
  llmRuns.forEach((r) => {
    const key = `${r.provider_name}|${r.model_name}`;
    const v = map.get(key) || { provider: r.provider_name, model: r.model_name, runs: 0, latency: 0, max: 0, in: 0, out: 0 };
    v.runs += 1;
    v.latency += r.latency_ms;
    v.max = Math.max(v.max, r.latency_ms);
    v.in += r.input_tokens;
    v.out += r.output_tokens;
    map.set(key, v);
  });
  return Array.from(map.values()).map((v) => ({
    provider: v.provider,
    model: v.model,
    runs: v.runs,
    avg_latency_ms: Math.round(v.latency / v.runs),
    max_latency_ms: v.max,
    input_tokens: v.in,
    output_tokens: v.out,
  }));
}

// ──────────────────────────── Rules (Q13)
export async function listRulesets(scope?: PfScope, projectId?: string): Promise<Ruleset[]> {
  await delay();
  let rows = rulesets.filter((r) => r.active);
  if (scope) rows = rows.filter((r) => r.scope === scope);
  if (projectId) rows = rows.filter((r) => r.project_id === projectId);
  return rows;
}

export async function listRules(rulesetId: string): Promise<Rule[]> {
  await delay();
  return rules.filter((r) => r.ruleset_id === rulesetId).sort((a, b) => b.priority - a.priority);
}

// ──────────────────────────── Term dictionary (Q14)
export interface TermFilters extends PageParams {
  scope?: PfScope;
  projectId?: string;
}

export async function listTerms(f: TermFilters = {}): Promise<PageResult<TermDictionaryEntry>> {
  await delay();
  let rows = [...termDictionary];
  if (f.scope) rows = rows.filter((r) => r.scope === f.scope);
  if (f.projectId) rows = rows.filter((r) => r.project_id === f.projectId);
  if (f.search) {
    const q = f.search.toLowerCase();
    rows = rows.filter((r) => r.source_term.toLowerCase().includes(q) || r.normalized_term.toLowerCase().includes(q));
  }
  rows.sort((a, b) => (a.updated_at < b.updated_at ? 1 : -1));
  return paginate(rows, f);
}

// ──────────────────────────── Templates (Q15)
export interface TemplateFilters extends PageParams {
  promptType?: string;
  scope?: PfScope;
  projectId?: string;
  activeOnly?: boolean;
}
export async function listTemplates(f: TemplateFilters = {}): Promise<PageResult<PromptTemplate>> {
  await delay();
  let rows = [...promptTemplates];
  if (f.activeOnly) rows = rows.filter((r) => r.is_active);
  if (f.promptType) rows = rows.filter((r) => r.prompt_type === f.promptType);
  if (f.scope) rows = rows.filter((r) => r.scope === f.scope);
  if (f.projectId) rows = rows.filter((r) => r.project_id === f.projectId);
  return paginate(rows, f);
}

// ──────────────────────────── Targets (Q16)
export async function listTargets(type?: PfTargetType): Promise<DeliveryTarget[]> {
  await delay();
  return type ? deliveryTargets.filter((t) => t.target_type === type) : deliveryTargets;
}

// ──────────────────────────── Logs + fingerprints (Q19)
export interface LogFilters extends PageParams {
  service?: LogEntry["service"];
  level?: LogEntry["level"];
  intakeNoteId?: string;
  utteranceId?: string;
  promptGenerationId?: string;
  deliveryId?: string;
}
export async function listLogs(f: LogFilters = {}): Promise<PageResult<LogEntry>> {
  await delay(120);
  let rows = [...logs];
  if (f.service) rows = rows.filter((r) => r.service === f.service);
  if (f.level) rows = rows.filter((r) => r.level === f.level);
  if (f.intakeNoteId) rows = rows.filter((r) => r.intake_note_id === f.intakeNoteId);
  if (f.utteranceId) rows = rows.filter((r) => r.utterance_id === f.utteranceId);
  if (f.promptGenerationId) rows = rows.filter((r) => r.prompt_generation_id === f.promptGenerationId);
  if (f.deliveryId) rows = rows.filter((r) => r.delivery_id === f.deliveryId);
  if (f.search) {
    const q = f.search.toLowerCase();
    rows = rows.filter((r) => r.message.toLowerCase().includes(q));
  }
  rows.sort((a, b) => (a.timestamp < b.timestamp ? 1 : -1));
  return paginate(rows, { page: f.page, pageSize: f.pageSize ?? 200 });
}

export async function getErrorFingerprints(limit = 10) {
  await delay();
  const map = new Map<string, { fingerprint: string; error_text: string; count: number; last_seen_at: string }>();
  processingRuns.forEach((r) => {
    if (!r.error_text) return;
    const fp = r.error_text.slice(0, 12);
    const v = map.get(fp) || { fingerprint: fp, error_text: r.error_text, count: 0, last_seen_at: r.updated_at };
    v.count += 1;
    if (r.updated_at > v.last_seen_at) v.last_seen_at = r.updated_at;
    map.set(fp, v);
  });
  return Array.from(map.values())
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}

// ──────────────────────────── SLA (Q20) + throughput (Q12)
export async function getSlaSummary() {
  await delay();
  return intakeNotes.slice(0, 20).map((n) => {
    const pg = promptGenerations.find((p) => p.intake_note_id === n.id);
    const d = pg ? deliveries.find((dd) => dd.prompt_generation_id === pg.id) : undefined;
    const terminal = d && ["delivered", "failed", "acked"].includes(d.status) ? d : undefined;
    const latency = terminal ? new Date(terminal.updated_at).getTime() - new Date(n.created_at).getTime() : null;
    return {
      intake_note_id: n.id,
      note_relative_path: n.note_relative_path,
      imported_at: n.created_at,
      terminal_status: terminal?.status ?? null,
      terminal_at: terminal?.updated_at ?? null,
      latency_ms: latency,
    };
  });
}

export async function getProjectThroughput() {
  await delay();
  return projects.map((p) => {
    const notes = intakeNotes.filter((n) => n.project_id === p.id);
    const pgs = promptGenerations.filter((pg) => notes.some((n) => n.id === pg.intake_note_id));
    const dels = deliveries.filter((d) => pgs.some((pg) => pg.id === d.prompt_generation_id));
    return {
      project_id: p.id,
      project_name: p.name,
      notes: notes.length,
      prompts: pgs.length,
      deliveries: dels.length,
      failed_deliveries: dels.filter((d) => d.status === "failed").length,
      failed_processing: processingRuns.filter((r) => notes.some((n) => n.id === r.intake_note_id) && r.status === "failed").length,
    };
  });
}

// ──────────────────────────── Mutations (M1–M5 + actions)
export async function retryDelivery(id: string) {
  await delay(220);
  return { ok: true, id, message: "Retry queued" };
}
export async function rerouteDelivery(id: string, targetId: string) {
  await delay(220);
  return { ok: true, id, targetId };
}
export async function updateDeliveryStatus(id: string, status: PfDeliveryStatus) {
  await delay(180);
  return { ok: true, id, status };
}
export async function updateRule(id: string, patch: Partial<Pick<Rule, "enabled" | "priority">>) {
  await delay(180);
  return { ok: true, id, ...patch };
}
export async function upsertTerm(payload: Partial<TermDictionaryEntry>) {
  await delay(180);
  return { ok: true, payload };
}
export async function activateTemplate(id: string, family: string) {
  await delay(220);
  return { ok: true, id, family };
}
export async function forceReview(id: string) {
  await delay(160);
  return { ok: true, id };
}
export async function clonePrompt(id: string) {
  await delay(160);
  return { ok: true, id, newId: id + "-clone" };
}
export async function changePromptPriority(id: string, priority: string) {
  await delay(140);
  return { ok: true, id, priority };
}
export async function archiveNote(id: string) {
  await delay(140);
  return { ok: true, id };
}
