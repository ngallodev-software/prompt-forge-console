---
created: "2026-04-24T23:00:00Z"
last_edited: "2026-04-24T23:15:00Z"
---

# Cavekit: Component Extraction

## Scope
Defines the component contracts for two reusable UI components extracted from inline page code in `prompt-forge-console`: `RoutePreview` (currently 75+ lines of inline JSX in `IntakeDetail.tsx`) and `KanbanIntegrationPanel` (currently 200+ lines of inline JSX, state, and discovery logic in `Settings.tsx`). Both components consume the design tokens defined in `cavekit-visual-foundation.md` and are reused in pages defined by `cavekit-page-consolidation.md`. This kit specifies prop contracts as data shapes, state ownership boundaries, observable rendering behavior, reuse targets, and the Visual Foundation tokens each component must reference. It does not specify React syntax, hook names, file layout, or any internal implementation choice.

## Requirements

### R1: RoutePreview component contract
**Description:** A `RoutePreview` component encapsulates the route-preview card currently rendered inline in `IntakeDetail.tsx`. It is a pure presentational component: all data needed to render a complete preview is passed in as props, and it owns no fetching, no querying, and no scope resolution. The component renders the route header (title and status badge), the route summary line, the four route detail cells (source folder, route family, route target, route context), the two state cells (fallback/replay state and Kanban binding readiness), the action buttons (open pipeline, optional review delivery), and the binding scope footer (scope badge plus project name or global-fallback label).
**Acceptance Criteria:**
- [ ] The component accepts a `note` input shaped as an intake-note record carrying at minimum the note id, the fields consumed by the route description (source folder, route family, route target, route context, replay state, replayability), and an optional delivery id for the review-delivery action.
- [ ] The component accepts a `route` input shaped as a voice-route description carrying `routeStatus`, `routeStatusLabel`, `routeSummary`, `sourceFolder`, `routeFamily`, `routeTarget`, `routeContext`, `replayState`, and `replayable`.
- [ ] The component accepts a `kanbanReady` boolean input.
- [ ] The component accepts a `kanbanBinding` input shaped as `{ baseUrl: string | null, workspaceId: string | null }` carrying the resolved (post-trim) values used by the binding-status cell.
- [ ] The component accepts a `scope` input shaped as `{ kind: "global" | "project", projectId: string | null, projectName: string | null }` consumed by the footer.
- [ ] The component does not accept a callback for fetching the note, the route description, the backend settings, or the project list (no data-loading props).
- [ ] When `route.routeStatus` is `"direct_kanban"`, the header status badge renders with the `success` tone; when `"queue_review"`, with the `warn` tone; for any other value, with the `danger` tone.
- [ ] When `kanbanReady` is `true`, the Kanban binding cell renders the literal string `"Ready"`; when `false`, it renders `"Unavailable"`.
- [ ] When `kanbanBinding.baseUrl` is null or an empty string, the Kanban binding cell renders the literal string `"unset"` in the base-url slot; same for `workspaceId` in the workspace-id slot.
- [ ] When `route.routeFamily`, `route.routeTarget`, or `route.routeContext` is null or undefined, the corresponding detail cell renders the literal placeholder string defined for that cell (`"unsupported"` for route family, `"—"` for route target and route context).
- [ ] The "Open pipeline" action always renders and links to `/pipeline/{note.id}`.
- [ ] The "Review delivery" action renders only when the input carries a non-empty delivery id and links to `/deliveries?id={deliveryId}`.
- [ ] The footer renders the scope badge and, when `scope.kind` is `"project"`, the project name; when `"global"`, the literal string `"Global fallback scope"`.
- [ ] The component is exported from a single module path that does not depend on `IntakeDetail.tsx` (no circular page-to-component import).
**Dependencies:** `cavekit-visual-foundation.md` (R1 surface tokens, R3 typography roles, R4 status palette, R5 spacing scale, R6 radius scale, R7 border tokens), R5 (token usage), `cavekit-ops-surface.md` (route description vocabulary that `route` carries — this kit does not redefine the vocabulary)

### R2: RoutePreview reuse targets
**Description:** `RoutePreview` is consumed by more than one page surface so that the route preview presentation is not duplicated as inline JSX anywhere in the console. This kit names the reuse targets and forbids reintroducing the inline form on any of them.
**Acceptance Criteria:**
- [ ] `IntakeDetail.tsx` renders the route preview by composing the `RoutePreview` component and contains no inline JSX duplicating the route header, route detail cells, state cells, action row, or scope footer.
- [ ] The Pipeline trace detail surface (the route at `/pipeline/:noteId` defined in `cavekit-page-consolidation.md` R4) renders `RoutePreview` at the head of its trace view when a note id is selected.
- [ ] No other file in `src/pages/` contains the inline route-header markup (`Route preview` heading paired with the four route detail cells) outside of consuming `RoutePreview`.
- [ ] The component renders identically across reuse targets given identical props (no per-page conditional layout inside the component).
**Dependencies:** R1 (component contract), `cavekit-page-consolidation.md` (R4 Pipeline trace detail route)

### R3: KanbanIntegrationPanel component contract and state ownership
**Description:** A `KanbanIntegrationPanel` component encapsulates the Kanban integration controls currently rendered inline in `Settings.tsx`: the binding scope display, the base URL / workspace id / passcode inputs, the workspace discovery surface (debounced query, discovered-workspaces dropdown, current-workspace display, and sanitized error message), and the scope badge integration. State ownership is split: the panel owns its in-progress draft inputs (base URL, workspace id, passcode) and its discovery trigger debounce internally; the parent owns the persisted backend settings, the binding scope, and the persistence callback. The panel exposes a single submit-style callback the parent invokes to write changes; the panel does not write to backend settings directly.
**Acceptance Criteria:**
- [ ] The component accepts an `initialDraft` input shaped as `{ baseUrl: string, workspaceId: string, passcode: string }` carrying the values the panel renders into its inputs on mount.
- [ ] The component accepts a `binding` input shaped as `{ scope: "global" | "project", projectId: string | null, projectName: string | null }` rendered as page-level chrome above the inputs.
- [ ] The component accepts an `onSubmit` callback input that receives the current draft values when the user invokes the panel's save action; the panel does not invoke any persistence side effect on its own.
- [ ] The component owns its in-progress edit state internally; changing an input updates the panel's local draft and does not propagate up until the user invokes the save action.
- [ ] The panel consumes the workspace discovery boundary (defined in `cavekit-integration-refactor.md` R1) which includes a 500 ms idle debounce; the panel does not implement its own debounce timer but relies on the boundary's idle gate.
- [ ] The workspace discovery query does not trigger when the current debounced base URL is an empty string.
- [ ] The discovered-workspaces dropdown renders only when the discovery response carries one or more workspaces; otherwise the dropdown is not present in the DOM.
- [ ] When the user selects a workspace from the discovered-workspaces dropdown, the panel's workspace id input updates to that workspace's id.
- [ ] The current-workspace display renders the workspace name resolved from the discovery response when the panel's workspace id matches a discovered workspace; otherwise it renders the workspace id verbatim.
- [ ] When the discovery query produces an error, the panel renders the error message passed through the error-sanitization rule defined in the existing `sanitizeErrorMessage` boundary; the panel never renders a raw stack trace, raw network error string, or any string containing the passcode.
- [ ] The component does not accept a prop that exposes the raw query client, the raw query result object, or the raw fetcher; the only data callback inputs are `onSubmit` and the discovery boundary the parent injects.
- [ ] The component is exported from a single module path that does not depend on `Settings.tsx`.
**Dependencies:** `cavekit-visual-foundation.md` (R1 surface tokens, R3 typography roles, R5 spacing scale, R6 radius scale, R7 border tokens), R5 (token usage), `cavekit-page-consolidation.md` (R1 — the Settings Integrations tab is the canonical mount point)

### R4: KanbanIntegrationPanel covers discovery, binding, and scope display
**Description:** `KanbanIntegrationPanel` is the single surface that combines workspace discovery, binding to a scope (global vs. project), and the scope-badge display. No other page or component in the console renders the Kanban discovery query, the discovered-workspaces dropdown, or the binding scope label inline.
**Acceptance Criteria:**
- [ ] The panel renders the binding scope badge above the inputs in every mounted instance.
- [ ] The panel renders the base URL input, the workspace id input, the passcode input, the discovery trigger surface (discovered workspaces and current workspace), and the save action as a single contiguous group within the panel.
- [ ] When the panel's `binding.scope` is `"project"`, the scope chrome renders the project name; when `"global"`, it renders the literal string `"Global fallback scope"`.
- [ ] No file in `src/pages/` other than the Settings page contains a workspace discovery query, a discovered-workspaces dropdown, or the binding scope label rendered inline.
- [ ] The panel's passcode input does not render its current value back into the discovered-workspaces error string, the current-workspace display, or any other visible text region.
- [ ] When the panel is unmounted (e.g., the user switches away from the Settings Integrations tab), in-flight discovery responses do not cause the panel to attempt to update its state on remount with stale data.
**Dependencies:** R3 (component contract), `cavekit-page-consolidation.md` (R1 Settings Integrations tab)

### R5: Both components consume Visual Foundation tokens
**Description:** Both `RoutePreview` and `KanbanIntegrationPanel` style themselves exclusively from the design tokens defined in `cavekit-visual-foundation.md`. Hard-coded color values, hard-coded pixel spacing values, and bespoke shadow values are not present in either component. Status colors come from the status palette; surfaces from the surface hierarchy; borders, dividers, and focus rings from the border tokens; typography from the typography scale; spacing from the spacing scale; corner rounding from the radius scale.
**Acceptance Criteria:**
- [ ] `RoutePreview`'s outer card uses the `surface-2` background token.
- [ ] `RoutePreview`'s four route detail cells use the `border` token for their hairline outline and the `radius-md` token for their corners.
- [ ] `RoutePreview`'s two state cells (fallback/replay and Kanban binding) use the `surface-1` background token (a one-step-down surface relative to the outer card).
- [ ] `RoutePreview`'s status badge tones map to the status palette: `success` to `status-green`, `warn` to `status-orange`, `danger` to `status-red`.
- [ ] `RoutePreview`'s detail cell labels (source folder, route family, route target, route context) use the `label` typography role.
- [ ] `RoutePreview`'s detail cell values (the monospace strings) use the `code` typography role.
- [ ] `RoutePreview`'s route summary line uses the `body` typography role.
- [ ] `RoutePreview` uses only spacing scale tokens (`space-1` through `space-8`) for its internal padding and gaps; no literal pixel values appear in its style declarations.
- [ ] `KanbanIntegrationPanel`'s outer container uses the `surface-2` background token.
- [ ] `KanbanIntegrationPanel`'s scope chrome uses the `divider` token to separate itself from the inputs below.
- [ ] `KanbanIntegrationPanel`'s inputs use the `border` token for their resting border and the `border-focus` token for their focused border.
- [ ] `KanbanIntegrationPanel`'s discovered-workspaces dropdown uses the `surface-3` background token (one step elevated relative to the panel container).
- [ ] `KanbanIntegrationPanel`'s sanitized error message uses the `status-red` token for its accent color and the `small` typography role for its body text.
- [ ] `KanbanIntegrationPanel` uses only spacing scale tokens for its internal padding and gaps; no literal pixel values appear in its style declarations.
- [ ] Neither component declares a `box-shadow` value with blur radius greater than 2px.
- [ ] Neither component references the legacy semantic CSS variables (`--background`, `--foreground`, `--surface-raised`, `--surface-sunken`, `--primary`, `--status-success`, `--status-warn`, `--status-danger`).
**Dependencies:** `cavekit-visual-foundation.md` (R1, R3, R4, R5, R6, R7)

## Out of Scope
- Other component extractions not identified in the red-team frontend simplification review (no extraction of intake list rows, delivery rows, prompt editor chrome, or the markdown preview).
- `Logs.tsx` reuse of `RoutePreview` — `Logs.tsx` log entries do not currently carry note id or route description; adding that data path is a future data-model change, not part of this extraction work.
- A component library documentation site, prop tables, or auto-generated reference documentation.
- Storybook stories, visual regression snapshots, or any per-component test scaffolding.
- The voice-route description function itself (`describeVoiceRoute`) — `RoutePreview` consumes its output as a prop and does not own its definition; route vocabulary is owned by `cavekit-ops-surface.md`.
- The error-sanitization rule itself (`sanitizeErrorMessage`) — `KanbanIntegrationPanel` consumes its output and does not redefine the rule.
- Backend settings persistence semantics (when writes hit the server, retry behavior, optimistic update strategy) — `KanbanIntegrationPanel` only emits a draft via `onSubmit` and does not own persistence.
- Route paths and routing wiring — owned by `cavekit-page-consolidation.md`.
- Animation or transition behavior on either component (no enter/exit animations, no debounce indicator animations beyond what falls out of normal input rendering).
- Accessibility behavior beyond what is implied by using the foundation tokens (no ARIA pattern decisions, no keyboard navigation specifics within the dropdown beyond standard select semantics).
- Internationalization or copy translation for the literal strings (`"Ready"`, `"Unavailable"`, `"unset"`, `"unsupported"`, `"—"`, `"Global fallback scope"`) — captured here as the current English literals to preserve parity with the inline source.

## Cross-References
- `cavekit-page-consolidation.md` — The Settings Integrations tab (R1) is the canonical mount point for `KanbanIntegrationPanel`; `IntakeDetail.tsx` and the Pipeline trace detail route (R4) are mount points for `RoutePreview`.
- `cavekit-visual-foundation.md` — Provides all design tokens both components reference (surfaces, borders, dividers, typography roles, status palette, spacing scale, radius scale).
- `cavekit-ops-surface.md` — Owns the route-description vocabulary that `RoutePreview` displays (route status labels, route summary copy, replay state semantics); this kit consumes that vocabulary as input data and does not redefine it.

## Changelog
- 2026-04-24: Initial brownfield cavekit drafted from the inline `RoutePreview` JSX in `IntakeDetail.tsx` (lines 69-137) and the inline Kanban integration block in `Settings.tsx` (workspace discovery query, draft inputs, sanitized error display, scope chrome). Captures R1-R5 covering the `RoutePreview` prop contract, `RoutePreview` reuse targets (IntakeDetail, Pipeline trace detail, Logs), the `KanbanIntegrationPanel` prop contract and state ownership split, the discovery / binding / scope coverage rule, and the Visual Foundation token usage requirements for both components. Excludes Storybook, component library documentation, and any extractions beyond the two named in the red-team review.
