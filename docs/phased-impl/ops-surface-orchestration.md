# Ops Surface Orchestration

Scope: coordinate the frontend revamp for review, deliveries, prompts, intake, pipeline trace, and logs without expanding backend scope unless a concrete data-shape gap exists.

## Decision

- Do not merge pages just to reduce route count.
- Do not expand the backend unless the frontend cannot express the intended UX with existing shapes.
- Prefer shared page scaffolding and clearer summaries over new APIs.

## What The Backend Already Gives Us

- `intake`: enough row data for a useful list and detail view.
- `prompts`: enough row data for lifecycle inspection and detail panels.
- `deliveries`: enough row data for dispatch, retry, reroute, and status actions.
- `lineage`: enough joined data for pipeline trace.
- `logs`: enough to support an activity stream, but not raw container logs.

## Backend Changes Only If Needed

1. Fix the bootstrap bug
- `GET /console/bootstrap` currently contains a queue-depth bug and is too heavy as a default source of truth.
- If the revamp depends on dashboard counts, fix the bug or stop consuming the buggy field.

2. Review queue shaping
- Keep the review page frontend-led if it can group prompts, failed deliveries, and failed runs cleanly.
- Add a backend review summary endpoint only if the client cannot keep the triage view coherent with existing routes.

3. Logs semantics
- Keep the logs page as a backend activity stream unless there is a real requirement for container stdout.
- If operators need actual runtime logs, that is a separate backend feature and should not be smuggled into the current page.

4. Optional detail endpoints
- Add delivery attempt history only if the delivery detail sheet needs a true timeline.
- Add prompt/delivery keyed lineage lookup only if the current intake-keyed trace cannot support the new entry points.

## Frontend Workstreams

### 1. Shared ops shell
- Build one shared layout pattern for operational pages.
- Include a purpose statement, a compact summary strip, filter controls, a primary list, and a secondary detail area.
- Keep routes separate.

### 2. Review
- Present as a triage board.
- Group by why the item needs attention.
- Show next action, not just row identity.

### 3. Deliveries
- Present as a dispatch ledger.
- Make retryability, destination, and failure reason visible first.
- Keep delivery detail focused on what changed and what to do next.

### 4. Prompts
- Present as a lifecycle ledger.
- Show status, review state, destination, priority, and lineage.
- Keep the detail pane about prompt meaning, not raw ids.

### 5. Intake
- Explain watcher semantics in plain language.
- Replace "watch" jargon with an explanation of what eligibility means.
- Make path secondary to note meaning.

### 6. Pipeline trace
- Keep it as the end-to-end note journey.
- Teach the user how to enter the page from intake or review.
- Use diagnostics to explain gaps in human language.

### 7. Logs
- State clearly that the stream is backend activity, not container stdout.
- Keep service and severity filters functional.
- Explain repeated timestamps as grouped backend events when applicable.

## Coordination Rules

- Review and deliveries should share styling and terminology, but remain separate pages.
- Prompts should not be folded into review or deliveries.
- Pipeline should remain the deepest inspection path, not a generic detail drawer.
- Intake should stay the entry point for note-centric workflows.

## Validation Gates

- A first-time user can say what each page is for from the header copy alone.
- A first-time user can tell review, deliveries, and prompts apart without reading UUIDs.
- The pipeline page tells the user how to use it.
- The intake page explains watch eligibility without jargon.
- The logs page tells the truth about its source.

## Backend Scope Gate

Only add backend work if one of these becomes true:
- The frontend cannot render a meaningful page without a new joined shape.
- Pagination or filtering becomes impossible with existing route shapes.
- A page would otherwise mislead users about what the backend actually stores.

