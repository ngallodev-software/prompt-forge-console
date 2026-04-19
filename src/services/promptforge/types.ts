// PromptForge enums and core type definitions.
// Mirrors authoritative Postgres schema.

export type PfScope = "global" | "user" | "project";
export type PfNoteStatus = "new" | "imported" | "processing" | "processed" | "error" | "archived";
export type PfRevisionKind =
  | "raw"
  | "directive_stripped"
  | "deterministic_preprocessed"
  | "llm_cleaned"
  | "llm_structured_source"
  | "final_rendered_prompt";
export type PfProducerType = "human" | "watcher" | "python" | "llm" | "renderer" | "system";
export type PfRuleType = "cleanup" | "expansion" | "routing" | "formatting" | "safety" | "terminology";
export type PfPromptGenerationStatus =
  | "created"
  | "preprocessed"
  | "transforming"
  | "structured_validating"
  | "rendered"
  | "failed";
export type PfLlmRunMode = "review" | "inference";
export type PfDestination = "chat" | "cli" | "obsidian_note" | "queue_only";
export type PfTargetType = "none" | "chat_session" | "claude_session" | "codex_session" | "obsidian_note" | "generic_queue";
export type PfDeliveryMode = "draft" | "queue" | "auto_dispatch";
export type PfDeliveryStatus = "not_started" | "queued" | "dispatching" | "delivered" | "acked" | "failed";
export type PfProcessingStatus = "running" | "completed" | "failed";
export type PfPriority = "low" | "normal" | "high" | "urgent";

export type Role = "viewer" | "operator" | "admin";

export interface Project {
  id: string;
  name: string;
  slug: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

export interface IntakeNote {
  id: string;
  project_id: string | null;
  note_relative_path: string; // unique
  status: PfNoteStatus;
  watch_eligible: boolean;
  source_device: string | null;
  body_text: string;
  frontmatter_original: Record<string, unknown>;
  frontmatter_current: Record<string, unknown>;
  metadata_json: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface Utterance {
  id: string;
  intake_note_id: string;
  speaker: string | null;
  index: number;
  created_at: string;
}

export interface TranscriptRevision {
  id: string;
  utterance_id: string;
  revision_kind: PfRevisionKind;
  producer_type: PfProducerType;
  producer_name: string;
  content_text: string;
  metadata_json: Record<string, unknown>;
  created_at: string;
}

export interface Ruleset {
  id: string;
  name: string;
  scope: PfScope;
  project_id: string | null;
  active: boolean;
  description?: string;
  updated_at: string;
}

export interface Rule {
  id: string;
  ruleset_id: string;
  name: string;
  rule_type: PfRuleType;
  priority: number;
  enabled: boolean;
  pattern?: string;
  replacement?: string;
  description?: string;
  updated_at: string;
}

export interface TermDictionaryEntry {
  id: string;
  scope: PfScope;
  project_id: string | null;
  source_term: string;
  normalized_term: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

export interface PromptTemplate {
  id: string;
  name: string;
  prompt_type: string;
  scope: PfScope;
  project_id: string | null;
  version: number;
  is_active: boolean;
  template_family_key: string;
  body: string;
  updated_at: string;
}

export interface PromptGeneration {
  id: string;
  intake_note_id: string;
  status: PfPromptGenerationStatus;
  requires_review: boolean;
  prompt_type: string;
  ruleset_id: string | null;
  template_id: string | null;
  destination: PfDestination;
  mode: PfDeliveryMode;
  priority: PfPriority;
  structured_output_json: Record<string, unknown>;
  final_prompt_markdown: string;
  validation_warnings: string[];
  created_at: string;
  updated_at: string;
}

export interface LlmRun {
  id: string;
  prompt_generation_id: string;
  provider_name: string;
  model_name: string;
  mode: PfLlmRunMode;
  latency_ms: number;
  input_tokens: number;
  output_tokens: number;
  created_at: string;
}

export interface DeliveryTarget {
  id: string;
  name: string;
  target_type: PfTargetType;
  destination: PfDestination;
  scope: PfScope;
  project_id: string | null;
  enabled: boolean;
  is_sensitive: boolean;
  requires_confirmation: boolean;
  environment: "dev" | "staging" | "prod";
  validation_status: "ok" | "degraded" | "unknown" | "error";
  updated_at: string;
}

export interface Delivery {
  id: string;
  prompt_generation_id: string;
  target_id: string | null;
  status: PfDeliveryStatus;
  destination: PfDestination;
  mode: PfDeliveryMode;
  priority: PfPriority;
  retry_count: number;
  failure_text: string | null;
  ack_text: string | null;
  created_at: string;
  updated_at: string;
}

export interface ProcessingRun {
  id: string;
  intake_note_id: string;
  status: PfProcessingStatus;
  stage_name: string;
  error_text: string | null;
  trace_json: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface LogEntry {
  id: string;
  service: "watcher" | "api" | "n8n" | "postgres";
  level: "debug" | "info" | "warn" | "error";
  message: string;
  timestamp: string;
  intake_note_id?: string;
  utterance_id?: string;
  prompt_generation_id?: string;
  delivery_id?: string;
  fields: Record<string, unknown>;
}

export interface HealthSnapshot {
  api: { status: "ok" | "degraded" | "down"; latency_ms: number; checked_at: string };
  providers: Array<{ name: string; status: "ok" | "degraded" | "down"; latency_ms: number }>;
  db: { status: "ok" | "degraded" | "down"; latency_ms: number };
  queue_depth: number;
  failures_24h: number;
}

export interface PageParams {
  page?: number;
  pageSize?: number;
  search?: string;
  sortBy?: string;
  sortDir?: "asc" | "desc";
}

export interface PageResult<T> {
  rows: T[];
  total: number;
  page: number;
  pageSize: number;
}
