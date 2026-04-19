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
import { ApiError, BackendUnavailableError, NotFoundError, ValidationError } from "./errors";
import { defaultConsoleSettings, useAppStore } from "@/stores/app-store";

const ENV_API_BASE = (import.meta.env.VITE_PROMPTFORGE_API_BASE as string | undefined)?.replace(/\/+$/, "") || defaultConsoleSettings.apiBaseUrl;
const ENV_BOOTSTRAP_PATH = (import.meta.env.VITE_PROMPTFORGE_BOOTSTRAP_PATH as string | undefined) || defaultConsoleSettings.bootstrapPath;
export const HYDRATION_TTL_MS = Number(import.meta.env.VITE_PROMPTFORGE_HYDRATION_TTL_MS || 15_000);

function getApiBase(): string {
  return useAppStore.getState().consoleSettings.apiBaseUrl.trim().replace(/\/+$/, "") || ENV_API_BASE;
}

function getBootstrapPath(): string {
  return useAppStore.getState().consoleSettings.bootstrapPath.trim() || ENV_BOOTSTRAP_PATH;
}

export function getConsoleRuntimeSnapshot() {
  return {
    apiBaseUrl: getApiBase(),
    bootstrapPath: getBootstrapPath(),
    defaultApiBaseUrl: ENV_API_BASE,
    defaultBootstrapPath: ENV_BOOTSTRAP_PATH,
    hydrationTtlMs: HYDRATION_TTL_MS,
    strictBackend: STRICT_BACKEND,
  };
}

let lastHydrationAt = 0;
let hydrationInFlight: Promise<void> | null = null;

function replaceArrayInPlace<T>(target: T[], next?: unknown) {
  if (!Array.isArray(next)) return;
  target.splice(0, target.length, ...(next as T[]));
}

async function fetchJson<T>(path: string, init?: RequestInit): Promise<T> {
  try {
    const res = await fetch(`${getApiBase()}${path}`, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        ...(init?.headers || {}),
      },
    });
    if (!res.ok) {
      const detail = (await res.text()).trim() || res.statusText || `HTTP ${res.status}`;
      if (res.status === 503) throw new BackendUnavailableError(detail);
      if (res.status === 404) throw new NotFoundError(detail);
      if (res.status === 400 || res.status === 422) throw new ValidationError(res.status as 400 | 422, detail);
      throw new ApiError(res.status, detail, res.status >= 500);
    }
    return (await res.json()) as T;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    const detail = error instanceof Error ? error.message : "Network error";
    throw new ApiError(0, detail || "Network error", true, error);
  }
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

interface BackendPaginatedResponse<T> {
  pagination: { total: number; limit: number; offset: number; has_more: boolean };
  [key: string]: unknown;
  _items?: T[];
}

interface LineageResponse {
  intake_note: IntakeNote;
  utterances: Array<Utterance & { raw_text?: string }>;
  revisions: TranscriptRevision[];
  promptGenerations: PromptGeneration[];
  deliveries: Delivery[];
  processingRuns: ProcessingRun[];
}

export function adaptPageResult<T>(raw: BackendPaginatedResponse<T>, itemsKey: string, pageSize: number): PageResult<T> {
  const rows = (raw[itemsKey] as T[] | undefined) ?? [];
  const { total, limit, offset } = raw.pagination;
  const page = limit > 0 ? Math.floor(offset / limit) + 1 : 1;
  return { rows, total, page, pageSize };
}

async function fetchPageResult<T>(path: string, itemsKey: string, pageSize: number): Promise<PageResult<T>> {
  const raw = await fetchJson<BackendPaginatedResponse<T>>(path);
  return adaptPageResult(raw, itemsKey, pageSize);
}

async function ensureHydrated(force = false): Promise<void> {
  const stale = Date.now() - lastHydrationAt > HYDRATION_TTL_MS;
  if (!force && !stale && lastHydrationAt > 0) return;
  if (hydrationInFlight) return hydrationInFlight;

  hydrationInFlight = (async () => {
    try {
      const snapshot = await fetchJson<Record<string, unknown>>(getBootstrapPath());
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
  return fetchPageResult<IntakeNote>(buildQueryPath("/console/intake", {
    limit: pageSize,
    offset: (page - 1) * pageSize,
    project_id: f.projectId,
    status: f.status,
    watch_eligible: f.watchEligible,
    source_device: f.sourceDevice,
    search: f.search,
    with_skip_reason: f.withSkipReason,
  }), "intakeNotes", pageSize);
}

export async function getIntakeNote(id: string): Promise<IntakeNote | undefined> {
  try {
    const raw = await fetchJson<{ note: IntakeNote }>(`/console/intake/${id}`);
    return raw.note;
  } catch (error) {
    if (STRICT_BACKEND) throw createStrictBackendError(error);
    logBackendFallback(`promptforge intake detail ${id}`, error);
    await delay(60);
    return intakeNotes.find((n) => n.id === id);
  }
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
  try {
    const raw = await fetchJson<LineageResponse>(`/console/lineage/${noteId}`);
    return {
      note: raw.intake_note,
      utterances: raw.utterances.map((u, index) => ({
        id: u.id,
        intake_note_id: u.intake_note_id,
        speaker: u.speaker ?? null,
        index: u.index ?? index,
        created_at: u.created_at,
      })),
      revisions: raw.revisions,
      promptGenerations: raw.promptGenerations,
      deliveries: raw.deliveries,
      processingRuns: raw.processingRuns,
    };
  } catch (error) {
    if (STRICT_BACKEND) throw createStrictBackendError(error);
    logBackendFallback(`promptforge lineage ${noteId}`, error);
    await delay(80);
    const note = intakeNotes.find((n) => n.id === noteId);
    const utts = utterances.filter((u) => u.intake_note_id === noteId);
    const revs = utts.flatMap((u) => transcriptRevisions.filter((r) => r.utterance_id === u.id));
    const pgs = promptGenerations.filter((p) => p.intake_note_id === noteId);
    const dels = pgs.flatMap((pg) => deliveries.filter((d) => d.prompt_generation_id === pg.id));
    const runs = processingRuns.filter((r) => r.intake_note_id === noteId);
    return { note, utterances: utts, revisions: revs, promptGenerations: pgs, deliveries: dels, processingRuns: runs };
  }
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
  return fetchPageResult<PromptGeneration>(buildQueryPath("/console/prompts", {
    limit: pageSize,
    offset: (page - 1) * pageSize,
    status: f.status,
    requires_review: f.requiresReview,
    search: f.search,
  }), "promptGenerations", pageSize);
}

export async function getPromptGeneration(id: string): Promise<PromptGeneration | undefined> {
  await delay(50);
  return promptGenerations.find((p) => p.id === id);
}

export async function getLatestPromptForNote(noteId: string): Promise<PromptGeneration | undefined> {
  try {
    const page = await fetchPageResult<PromptGeneration>(
      buildQueryPath("/console/prompts", {
        intake_note_id: noteId,
        limit: 1,
        offset: 0,
      }),
      "promptGenerations",
      1,
    );
    return page.rows[0];
  } catch (error) {
    if (STRICT_BACKEND) throw createStrictBackendError(error);
    logBackendFallback(`promptforge latest prompt for note ${noteId}`, error);
    await delay(40);
    return promptGenerations.find((p) => p.intake_note_id === noteId);
  }
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
  return fetchPageResult<Delivery & { retry_candidate: boolean }>(buildQueryPath("/console/deliveries", {
    limit: pageSize,
    offset: (page - 1) * pageSize,
    status: f.failedOnly ? "failed" : f.status,
    search: f.search,
  }), "deliveries", pageSize);
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
  await ensureHydrated();
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
  const lineage = await getNoteLineage(noteId);
  return lineage.processingRuns;
}

export async function listFailedProcessingRuns(): Promise<ProcessingRun[]> {
  try {
    const page = await fetchPageResult<ProcessingRun>("/console/processing/failed?limit=250&offset=0", "processingRuns", 250);
    return page.rows;
  } catch (error) {
    if (STRICT_BACKEND) throw createStrictBackendError(error);
    logBackendFallback("promptforge failed processing runs", error);
    await delay();
    return processingRuns.filter((r) => r.status === "failed");
  }
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
  try {
    const page = await fetchPageResult<Ruleset>(buildQueryPath("/console/rulesets", {
      scope,
      project_id: projectId,
      limit: 250,
      offset: 0,
    }), "rulesets", 250);
    return page.rows;
  } catch (error) {
    if (STRICT_BACKEND) throw createStrictBackendError(error);
    logBackendFallback("promptforge rulesets", error);
    await delay();
    let rows = rulesets.filter((r) => r.active);
    if (scope) rows = rows.filter((r) => r.scope === scope);
    if (projectId) rows = rows.filter((r) => r.project_id === projectId);
    return rows;
  }
}

export async function listRules(rulesetId: string): Promise<Rule[]> {
  try {
    const page = await fetchPageResult<Rule>(buildQueryPath("/console/rules", {
      ruleset_id: rulesetId,
      limit: 500,
      offset: 0,
    }), "rules", 500);
    return page.rows.sort((a, b) => b.priority - a.priority);
  } catch (error) {
    if (STRICT_BACKEND) throw createStrictBackendError(error);
    logBackendFallback(`promptforge rules ${rulesetId}`, error);
    await delay();
    return rules.filter((r) => r.ruleset_id === rulesetId).sort((a, b) => b.priority - a.priority);
  }
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
  return fetchPageResult<TermDictionaryEntry>(buildQueryPath("/console/dictionary", {
    limit: pageSize,
    offset: (page - 1) * pageSize,
    scope: f.scope,
    project_id: f.projectId,
    search: f.search,
  }), "termDictionary", pageSize);
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
  return fetchPageResult<PromptTemplate>(buildQueryPath("/console/templates", {
    limit: pageSize,
    offset: (page - 1) * pageSize,
    prompt_type: f.promptType,
    scope: f.scope,
    project_id: f.projectId,
    active_only: f.activeOnly ? true : undefined,
    search: f.search,
  }), "promptTemplates", pageSize);
}

// ──────────────────────────── Targets (Q16)
export async function listTargets(type?: PfTargetType): Promise<DeliveryTarget[]> {
  try {
    const page = await fetchPageResult<DeliveryTarget>(buildQueryPath("/console/targets", {
      type,
      limit: 250,
      offset: 0,
    }), "deliveryTargets", 250);
    return page.rows;
  } catch (error) {
    if (STRICT_BACKEND) throw createStrictBackendError(error);
    logBackendFallback("promptforge targets", error);
    await delay();
    return type ? deliveryTargets.filter((t) => t.target_type === type) : deliveryTargets;
  }
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

function applyLogFilters(rows: LogEntry[], f: LogFilters): LogEntry[] {
  const search = f.search?.trim().toLowerCase();
  return rows.filter((row) => {
    if (f.service && row.service !== f.service) return false;
    if (f.level && row.level !== f.level) return false;
    if (f.intakeNoteId && row.intake_note_id !== f.intakeNoteId) return false;
    if (f.utteranceId && row.utterance_id !== f.utteranceId) return false;
    if (f.promptGenerationId && row.prompt_generation_id !== f.promptGenerationId) return false;
    if (f.deliveryId && row.delivery_id !== f.deliveryId) return false;
    if (!search) return true;

    const haystack = [
      row.message,
      row.service,
      row.level,
      row.intake_note_id,
      row.utterance_id,
      row.prompt_generation_id,
      row.delivery_id,
      JSON.stringify(row.fields),
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    return haystack.includes(search);
  });
}

function paginateRows<T>(rows: T[], page: number, pageSize: number): PageResult<T> {
  const start = (page - 1) * pageSize;
  return {
    rows: rows.slice(start, start + pageSize),
    total: rows.length,
    page,
    pageSize,
  };
}

export async function listLogs(f: LogFilters = {}): Promise<PageResult<LogEntry>> {
  await delay(120);
  const page = f.page ?? 1;
  const pageSize = f.pageSize ?? 200;
  try {
    const result = await fetchPageResult<LogEntry>(buildQueryPath("/console/logs", {
      limit: pageSize,
      offset: (page - 1) * pageSize,
      source: f.service,
      level: f.level,
      intake_note_id: f.intakeNoteId,
      utterance_id: f.utteranceId,
      prompt_generation_id: f.promptGenerationId,
      delivery_id: f.deliveryId,
      search: f.search,
    }), "logs", pageSize);

    if (result.total > 0 || logs.length === 0 || STRICT_BACKEND) return result;
    return paginateRows(applyLogFilters(logs, f), page, pageSize);
  } catch (error) {
    if (STRICT_BACKEND) throw createStrictBackendError(error);
    logBackendFallback("promptforge logs", error);
    await delay();
    return paginateRows(applyLogFilters(logs, f), page, pageSize);
  }
}

export async function getErrorFingerprints(limit = 10) {
  try {
    const raw = await fetchJson<{ errorFingerprints: Array<{ fingerprint: string; sample_message?: string; count: number; last_seen_at: string }> }>(
      buildQueryPath("/console/metrics/error-fingerprints", { limit, offset: 0 }),
    );
    return (raw.errorFingerprints || []).map((entry) => ({
      fingerprint: entry.fingerprint,
      error_text: entry.sample_message || entry.fingerprint,
      count: entry.count,
      last_seen_at: entry.last_seen_at,
    }));
  } catch (error) {
    if (STRICT_BACKEND) throw createStrictBackendError(error);
    logBackendFallback("promptforge error fingerprints", error);
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

export interface LlmAssistPayload {
  prompt: string;
  context_type?: string;
  context?: Record<string, unknown>;
}

export interface LlmAssistResult {
  result: string;
  provider?: string | null;
  model?: string | null;
  available: boolean;
}

export async function llmAssist(payload: LlmAssistPayload): Promise<LlmAssistResult> {
  try {
    const response = await postJson<LlmAssistResult>("/console/llm/assist", payload);
    return response;
  } catch (error) {
    if (STRICT_BACKEND) throw error;
    logBackendFallback("llmAssist", error);
    return { result: "LLM not available in development mode.", available: false };
  }
}
