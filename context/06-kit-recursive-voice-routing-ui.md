# Kit: Recursive Voice Routing UI

## Scope
Show folder-derived route meaning, scope, and fallback state in the console.

## Requirements

### R1 Scope clarity
- The settings page must show the active scope before editing Kanban bindings
- If the active scope is project-scoped, the UI must show which project is being edited

### R2 Route preview
- Intake detail must show the source folder path and derived route key
- The UI must explain the final destination in human terms

### R3 Kanban availability
- The UI must show whether Kanban is reachable
- If Kanban is unreachable, the UI must not fail the whole page

### R4 Fallback state
- Queue/review fallback must be visible in the console
- A user should be able to tell whether the item is waiting for Kanban recovery
- Unknown route families must be displayed as unsupported, not quietly remapped

### R5 Replay affordance
- If an item is queued for Kanban, the UI must make replay/retry discoverable

### R6 n8n boundary
- UI copy should not imply that n8n owns route policy
- n8n may be mentioned as a bridge only

## Acceptance Criteria
- A user can tell why a note maps to Kanban or queue
- A user can tell which Prompt Forge project owns the Kanban binding
- A Kanban outage renders inline fallback state instead of a page failure
