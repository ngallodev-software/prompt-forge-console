# Backend Gap Closure Plan

You are working in the frontend repo at `this repository`.

Goal
- Close the backend and database gaps that still force the console to rely on bootstrap hydration, mock fallbacks, or local-only draft flows.
- Replace silent mock behavior with real backend persistence wherever the frontend already implies a real contract.
- Keep the frontend contract stable while backend support lands.

Primary sources for the current contract
- `src/services/promptforge/api.ts`
- `src/services/promptforge/types.ts`
- `docs/frontend-service-mapping.md`
- `docs/required-endpoints.json`

Current state summary
- Most read surfaces still hydrate from `GET /console/bootstrap` and then operate on in-memory arrays.
- Several write surfaces exist only as mock fallbacks or local-memory mutations.
- Some pages already show explicit warnings that the backend contract is missing.
- Delivery targets exist as inventory, but live dispatch to running Codex or Claude sessions is not implemented.
- Settings now distinguishes frontend-local preferences from backend-managed values, but there is no backend settings API yet.

What is currently mocked, local-only, or incomplete

1. Read paths
- Dashboard data is mostly computed from bootstrap-supplied in-memory collections.
- Intake, prompt, delivery, rules, dictionary, template, target, log, SLA, throughput, and lineage views all depend on bootstrap data unless a dedicated endpoint responds successfully.
- Health still depends on `/ _healthz` and `/providers/health`, with fallback behavior in non-strict mode.
- Error fingerprints and several aggregate cards are computed from hydrated in-memory data when the backend is absent.

2. Write paths
- `retryDelivery`, `rerouteDelivery`, `updateDeliveryStatus` use backend calls but still fall back to mock behavior when the backend is unavailable.
- `updateRule` only persists `enabled` and `priority`.
- `upsertTerm` falls back to in-memory mutation when the backend is unavailable.
- `activateTemplate` exists, but create/edit flow is still local-only in the UI and needs the corresponding backend persistence contract.
- `forceReview`, `clonePrompt`, `changePromptPriority`, and `archiveNote` are still only partially backed.
- Template creation/editing currently uses `upsertTemplateLocal`, which is explicitly local-memory only.

3. Missing backend capabilities implied by the UI
- Rules creation and rules dry-run are not implemented.
- Template create/update persistence is not implemented.
- Delivery targets are inventory-only and do not dispatch into live sessions.
- Live Codex and Claude session delivery needs a session registry, dispatch adapter, and delivery history persistence.
- Settings persistence for backend-managed values is missing.

Implementation order

Phase 1. Make the backend contract explicit
- Inventory every endpoint the frontend already expects and decide whether it is:
  - already implemented
  - needs schema support
  - needs a new route
  - should return a clear unsupported error
- Remove any backend behavior that silently returns success for unsupported work.
- Preserve backward compatibility for already-working read routes.

Phase 2. Add persistence for missing state
- Add or finish database tables or equivalent persistence models for:
  - delivery attempts and delivery history
  - delivery target registry and validation state
  - live session registry for target dispatch
  - rule versioning and edits
  - template versioning and activation state
  - term dictionary upsert history
  - prompt moderation / review actions
  - intake archive state
  - settings storage for backend-managed non-secret values
  - secret references or secret metadata if backend settings need it
  - log indexing and error fingerprint aggregation
  - queue / processing history

Phase 3. Finish the read APIs
- Back the console read surfaces with real routes or real database queries instead of snapshot-only hydration.
- Keep bootstrap as the initial hydration path, but let dedicated routes override local snapshot behavior.
- Required read endpoints and data shape:
  - `GET /console/bootstrap`
  - `GET /console/intake`
  - `GET /console/intake/:id`
  - `GET /console/lineage/:id`
  - `GET /console/prompts`
  - `GET /console/deliveries`
  - `GET /console/deliveries/:id`
  - `GET /console/rulesets`
  - `GET /console/rules`
  - `GET /console/dictionary`
  - `GET /console/templates`
  - `GET /console/targets`
  - `GET /console/logs`
  - `GET /console/metrics/error-fingerprints`
  - `GET /console/processing/failed`
  - `GET /console/health`
  - `GET /_healthz`
  - `GET /providers/health`
- Keep pagination, filtering, and sort semantics stable across these routes.

Phase 4. Finish the write APIs
- Implement or harden the current mutation paths so they persist real backend state.
- Required write endpoints:
  - `POST /console/deliveries/:id/retry`
  - `POST /console/deliveries/:id/reroute`
  - `PATCH /console/deliveries/:id/status`
  - `PATCH /console/rules/:id`
  - `POST /console/dictionary/upsert`
  - `POST /console/templates/:id/activate`
  - `POST /console/prompts/:id/force-review`
  - `POST /console/prompts/:id/clone`
  - `PATCH /console/prompts/:id/priority`
  - `PATCH /console/intake/:id/archive`
  - `POST /console/templates`
  - `PATCH /console/templates/:id`
  - `POST /console/rules`
  - rules dry-run endpoint, if the UI should continue exposing the sandbox
  - settings read/write endpoints for backend-managed settings
  - target dispatch endpoint for real live-session delivery

Phase 5. Delivery target execution
- Turn delivery targets into real executable targets instead of inventory-only rows.
- Support target types:
  - `claude_session`
  - `codex_session`
  - `chat_session`
  - `obsidian_note`
  - `generic_queue`
- Implement target validation and health:
  - `ok`
  - `degraded`
  - `unknown`
  - `error`
- For live session delivery:
  - require a stable session identifier
  - report accepted vs rejected dispatch
  - persist every attempt
  - fail explicitly when the session is missing, dead, detached, or busy
- Keep adapters separate for Codex and Claude if the transport differs.

Phase 6. Settings backend support
- Add backend persistence only for values that are truly server-owned.
- Keep frontend-local preferences in the browser store.
- Suggested backend-owned settings:
  - environment/runtime flags
  - backend paths
  - provider base URLs
  - secret references
  - worker runtime config
- Keep operator-facing read/write semantics explicit:
  - secrets should never be echoed back in plaintext
  - secret-bearing values should be write-only or redacted
  - admin-only edits stay behind authorization checks

Phase 7. Observability and error policy
- Make unsupported work fail clearly.
- Add or keep structured error types for:
  - backend unavailable
  - not found
  - validation
  - strict mode / no fallback
  - unsupported target or action
- Ensure logs and audit events capture:
  - actor
  - route
  - entity id
  - before / after values where safe
  - timestamps
  - failure text

Gap matrix by frontend area

1. Dashboard
- Current behavior: mostly computed from bootstrap data.
- Backend work:
  - make throughput and SLA queries real
  - add queue depth and failure counts as first-class summaries
  - keep bootstrap snapshot consistent with the real aggregates

2. Health
- Current behavior: probes are fetched directly and may fall back.
- Backend work:
  - return real API, database, and provider health
  - keep latency, availability, and checked-at fields accurate
  - distinguish degraded from down

3. Intake and Intake Detail
- Current behavior: list/detail/archive are partly bootstrap-backed.
- Backend work:
  - real paginated intake query
  - note detail lookup
  - eligibility and skip reason fields
  - archive mutation
  - lineage lookup by note id

4. Pipeline
- Current behavior: lineage is built from bootstrap data and diagnostics are inferred.
- Backend work:
  - real lineage endpoint
  - reliable utterance, revision, prompt, delivery, and processing-run joins
  - expose missing-stage and orphan-link information if the backend can compute it

5. Prompts
- Current behavior: list/detail exist, but force-review, clone, and priority mutations need durable backend support.
- Backend work:
  - persist prompt generation mutations
  - preserve validation warnings and structured output
  - clone should create a real new prompt row, not a synthetic id

6. Deliveries
- Current behavior: retry/reroute/status mutations may fall back to mock behavior.
- Backend work:
  - persist retry history
  - support reroute to a real target
  - update status with audit trail
  - expose delivery history for lineage and review pages

7. Review
- Current behavior: groups failed rows from prompt/delivery/run data.
- Backend work:
  - make review queues queryable from real persistence
  - add explicit review/attention states if the UI should move beyond read-only grouping

8. Rules
- Current behavior: read paths work from snapshot data, but create and dry-run are missing and only precedence edit is writable.
- Backend work:
  - persist rule creation
  - persist rule updates beyond enabled/priority if the UI keeps exposing those fields
  - add dry-run endpoint or explicitly remove the sandbox from the UI
  - keep precedence ordering consistent

9. Dictionary
- Current behavior: upsert exists only as mock fallback when the backend is absent.
- Backend work:
  - persist dictionary entries
  - support scoped upserts
  - support search/filter by scope and project
  - add import history if bulk import matters

10. Templates
- Current behavior: create/edit is local-memory only; activation exists as a mutation contract but not all editing flows are persisted.
- Backend work:
  - persist template create/update
  - preserve family key and versioning
  - support activation with correct scope isolation
  - ensure only one active template per family/scope/project as intended

11. Targets
- Current behavior: inventory only.
- Backend work:
  - persist target registry
  - validate health and enabled state
  - support executable dispatch
  - support live Codex and Claude session targets
  - keep queue and note write-back targets explicit

12. Logs and metrics
- Current behavior: log stream and fingerprints are aggregate views over bootstrap data.
- Backend work:
  - persist structured logs
  - index by service, level, note, prompt, delivery
  - compute fingerprints in backend rather than only client-side

13. Settings
- Current behavior: frontend-local preferences are real; backend settings are still read-only.
- Backend work:
  - add settings persistence for server-owned config
  - keep browser-only preferences out of the backend
  - define redaction rules for secrets and deployment-specific values

Data model / migration plan
- Add migrations or equivalent schema updates for:
  - `delivery_targets`
  - `delivery_attempts`
  - `delivery_history`
  - `session_registry`
  - `template_versions`
  - `rules`
  - `rule_sets`
  - `dictionary_terms`
  - `settings`
  - `settings_secrets` or secret metadata references
  - `logs`
  - `error_fingerprints`
  - `processing_runs`
  - `review_queue` or derived view
- Keep ids stable and human-debuggable where possible.
- Preserve foreign keys from prompt generations to intake notes, templates, rulesets, and deliveries.

Validation and permission rules
- Read endpoints:
  - available to the same roles as the current console expects
  - no secret leakage
- Write endpoints:
  - enforce role checks consistently
  - return validation errors for bad payloads
  - return explicit unsupported errors for unimplemented actions
- Session dispatch:
  - reject missing or detached sessions
  - reject busy sessions if the transport cannot queue safely
  - record the actual transport result

Test coverage
- Add tests for:
  - bootstrap payload shape
  - pagination and filtering for each list endpoint
  - delivery retry/reroute/status
  - rule update and create behavior
  - template create/update/activate behavior
  - dictionary upsert
  - prompt force-review / clone / priority change
  - intake archive
  - target validation and live-session dispatch
  - health and provider probes
  - unsupported action failures
  - settings read/write and secret redaction

Acceptance criteria
- The console no longer needs mock fallback for core read paths in normal hosted usage.
- Real data exists for:
  - intake
  - prompt generations
  - deliveries
  - rules
  - dictionary
  - templates
  - targets
  - logs
  - health and metrics
- Live dispatch to Codex and Claude sessions is a real backend capability, not a pretend inventory row.
- Unsupported features fail loudly and predictably.
- Database state survives reloads and supports audit/debug traceability.

Rollout notes
- Keep bootstrap support during migration so the frontend can hydrate while dedicated routes are added.
- Introduce feature-by-feature, not all at once.
- Prefer explicit unsupported errors over silent mock fallback once a route is meant to be real.
- Leave frontend-local settings in the browser store unless there is a clear server-side owner.

Repository handoff note
- This plan is for the backend repo at `the Prompt Forge backend repository`.
- Do not redesign the frontend in the backend implementation step.
- Preserve existing frontend query key shapes and response field names where possible.
