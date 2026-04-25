# Console Surface Audit

## Scope

Reviewed the current Prompt Forge Console surfaces that touch Kanban binding and routing semantics:

- `src/pages/Settings.tsx`
- `src/pages/Intake.tsx`
- `src/pages/IntakeDetail.tsx`
- `src/pages/Dashboard.tsx`
- `src/services/promptforge/api.ts`
- `src/services/promptforge/types.ts`
- existing Cavekit context docs under `context/`

## What Exists Today

- Settings already owns the only editable Kanban binding controls:
  - `kanbanBaseUrl`
  - `kanbanWorkspaceId`
  - `kanbanPasscode`
  - workspace discovery
  - a clear availability/error readout
- Prompt-to-Kanban preview/apply already lives on the prompt detail surface in `src/pages/Prompts.tsx`.
- Intake detail is a traceability surface, not a routing-control surface.
- Dashboard is aggregate-only and does not currently expose route binding meaning.

## Main Finding

The current UI separates two concerns correctly, but not clearly enough:

- Settings answers: "Where is Kanban, and which workspace is bound?"
- Prompt detail answers: "What will be sent, and what happened?"

What is still missing is explicit route meaning. The UI does not yet make it obvious whether a prompt is being routed by folder-derived path rules, project scope, or a fallback/default path when Kanban is unavailable.

## Minimum UI Changes

1. Keep Kanban connection fields in Settings.
   - Do not move `kanbanBaseUrl` / `kanbanWorkspaceId` into Dashboard or Intake Detail.
   - The Settings page is still the right place for backend-owned binding values and workspace discovery.

2. Add a small route-meaning panel next to the existing Kanban harness on the prompt detail surface.
   - Show the source scope explicitly: folder-derived, project-scoped, or fallback/default.
   - Show the resolved destination workspace and the source of that resolution.
   - Show a blocked/unavailable state when Kanban cannot be reached or the binding is incomplete.

3. Surface the same fallback state on Intake Detail when a note has no resolvable Kanban target.
   - This is the right place to explain why a note did not route cleanly.
   - Keep it read-only and trace-oriented.

4. Leave Dashboard out of the routing controls.
   - It can link to the relevant detail surfaces, but it should not own route semantics.

## Recommendation On Placement

### Settings

Best place for:

- Kanban base URL
- Kanban workspace ID
- passcode / discovery
- project-scope binding clarity

Not best place for:

- folder-derived routing rules
- route resolution explanation
- fallback/review visibility

### Intake Detail

Best place for:

- source-path context
- "why was this note routed or skipped?" explanation
- fallback/review visibility when a note has no Kanban target

Not best place for:

- editing binding settings

### Dashboard

Best place for:

- high-level "Kanban unavailable" signal if needed
- links to the relevant records

Not best place for:

- route controls or binding edits

### Dedicated Panel

A dedicated integration panel is warranted only if the route model expands beyond a single source rule plus a Kanban binding.

For the current problem, a dedicated panel would be too heavy unless the app needs all of these at once:

- multiple route sources
- per-project routing overrides
- fallback policy editing
- workspace selection and discovery
- availability diagnostics

If the goal is only to make route scope, destination, and fallback obvious, the lighter path is better:

- Settings for binding
- Prompt detail for resolution/apply
- Intake Detail for source/fallback explanation

## Test Gaps

Before implementation, cover these cases:

- settings with valid Kanban base URL and workspace ID
- settings with missing workspace ID
- workspace discovery success and empty discovery
- Kanban unavailable transport error
- prompt preview showing resolved target and fallback state
- apply blocked when binding is incomplete
- intake detail showing source-path or fallback explanation for a note with no resolvable Kanban route

## Conclusion

Current Settings placement is correct for connection and workspace binding, but not sufficient for route meaning.
Route meaning should live primarily on the prompt detail surface, with Intake Detail carrying the fallback/review explanation.
A dedicated integration panel is not justified yet unless routing grows into a multi-source management problem.
