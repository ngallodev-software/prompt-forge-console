# Frontend Unmocking Plan

You are working in the frontend repo at `this repository`.

Goal
- Convert the console from a bootstrap-plus-fallback app into a backend-driven app for all features the backend now supports.
- Remove mock-only UI paths, local draft flows, and silent fallback behaviors once the backend endpoints and persistence exist.
- Keep the app honest: if the backend does not support a feature yet, the UI should say so explicitly rather than pretending the action worked.

This plan follows the backend gap-closure work and assumes the backend is partially done.

Current mocked, local-only, or not-fully-working frontend surfaces

1. Mock fallback and bootstrap dependence
- The service layer still hydrates most lists from `GET /console/bootstrap`.
- `shouldUseMockData()` still allows fallback to seeded fixtures when backend calls fail.
- Hosted preview can still drift toward mock behavior if the API base is misconfigured.

2. Local draft flows
- Template create/edit still uses `upsertTemplateLocal()` in memory.
- Rules creation is still presented as unavailable.
- Rules dry-run is still a disabled sandbox.

3. Partially wired mutations
- Delivery retry, reroute, and status updates are wired but can still fall back to mock behavior.
- Rule precedence updates work, but only `enabled` and `priority` are actually writable.
- Dictionary upsert works as a local fallback when the backend is missing.
- Prompt force-review, clone, priority change, and note archive are only partially real.

4. Inventory-only screens
- Targets currently show inventory and health but not live dispatch.
- Some settings values are local browser preferences only, while backend-managed sections remain read-only.

5. Read-only / placeholder UI that should become real once the backend is ready
- Template activation and versioning flows
- Delivery target health / dispatch
- Delivery history and reroute details
- Backend-managed settings
- Ruleset create / edit / dry-run
- Prompt clone / review / priority flows

Implementation strategy

Phase 1. Remove fallback as the default operating mode
- In hosted and staging-like environments, the app should prefer real backend responses.
- Keep mock fixtures only for local dev and controlled fallback modes.
- Do not let failing backend calls silently replace server data unless the user explicitly opted into mock mode.
- Preserve `STRICT_BACKEND` behavior so unsupported or broken backend contracts are visible immediately.

Phase 2. Convert each local-only flow into a real backend mutation flow
- Replace each local-memory draft or mutation helper with a backend-backed action.
- Keep query invalidation consistent after every successful mutation.
- Surface clear error toasts and inline error states on unsupported or rejected actions.

Phase 3. Clean up inventory-only and read-only screens
- Once the backend supports live execution or editing, remove the “inventory only” or “draft only” framing.
- Convert placeholder warnings to real state indicators or explicit unsupported notices.
- Keep the UI honest for any capability that still does not exist server-side.

Feature-by-feature implementation plan

1. Templates

Current state
- The template editor uses `upsertTemplateLocal()` and writes only to in-memory state.
- The list and detail views already read from the backend when possible, but create/edit is still local draft mode.
- Activation already has a backend mutation wrapper, but the surrounding CRUD is not real yet.

Frontend work
- Replace local draft save with real create/update calls.
- If the backend supports separate create and update endpoints, wire those directly.
- If the backend uses one upsert endpoint, switch the editor to that contract and remove the local-memory path.
- Preserve the existing family/version behavior in the UI.
- Keep template activation as a real backend action and refresh the list after success.
- Remove or reword the “local draft flow” warning once persistence is real.
- Ensure the list panel, detail panel, editor, and activation confirmation all reflect real backend state.

Acceptance criteria
- Creating a template persists across reload.
- Editing a template persists across reload.
- Activation flips backend state and the active template survives refetch.
- No local-memory fallback is needed for normal usage.

2. Rules

Current state
- Rule list and precedence are real enough to inspect, but create path is disabled.
- Only `enabled` and `priority` are writable.
- The sandbox / dry-run panel is intentionally disabled.

Frontend work
- Enable rule creation when the backend exposes the create endpoint.
- Wire the create editor to backend persistence.
- If the backend exposes rule editing beyond `enabled` and `priority`, make those fields writable with real validation.
- Replace the disabled dry-run sandbox with a real request/response flow if the backend implements the dry-run endpoint.
- Keep drag-to-reorder behavior but make it persist through backend writes only.
- If dry-run remains unsupported, keep the panel but label it explicitly as unsupported instead of implying a hidden capability.

Acceptance criteria
- New rules persist.
- Rule edits persist beyond the current session.
- Precedence changes persist and survive reload.
- Dry-run either works end-to-end or is explicitly unsupported.

3. Deliveries

Current state
- Retry, reroute, and status updates exist but can still fall back to mock behavior.
- The list is good enough for review, but delivery history and target routing are not fully operational.

Frontend work
- Remove local mock fallback from delivery mutations once the backend routes are live.
- Keep `retry`, `reroute`, and `status` updates using the real backend only.
- Refresh delivery list, delivery detail, and lineage views after each successful mutation.
- Show explicit errors for rejected retries, missing target ids, and unsupported reroutes.
- Add or enable a delivery detail surface if the backend exposes richer history data.
- Make the queue depth card and retry candidate markers reflect server state, not computed mock state.

Acceptance criteria
- Retry works against real backend history.
- Reroute selects a real target and updates the delivery record.
- Status updates persist and are visible on reload.
- Delivery history reflects the actual sequence of attempts.

4. Targets

Current state
- Targets are inventory only.
- Health and enablement are visible, but dispatch is not actually exposed as an operational action in the UI.

Frontend work
- Once the backend supports dispatch, add explicit actions for supported target types.
- Distinguish target types in the UI:
  - `claude_session`
  - `codex_session`
  - `chat_session`
  - `obsidian_note`
  - `generic_queue`
- Show target health as an operational indicator, not just a static badge.
- If live session targets are attached, show the session id or attachment state.
- If a target is unsupported or detached, disable the dispatch action and explain why.

Acceptance criteria
- Targets can dispatch when backend support exists.
- Unsupported targets remain visibly disabled.
- Health reflects backend validation rather than seeded metadata only.

5. Prompts

Current state
- Read-only prompt inspection is functional.
- Force review, clone, and priority change are exposed as actions but rely on backend support.

Frontend work
- Wire clone to create a real backend prompt row.
- Wire force review to a real backend moderation or review state.
- Keep priority changes tied to backend persistence.
- Refresh prompt detail, review queue, and lineage after mutations.
- If the backend adds more prompt lifecycle states, surface them directly instead of flattening them into generic status badges.

Acceptance criteria
- Clone creates a real new prompt.
- Force review changes backend review state.
- Priority changes persist.

6. Dictionary

Current state
- Upsert is already modeled, but fallback can still mutate local data if the backend is unavailable.

Frontend work
- Remove local fallback for dictionary edits once the backend endpoint is stable.
- Ensure scoped entries round-trip correctly for global, user, and project scopes.
- Keep import/export working, but make imports write to the backend rather than only to local state.
- Refresh dictionary list and any dependent pages after save.

Acceptance criteria
- Dictionary edits survive reload.
- Import writes to the backend.
- Scope/project filtering still works after refetch.

7. Settings

Current state
- Browser-owned preferences are real.
- Backend-managed values are displayed read-only until the backend settings API is available.

Frontend work
- Keep browser-only preferences in Zustand persistence.
- When backend settings endpoints exist, split the page into:
  - local browser preferences
  - backend-managed runtime config
  - backend-managed secrets / infrastructure values
- Make any backend-owned fields editable only through the backend API, not through local state.
- Preserve read-only treatment for secrets and deployment values that should not live in the browser.

Acceptance criteria
- Local preferences remain persistent and editable.
- Backend-managed settings are editable only when the server contract exists.
- Secrets are never exposed in plaintext.

8. Health, logs, dashboard, and metrics

Current state
- These pages are mostly read surfaces and are already functional enough to inspect.
- They still lean on bootstrap data and aggregate computations.

Frontend work
- Prefer real backend data over bootstrap snapshot data once the backend surfaces are live.
- Keep fallback computation only as a controlled local dev path.
- Make dashboard cards, health cards, and log fingerprint panels read server truth directly.
- Keep query inspector support for diagnosis, but do not let it hide broken backend state.

Acceptance criteria
- Health and aggregate cards reflect the real backend.
- Log fingerprint and throughput cards update from backend state.
- Bootstrap remains a startup convenience, not the final source of truth.

9. Intake, Intake Detail, and Pipeline

Current state
- Read paths are fairly complete but still derive lineage from hydrated snapshot data.
- Pipeline diagnostics are inferred from the loaded dataset.

Frontend work
- Keep the dedicated lineage endpoint as the source of truth.
- Remove any residual snapshot-only assumptions from the lineage and diagnostics views.
- Keep the help tooltips added in part 1.
- Refresh lineage, intake detail, prompt, and delivery views consistently after mutations.

Acceptance criteria
- Lineage pages show backend truth after reload.
- Diagnostics still work when backend records are complete.
- Missing backend data is obvious rather than quietly synthesized.

10. Review queue

Current state
- Review queue is a grouped read surface and is useful already.
- It still depends on a mix of prompt, delivery, and failed-run states.

Frontend work
- Keep review grouping aligned with the backend states introduced during the backend gap closure.
- If the backend exposes explicit review queue records, switch to those instead of client-side grouping.
- Preserve quick navigation into pipeline and delivery views.

Acceptance criteria
- Review queue reflects real backend state.
- Items still deep-link into the relevant detail pages.

11. Error handling and fallback policy

Current state
- The service layer still contains mock fallback logic for many reads and writes.

Frontend work
- Gradually remove mock fallback paths from the service layer once the backend contract is stable for each feature.
- Keep dev-only fallback behind explicit configuration.
- When a route is truly unsupported, show a clear unsupported state instead of a fake success path.
- Keep backend error classes mapped to user-facing copy consistently.

Acceptance criteria
- Production-like environments do not silently use mock data.
- Unsupported features fail clearly.
- User messaging matches the actual backend capability.

Detailed execution order

1. Stabilize configuration
- Verify the frontend API base and bootstrap path point at the real backend.
- Keep the mock toggle only for local development.

2. Switch feature-by-feature
- Templates first, because the current local draft flow is the most visibly fake.
- Then rules, because create and dry-run are currently explicit gaps.
- Then deliveries and targets, because those are the main operational workflows.
- Then dictionary and prompt actions.
- Then settings backend fields.

3. Tighten read paths
- Replace any remaining bootstrap-derived state with real endpoint responses where available.
- Keep bootstrap only as an initial hydration layer.

4. Remove mock fallback
- After each backend surface is confirmed, delete or gate the corresponding fallback branch.
- Do not remove fallbacks for features that are not yet supported.

5. Revalidate
- Run the frontend build after each feature wave.
- Verify persisted state survives reload.
- Verify unsupported actions fail with explicit messaging.

Backend dependency checklist
- The backend should already provide:
  - real settings storage for server-owned values
  - template create/update
  - rules create and dry-run if the UI keeps those surfaces
  - live delivery target dispatch
  - delivery history and reroute/retry/status persistence
  - real prompt lifecycle mutations
- If any backend dependency is still missing, keep the UI honest and leave the corresponding control disabled with explicit copy.

Definition of done
- No user-facing page in the console relies on mock data for core workflows in hosted/staging use.
- Any remaining mock mode is explicit, opt-in, and clearly local-development-only.
- Every currently fake-looking action either works against the backend or clearly says it is unsupported.
- The UI remains consistent with the current design system and the tooltip/help improvements already rolled out.
