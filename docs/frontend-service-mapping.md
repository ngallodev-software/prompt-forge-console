# Frontend Service Mapping

Source of truth: `src/services/promptforge/api.ts`.

This service layer is mostly mock-data backed. Most read functions do not hit a dedicated per-resource backend endpoint; instead they call the shared hydration path used by `delay()`/`ensureHydrated()`:

- `GET /console/bootstrap` by default, or the value of `VITE_PROMPTFORGE_BOOTSTRAP_PATH`
- If `VITE_PROMPTFORGE_STRICT_BACKEND=true`, fetch failures are rethrown instead of falling back to fixtures

## Service Functions

| Service fn | Signature | Backend endpoint | Fallback behavior |
| --- | --- | --- | --- |
| `getHealth` | `getHealth(): Promise<HealthSnapshot>` | `GET /_healthz` and `GET /providers/health` | If either fetch fails, `STRICT_BACKEND` rethrows; otherwise it waits briefly and returns the in-memory `healthSnapshot` with degraded/unchanged mock values. |
| `listProjects` | `listProjects(): Promise<Project[]>` | Shared hydration via `GET /console/bootstrap` | After hydration delay, returns the in-memory `projects` array. |
| `listIntakeNotes` | `listIntakeNotes(f: IntakeFilters = {}): Promise<PageResult<IntakeNote>>` | No dedicated endpoint; uses shared hydration via `GET /console/bootstrap` | Filters, sorts, and paginates the hydrated in-memory `intakeNotes`. |
| `getIntakeNote` | `getIntakeNote(id: string): Promise<IntakeNote \| undefined>` | No dedicated endpoint; uses shared hydration via `GET /console/bootstrap` | Returns the matching note from in-memory `intakeNotes`, or `undefined` if not found. |
| `getIntakeStatusCounts` | `getIntakeStatusCounts(): Promise<{ "24h": Record<string, number>; "7d": Record<string, number>; "30d": Record<string, number> }>` | No dedicated endpoint; uses shared hydration via `GET /console/bootstrap` | Computes counts from the hydrated `intakeNotes` snapshot. |
| `listUtterancesForNote` | `listUtterancesForNote(noteId: string): Promise<Utterance[]>` | No dedicated endpoint; uses shared hydration via `GET /console/bootstrap` | Filters in-memory `utterances` by `intake_note_id`. |
| `listRevisionsForUtterance` | `listRevisionsForUtterance(utteranceId: string): Promise<TranscriptRevision[]>` | No dedicated endpoint; uses shared hydration via `GET /console/bootstrap` | Filters in-memory `transcriptRevisions` and sorts by `created_at`. |
| `getNoteLineage` | `getNoteLineage(noteId: string): Promise<{ note: IntakeNote \| undefined; utterances: Utterance[]; revisions: TranscriptRevision[]; promptGenerations: PromptGeneration[]; deliveries: Delivery[]; processingRuns: ProcessingRun[] }>` | No dedicated endpoint; uses shared hydration via `GET /console/bootstrap` | Builds a composite lineage object from hydrated in-memory arrays. |
| `listPromptGenerations` | `listPromptGenerations(f: PromptFilters = {}): Promise<PageResult<PromptGeneration>>` | No dedicated endpoint; uses shared hydration via `GET /console/bootstrap` | Filters, sorts, and paginates the in-memory `promptGenerations`. |
| `getPromptGeneration` | `getPromptGeneration(id: string): Promise<PromptGeneration \| undefined>` | No dedicated endpoint; uses shared hydration via `GET /console/bootstrap` | Returns the matching prompt generation from in-memory data, or `undefined`. |
| `getLatestPromptForNote` | `getLatestPromptForNote(noteId: string): Promise<PromptGeneration \| undefined>` | No dedicated endpoint; uses shared hydration via `GET /console/bootstrap` | Returns the first matching prompt generation for the note from in-memory data. |
| `listDeliveries` | `listDeliveries(f: DeliveryFilters = {}): Promise<PageResult<Delivery & { retry_candidate: boolean }>>` | No dedicated endpoint; uses shared hydration via `GET /console/bootstrap` | Enriches deliveries with `retry_candidate`, then filters, sorts, and paginates the hydrated in-memory array. |
| `getDelivery` | `getDelivery(id: string): Promise<Delivery \| undefined>` | No dedicated endpoint; uses shared hydration via `GET /console/bootstrap` | Returns the matching delivery from hydrated in-memory data, or `undefined`. |
| `getDeliveryHistory` | `getDeliveryHistory(id: string): Promise<Delivery[]>` | No dedicated endpoint; uses shared hydration via `GET /console/bootstrap` | Returns the base delivery plus any matching rows from in-memory `deliveryHistory`; returns `[]` if the base delivery is missing. |
| `getQueueDepth` | `getQueueDepth(): Promise<{ priority: string; destination: string; queued_count: number }[]>` | No dedicated endpoint; uses shared hydration via `GET /console/bootstrap` | Groups hydrated in-memory deliveries by priority and destination. |
| `listProcessingRunsForNote` | `listProcessingRunsForNote(noteId: string): Promise<ProcessingRun[]>` | No dedicated endpoint; uses shared hydration via `GET /console/bootstrap` | Filters hydrated in-memory `processingRuns` by note. |
| `listFailedProcessingRuns` | `listFailedProcessingRuns(): Promise<ProcessingRun[]>` | No dedicated endpoint; uses shared hydration via `GET /console/bootstrap` | Returns hydrated in-memory processing runs whose status is `failed`. |
| `getLlmRunAggregate` | `getLlmRunAggregate(): Promise<{ provider: string; model: string; runs: number; avg_latency_ms: number; max_latency_ms: number; input_tokens: number; output_tokens: number }[]>` | No dedicated endpoint; uses shared hydration via `GET /console/bootstrap` | Aggregates hydrated in-memory `llmRuns` by provider/model. |
| `listRulesets` | `listRulesets(scope?: PfScope, projectId?: string): Promise<Ruleset[]>` | No dedicated endpoint; uses shared hydration via `GET /console/bootstrap` | Returns active in-memory rulesets, optionally filtered by scope and project. |
| `listRules` | `listRules(rulesetId: string): Promise<Rule[]>` | No dedicated endpoint; uses shared hydration via `GET /console/bootstrap` | Filters hydrated in-memory `rules` by `ruleset_id` and sorts by priority. |
| `listTerms` | `listTerms(f: TermFilters = {}): Promise<PageResult<TermDictionaryEntry>>` | No dedicated endpoint; uses shared hydration via `GET /console/bootstrap` | Filters, sorts, and paginates hydrated in-memory dictionary terms. |
| `listTemplates` | `listTemplates(f: TemplateFilters = {}): Promise<PageResult<PromptTemplate>>` | No dedicated endpoint; uses shared hydration via `GET /console/bootstrap` | Filters, sorts, and paginates hydrated in-memory templates. |
| `listTargets` | `listTargets(type?: PfTargetType): Promise<DeliveryTarget[]>` | No dedicated endpoint; uses shared hydration via `GET /console/bootstrap` | Returns hydrated in-memory delivery targets, optionally filtered by `target_type`. |
| `listLogs` | `listLogs(f: LogFilters = {}): Promise<PageResult<LogEntry>>` | No dedicated endpoint; uses shared hydration via `GET /console/bootstrap` | Filters hydrated in-memory logs, sorts by timestamp, and paginates with a default page size of `200`. |
| `getErrorFingerprints` | `getErrorFingerprints(limit = 10): Promise<{ fingerprint: string; error_text: string; count: number; last_seen_at: string }[]>` | No dedicated endpoint; uses shared hydration via `GET /console/bootstrap` | Builds fingerprints from hydrated in-memory processing-run errors and returns the top `limit` rows. |
| `getSlaSummary` | `getSlaSummary(): Promise<{ intake_note_id: string; note_relative_path: string; imported_at: string; terminal_status: string \| null; terminal_at: string \| null; latency_ms: number \| null }[]>` | No dedicated endpoint; uses shared hydration via `GET /console/bootstrap` | Computes SLA rows from hydrated in-memory intake notes, prompt generations, and deliveries. |
| `getProjectThroughput` | `getProjectThroughput(): Promise<{ project_id: string; project_name: string; notes: number; prompts: number; deliveries: number; failed_deliveries: number; failed_processing: number }[]>` | No dedicated endpoint; uses shared hydration via `GET /console/bootstrap` | Computes throughput metrics from hydrated in-memory project, note, prompt, delivery, and processing data. |
| `retryDelivery` | `retryDelivery(id: string): Promise<{ ok: boolean; id: string; message: string }>` | `POST /console/deliveries/{id}/retry` | On backend error, `STRICT_BACKEND` rethrows; otherwise it waits briefly and returns `{ ok: true, id, message: "Retry queued" }`. |
| `rerouteDelivery` | `rerouteDelivery(id: string, targetId: string): Promise<{ ok: boolean; id: string; targetId: string }>` | `POST /console/deliveries/{id}/reroute` | On backend error, `STRICT_BACKEND` rethrows; otherwise it waits briefly and returns `{ ok: true, id, targetId }`. |
| `updateDeliveryStatus` | `updateDeliveryStatus(id: string, status: PfDeliveryStatus): Promise<{ ok: boolean; id: string; status: PfDeliveryStatus }>` | `PATCH /console/deliveries/{id}/status` | On backend error, `STRICT_BACKEND` rethrows; otherwise it waits briefly and returns `{ ok: true, id, status }`. |
| `updateRule` | `updateRule(id: string, patch: Partial<Pick<Rule, "enabled" \| "priority">>): Promise<{ ok: boolean; id: string } & Partial<Pick<Rule, "enabled" \| "priority">>>` | `PATCH /console/rules/{id}` | On backend error, `STRICT_BACKEND` rethrows; otherwise it mutates the hydrated in-memory rule row, waits briefly, and returns `{ ok: true, id, ...patch }`. |
| `upsertTerm` | `upsertTerm(payload: Partial<TermDictionaryEntry>): Promise<{ ok: boolean; payload: Partial<TermDictionaryEntry> \| undefined }>` | `POST /console/dictionary/upsert` | On backend error, `STRICT_BACKEND` rethrows; otherwise it waits briefly and returns the submitted payload. |
| `activateTemplate` | `activateTemplate(id: string, family: string): Promise<{ ok: boolean; id: string; family: string }>` | `POST /console/templates/{id}/activate` | On backend error, `STRICT_BACKEND` rethrows; otherwise it waits briefly and returns `{ ok: true, id, family }`. |
| `forceReview` | `forceReview(id: string): Promise<{ ok: boolean; id: string }>` | `POST /console/prompts/{id}/force-review` | On backend error, `STRICT_BACKEND` rethrows; otherwise it waits briefly and returns `{ ok: true, id }`. |
| `clonePrompt` | `clonePrompt(id: string): Promise<{ ok: boolean; id: string; newId: string }>` | `POST /console/prompts/{id}/clone` | On backend error, `STRICT_BACKEND` rethrows; otherwise it waits briefly and returns a synthetic clone id (`${id}-clone`). |
| `changePromptPriority` | `changePromptPriority(id: string, priority: string): Promise<{ ok: boolean; id: string; priority: string }>` | `PATCH /console/prompts/{id}/priority` | On backend error, `STRICT_BACKEND` rethrows; otherwise it waits briefly and echoes the new priority. |
| `archiveNote` | `archiveNote(id: string): Promise<{ ok: boolean; id: string }>` | `PATCH /console/intake/{id}/archive` | On backend error, `STRICT_BACKEND` rethrows; otherwise it waits briefly and returns `{ ok: true, id }`. |

## Query Key Shapes

`qk` is the exported cache-key factory in `src/services/promptforge/api.ts`.

| Query key | Shape |
| --- | --- |
| `qk.health` | `["pf", "health"]` |
| `qk.projects` | `["pf", "projects"]` |
| `qk.intakeList(params)` | `["pf", "intake", "list", params]` |
| `qk.intake(id)` | `["pf", "intake", id]` |
| `qk.intakeStatusCounts` | `["pf", "intake", "statusCounts"]` |
| `qk.utterancesByNote(id)` | `["pf", "utterances", "note", id]` |
| `qk.revisionsByUtterance(id)` | `["pf", "revisions", "utterance", id]` |
| `qk.promptList(params)` | `["pf", "prompts", "list", params]` |
| `qk.prompt(id)` | `["pf", "prompts", id]` |
| `qk.promptByNote(id)` | `["pf", "prompts", "note", id]` |
| `qk.reviewList` | `["pf", "review", "list"]` |
| `qk.deliveriesList(params)` | `["pf", "deliveries", "list", params]` |
| `qk.delivery(id)` | `["pf", "deliveries", id]` |
| `qk.deliveryByPrompt(id)` | `["pf", "deliveries", "prompt", id]` |
| `qk.deliveryHistory(id)` | `["pf", "deliveries", "history", id]` |
| `qk.queueDepth` | `["pf", "deliveries", "queueDepth"]` |
| `qk.processingByNote(id)` | `["pf", "processing", "note", id]` |
| `qk.processingFailed` | `["pf", "processing", "failed"]` |
| `qk.rulesets(scope?, projectId?)` | `["pf", "rulesets", scope, projectId]` |
| `qk.rulesByRuleset(id)` | `["pf", "rules", "ruleset", id]` |
| `qk.termDict(params)` | `["pf", "dict", "list", params]` |
| `qk.templates(params)` | `["pf", "templates", "list", params]` |
| `qk.targets(type?)` | `["pf", "targets", type]` |
| `qk.logsList(params)` | `["pf", "logs", "list", params]` |
| `qk.errorFingerprints` | `["pf", "logs", "fingerprints"]` |
| `qk.llmRunsAgg` | `["pf", "llm", "agg"]` |
| `qk.slaSummary` | `["pf", "sla"]` |
| `qk.projectThroughput` | `["pf", "throughput"]` |
