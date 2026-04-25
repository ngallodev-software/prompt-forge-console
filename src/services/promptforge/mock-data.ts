// Deterministic seeded mock data factories for PromptForge.
// All entities correlated across the lineage chain.

import type {
  Delivery,
  DeliveryTarget,
  HealthSnapshot,
  IntakeNote,
  LlmRun,
  LogEntry,
  ProcessingRun,
  Project,
  PromptGeneration,
  PromptTemplate,
  Rule,
  Ruleset,
  TermDictionaryEntry,
  TranscriptRevision,
  Utterance,
  PfDeliveryStatus,
  PfPromptGenerationStatus,
  PfNoteStatus,
  PfRevisionKind,
} from "./types";

// Tiny seeded RNG (mulberry32) for deterministic data
function mulberry32(seed: number) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rng = mulberry32(42);
const pick = <T>(arr: T[]): T => arr[Math.floor(rng() * arr.length)];
const range = (n: number) => Array.from({ length: n }, (_, i) => i);

const now = Date.now();
const minutesAgo = (m: number) => new Date(now - m * 60_000).toISOString();
const hoursAgo = (h: number) => new Date(now - h * 3600_000).toISOString();

// Stable UUID-ish generator
function uid(prefix: string, n: number) {
  return `${prefix}-${n.toString().padStart(8, "0")}`;
}

// ──────────────────────────── Projects
export const projects: Project[] = [
  { id: uid("proj", 1), name: "Voice Capture", slug: "voice-capture", description: "Mobile dictations", created_at: hoursAgo(720), updated_at: hoursAgo(2) },
  { id: uid("proj", 2), name: "CLI Pipelines", slug: "cli-pipelines", description: "Codex / Claude orchestration", created_at: hoursAgo(600), updated_at: hoursAgo(8) },
  { id: uid("proj", 3), name: "Obsidian Vault", slug: "obsidian-vault", description: "Note authoring", created_at: hoursAgo(800), updated_at: hoursAgo(1) },
];

// ──────────────────────────── Intake Notes
const noteStatuses: PfNoteStatus[] = ["new", "imported", "processing", "processed", "processed", "processed", "error", "archived"];
const devices = ["iphone-15", "mac-studio", "ipad-pro", "android-pixel-8", "obsidian-desktop"];
const voiceRouteSpecs = [
  { family: "kanban", target: "prompt-forge", status: "direct_kanban", replayable: true },
  { family: "queue", target: "manual-review", status: "queue_review", replayable: true },
  { family: "review", target: "triage", status: "queue_review", replayable: true },
  { family: "experimental", target: "voice-lab", status: "unsupported", replayable: false },
] as const;

export const intakeNotes: IntakeNote[] = range(48).map((i) => {
  const status = noteStatuses[i % noteStatuses.length];
  const project = projects[i % projects.length];
  const eligible = status !== "archived" && rng() > 0.15;
  const route = voiceRouteSpecs[i % voiceRouteSpecs.length];
  const sourcePath = `Inbox/Voice/${route.family}/${route.target}/${project.slug}/2026/04/${String(i + 1).padStart(3, "0")}-${pick(["standup", "ideas", "todo", "review", "spec", "thought"])}.md`;
  const routeRecord = {
    source_path: sourcePath,
    route_family: route.family,
    route_target: route.target,
    route_context: `${project.slug}/2026/04`,
    route_status: route.status,
    replayable: route.replayable,
    replay_state:
      route.status === "direct_kanban"
        ? "Replay keeps the same source path and workspace key."
        : route.status === "unsupported"
          ? "Not replayable until the route policy explicitly grows this family."
          : "Replay stays within queue/review unless policy changes.",
  };
  return {
    id: uid("note", i + 1),
    project_id: project.id,
    note_relative_path: sourcePath,
    status,
    watch_eligible: eligible,
    source_device: pick(devices),
    body_text: `# Voice memo ${i + 1}\n\n${pick([
      "Need to refactor the dispatcher to support priority lanes.",
      "Reminder: confirm the codex session timeout settings before deploy.",
      "Sketch out the new review queue grouping by failure class.",
      "Update the obsidian writeback to include retry counts.",
    ])}`,
    frontmatter_original: {
      destination: pick(["chat", "cli", "obsidian_note"]),
      mode: pick(["draft", "queue", "auto_dispatch"]),
      tags: ["voice", project.slug],
      promptforge_route: routeRecord,
    },
    frontmatter_current: {
      destination: pick(["chat", "cli", "obsidian_note"]),
      mode: pick(["draft", "queue", "auto_dispatch"]),
      tags: ["voice", project.slug, "processed"],
      prompt_generation_id: uid("pg", i + 1),
      delivery_id: uid("del", i + 1),
      promptforge_route: routeRecord,
      status,
    },
    metadata_json: !eligible
      ? { eligibility_reason: "watch_eligible=false", skip_cause: "missing required frontmatter: prompt_type", promptforge_route: routeRecord }
      : { eligibility_reason: "passed", source_path: sourcePath, promptforge_route: routeRecord },
    created_at: minutesAgo(15 + i * 17),
    updated_at: minutesAgo(2 + i * 13),
  };
});

// ──────────────────────────── Utterances + Revisions
export const utterances: Utterance[] = intakeNotes.map((n, i) => ({
  id: uid("utt", i + 1),
  intake_note_id: n.id,
  speaker: pick(["user", "user", "user", null]),
  index: 0,
  created_at: n.created_at,
}));

const revisionKinds: PfRevisionKind[] = [
  "raw",
  "directive_stripped",
  "deterministic_preprocessed",
  "llm_cleaned",
  "final_rendered_prompt",
];

export const transcriptRevisions: TranscriptRevision[] = utterances.flatMap((u, idx) => {
  const note = intakeNotes[idx];
  const count = note.status === "error" ? 3 : revisionKinds.length;
  return revisionKinds.slice(0, count).map((kind, k) => ({
    id: uid(`rev-${idx + 1}`, k + 1),
    utterance_id: u.id,
    revision_kind: kind,
    producer_type: kind === "raw" ? "watcher" : kind.includes("llm") ? "llm" : kind === "final_rendered_prompt" ? "renderer" : "python",
    producer_name: kind === "raw" ? "obsidian-watcher" : kind.includes("llm") ? "openai/gpt-4o-mini" : kind === "final_rendered_prompt" ? "render-engine" : "preprocess",
    content_text: kind === "raw"
      ? note.body_text
      : kind === "directive_stripped"
      ? note.body_text.replace(/^>.*$/gm, "")
      : kind === "deterministic_preprocessed"
      ? note.body_text + "\n\n<!-- normalized terms applied -->"
      : kind === "llm_cleaned"
      ? note.body_text.replace(/\s+/g, " ").trim()
      : `## Rendered Prompt\n\n${note.body_text}\n\n---\nDestination: ${note.frontmatter_current.destination}`,
    metadata_json: { stage: kind, took_ms: 40 + Math.floor(rng() * 600) },
    created_at: new Date(new Date(u.created_at).getTime() + k * 1500).toISOString(),
  }));
});

// ──────────────────────────── Rulesets / Rules
export const rulesets: Ruleset[] = [
  { id: uid("rs", 1), name: "Global cleanup", scope: "global", project_id: null, active: true, description: "Default cleanup", updated_at: hoursAgo(72) },
  { id: uid("rs", 2), name: "Voice Capture rules", scope: "project", project_id: projects[0].id, active: true, description: "Mobile dictations", updated_at: hoursAgo(12) },
  { id: uid("rs", 3), name: "CLI routing", scope: "project", project_id: projects[1].id, active: true, description: "CLI session routing", updated_at: hoursAgo(36) },
  { id: uid("rs", 4), name: "Legacy formatting", scope: "global", project_id: null, active: false, updated_at: hoursAgo(800) },
];

export const rules: Rule[] = rulesets.flatMap((rs, rsIdx) =>
  range(4).map((i) => ({
    id: uid(`rule-${rsIdx + 1}`, i + 1),
    ruleset_id: rs.id,
    name: pick(["Strip filler words", "Expand TODO acronyms", "Route to claude session", "Format code blocks", "Redact PII", "Normalize project names"]),
    rule_type: pick(["cleanup", "expansion", "routing", "formatting", "safety", "terminology"] as const),
    priority: 100 - i * 10,
    enabled: rng() > 0.2,
    pattern: "\\b(um|uh|like)\\b",
    replacement: "",
    description: "Match repeated filler words and remove them.",
    updated_at: hoursAgo(i * 4 + 1),
  })),
);

// ──────────────────────────── Term dictionary
export const termDictionary: TermDictionaryEntry[] = range(24).map((i) => ({
  id: uid("term", i + 1),
  scope: (["global", "project", "user"] as const)[i % 3],
  project_id: i % 3 === 1 ? projects[i % projects.length].id : null,
  source_term: pick(["pf", "obs", "claud", "codex", "n8n", "yaml fm", "rls"]),
  normalized_term: pick(["PromptForge", "Obsidian", "Claude", "Codex", "n8n", "YAML frontmatter", "row-level security"]),
  description: "Common abbreviation",
  created_at: hoursAgo(200 - i * 4),
  updated_at: hoursAgo(i),
}));

// ──────────────────────────── Templates
export const promptTemplates: PromptTemplate[] = [
  ...range(3).map((i) => ({
    id: uid("tmpl", i + 1),
    name: "Agent Task v1",
    prompt_type: "agent_task",
    scope: "global" as const,
    project_id: null,
    version: i + 1,
    is_active: i === 2,
    template_family_key: "agent_task_v1",
    body: `# {{title}}\n\n## Context\n{{context}}\n\n## Task\n{{task}}\n\n## Constraints\n{{constraints}}`,
    updated_at: hoursAgo(40 - i * 8),
  })),
  ...range(2).map((i) => ({
    id: uid("tmpl-cli", i + 1),
    name: "CLI Session",
    prompt_type: "cli_session",
    scope: "project" as const,
    project_id: projects[1].id,
    version: i + 1,
    is_active: i === 1,
    template_family_key: "cli_session_v1",
    body: `# CLI Session\n\nSession: {{session_id}}\nCommand: {{command}}`,
    updated_at: hoursAgo(20 - i * 5),
  })),
];

// ──────────────────────────── Delivery targets
export const deliveryTargets: DeliveryTarget[] = [
  { id: uid("tgt", 1), name: "Claude — main", target_type: "claude_session", destination: "chat", scope: "global", project_id: null, enabled: true, is_sensitive: false, requires_confirmation: false, environment: "prod", validation_status: "ok", updated_at: hoursAgo(2) },
  { id: uid("tgt", 2), name: "Codex — refactor", target_type: "codex_session", destination: "cli", scope: "project", project_id: projects[1].id, enabled: true, is_sensitive: true, requires_confirmation: true, environment: "prod", validation_status: "ok", updated_at: hoursAgo(6) },
  { id: uid("tgt", 3), name: "Obsidian inbox", target_type: "obsidian_note", destination: "obsidian_note", scope: "global", project_id: null, enabled: true, is_sensitive: false, requires_confirmation: false, environment: "prod", validation_status: "ok", updated_at: hoursAgo(1) },
  { id: uid("tgt", 4), name: "Generic queue (staging)", target_type: "generic_queue", destination: "queue_only", scope: "global", project_id: null, enabled: true, is_sensitive: false, requires_confirmation: false, environment: "staging", validation_status: "degraded", updated_at: hoursAgo(36) },
  { id: uid("tgt", 5), name: "Old chat session", target_type: "chat_session", destination: "chat", scope: "user", project_id: null, enabled: false, is_sensitive: false, requires_confirmation: false, environment: "dev", validation_status: "error", updated_at: hoursAgo(240) },
];

// ──────────────────────────── Prompt generations
const pgStatuses: PfPromptGenerationStatus[] = ["created", "preprocessed", "transforming", "structured_validating", "rendered", "rendered", "rendered", "failed"];

export const promptGenerations: PromptGeneration[] = intakeNotes.map((n, i) => {
  const status = n.status === "error" ? "failed" : pgStatuses[i % pgStatuses.length];
  const requiresReview = status === "rendered" && rng() > 0.7;
  return {
    id: uid("pg", i + 1),
    intake_note_id: n.id,
    status,
    requires_review: requiresReview,
    prompt_type: pick(["agent_task", "cli_session", "review_request"]),
    ruleset_id: rulesets[i % rulesets.length].id,
    template_id: promptTemplates[i % promptTemplates.length].id,
    destination: (n.frontmatter_current.destination as never) || "chat",
    mode: (n.frontmatter_current.mode as never) || "queue",
    priority: pick(["low", "normal", "normal", "normal", "high", "urgent"]),
    structured_output_json: {
      contract_name: "agent_task_v1",
      title: `Task ${i + 1}`,
      summary: "Auto-generated structured output",
      destination: n.frontmatter_current.destination,
      mode: n.frontmatter_current.mode,
    },
    final_prompt_markdown: `# Task ${i + 1}\n\n${n.body_text}\n\n---\nGenerated for **${n.frontmatter_current.destination}**`,
    validation_warnings: requiresReview ? ["Ambiguous destination", "Missing tag: priority"] : status === "failed" ? ["Schema validation failed: missing 'task' field"] : [],
    created_at: minutesAgo(13 + i * 13),
    updated_at: minutesAgo(1 + i * 11),
  };
});

// ──────────────────────────── Deliveries
const deliveryStatuses: PfDeliveryStatus[] = ["not_started", "queued", "dispatching", "delivered", "delivered", "delivered", "acked", "failed"];

export const deliveries: Delivery[] = promptGenerations.map((pg, i) => {
  const status: PfDeliveryStatus = pg.status === "failed" ? "not_started" : deliveryStatuses[i % deliveryStatuses.length];
  const isFail = status === "failed";
  return {
    id: uid("del", i + 1),
    prompt_generation_id: pg.id,
    target_id: deliveryTargets[i % deliveryTargets.length].id,
    status,
    destination: pg.destination,
    mode: pg.mode,
    priority: pg.priority,
    retry_count: isFail ? Math.floor(rng() * 4) : 0,
    failure_text: isFail
      ? pick([
          "Connection refused: claude session not found",
          "HTTP 502 from generic_queue endpoint after 3 retries",
          "Target marked sensitive — confirmation required",
          "Schema mismatch: missing field 'session_id'",
        ])
      : null,
    ack_text: status === "acked" ? "downstream-ack ts=" + minutesAgo(i) : null,
    created_at: minutesAgo(11 + i * 11),
    updated_at: minutesAgo(0 + i * 7),
  };
});

// Add a few extra retry deliveries for some failed ones to show history
export const deliveryHistory: Delivery[] = deliveries
  .filter((d) => d.status === "failed")
  .slice(0, 6)
  .flatMap((d, i) =>
    range(d.retry_count).map((r) => ({
      ...d,
      id: uid(`del-${i + 1}-retry`, r + 1),
      status: "failed" as PfDeliveryStatus,
      retry_count: r,
      created_at: minutesAgo(60 + r * 30),
      updated_at: minutesAgo(45 + r * 30),
    })),
  );

// ──────────────────────────── Processing runs
export const processingRuns: ProcessingRun[] = intakeNotes.flatMap((n, i) => {
  const stages = ["preprocess", "validate", "render", "prepare-delivery"];
  return stages.map((stage, s) => {
    const failed = n.status === "error" && s === stages.length - 1;
    return {
      id: uid(`run-${i + 1}`, s + 1),
      intake_note_id: n.id,
      status: failed ? "failed" : "completed",
      stage_name: stage,
      error_text: failed
        ? pick([
            "ValidationError: required field 'task' missing",
            "TimeoutError: render exceeded 30s budget",
            "RuleError: pattern compile failed at rule_id=rule-2-3",
            "TemplateError: variable {{title}} unresolved",
          ])
        : null,
      trace_json: {
        stage,
        steps: [
          { name: "load_input", ms: 5 },
          { name: "apply_rules", ms: 120 + Math.floor(rng() * 200), rules_applied: 4 },
          { name: "emit_output", ms: 8 },
        ],
        ...(failed ? { failure: { phase: "emit_output", code: "VALIDATION" } } : {}),
      },
      created_at: minutesAgo(20 + i * 13 + s * 2),
      updated_at: minutesAgo(18 + i * 13 + s * 2),
    };
  });
});

// ──────────────────────────── LLM runs
export const llmRuns: LlmRun[] = promptGenerations.slice(0, 24).map((pg, i) => ({
  id: uid("llm", i + 1),
  prompt_generation_id: pg.id,
  provider_name: pick(["openai", "anthropic", "google"]),
  model_name: pick(["gpt-4o-mini", "claude-3-5-sonnet", "gemini-1.5-pro"]),
  mode: i % 4 === 0 ? "review" : "inference",
  latency_ms: 400 + Math.floor(rng() * 4000),
  input_tokens: 200 + Math.floor(rng() * 1800),
  output_tokens: 100 + Math.floor(rng() * 1200),
  created_at: minutesAgo(i * 23),
}));

// ──────────────────────────── Logs
const logServices: LogEntry["service"][] = ["watcher", "api", "n8n", "postgres"];
const logLevels: LogEntry["level"][] = ["debug", "info", "info", "info", "warn", "error"];

export const logs: LogEntry[] = range(280).map((i) => {
  const note = intakeNotes[i % intakeNotes.length];
  const pg = promptGenerations[i % promptGenerations.length];
  const del = deliveries[i % deliveries.length];
  const level = logLevels[i % logLevels.length];
  const service = logServices[i % logServices.length];
  const isErr = level === "error";
  return {
    id: uid("log", i + 1),
    service,
    level,
    timestamp: minutesAgo(i * 2),
    message: isErr
      ? pick([
          "ValidationError: required field 'task' missing",
          "Connection refused: claude session not found",
          "HTTP 502 from generic_queue endpoint after 3 retries",
          "Pattern compile failed at rule_id=rule-2-3",
        ])
      : pick([
          "imported note " + note.note_relative_path,
          "preprocess applied 4 rules",
          "render completed in 412ms",
          "delivery queued",
          "delivery dispatched",
          "ack received",
        ]),
    intake_note_id: i % 2 === 0 ? note.id : undefined,
    utterance_id: i % 3 === 0 ? utterances[i % utterances.length].id : undefined,
    prompt_generation_id: i % 4 === 0 ? pg.id : undefined,
    delivery_id: i % 5 === 0 ? del.id : undefined,
    fields: { service, level, request_id: uid("req", i + 1) },
  };
});

// ──────────────────────────── Health
export const healthSnapshot: HealthSnapshot = {
  api: { status: "ok", latency_ms: 42, checked_at: new Date().toISOString() },
  providers: [
    { name: "openai", status: "ok", latency_ms: 220 },
    { name: "anthropic", status: "ok", latency_ms: 280 },
    { name: "google", status: "degraded", latency_ms: 1850 },
  ],
  db: { status: "ok", latency_ms: 6 },
  queue_depth: deliveries.filter((d) => ["queued", "dispatching"].includes(d.status)).length,
  failures_24h: deliveries.filter((d) => d.status === "failed").length + processingRuns.filter((r) => r.status === "failed").length,
};
