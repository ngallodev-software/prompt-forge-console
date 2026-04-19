
# PromptForge Operator Console — Build Plan

A production-grade internal operations frontend for PromptForge. Mock data only via a typed service layer (easy to wire to your real API/Postgres later), dev-only role switcher, all 14 routes scaffolded, GitHub/Sentry hybrid aesthetic.

## Foundation

**Design system** — light default + strong dark mode, restrained palette with status-forward color tokens (success/warn/danger/info/neutral), inline-diff friendly surfaces, monospace for IDs/paths/JSON, dense-but-readable tables. All colors as HSL tokens in `index.css`; semantic Tailwind tokens (`status-success`, `status-warn`, `status-danger`, `surface-raised`, `surface-sunken`, `border-subtle`, etc.). Theme toggle persisted.

**App shell** — left nav (collapsible, mobile drawer), top bar with global search/command palette (⌘K), environment badge, workspace/scope switcher (global/user/project), role switcher (viewer/operator/admin), theme toggle, global health strip. Two/three-pane layouts on desktop, stacked sheets on mobile. URL-driven filters and tab state.

**Typed service layer** — `src/services/promptforge/` with one module per entity (intakeNotes, utterances, transcriptRevisions, promptGenerations, deliveries, processingRuns, llmRuns, rulesets, rules, termDictionary, promptTemplates, deliveryTargets, projects, health, logs). Each module exports typed query/mutation functions backed by mock factories now, swappable for real fetch calls later. TanStack Query keys structured per entity for predictable invalidation. Zod schemas mirror the enums and contracts (`pf_scope`, `pf_note_status`, `pf_revision_kind`, `pf_destination`, `pf_target_type`, `pf_delivery_mode`, `pf_delivery_status`, `pf_processing_status`, `pf_priority`, `pf_rule_type`, `pf_prompt_generation_status`, `pf_producer_type`, `pf_llm_run_mode`).

**Mock data** — realistic factories producing correlated records across the lineage chain (intake_note → utterance → transcript_revisions → prompt_generation → deliveries → processing_runs), with believable failures, retry candidates, review-required items, recurring error fingerprints, and end-to-end SLA latencies. Seed deterministic so the dashboard always shows interesting state.

## Shared components

`DataTable` (server-style pagination, sort, column visibility, row actions, sticky header), `TimelineTrace`, `JsonViewer` (collapsible, copy, search), `MarkdownPreview`, `DiffViewer` (revision-to-revision), `QueryInspector` (debug overlay showing the catalog query name + params behind each list), `StatusBadge`, `PriorityBadge`, `ScopeBadge`, `EnvironmentBadge`, `WorkspaceSwitcher`, `HealthCard`, `MetricCard`, `NeedsAttentionPanel`, `RelatedArtifactsPanel`, `RootCausePanel`, `RulePrecedenceVisualizer`, `FrontmatterCompare`, `LogStream` (virtualized), `ActionDrawer`, `ConfirmationModal`, `RetryActionMenu`, `ExportMenu`, `EmptyState`, `ErrorState`, `LoadingState`, `PermissionGuard`, `DangerZoneCard`. Route-level error boundaries.

## Routes

1. **`/dashboard`** — health cards (API, providers, DB proxy, queue depth, 24h failures), throughput charts (imported / rendered / delivered / failed), needs-attention panels (review, failed deliveries, failed runs, stuck notes), quick actions, recent activity feed with correlation IDs, SLA/latency summary.

2. **`/intake`** — server-paginated table (Q1) with split detail preview, filters (status, project, watch_eligible, source_device, date), full-text search, eligibility/skip badges, frontmatter-original-vs-current compare, role-gated bulk actions.

3. **`/intake/:id`** — full note detail: metadata, raw + parsed body, original vs processed frontmatter, linked utterances, latest transcript revision, latest prompt generation, latest delivery, related processing runs, eligibility reasoning, action drawer, export trace bundle.

4. **`/pipeline/:intakeNoteId`** — diagnostics centerpiece. Lineage strip + timeline (Q7, Q8), per-stage cards with producer/timestamps/warnings/errors/`metadata_json`/`trace_json`, adjacent-revision diff viewer (Q9), JSON inspector, root-cause summary, related artifacts dock, contextual retry actions.

5. **`/prompts`** — table (Q10) with tabs per row: overview, render output (markdown), structured output (JSON), lineage, validation. Actions: force review, clone, requeue, reroute, change priority.

6. **`/deliveries`** — table with retry-candidate flag (Q5), queue depth widget (Q6), detail drawer with status history, ack/failure fingerprint, retry/requeue/reroute, safety/destination readiness indicators.

7. **`/review`** — unified queue (requires_review + failed generations + failed deliveries + failed runs Q3/Q4/Q5) with class tabs, severity sort, root-cause panel, side-by-side related artifacts, operator decision panel (approve/resolve/retry/reroute/escalate), explainability panel.

8. **`/rules`** — CRUD on rulesets/rules (Q13) with scope-aware editing, drag-priority ordering, `RulePrecedenceVisualizer`, enable toggles, dry-run sandbox calling preprocess/validate/render/prepare-delivery, change-history placeholder.

9. **`/dictionary`** — CRUD on `term_dictionary` (Q14), scope/project filters, JSON/CSV import-export, normalization preview, impact hints.

10. **`/templates`** — list (Q15) with version history, active toggle with safe activation flow (M5 transactional pattern), prompt_type filter, rendered preview, dependency hints.

11. **`/targets`** — CRUD on `delivery_targets` (Q16), safety flags, environment scoping, validation status, test/health affordances, dangerous-target warnings.

12. **`/logs`** — service tabs (watcher/api/n8n/postgres), filter builder with correlation IDs (intake_note_id/utterance_id/prompt_generation_id/delivery_id), saveable presets, virtualized stream, structured + raw JSON view, jump-to-artifact, error fingerprinting (Q19).

13. **`/settings`** — environment config (redacted secrets), watch/processing folders, webhook toggles, LLM provider mode, feature flags, role/permission matrix, polling preferences, audit history placeholder, danger zone.

14. **`/health`** — API + provider summaries, dependency matrix, status history mini-timeline, probe details, degraded-mode banner, links to affected dashboards.

## Mutations

All mutations (M1 update delivery status, M2 retry/requeue, M3 update rule, M4 upsert dictionary term, M5 toggle template active version + reroute/change priority/force review/clone/archive/export) routed through the typed service layer with Zod-validated payloads, confirmation modals for destructive ops, role checks via `PermissionGuard`, optimistic updates only where rollback is reliable, and predictable query invalidation.

## Safety, accessibility, performance

Non-destructive defaults, dry-run on risky edits, secrets redaction in UI/logs/exports, semantic HTML with ARIA labels, visible focus states, full keyboard nav (including ⌘K launcher), AA contrast in both themes, mobile-first stacked views with no desktop-only critical paths, virtualized lists/logs, debounced search, server-paginated tables, URL-synced filters.

## Documentation in-app

A `/settings → Query Catalog` panel listing all 20 named queries (Q1–Q20) with parameters and which page consumes them — makes the future backend wiring trivial.

## Delivery sequence

1. Foundation: design tokens, theme, app shell, role switcher, routing, service layer skeleton, mock factories, shared primitives.
2. Diagnostics core: Dashboard, Intake (+detail), Pipeline trace, Review, Deliveries, Prompts.
3. Admin surfaces: Rules, Dictionary, Templates, Targets.
4. Operations: Logs, Health, Settings + Query Catalog panel.
5. Polish: empty/error/loading states audit, keyboard nav pass, mobile pass, accessibility pass.
