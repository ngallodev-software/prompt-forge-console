# Frontend Unmocking Execution Checklist

Use this checklist to execute [frontend-unmocking-plan.md](../../docs/phased-impl/frontend-unmocking-plan.md).

Scope
- Frontend repo: `this repository`
- Goal: remove mock/local-only behavior feature by feature as backend support lands
- Rule: do not delete fallback until the backend path is verified

Owners
- `core`: service layer, bootstrap, fallback policy, shared query keys
- `settings`: settings page, persisted UI preferences, runtime read-only sections
- `templates`: template CRUD and activation flow
- `rules`: rules list, create/edit, reorder, dry-run
- `deliveries`: delivery retry/reroute/status/history
- `targets`: target inventory and live dispatch UI
- `dictionary`: term upsert and import/export
- `prompts`: prompt lifecycle actions
- `health`: dashboard, health, logs, metrics
- `pipeline`: intake detail, pipeline trace, review queue

Completion rule
- Mark a task done only after the backend endpoint exists, the frontend uses it, and `npm run build` passes.

---

## 1. Core service layer

Owner: `core`

- [ ] Remove mock fallback for features whose backend routes are stable.
  - File targets:
    - [src/services/promptforge/api.ts](../../src/services/promptforge/api.ts)
    - [src/services/promptforge/config.ts](../../src/services/promptforge/config.ts)
  - Done when:
    - hosted/staging does not silently substitute mock data
    - local dev can still opt into fallback

- [ ] Keep bootstrap hydration as startup convenience, not source of truth.
  - File targets:
    - [src/services/promptforge/api.ts](../../src/services/promptforge/api.ts)
    - [src/services/promptforge/query-catalog.ts](../../src/services/promptforge/query-catalog.ts)
  - Done when:
    - dedicated routes override bootstrap state
    - cache invalidation still works after mutations

- [ ] Verify query keys still align with backend responses.
  - File targets:
    - [src/services/promptforge/api.ts](../../src/services/promptforge/api.ts)
    - [src/services/promptforge/mutation-invalidation.ts](../../src/services/promptforge/mutation-invalidation.ts)
  - Done when:
    - list/detail mutation flows invalidate the right caches

---

## 2. Templates

Owner: `templates`

- [ ] Replace `upsertTemplateLocal()` with real backend CRUD.
  - File targets:
    - [src/pages/Templates.tsx](../../src/pages/Templates.tsx)
    - [src/services/promptforge/api.ts](../../src/services/promptforge/api.ts)
    - [src/services/promptforge/types.ts](../../src/services/promptforge/types.ts)
  - Done when:
    - create/edit persists across reload
    - no local-memory draft path is used in normal operation

- [ ] Keep activation real and refetch after success.
  - File targets:
    - [src/pages/Templates.tsx](../../src/pages/Templates.tsx)
    - [src/services/promptforge/api.ts](../../src/services/promptforge/api.ts)
  - Done when:
    - active template state survives refresh
    - inactive siblings are handled by backend rules

- [ ] Remove the “local draft flow” warning once backend CRUD is live.
  - File targets:
    - [src/pages/Templates.tsx](../../src/pages/Templates.tsx)
  - Done when:
    - page no longer reads like a mock editor

---

## 3. Rules

Owner: `rules`

- [ ] Enable rule creation against real backend endpoints.
  - File targets:
    - [src/pages/Rules.tsx](../../src/pages/Rules.tsx)
    - [src/services/promptforge/api.ts](../../src/services/promptforge/api.ts)
    - [src/services/promptforge/types.ts](../../src/services/promptforge/types.ts)
  - Done when:
    - new rules persist
    - create form is no longer labeled unavailable

- [ ] Wire any newly supported editable rule fields.
  - File targets:
    - [src/pages/Rules.tsx](../../src/pages/Rules.tsx)
  - Done when:
    - frontend editable fields match backend writable fields

- [ ] Keep reorder/save behavior backed by persistence only.
  - File targets:
    - [src/pages/Rules.tsx](../../src/pages/Rules.tsx)
  - Done when:
    - precedence survives reload
    - no fallback mutation branch remains for production usage

- [ ] Replace or remove dry-run sandbox depending on backend support.
  - File targets:
    - [src/pages/Rules.tsx](../../src/pages/Rules.tsx)
  - Done when:
    - sandbox is either functional or explicitly unsupported

---

## 4. Deliveries

Owner: `deliveries`

- [ ] Remove retry/reroute/status fallback once backend routes are stable.
  - File targets:
    - [src/pages/Deliveries.tsx](../../src/pages/Deliveries.tsx)
    - [src/services/promptforge/api.ts](../../src/services/promptforge/api.ts)
  - Done when:
    - delivery actions operate only on backend state
    - no mock success path remains

- [ ] Add delivery history detail if backend now persists attempt history.
  - File targets:
    - [src/pages/Deliveries.tsx](../../src/pages/Deliveries.tsx)
    - [src/services/promptforge/api.ts](../../src/services/promptforge/api.ts)
  - Done when:
    - users can inspect retry attempts and reroute outcomes

- [ ] Keep queue depth derived from server truth.
  - File targets:
    - [src/pages/Dashboard.tsx](../../src/pages/Dashboard.tsx)
    - [src/pages/Deliveries.tsx](../../src/pages/Deliveries.tsx)
  - Done when:
    - counts match backend queue state

---

## 5. Targets

Owner: `targets`

- [ ] Add real dispatch actions for supported targets.
  - File targets:
    - [src/pages/Targets.tsx](../../src/pages/Targets.tsx)
    - [src/services/promptforge/types.ts](../../src/services/promptforge/types.ts)
    - [src/services/promptforge/api.ts](../../src/services/promptforge/api.ts)
  - Done when:
    - `claude_session`, `codex_session`, `chat_session`, `obsidian_note`, and `generic_queue` are handled explicitly

- [ ] Surface target health and attachment state from backend validation.
  - File targets:
    - [src/pages/Targets.tsx](../../src/pages/Targets.tsx)
  - Done when:
    - `ok`, `degraded`, `unknown`, and `error` reflect real state

- [ ] Show explicit unsupported/disabled states for non-executable targets.
  - File targets:
    - [src/pages/Targets.tsx](../../src/pages/Targets.tsx)
  - Done when:
    - UI never implies a dead target is dispatchable

---

## 6. Dictionary

Owner: `dictionary`

- [ ] Remove local mutation fallback for term upsert.
  - File targets:
    - [src/pages/Dictionary.tsx](../../src/pages/Dictionary.tsx)
    - [src/services/promptforge/api.ts](../../src/services/promptforge/api.ts)
  - Done when:
    - import and manual save survive reload

- [ ] Make bulk import write through backend persistence.
  - File targets:
    - [src/pages/Dictionary.tsx](../../src/pages/Dictionary.tsx)
  - Done when:
    - imported terms appear after refresh

---

## 7. Prompts

Owner: `prompts`

- [ ] Replace clone / force-review / priority update fallback behavior with backend-only state.
  - File targets:
    - [src/pages/Prompts.tsx](../../src/pages/Prompts.tsx)
    - [src/services/promptforge/api.ts](../../src/services/promptforge/api.ts)
  - Done when:
    - actions persist and refetch cleanly

- [ ] Add any missing prompt detail states the backend now exposes.
  - File targets:
    - [src/pages/Prompts.tsx](../../src/pages/Prompts.tsx)
  - Done when:
    - prompt review and lifecycle state are honest to backend data

---

## 8. Settings

Owner: `settings`

- [ ] Keep browser-only preferences in persisted app state.
  - File targets:
    - [src/stores/app-store.ts](../../src/stores/app-store.ts)
    - [src/pages/Settings.tsx](../../src/pages/Settings.tsx)
  - Done when:
    - theme, role, workspace, debug, polling, and environment survive reload

- [ ] Wire backend-managed settings only after the backend endpoints exist.
  - File targets:
    - [src/pages/Settings.tsx](../../src/pages/Settings.tsx)
    - [src/services/promptforge/api.ts](../../src/services/promptforge/api.ts)
  - Done when:
    - read-only sections become editable only through real APIs

- [ ] Keep secrets/infrastructure fields redacted or read-only.
  - File targets:
    - [src/pages/Settings.tsx](../../src/pages/Settings.tsx)
  - Done when:
    - no secret-bearing value is exposed in plain browser state

---

## 9. Health, logs, dashboard

Owner: `health`

- [ ] Prefer real backend aggregates over bootstrap-computed summaries.
  - File targets:
    - [src/pages/Dashboard.tsx](../../src/pages/Dashboard.tsx)
    - [src/pages/Health.tsx](../../src/pages/Health.tsx)
    - [src/pages/Logs.tsx](../../src/pages/Logs.tsx)
  - Done when:
    - health, error fingerprints, throughput, and queue depth reflect backend truth

- [ ] Keep fallback computation only for local dev or backend outage handling.
  - File targets:
    - [src/services/promptforge/api.ts](../../src/services/promptforge/api.ts)
  - Done when:
    - production-like usage does not silently degrade to fixtures

---

## 10. Intake, Intake Detail, Pipeline, Review

Owner: `pipeline`

- [ ] Keep lineage sourced from real backend endpoints.
  - File targets:
    - [src/pages/Pipeline.tsx](../../src/pages/Pipeline.tsx)
    - [src/pages/IntakeDetail.tsx](../../src/pages/IntakeDetail.tsx)
    - [src/services/promptforge/api.ts](../../src/services/promptforge/api.ts)
  - Done when:
    - pipeline and detail pages survive refresh without bootstrap-only assumptions

- [ ] Keep review queue aligned with backend state.
  - File targets:
    - [src/pages/Review.tsx](../../src/pages/Review.tsx)
  - Done when:
    - queue items deep-link correctly and count accurately

- [ ] Leave the tooltip/help improvements intact while removing fake copy.
  - File targets:
    - [src/pages/Pipeline.tsx](../../src/pages/Pipeline.tsx)
  - Done when:
    - no prompt-leak-style body copy returns

---

## 11. Verification

Owner: `core`

- [ ] Run frontend build after each feature wave.
  - Command:
    - `npm run build`
  - Done when:
    - build passes with no type errors

- [ ] Verify reload persistence for every newly backed setting or editor.
  - Done when:
    - state survives a hard refresh

- [ ] Verify unsupported actions fail clearly.
  - Done when:
    - UI shows explicit unsupported or disabled copy instead of fake success

- [ ] Verify production-like environments do not use mock fixtures.
  - Done when:
    - backend errors surface instead of fixture substitution

---

## Suggested execution order

1. `templates`
2. `rules`
3. `deliveries`
4. `targets`
5. `dictionary`
6. `prompts`
7. `settings`
8. `health`
9. `pipeline`
10. `core`

This order works because it removes the most visible fake flows first, then tightens the data surfaces the rest of the console depends on.
