# Cavekit: Kanban Task Creation Harness UI

## Scope

This cavekit defines the Prompt Forge Console surface for local Kanban task creation using the existing Kanban import `v1` contract.

It covers:

- operator entry point selection
- manifest preview and apply affordance
- local success/failure feedback
- linkage back to Prompt Forge lineage

It does not cover:

- remote multi-user setup
- generalized target management
- replacing backend ownership of manifest derivation

## Requirements

### R1: Console remains an operator surface, not contract owner

**Description:** Console triggers and displays the harness flow, but backend owns manifest derivation and apply semantics.

**Acceptance Criteria:**
- [ ] UI does not reimplement Kanban manifest mapping rules in page code.
- [ ] UI calls backend/service-layer functions for manifest preview/apply.
- [ ] UI presents results returned by backend/client adapter rather than synthesizing them.

### R2: Entry point is low-drift and context-rich

**Description:** v1 should attach to an existing operator surface where prompt lineage and review context already exist.

**Acceptance Criteria:**
- [ ] Chosen entry point is one of: prompt detail, intake detail, or pipeline trace.
- [ ] Entry point gives operator enough context to know what will be sent to Kanban.
- [ ] Entry point displays `prompt_generation.id` as the canonical source artifact id that backend will use for identity.
- [ ] Entry point does not require a brand-new top-level route for v1.

### R3: Manifest preview is explicit

**Description:** Before apply, operator can inspect the derived Kanban manifest or a meaningful summary of it.

**Acceptance Criteria:**
- [ ] UI exposes either raw manifest JSON or a readable summary with task count, link count, and start intent.
- [ ] Preview clearly shows the source Prompt Forge record(s), source revision, and workspace target.
- [ ] Preview shows `kanbanBaseUrl` and `kanbanWorkspaceId` values used for apply.
- [ ] Preview payload is returned by backend/service-layer code, not reconstructed in page code.
- [ ] Missing required data surfaces before apply attempt.

### R4: Apply result is explicit and traceable

**Description:** Operator must see whether Kanban created tasks, replayed existing tasks, created links, or failed.

**Acceptance Criteria:**
- [ ] UI shows `taskMappings`, `linkResults`, and `startResults` or a faithful summary.
- [ ] Failure state includes the Kanban error code/message when available.
- [ ] UI distinguishes import committed / start failed from full import failure.
- [ ] Success state links back to the source Prompt Forge record context.

### R5: Local validation path is first-class

**Description:** v1 is a local dogfood harness. UI must make that assumption explicit.

**Acceptance Criteria:**
- [ ] Copy or settings indicate local Kanban runtime expectation.
- [ ] UI makes missing `kanbanBaseUrl` / `kanbanWorkspaceId` a blocked preflight state, not a best-effort apply.
- [ ] UI does not imply production-grade remote robustness.
- [ ] Validation docs include a real local runbook.

### R6: v1 stays narrow

**Description:** First UI should support one clear local apply path, not broad integration management.

**Acceptance Criteria:**
- [ ] No new global integration dashboard in v1.
- [ ] No bidirectional sync UI in v1.
- [ ] No multi-target orchestration UI in v1.

## Out of Scope

- generic external target manager
- production secret storage for Kanban endpoints
- full reconciliation dashboard
- background polling for Kanban execution state

## Residual Risks

- A prompt-detail entry point is convenient but can drift from canonical source lineage if the backend source boundary is not shown explicitly.
- Local runtime assumptions can make the UI feel reliable while the underlying Kanban workspace binding is wrong.

## Cross-References

- `context/refs/kanban-local-harness.md`
- `/lump/apps/prompt-forge/context/kits/cavekit-kanban-task-creation-harness.md`
