# Scope

## What This UI Does
- Shows route meaning derived from source folder paths
- Makes project scope visible before saving routing settings
- Shows whether a note was routed directly to Kanban or queued for review
- Shows whether Kanban is reachable right now
- Shows replayable queue/review items and their route context
- Shows unknown route families as unsupported / fail-closed

## What This UI Does Not Do
- Does not merge Kanban into the generic delivery target model yet
- Does not let n8n own route policy
- Does not hide route failure behind a generic error page
- Does not require the user to understand backend internals to save a workspace binding

## UX Decisions
- Keep Kanban routing in Settings or a dedicated integration panel, not the generic Targets page
- Show the active Prompt Forge scope next to the Kanban binding controls
- Show route preview on intake detail rows so folder meaning is visible
- Use queue/review language when Kanban is down

## Why
- The user should see how `Inbox/Voice/...` becomes a route
- The user should see where the prompt will end up
- The user should know what happens when Kanban is unavailable
