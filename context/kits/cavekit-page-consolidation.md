---
created: "2026-04-24T23:00:00Z"
last_edited: "2026-04-24T23:00:00Z"
---

# Cavekit: Page Consolidation

## Scope
Defines the route-level page composition and navigation changes required by the prompt-forge-console redesign. Three structural changes are in scope: (1) decomposing the monolithic Settings page into a tabbed interface with four named tabs, (2) adding a trace quick-link from the Intake list into the Pipeline trace route, and (3) introducing a Pipeline list view as a distinct route from the existing Pipeline trace detail. All other existing routes (Dashboard, Health, Logs, Intake, IntakeDetail, Prompts, Deliveries, Review, Rules, Targets, Templates, Dictionary) remain present and unchanged in this kit. This kit defines the structural and routing contract; the user-facing semantics of Pipeline and Intake (what they communicate, terminology, guided journey copy) remain owned by `cavekit-ops-surface.md`.

## Requirements

### R1: Settings page decomposes into four named tabs
**Description:** The Settings route renders a tabbed container with exactly four tabs: Runtime, Secrets, Integrations, Projects. All Settings content is reachable through one of these four tabs (or through page-level chrome rendered above the tab control). The tab control is the only mechanism a user uses to move between Settings sub-surfaces; there are no hidden or unrouted sub-pages.
**Acceptance Criteria:**
- [ ] The Settings route exposes exactly four tabs whose visible labels are `Runtime`, `Secrets`, `Integrations`, `Projects`.
- [ ] Exactly one tab is in the active state at any given time.
- [ ] The Runtime tab contains the backend runtime settings form, the local console connectivity controls, and the workspace selector previously rendered inline on the legacy Settings page.
- [ ] The Secrets tab contains the secrets management form previously rendered inline on the legacy Settings page.
- [ ] The Integrations tab renders the `KanbanIntegrationPanel` component contract defined in `cavekit-component-extraction.md` and contains no other inline integration forms.
- [ ] The Projects tab contains the projects CRUD surface previously rendered inline on the legacy Settings page.
- [ ] The binding scope display renders as page-level chrome above the tab control and is visible regardless of which tab is active.
- [ ] No Settings content renders outside the tab content area or the page-level chrome above the tab control.
- [ ] The active tab uses the `surface-3` background token and the inactive tabs use the `surface-2` background token from `cavekit-visual-foundation.md`.
- [ ] The tab control uses the `border` and `divider` tokens from `cavekit-visual-foundation.md` to delineate tab boundaries; no `box-shadow` greater than 2px blur is used for the active state.
**Dependencies:** `cavekit-visual-foundation.md` (R1 surface tokens, R7 border/divider tokens), `cavekit-component-extraction.md` (KanbanIntegrationPanel contract)

### R2: Settings tab switches preserve unsaved edits per tab
**Description:** Unsaved in-progress edits made within one Settings tab survive switching to a different tab and switching back. Each tab maintains its own independent in-progress edit buffer; switching tabs does not clear, reset, or submit edits in any other tab. Edits are only cleared when the user explicitly saves or discards them through the tab's own controls.
**Acceptance Criteria:**
- [ ] Modifying an unsaved field on the Runtime tab, switching to the Secrets tab, and switching back to Runtime shows the modified value still present in the field.
- [ ] Modifying an unsaved field on the Secrets tab, switching to the Projects tab, and switching back to Secrets shows the modified value still present in the field.
- [ ] Switching from a tab with unsaved edits to another tab does not trigger a save, submit, or network write of those edits.
- [ ] Switching tabs does not display a confirmation prompt or warning about unsaved edits.
- [ ] Saving on one tab (e.g., Runtime) does not modify, clear, or submit unsaved edits on any other tab.
- [ ] An explicit discard or reset action on a tab clears only that tab's unsaved edits and does not affect other tabs.
**Dependencies:** R1 (tab structure must exist)

### R3: Intake list exposes a trace quick-link in the actions column
**Description:** Each row in the Intake list table exposes a trace quick-link in the row actions column. Activating the quick-link routes the user to the Pipeline trace for the note represented by that row. The existing detail action (eye icon → IntakeDetail route) remains present and unchanged; the trace quick-link is additive.
**Acceptance Criteria:**
- [ ] Every row in the Intake list table renders a trace action in the actions column.
- [ ] Activating the trace action on a row whose note id is `:noteId` navigates the browser to the route path `/pipeline/:noteId`.
- [ ] The existing detail action that navigates to `/intake/:noteId` remains present in the actions column on every row.
- [ ] The trace action and the detail action are visually distinguishable (different label or different icon).
- [ ] The trace action is keyboard-focusable and activatable via the keyboard.
- [ ] The trace action uses the same icon button styling tokens as other Intake row actions (no bespoke shadow or color outside `cavekit-visual-foundation.md` tokens).
**Dependencies:** R4 (Pipeline trace detail route must accept `:noteId`), `cavekit-visual-foundation.md`

### R4: Pipeline list view exists as a distinct route from the Pipeline trace
**Description:** A Pipeline list view route exists, separate from the existing Pipeline trace detail route. The list view enumerates intake notes with their lineage status so a user can pick a note to trace. The existing Pipeline trace detail route (which shows the timeline lineage of a single note) remains present and unchanged in behavior. The list view is the default surface a user sees when navigating to the Pipeline section without a specific note id.
**Acceptance Criteria:**
- [ ] Navigating to the Pipeline section root (a Pipeline route with no note id) renders the list view, not the trace detail.
- [ ] Navigating to the Pipeline trace route with a specific note id (e.g., `/pipeline/:noteId`) renders the trace detail view.
- [ ] The list view renders one row per intake note with at least the following columns: note relative path, lineage status, created timestamp, and a row action that routes to `/pipeline/:noteId` for that row.
- [ ] The list view and the trace detail view are reachable through distinct route paths (the list view route does not share its path with the trace detail route).
- [ ] The list view does not render the timeline trace, diff viewer, or root-cause panel that belong to the trace detail view.
- [ ] The trace detail view continues to render its existing timeline, diff viewer, and root-cause content; this kit does not modify trace detail behavior.
**Dependencies:** `cavekit-ops-surface.md` (R6 pipeline trace semantics — this kit adds a list surface but does not change what trace detail communicates)

### R5: Tab control adapts responsively at a defined viewport breakpoint
**Description:** The Settings tab control adapts its presentation based on viewport width. At viewport widths at or above 768px, the control renders as a horizontal tab bar. At viewport widths below 768px, the control renders as a single-select dropdown that exposes the same four named tabs and the same active-tab semantics. The active tab and the tab content shown remain identical across both presentations for the same selection.
**Acceptance Criteria:**
- [ ] At a viewport width of 768px or greater, the Settings tab control renders as a horizontal tab bar showing all four tab labels simultaneously.
- [ ] At a viewport width below 768px, the Settings tab control renders as a single-select dropdown whose options are the four tab labels.
- [ ] Changing the active tab via the dropdown selection updates the visible tab content to the same content shown when the corresponding horizontal tab is active.
- [ ] Resizing the viewport across the 768px threshold preserves the currently active tab (the same tab remains active after the presentation switches).
- [ ] Resizing the viewport across the 768px threshold preserves unsaved in-progress edits in every tab (R2 holds across the responsive transition).
- [ ] Both presentations use the spacing scale tokens from `cavekit-visual-foundation.md` for internal padding and gap; no hard-coded pixel spacing values appear in the tab control.
**Dependencies:** R1 (tab structure), R2 (edit preservation), `cavekit-visual-foundation.md` (R5 spacing scale)

## Out of Scope
- Merging Dashboard and Health into a single page — they serve distinct operator purposes (workflow status vs. infrastructure monitoring) per red-team review.
- Merging the Intake, Prompts, or Deliveries list pages into tabs or a unified surface — they are CRUD list pages with independent pagination, filtering, and create/edit flows; consolidating them was rejected by red-team review.
- Renaming the Pipeline route or section to "Status" — conflicts with health-monitoring vocabulary owned by Dashboard and Health.
- CRUD operation behavior for prompts, deliveries, projects, or any other resource (creation, editing, deletion semantics already work and are not modified by this kit).
- Settings tab visual ordering, icon assignment, and tab-specific iconography — deferred to future UX work.
- The user-facing copy, terminology, and guided-journey explanations on the Pipeline trace and Intake pages — owned by `cavekit-ops-surface.md` (R6, R7).
- Backend routes, data models, or new API capabilities to support the Pipeline list view (the list view consumes the existing intake listing capability).
- Animation or transition behavior for tab switching and the responsive presentation change.
- Persistence of the active Settings tab across page reloads or browser sessions.

## Cross-References
- `cavekit-component-extraction.md` — Settings Integrations tab renders the `KanbanIntegrationPanel` component contract; tab control and Pipeline list row actions consume button and table component contracts defined there.
- `cavekit-visual-foundation.md` — Tab active/inactive states, tab borders/dividers, and tab control spacing all reference Visual Foundation tokens (R1 surface hierarchy, R5 spacing scale, R7 border and divider tokens).
- `cavekit-ops-surface.md` — Boundary: this kit owns the structural addition of a Pipeline list view route and the Intake row trace action; ops-surface continues to own what the Pipeline trace detail and Intake pages communicate to the user (R6, R7).

## Changelog
- 2026-04-24: Initial cavekit drafted from brownfield analysis of Settings.tsx (834 LOC monolith), Pipeline.tsx (290 LOC trace detail), and Intake.tsx (127 LOC list). Captures the post-red-team scope: Settings tabbing, Intake trace quick-link, and a new Pipeline list view; explicitly excludes the rejected merges (Dashboard+Health, Intake/Prompts/Deliveries consolidation) and the rejected Pipeline rename.
