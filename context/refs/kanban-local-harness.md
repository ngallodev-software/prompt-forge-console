# Kanban Local Harness Reference

## Purpose

Ground Prompt Forge Console planning against:

- real Prompt Forge Console seams
- real Prompt Forge backend seams
- real Kanban roll-up import seams

## Confirmed Console Seams

Primary service boundary:

- `src/services/promptforge/api.ts`

Strong operator entry points:

- `src/pages/Prompts.tsx`
  - existing prompt actions: clone, force review, change priority
- `src/pages/Pipeline.tsx`
  - lineage-first inspection surface
- `src/pages/IntakeDetail.tsx`
  - existing export bundle pattern

Useful reuse pattern:

- `src/pages/Dictionary.tsx`
  - JSON export/import UX pattern already exists

## Confirmed Backend Facts

- backend canonical contracts:
  - `Prompt Forge backend repository: promptforge_services/models.py`
- backend compile surface:
  - `Prompt Forge backend repository: promptforge_services/api.py`
- backend operator mutation surface:
  - `Prompt Forge backend repository: promptforge_services/console_api.py`

## Confirmed Kanban Facts

Primary import seam:

- `Kanban repository: src/trpc/workspace-api.ts`
  - `workspace.importTasks`

CLI wrapper:

- `Kanban repository: src/commands/task.ts`
  - `task import --file <path>`

## Planning Implication

Console v1 should focus on:

1. choosing a low-drift operator entry point
2. previewing the backend-owned Kanban manifest that backend harness will apply
3. triggering local apply and showing result

Console v1 should not:

- invent a separate Kanban contract
- duplicate backend manifest builder logic
- pretend mocked hydration is enough proof of success
- turn Kanban integration into a global app setting before local dogfood succeeds

## Planning Corrections Locked

- Preview and apply payloads must come from backend/service-layer responses, not page-level reconstruction.
- UI must show canonical source artifact identity and target workspace so replay context is visible to the operator.
- UI result state must preserve the difference between import failure and start failure.
