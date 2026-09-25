# Settings Page Review + Backend Follow-Up Prompt

You are working in the frontend repo at `this repository`.

Goal
- Perform a thorough review of the Settings page and implement it so it is clearly functional, editable, and not presentation-only.
- Preserve the existing app architecture and component system.
- After the frontend work is complete, produce a second artifact: a backend implementation prompt that can be executed in the backend repo to add the server-side support required by the frontend changes.

Primary focus
- `src/pages/Settings.tsx`
- `src/stores/app-store.ts`
- `src/services/promptforge/types.ts`
- `src/services/promptforge/api.ts`
- `src/services/promptforge/query-catalog.ts`
- related shell, form, and permission components used by the page

What to inspect first
- Existing Settings page behavior and visual state
- Whether the page still implies mock data or fake config
- Which fields should be editable vs read-only
- Which settings are local UI preferences vs backend-managed runtime config
- Whether any controls are disabled incorrectly
- Whether the page is hiding capability behind placeholder data
- Whether current contracts already support persistence or need extension

Implementation requirements
1. Make the Settings page honest and usable
- Remove any remaining mock-looking configuration blocks.
- If a field is editable only locally, label it as local browser persistence.
- If a field must be backend-managed, do not fake persistence; clearly mark it read-only until backend support exists.
- Keep the page operational for operator/admin workflows.

2. Split settings into clear domains
- Local console preferences
- Runtime configuration values
- Backend-managed secrets or infrastructure values
- Query catalog docs and admin actions
- Do not mix fake env text with editable inputs.

3. Persist frontend-only settings
- Use the existing app store pattern for persisted UI preferences.
- Persist values like theme, role, workspace, debug, polling, and any new console settings that are truly frontend-owned.
- Add typed state and explicit update/reset actions.
- Keep the store shape stable where possible.

4. Preserve contracts
- Avoid breaking existing page routes.
- Preserve existing query key shapes and service signatures unless there is a strong reason not to.
- If any type additions are needed, make them explicit and minimal.

5. Make controls genuinely editable
- Inputs must be actual form elements with working change handlers.
- If a value is derived from runtime env or backend state, show it read-only and explain why.
- Use accessible labels and clear affordances.
- Do not leave sections looking like form fields if they are not meant to be changed.

6. Respect permissions
- Keep admin-only actions behind permission checks.
- If a section is operator-visible but not editable, say so explicitly.
- Do not weaken role guards.

7. Keep the UI consistent
- Match the existing design language and component system.
- Do not introduce a redesign unless necessary to fix usability.
- Avoid placeholder text that looks like production config when it is not.

8. Validate thoroughly
- Run the frontend build.
- Fix type errors, lint errors, and broken imports.
- Verify the page renders and the controls can be changed.
- Verify persisted state survives reload.
- Verify the page no longer reads like mock data.

Technical details to consider
- The app already uses Zustand with persistence.
- The Settings page currently contains hardcoded redacted env text that should not be treated as live editable config.
- There is no backend settings API yet, so frontend persistence may be the correct interim behavior for some values.
- Some values likely belong to the backend repo instead of the frontend repo, especially secret-bearing or deployment-specific values.
- Keep the distinction between frontend-local preferences and backend deployment config very clear.

Guardrails
- Do not introduce secrets, tokens, real vault paths, or real hostnames into committed code.
- Do not change unrelated pages unless required by shared state or shared components.
- Do not remove existing functionality unless replacing it with a real equivalent.
- Do not silently degrade to mock data.
- Do not create a backend implementation in this step.
- Do not overcomplicate the frontend if the backend is not ready.
- Prefer small, explicit changes over broad refactors.

Deliverables for the frontend repo
- Updated Settings page with real editable controls where appropriate
- Updated typed store/state if needed
- Updated shared types if needed
- Build verification
- Short implementation summary

Second deliverable: backend follow-on prompt artifact
After the frontend changes are complete, create a markdown artifact in the repo at:

- `docs/phased-impl/settings-backend-support-prompt.md`

This artifact must be a standalone prompt for the backend repo at `the Prompt Forge backend repository` that instructs a backend agent to implement the server-side support required by the frontend settings changes.

The backend prompt artifact must include:
- the exact frontend behavior that now needs server support
- the required persistence model for settings
- the backend endpoints needed
- any schema changes or migrations
- validation rules
- permission rules
- read/write semantics for secrets vs non-secret settings
- audit logging requirements if needed
- test coverage requirements
- acceptance criteria
- rollout and compatibility notes

Backend prompt artifact scope
- It must be detailed enough for another agent to implement the backend without guessing.
- It must not ask the backend agent to redesign the frontend.
- It must preserve backward compatibility where possible.
- It must explicitly call out any settings that remain frontend-only and should not be moved to the backend.

Recommended backend areas to cover in the artifact
- settings storage tables or config records
- API routes for reading and updating settings
- serialization and validation
- auth/role checks
- secrets handling
- bootstrap payload integration if relevant
- test cases for read/write/update/permission failures

Execution order
1. Review the current Settings page and related state.
2. Implement the frontend corrections.
3. Verify the frontend builds.
4. Write the backend prompt artifact.
5. Ensure the artifact is precise enough to hand off directly to a backend agent.

Output format
- Make the code changes in the frontend repo.
- Then create the backend prompt artifact markdown file.
- Provide a concise summary of what changed and where the backend follow-up prompt lives.
