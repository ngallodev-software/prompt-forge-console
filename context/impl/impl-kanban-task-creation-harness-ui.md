# Impl Tracking: Kanban Task Creation Harness UI

## Status

- phase: complete
- branch: `fork/feature-request/kanban-task-creation-harness`
- implementation: complete

## Confirmed Facts

- `src/pages/Prompts.tsx` already hosts prompt-level operator actions.
- `src/pages/IntakeDetail.tsx` already has export-bundle behavior.
- `src/services/promptforge/api.ts` is the service-layer source of truth.
- backend owns meaningful mutations; UI should not own Kanban manifest construction.

## Planning Decisions Locked

- prompt detail action is recommended v1 entry
- preview/apply must go through typed service-layer functions
- local Kanban roll-up validation is required before calling branch done
- preview must be backend-owned and source-bound
- UI must show canonical source identity and workspace target before apply
- UI must distinguish import success with start failure from full apply failure
- canonical source identity shown in v1 is `prompt_generation.id`
- workspace binding shown in v1 is `kanbanBaseUrl` + `kanbanWorkspaceId`

## Risks

- console still hydrates much of its read model through bootstrap/mocks
- UI can appear to work while backend or Kanban apply fails
- too much config UI too early would widen scope and slow dogfood
- prompt-detail convenience can drift from source lineage if the backend identity boundary is not surfaced in the UI

## Implemented

- extended backend runtime settings types with:
  - `kanbanBaseUrl`
  - `kanbanWorkspaceId`
- extended Settings page runtime draft hydration and save path to include both Kanban binding fields
- added Settings page inputs for both backend-managed Kanban binding fields
- added Prompt sheet Kanban actions:
  - preview backend-owned Kanban manifest
  - apply prompt generation into Kanban
- added Prompt sheet display of:
  - Kanban binding
  - preview manifest
  - apply result or preflight errors

## Validation

- `npm run build`
  - pass
- `npm test`
  - pass

## Remaining

- no richer UI reconciliation view yet beyond JSON result display
- no multi-task chain UI yet
