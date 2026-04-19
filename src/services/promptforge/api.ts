// Typed service layer with runtime backend hydration.
// Contract-first: function signatures and query key shapes stay stable for UI pages.

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
import { STRICT_BACKEND, createStrictBackendError, logBackendFallback } from "./config";

const API_BASE = (import.meta.env.VITE_PROMPTFORGE_API_BASE as string | undefined)?.replace(/\/+$/, "") || "http://localhost:8090";
const BOOTSTRAP_PATH = (import.meta.env.VITE_PROMPTFORGE_BOOTSTRAP_PATH as string | undefined) || "/console/bootstrap";
const HYDRATION_TTL_MS = Number(import.meta.env.VITE_PROMPTFORGE_HYDRATION_TTL_MS || 15_000);

let lastHydrationAt = 0;
let hydrationInFlight: Promise<void> | null = null;

function replaceArrayInPlace<T>(target: T[], next?: unknown) {
  if (!Array.isArray(next)) return;
  target.splice(0, target.length, ...(next as T[]));
}

async function fetchJson<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers || {}),
    },
  });
  if (!res.ok) {
    throw new Error(`HTTP ${res.status} for ${path}`);
  }
  return (await res.json()) as T;
}

async function postJson<T>(path: string, payload?: unknown, method: "POST" | "PATCH" | "PUT" | "DELETE" = "POST"): Promise<T> {
  return fetchJson<T>(path, {
    method,
    body: payload === undefined ? undefined : JSON.stringify(payload),
  });
}

function buildQueryPath(path: string, params: Record<string, unknown>): string {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === "") continue;
    query.set(key, String(value));
  }
  const qs = query.toString();
  return qs ? `${path}?${qs}` : path;
}

async function ensureHydrated(force = false): Promise<void> {
  const stale = Date.now() - lastHydrationAt > HYDRATION_TTL_MS;
  if (!force && !stale && lastHydrationAt > 0) return;
  if (hydrationInFlight) return hydrationInFlight;

  hydrationInFlight = (async () => {
    try {
      const snapshot = await fetchJson<Record<string, unknown>>(BOOTSTRAP_PATH);
      replaceArrayInPlace(projects, snapshot.projects);
      replaceArrayInPlace(intakeNotes, snapshot.intakeNotes);
      replaceArrayInPlace(utterances, snapshot.utterances);
      replaceArrayInPlace(transcriptRevisions, snapshot.transcriptRevisions);
      replaceArrayInPlace(promptGenerations, snapshot.promptGenerations);
      replaceArrayInPlace(deliveries, snapshot.deliveries);
      replaceArrayInPlace(deliveryHistory, snapshot.deliveryHistory);
      replaceArrayInPlace(processingRuns, snapshot.processingRuns);
      replaceArrayInPlace(llmRuns, snapshot.llmRuns);
      replaceArrayInPlace(rulesets, snapshot.rulesets);
      replaceArrayInPlace(rules, snapshot.rules);
      replaceArrayInPlace(termDictionary, snapshot.termDictionary);
      replaceArrayInPlace(promptTemplates, snapshot.promptTemplates);
      replaceArrayInPlace(deliveryTargets, snapshot.deliveryTargets);
      replaceArrayInPlace(logs, snapshot.logs);
      if (snapshot.healthSnapshot && typeof snapshot.healthSnapshot === "object") {
        Object.assign(healthSnapshot, snapshot.healthSnapshot);
      }
      lastHydrationAt = Date.now();
    } catch (error) {
      if (STRICT_BACKEND) throw createStrictBackendError(error);
      logBackendFallback("promptforge bootstrap hydration", error);
      lastHydrationAt = Date.now();
    } finally {
      hydrationInFlight = null;
    }
  })();

  return hydrationInFlight;
}

// Simulated delay for UX smoothness; also triggers backend hydration.
const delay = async (ms = 180) => {
  await ensureHydrated();
  return new Promise<void>((r) => setTimeout(r, ms));
};

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
  try {
    const [apiHealth, providersHealth] = await Promise.all([
      fetchJson<{ ok: boolean }>("/_healthz"),
      fetchJson<{ providers?: Array<{ provider_name?: string; detail?: string; available?: boolean }> }>("/providers/health"),
    ]);
    return {
      ...healthSnapshot,
      api: {
        ...healthSnapshot.api,
        status: apiHealth?.ok ? "ok" : "degraded",
        checked_at: new Date().toISOString(),
      },
      providers: (providersHealth?.providers || []).map((p) => ({
        name: p.provider_name || "unknown",
        status: p.available ? "ok" : "degraded",
        latency_ms: 0,
      })),
    };
  } catch (error) {
    if (STRICT_BACKEND) throw createStrictBackendError(error);
    logBackendFallback("promptforge health check", error);
    await delay(80);
    return healthSnapshot;
  }
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
  const page = f.page ?? 1;
  const pageSize = f.pageSize ?? 25;
  return fetchJson<PageResult<IntakeNote>>(buildQueryPath("/console/intake", {
    limit: pageSize,
    offset: (page - 1) * pageSize,
    project_id: f.projectId,
    status: f.status,
    watch_eligible: f.watchEligible,
    source_device: f.sourceDevice,
    search: f.search,
    with_skip_reason: f.withSkipReason,
  }));
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
  const page = f.page ?? 1;
  const pageSize = f.pageSize ?? 25;
  return fetchJson<PageResult<PromptGeneration>>(buildQueryPath("/console/prompts", {
    limit: pageSize,
    offset: (page - 1) * pageSize,
    status: f.status,
    requires_review: f.requiresReview,
    search: f.search,
  }));
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
  const page = f.page ?? 1;
  const pageSize = f.pageSize ?? 25;
  return fetchJson<PageResult<Delivery & { retry_candidate: boolean }>>(buildQueryPath("/console/deliveries", {
    limit: pageSize,
    offset: (page - 1) * pageSize,
    status: f.failedOnly ? "failed" : f.status,
    search: f.search,
  }));
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
  const page = f.page ?? 1;
  const pageSize = f.pageSize ?? 25;
  return fetchJson<PageResult<TermDictionaryEntry>>(buildQueryPath("/console/dictionary", {
    limit: pageSize,
    offset: (page - 1) * pageSize,
    scope: f.scope,
    project_id: f.projectId,
    search: f.search,
  }));
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
  const page = f.page ?? 1;
  const pageSize = f.pageSize ?? 25;
  return fetchJson<PageResult<PromptTemplate>>(buildQueryPath("/console/templates", {
    limit: pageSize,
    offset: (page - 1) * pageSize,
    prompt_type: f.promptType,
    scope: f.scope,
    project_id: f.projectId,
    active_only: f.activeOnly ? true : undefined,
    search: f.search,
  }));
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
  const page = f.page ?? 1;
  const pageSize = f.pageSize ?? 200;
  return fetchJson<PageResult<LogEntry>>(buildQueryPath("/console/logs", {
    limit: pageSize,
    offset: (page - 1) * pageSize,
    source: f.service,
    level: f.level,
    intake_note_id: f.intakeNoteId,
    utterance_id: f.utteranceId,
    prompt_generation_id: f.promptGenerationId,
    delivery_id: f.deliveryId,
    search: f.search,
  }));
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
  try {
    const response = await postJson<{ ok?: boolean; message?: string }>(`/console/deliveries/${id}/retry`);
    await ensureHydrated(true);
    return { ok: response?.ok ?? true, id, message: response?.message || "Retry queued" };
  } catch (error) {
    if (STRICT_BACKEND) throw error;
  }
  await delay(220);
  return { ok: true, id, message: "Retry queued" };
}
export async function rerouteDelivery(id: string, targetId: string) {
  try {
    const response = await postJson<{ ok?: boolean }>(`/console/deliveries/${id}/reroute`, { targetId });
    await ensureHydrated(true);
    return { ok: response?.ok ?? true, id, targetId };
  } catch (error) {
    if (STRICT_BACKEND) throw error;
  }
  await delay(220);
  return { ok: true, id, targetId };
}
export async function updateDeliveryStatus(id: string, status: PfDeliveryStatus) {
  try {
    const response = await postJson<{ ok?: boolean }>(`/console/deliveries/${id}/status`, { status }, "PATCH");
    await ensureHydrated(true);
    return { ok: response?.ok ?? true, id, status };
  } catch (error) {
    if (STRICT_BACKEND) throw error;
  }
  await delay(180);
  return { ok: true, id, status };
}
export async function updateRule(id: string, patch: Partial<Pick<Rule, "enabled" | "priority">>) {
  try {
    const response = await postJson<{ ok?: boolean }>(`/console/rules/${id}`, patch, "PATCH");
    await ensureHydrated(true);
    return { ok: response?.ok ?? true, id, ...patch };
  } catch (error) {
    if (STRICT_BACKEND) throw error;
  }
  await delay(180);
  return { ok: true, id, ...patch };
}
export async function upsertTerm(payload: Partial<TermDictionaryEntry>) {
  try {
    const response = await postJson<{ ok?: boolean; payload?: Partial<TermDictionaryEntry> }>(`/console/dictionary/upsert`, payload);
    await ensureHydrated(true);
    return { ok: response?.ok ?? true, payload: response?.payload ?? payload };
  } catch (error) {
    if (STRICT_BACKEND) throw error;
  }
  await delay(180);
  return { ok: true, payload };
}
export async function activateTemplate(id: string, family: string) {
  try {
    const response = await postJson<{ ok?: boolean }>(`/console/templates/${id}/activate`, { family });
    await ensureHydrated(true);
    return { ok: response?.ok ?? true, id, family };
  } catch (error) {
    if (STRICT_BACKEND) throw error;
  }
  await delay(220);
  return { ok: true, id, family };
}
export async function forceReview(id: string) {
  try {
    const response = await postJson<{ ok?: boolean }>(`/console/prompts/${id}/force-review`);
    await ensureHydrated(true);
    return { ok: response?.ok ?? true, id };
  } catch (error) {
    if (STRICT_BACKEND) throw error;
  }
  await delay(160);
  return { ok: true, id };
}
export async function clonePrompt(id: string) {
  try {
    const response = await postJson<{ ok?: boolean; newId?: string }>(`/console/prompts/${id}/clone`);
    await ensureHydrated(true);
    return { ok: response?.ok ?? true, id, newId: response?.newId || `${id}-clone` };
  } catch (error) {
    if (STRICT_BACKEND) throw error;
  }
  await delay(160);
  return { ok: true, id, newId: id + "-clone" };
}
export async function changePromptPriority(id: string, priority: string) {
  try {
    const response = await postJson<{ ok?: boolean }>(`/console/prompts/${id}/priority`, { priority }, "PATCH");
    await ensureHydrated(true);
    return { ok: response?.ok ?? true, id, priority };
  } catch (error) {
    if (STRICT_BACKEND) throw error;
  }
  await delay(140);
  return { ok: true, id, priority };
}
export async function archiveNote(id: string) {
  try {
    const response = await postJson<{ ok?: boolean }>(`/console/intake/${id}/archive`, {}, "PATCH");
    await ensureHydrated(true);
    return { ok: response?.ok ?? true, id };
  } catch (error) {
    if (STRICT_BACKEND) throw error;
  }
  await delay(140);
  return { ok: true, id };
}
