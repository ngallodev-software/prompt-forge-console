# Plan: Operations Surface Redesign

## Goal
Turn the current operator pages into a coherent workflow system instead of a set of similar-looking database views.

## Redesign thesis
- Review, deliveries, prompts, pipeline, intake, and logs are one workflow chain, but each page answers a different question.
- The redesign should make the question obvious before the data grid appears.
- Rows should foreground human meaning and next action, with UUIDs relegated to secondary reference data.

## Phase 1: Shared operational shell
- Add or reuse a common page scaffold for operational surfaces.
- The scaffold should include:
  - a page-specific purpose statement
  - a compact status summary strip
  - a filter row when filtering matters
  - a primary list or timeline
  - a secondary detail surface for deep inspection
- The shell must preserve existing routes and backend contracts.

## Phase 2: Rebuild the list semantics
- Review becomes a triage board.
- Deliveries become a dispatch ledger.
- Prompts become a lifecycle ledger.
- Intake becomes an intake inventory with plain-language watcher semantics.
- Logs become an activity stream with explicit source labeling.

## Phase 3: Clarify the journey pages
- Pipeline becomes the canonical "one note, end to end" trace.
- The page should teach the user how to enter the trace from intake or review.
- Diagnostics should explain gaps and missing stages in user language.

## Phase 4: Reduce repeated visual noise
- Replace UUID-led row descriptions with human-readable summaries.
- Group or label entries that are structurally similar.
- Use secondary metadata to distinguish items that otherwise look identical.

## Phase 5: Normalize wording and affordances
- Define shared wording for:
  - review
  - delivery
  - prompt generation
  - watch eligibility
  - lineage trace
  - activity log
- Keep action labels aligned with what the backend can actually do.

## Validation
- A first-time user can answer "what is this page for?" from the header and supporting copy.
- A first-time user can distinguish at least two rows without using UUIDs.
- The review, deliveries, prompts, intake, logs, and pipeline pages each convey a different job-to-be-done.
- The pipeline page explains how to use it without prior knowledge of the backend data model.
- The intake page explains watch eligibility and note path without jargon.

