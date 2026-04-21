# Cavekit: Operations Surface

## Scope
This cavekit defines the operator-facing console surfaces that help a user understand, inspect, and act on the workflow state of PromptForge. It covers the review queue, deliveries, prompts, pipeline trace, intake explorer, and logs. It does not define backend data models or new backend capabilities; it defines what each page must communicate and how a user should be able to use it.

## Requirements

### R1: Every operations page must declare its job
**Description:** Each page in the operations surface must clearly state what question it answers and what action it supports.
**Acceptance Criteria:**
- [ ] The top of every in-scope page includes a short purpose statement that is specific to that page.
- [ ] A user can distinguish review, delivery, prompt, intake, pipeline, and log pages without relying on route names or UUIDs.
- [ ] Empty states and help text reinforce the same page purpose rather than repeating generic UI copy.
**Dependencies:** None

### R2: UUIDs must be secondary, not the primary story
**Description:** Operational lists must present a human-readable summary before the raw identifier.
**Acceptance Criteria:**
- [ ] Each row shows a meaningful label such as status, reason, destination, stage, or note summary ahead of the UUID.
- [ ] UUIDs remain visible for cross-reference, but are visually de-emphasized relative to the human summary.
- [ ] Rows that only differ by UUID are treated as the same kind of item unless another meaningful field differentiates them.
**Dependencies:** R1

### R3: The review queue must be a triage surface
**Description:** The review page must help an operator decide what to do next, not just list unfinished records.
**Acceptance Criteria:**
- [ ] Review items are grouped or labeled by why they need attention, such as review required, failed generation, failed delivery, or failed run.
- [ ] The row presentation makes the next likely action obvious.
- [ ] The page makes it clear that review is a merged triage queue, not a single homogeneous list.
**Dependencies:** R1, R2

### R4: Deliveries must read as dispatch operations
**Description:** The deliveries page must explain delivery state, retryability, destination, and failure mode in operational terms.
**Acceptance Criteria:**
- [ ] Each delivery row shows destination, status, retry count, and a meaningful failure or state summary when present.
- [ ] The page distinguishes retry candidates from non-actionable delivery history.
- [ ] The detail view explains why the delivery matters and what the user can do with it.
**Dependencies:** R1, R2

### R5: Prompts must read as a lifecycle ledger
**Description:** The prompts page must communicate where a prompt generation sits in its lifecycle and how it relates to the originating note.
**Acceptance Criteria:**
- [ ] Each row shows lifecycle state, review state, destination, priority, and an origin reference.
- [ ] The detail pane makes the rendered prompt, structured output, and lineage purpose clear.
- [ ] The page explains the difference between a generated prompt, a review flag, and a downstream delivery.
**Dependencies:** R1, R2

### R6: Pipeline trace must be a guided journey view
**Description:** The pipeline page must help a user inspect one note end-to-end and understand how to enter the trace.
**Acceptance Criteria:**
- [ ] The page explains that it traces one intake note through revisions, prompts, deliveries, and processing runs.
- [ ] The page tells the user how to reach it from intake or review surfaces.
- [ ] The timeline and diagnostics highlight gaps, missing stages, and likely failure points in plain language.
**Dependencies:** R1

### R7: Intake must explain watcher semantics
**Description:** The intake page must translate watcher-specific terms into user-facing language.
**Acceptance Criteria:**
- [ ] "Watch" or "watch eligibility" is explained in terms of whether the note will be processed by the watcher.
- [ ] The note path is labeled as a vault-relative or source-path concept, not left as an unexplained technical field.
- [ ] The page helps the user decide whether a note is ready, skipped, or needs attention.
**Dependencies:** R1

### R8: Logs must be honest about their source
**Description:** The logs page must state what the stream represents and how to filter it.
**Acceptance Criteria:**
- [ ] The page clearly states whether the stream is backend activity, persisted operational logs, or container stdout.
- [ ] The service filter changes the displayed rows.
- [ ] Repeated timestamps or grouped entries are explained when they arise from related backend records.
**Dependencies:** R1

### R9: Shared operational patterns must remain consistent
**Description:** The operations pages must share a common visual and interaction language.
**Acceptance Criteria:**
- [ ] The pages use a shared pattern for summary strip, filters, list rows, and detail disclosure.
- [ ] Shared terms mean the same thing across pages.
- [ ] Primary actions are visible before deep details.
**Dependencies:** R1-R8

## Out of Scope
- Backend schema changes.
- New workflow capabilities not already supported by the backend.
- Replacing live data with mock data.
- Settings and admin configuration surfaces that are not part of the operational workflow.

## Cross-References
- See also: `context/refs/ops-surface-current-observations.md` for the current-state assessment.
- See also: `docs/frontend-console-architecture.md` for the broader frontend system context.
- Depends on: existing console routes and query contracts in `src/pages/` and `src/services/promptforge/`.

