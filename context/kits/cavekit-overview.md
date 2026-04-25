---
created: "2026-04-24T23:00:00Z"
last_edited: "2026-04-24T23:00:00Z"
---

# Cavekit Overview

## Project
Prompt Forge Console — React + TypeScript operator console for prompt generation pipeline

## Redesign Scope
UI simplification + Kanban visual migration (4 domains, 22 requirements)

## Domain Index
| Domain | Cavekit File | Requirements | Status | Description |
|--------|-----------|-------------|--------|-------------|
| Visual Foundation | cavekit-visual-foundation.md | 7 | DRAFT | Surface hierarchy, themes, typography, status palette |
| Page Consolidation | cavekit-page-consolidation.md | 5 | DRAFT | Settings tabs, trace links, Pipeline list |
| Component Extraction | cavekit-component-extraction.md | 5 | DRAFT | RoutePreview + KanbanIntegrationPanel extraction |
| Integration Refactor | cavekit-integration-refactor.md | 5 | DRAFT | Discovery unification, debounce verification |
| Ops Surface | cavekit-ops-surface.md | 9 | EXISTING | Operations surface requirements (prior work) |
| Kanban Harness UI | cavekit-kanban-task-creation-harness-ui.md | 4 | EXISTING | Kanban task creation UI (prior work) |

## Cross-Reference Map
| Domain A | Interacts With | Interaction Type |
|----------|---------------|-----------------|
| Visual Foundation | Component Extraction | Provides design tokens |
| Visual Foundation | Page Consolidation | Provides layout tokens |
| Component Extraction | Page Consolidation | Provides reusable components |
| Component Extraction | Visual Foundation | References design tokens |
| Integration Refactor | Component Extraction | Uses KanbanIntegrationPanel |
| Integration Refactor | Visual Foundation | References status tone tokens |
| Page Consolidation | Component Extraction | Consumes RoutePreview + KanbanPanel |
| Page Consolidation | Visual Foundation | References tab styling tokens |

## Dependency Graph

**Implementation order (redesign domains only):**

1. **Visual Foundation** (no dependencies) — establishes design tokens
2. **Component Extraction** (depends on Visual Foundation) — creates reusable components
3. **Integration Refactor** (depends on Component Extraction) — uses KanbanIntegrationPanel
4. **Page Consolidation** (depends on Component Extraction + Visual Foundation) — uses extracted components + tokens

**Parallelization:** Component Extraction + Integration Refactor can run in parallel after Visual Foundation completes.

## Statistics

**Redesign domains:** 4
**Total requirements (redesign):** 22
**Acceptance criteria (redesign):** ~90 (avg 4 per requirement)

**Existing domains:** 2
**Total requirements (existing):** 13

**Combined total:** 6 domains, 35 requirements
