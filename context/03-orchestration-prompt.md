# Orchestration Prompt

Branch: `fork/feature-request/recursive-voice-routing`

Use `codebase-memory-mcp` first for search and structure.

## Locked decisions
- Kanban routing is project-scoped
- Console must show the scope before save
- Intake pages should show route meaning, not only path fragments
- Queue/review fallback is a first-class state
- Targets page is not the default place for Kanban routing yet

## Agent split
- `mini low`: docs, UI inventory, test sweep
- `mini medium`: settings copy, route preview, availability states
- `gpt-5.3-codex medium`: end-to-end UI tests and larger refactors

## Exit criteria
- Scope is obvious in settings
- Route meaning is obvious in intake detail
- Kanban outage is shown as fallback state, not a page failure

## Completion signal
`<all-tasks-complete>`
