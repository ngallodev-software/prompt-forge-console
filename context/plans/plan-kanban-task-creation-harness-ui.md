# Plan: Kanban Task Creation Harness UI

## Goal

Add a narrow Prompt Forge Console operator flow that:

1. selects a Prompt Forge artifact context
2. previews backend-derived Kanban import manifest data
3. triggers local apply into Kanban roll-up
4. shows realized Kanban import results

## Brownfield Entry Points

Best candidate surfaces:

1. `src/pages/Prompts.tsx`
   - already has operator actions
   - prompt-focused and closest to final rendered prompt
2. `src/pages/IntakeDetail.tsx`
   - already exports a lineage bundle
   - good for source-centric traceability
3. `src/pages/Pipeline.tsx`
   - best lineage view
   - heavier surface; likely better as secondary navigation than first button location

Recommended v1 entry:

- start on prompt detail sheet in `src/pages/Prompts.tsx`
- link back to pipeline trace for deeper context
- require the sheet/dialog to show `prompt_generation.id`, `kanbanBaseUrl`, and `kanbanWorkspaceId` before apply

## Detailed Tickets

### T-01 UI seam audit write-up

- model: `gpt-5.4-mini low`
- goal: confirm exact insertion point and existing component patterns
- deliverable:
  - tracking doc update

### T-02 Define service-layer contract for preview/apply

- model: `gpt-5.4-mini low`
- goal: add typed service functions for:
  - preview manifest
  - apply manifest to Kanban
  - return structured result
- validation:
  - service signatures documented before page wiring
  - preview result includes source artifact identity, workspace target, and manifest summary
  - apply result preserves `ok`, `applied`, `taskMappings`, `linkResults`, `startResults`, and Kanban error code/message

### T-03 Add settings UI support for Kanban binding fields

- model: `gpt-5.4-mini low`
- goal: expose `kanbanBaseUrl` and `kanbanWorkspaceId` through existing settings flow
- constraints:
  - reuse current Settings page and typed settings service
  - no broad settings redesign
- validation:
  - fields visible/editable in correct scope
  - missing binding blocks apply

### T-04 Add UI action in prompt detail

- model: `gpt-5.4-mini medium`
- goal: add one operator action like `Create in Kanban`
- constraints:
  - reuse existing button/modal/sheet patterns
  - no top-level route addition in v1
- validation:
  - action visible only in chosen context

### T-05 Add manifest preview dialog or sheet section

- model: `gpt-5.4-mini medium`
- goal: show manifest summary or raw JSON before apply
- constraints:
  - leverage existing `JsonViewer`, cards, or confirmation modal patterns
- validation:
  - operator can inspect what will be sent
  - preview payload comes from backend/service layer, not local page reconstruction
  - missing workspace binding blocks apply

### T-06 Add apply result surface

- model: `gpt-5.4-mini medium`
- goal: show task/link/start results and errors
- validation:
  - created vs replayed rows clearly distinguishable
  - import failure vs start failure clearly distinguishable

### T-07 Live local validation

- model: `gpt-5.4-medium`
- goal: verify end-to-end UI -> backend -> Kanban local flow
- validation:
  - operator action from console creates or replays tasks in live Kanban
  - operator sees the same source identity and workspace target in preview and result states

### T-08 Final doc and tracking pass

- model: `gpt-5.4-mini low`
- goal: close Cavekit docs after implementation

## Validation Gates

### Gate A: UI contract gate

- typed service contract exists for preview/apply
- UI cannot build a Kanban manifest without backend-provided preview/apply responses

### Gate B: Preview gate

- operator sees accurate manifest summary before apply

### Gate C: Result gate

- operator sees Kanban outcome without guessing
- partial-success start results are not collapsed into generic failure

### Gate D: Live local gate

- same console action succeeds against real local Kanban roll-up

## Non-Goals

- top-level Kanban management console
- general external integrations marketplace
- real-time Kanban board embedding

## Next Phase: UX Hardening

### T-09 Add Kanban availability state

- model: `gpt-5.4-mini low`
- goal: replace raw preview/apply failures with clear status
- UI states:
  - Kanban unavailable
  - Kanban reachable, no workspace selected
  - Kanban reachable, workspace selected

### T-10 Add workspace picker

- model: `gpt-5.4-mini medium`
- goal: replace manual workspace id entry with discovery-backed selection
- backend dependency:
  - Prompt Forge discovery route backed by Kanban `projects.list`
- UI scope:
  - fetch workspace list for current `kanbanBaseUrl`
  - let operator select one
  - persist selected workspace id into Prompt Forge runtime settings

### T-11 Add create-workspace flow

- model: `gpt-5.4-medium`
- goal: let operator create a new Kanban workspace from the console
- backend dependency:
  - Prompt Forge create-workspace route backed by Kanban `projects.add`
- UI scope:
  - explicit modal/form
  - path/git-url input
  - write back returned `workspaceId`

### T-12 Add recovery/help surface when Kanban is down

- model: `gpt-5.4-mini low`
- goal: guide operator instead of failing with transport errors
- UI scope:
  - show configured Kanban base URL
  - show local source-path hint if configured
  - show exact command or instructions to start local Kanban
- non-goal:
  - no hidden browser-side process spawning
