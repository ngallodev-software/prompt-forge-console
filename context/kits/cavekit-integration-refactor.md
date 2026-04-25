---
created: "2026-04-24T23:00:00Z"
last_edited: "2026-04-24T23:00:00Z"
---

# Cavekit: Integration Refactor

## Scope
Verifies and unifies the existing Kanban integration boundary in `prompt-forge-console`. Three behaviors that already shipped in prior commits — input-debounced workspace discovery, sanitized error rendering at the UI boundary, and corrected route-status tone mapping — are pinned here as testable invariants so they cannot regress. One outstanding unification — the Kanban workspace discovery boundary — is captured as a single shared discovery surface consumed by the Settings Integrations tab, the Prompts page, and any future console surface that needs to discover Kanban workspaces. This kit does not introduce new integration features; it freezes the current correct behavior and forbids duplicate discovery implementations.

## Requirements

### R1: Single workspace discovery boundary
**Description:** The console exposes exactly one workspace discovery boundary that takes a base URL and a passcode and returns the list of discoverable Kanban workspaces. Every console surface that needs to discover Kanban workspaces consumes this single boundary. Inline reimplementation of the discovery query (defining a parallel debounce, a parallel query key, or a parallel fetcher) in any page or component is forbidden.
**Acceptance Criteria:**
- [ ] Exactly one module under `src/lib/` defines the workspace discovery boundary (the function that issues the discovery request, the query key, and the debounced-input contract).
- [ ] The discovery boundary's query key is namespaced under a single stable identifier (the existing `qk.kanbanWorkspaces(baseUrl, passcode)` shape) so identical inputs across consumers share the same cache entry.
- [ ] The Settings Integrations surface consumes the discovery boundary and contains no parallel implementation of the discovery fetch, the discovery debounce, or the discovery query key.
- [ ] The Prompts page consumes the same discovery boundary when it needs to render or select a Kanban workspace and contains no parallel implementation of the discovery fetch, the discovery debounce, or the discovery query key.
- [ ] No file under `src/pages/` other than the canonical mount points listed above issues a request to the Kanban workspace discovery endpoint inline.
- [ ] No file under `src/pages/` defines its own debounce timer that gates the discovery request; the debounce contract lives with the boundary or with the shared component that wraps it.
- [ ] A grep across `src/` for the Kanban discovery endpoint path and for the discovery fetcher symbol returns matches only in the boundary module, in `KanbanIntegrationPanel`, in any future consumer that imports the boundary, and in the boundary's own callers list — never as a duplicated inline fetch.
**Dependencies:** `cavekit-component-extraction.md` (R3, R4 — `KanbanIntegrationPanel` is the wrapper component that mounts the discovery boundary in the Settings Integrations tab and is the mount point reused by the Prompts page when workspace selection is needed)

### R2: Discovery waits for input idle before firing
**Description:** Workspace discovery does not fire on every keystroke into the base URL or passcode inputs. The discovery request fires only after the relevant inputs have been idle for at least 500 milliseconds since the last change. While inputs are still changing within that idle window, no discovery request is in flight for the in-progress values.
**Acceptance Criteria:**
- [ ] The idle threshold that gates discovery is exactly 500 milliseconds, defined as a single named constant (or single literal in a single file) so the threshold cannot diverge across consumers.
- [ ] When the base URL input changes, no discovery request is issued for the new value until at least 500 ms have elapsed without a further change to either the base URL or the passcode.
- [ ] When the passcode input changes, the same 500 ms idle gate applies before a discovery request is issued for the new value.
- [ ] When the debounced base URL is the empty string, no discovery request is issued regardless of the passcode value.
- [ ] An automated test that simulates four input changes within a 200 ms window observes at most one discovery request issued after the input stream settles (not four).
- [ ] The 500 ms idle gate is documented in a comment or named constant adjacent to the boundary so a future reader can identify it without reading downstream consumers.
**Dependencies:** R1 (the idle gate lives with the single discovery boundary)

### R3: Errors render through the sanitization boundary
**Description:** Every UI surface that renders an error from the Kanban integration (discovery error, preview error, apply error, settings persistence error sourced from the Kanban client) renders the error through the existing `sanitizeErrorMessage` boundary. Raw stack traces, raw network error toString output, file path fragments, line:column tuples, and the user's passcode never appear in any rendered error string in the DOM.
**Acceptance Criteria:**
- [ ] A single sanitization boundary exists in `src/lib/error-utils.ts` exporting `sanitizeErrorMessage(error: unknown): string`.
- [ ] Every `<p>`, `<span>`, toast body, or other text region that renders a Kanban-sourced error in `src/pages/` and `src/components/` passes the error through `sanitizeErrorMessage` before rendering.
- [ ] No rendered Kanban error string contains the substring `at ` followed by a file path and a line:column tuple.
- [ ] No rendered Kanban error string contains a `.tsx` or `.ts` file path fragment.
- [ ] No rendered Kanban error string contains the literal substring of the user's passcode (verified by an automated test that submits a known passcode, forces a discovery error, and asserts the passcode literal is not present in the DOM).
- [ ] The sanitization boundary maps the `kanban_transport_error:ConnectError` pattern to a user-facing string that mentions the base URL and Kanban running, with no transport-error code visible.
- [ ] When the input to `sanitizeErrorMessage` is null or undefined, the function returns a stable fallback string (`"An unknown error occurred."`) rather than rendering an empty error region or the literal `"undefined"`.
- [ ] When the input is a non-Error value (string, plain object), the function returns a stable fallback string (`"An unexpected error occurred."`) rather than rendering the raw value.
**Dependencies:** `cavekit-component-extraction.md` (R3 — `KanbanIntegrationPanel` renders its discovery error through this boundary)

### R4: Route status tone maps unavailable to danger
**Description:** The route status badge's tone derives from a fixed mapping: `direct_kanban` resolves to the `success` tone, `queue_review` resolves to the `warn` tone, and any other route status (including `unavailable`) resolves to the `danger` tone. The previous incorrect mapping that resolved `unavailable` to the `warn` tone is no longer present.
**Acceptance Criteria:**
- [ ] The mapping `direct_kanban -> success`, `queue_review -> warn`, default -> `danger` is the only mapping used by any route status badge in the console.
- [ ] No file in `src/pages/` or `src/components/` maps the `unavailable` route status to the `warn` tone or to the `success` tone.
- [ ] The mapping renders identically in every reuse target of the route status badge (the `IntakeDetail` route preview header, the Pipeline trace detail route preview header, and the Logs route preview header when present).
- [ ] The `success` tone resolves to the `status-green` token, the `warn` tone resolves to the `status-orange` token, and the `danger` tone resolves to the `status-red` token, as defined in the Visual Foundation status palette.
- [ ] An automated test that renders the route status badge with `routeStatus="unavailable"` observes the `danger` tone in the rendered output (and not `warn` or `success`).
- [ ] The tone mapping is defined in a single location reused across all consumers (no parallel ternary that re-derives the mapping inline in more than one file).
**Dependencies:** `cavekit-visual-foundation.md` (R4 status palette — `status-green`, `status-orange`, `status-red`), `cavekit-component-extraction.md` (R1 `RoutePreview` consumes this mapping for its header status badge)

### R5: Discovery boundary is the only Kanban discovery surface
**Description:** The single discovery boundary defined by R1 is the only place in the console where Kanban workspace discovery logic lives. The boundary is reused — not reimplemented — by every current and future console consumer (Settings Integrations tab, Prompts page, and any future surface that needs workspace selection). Adding a new consumer requires importing the boundary, not copying its fetch, debounce, query key, or error-sanitization wiring.
**Acceptance Criteria:**
- [ ] The Settings Integrations tab and the Prompts page resolve their discovered workspaces from the same query cache entry when given the same `(baseUrl, passcode)` pair (verified by reading the query key shape; both consumers produce the identical key).
- [ ] When the Settings Integrations tab triggers a discovery refresh, a Prompts page mounted with the same `(baseUrl, passcode)` reads the refreshed result from cache without issuing a second discovery request.
- [ ] No `src/pages/` file other than the Settings Integrations tab and the Prompts page issues the Kanban discovery request inline; future consumers must reuse `KanbanIntegrationPanel` or import the boundary directly.
- [ ] No `src/components/` file other than `KanbanIntegrationPanel` issues the Kanban discovery request inline.
- [ ] The error-sanitization wiring (R3) is applied at the consumer's render boundary, not duplicated inside the discovery boundary itself; the discovery boundary returns the raw error and the consumer passes it through `sanitizeErrorMessage`.
- [ ] An automated lint or grep step in CI fails the build if a new file outside the allowed list issues a request to the Kanban discovery endpoint or imports the discovery fetcher without going through `KanbanIntegrationPanel`.
**Dependencies:** R1 (single boundary), R2 (idle gate lives with the boundary), R3 (sanitization at consumer boundary), `cavekit-component-extraction.md` (R3, R4 — `KanbanIntegrationPanel` is the canonical wrapper)

## Out of Scope
- Kanban authentication and passcode storage security (storage at rest, transport encryption, redaction in logs, rotation policy) — deferred per red-team review and not addressed by this kit.
- Backend Kanban client implementation, request shapes, and transport behavior — already completed in commit `7f2ab1b` and outside this kit's scope.
- New discovery features such as workspace filtering, pagination, search-as-you-type beyond the existing debounced fetch, or favorited-workspace persistence.
- Replacement of the existing `sanitizeErrorMessage` boundary with a different sanitization library or strategy; this kit verifies the current boundary's invariants and does not redesign it.
- The route-status vocabulary itself (the set of allowed `routeStatus` string values, the `routeStatusLabel` copy) — owned by `cavekit-ops-surface.md`.
- The Kanban task creation harness flow, draft preview, and apply behavior — owned by `cavekit-kanban-task-creation-harness-ui.md`.
- Component prop shapes for `KanbanIntegrationPanel` and `RoutePreview` — owned by `cavekit-component-extraction.md` (R1, R3).
- Page-level routing, mount points, and navigation between the Settings Integrations tab and the Prompts page — owned by `cavekit-page-consolidation.md`.
- Visual styling of the discovery dropdown, the error message accent color, and the status badge tones beyond referencing the Visual Foundation status palette — owned by `cavekit-visual-foundation.md` (R4) and `cavekit-component-extraction.md` (R5).

## Cross-References
- `cavekit-component-extraction.md` — `KanbanIntegrationPanel` (R3, R4) is the canonical wrapper that mounts the discovery boundary defined here; `RoutePreview` (R1) consumes the route-status tone mapping pinned by R4 of this kit.
- `cavekit-visual-foundation.md` — R4 status palette defines the `status-green`, `status-orange`, `status-red` tokens that the route-status tone mapping (R4) resolves to.
- `cavekit-ops-surface.md` — Owns the route-status vocabulary (`direct_kanban`, `queue_review`, `unavailable`, etc.) that the tone mapping in R4 keys off; this kit consumes that vocabulary and does not redefine it.
- `cavekit-kanban-task-creation-harness-ui.md` — A consumer of the Kanban integration that renders Kanban-sourced errors; those errors must flow through the sanitization boundary pinned by R3.
- `cavekit-page-consolidation.md` — Defines the Settings Integrations tab and the Prompts page mount points that consume the single discovery boundary (R1, R5).

## Changelog
- 2026-04-24: Initial brownfield cavekit. Pins three already-shipped behaviors as regression-proof invariants — the 500 ms input-idle gate on workspace discovery (R2), the `sanitizeErrorMessage` boundary covering all rendered Kanban errors (R3), and the corrected route-status tone mapping where `unavailable` resolves to `danger` (R4) — and captures the outstanding unification work as the single workspace discovery boundary (R1) reused by Settings Integrations, Prompts, and future consumers (R5). Excludes Kanban auth/passcode storage security (deferred per red-team review), backend client changes (completed in commit `7f2ab1b`), and net-new discovery features (filtering, pagination).
