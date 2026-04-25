# Red-Team Frontend Review: Simplicity, Clarity, Theme Consistency

**Date:** 2026-04-25  
**Reviewer:** Independent red-team assessment  
**Subject:** prompt-forge-console frontend after simplification work

---

## Executive Summary

**Verdict:** Console **mostly simple and clear**, but **theme diverges from Kanban suite**. Extraction work (RoutePreview, KanbanIntegrationPanel) executed correctly. Settings still 1028 LOC, needs tab split. Navigation clear but Health/Dashboard distinction weak.

**Key findings:**
- ✅ Component extraction done right (RoutePreview, KanbanIntegrationPanel)
- ✅ Navigation clear, no confusion about workflow
- ⚠️  Settings still massive (1028 LOC) — tabs needed
- ⚠️  Theme uses `--surface-*` + `--border-vf` + GitHub/Sentry hybrid, **not** Kanban design tokens
- ⚠️  Dashboard vs Health overlap persists (both show backend health)
- ✅ Intake/Prompts/Deliveries correctly kept separate (good call vs proposal)

---

## Theme Consistency: Kanban Suite Alignment

### Finding: **Theme DOES NOT match Kanban**

**prompt-forge-console design system:**
```css
/* Surface hierarchy (--surface-0 to --surface-4) */
--surface-0: hsl(220, 28%, 6%);   /* Page background - darkest */
--surface-1: hsl(220, 25%, 8%);   /* Base content surface */
--surface-2: hsl(220, 22%, 11%);  /* Card container */
--surface-3: hsl(220, 20%, 16%);  /* Elevated component */
--surface-4: hsl(220, 18%, 20%);  /* Overlay/modal - lightest */

/* Border tokens (dark theme) */
--border-vf: hsl(220, 18%, 20%);
--border-bright: hsl(220, 18%, 30%);
--border-focus: hsl(222, 85%, 65%);

/* Typography roles */
--type-h1-size: 2.5rem;
--type-label-size: 0.75rem;
--type-code-size: 0.8125rem;

/* Status palette (opaque) */
--status-blue: hsl(210, 100%, 55%);
--status-green: hsl(145, 60%, 50%);
--status-orange: hsl(38, 92%, 58%);
--status-red: hsl(0, 72%, 60%);
```

**Kanban web-ui design system:**
- Not using `--surface-*` variables (checked: no grep hits in `/lump/apps/kanban/web-ui/src`)
- No `--border-vf` or `--type-*` role tokens
- Kanban uses Tailwind + shadcn/ui with **standard HSL color vars**
- No unified Visual Foundation system across suite

**Reality check:**
- prompt-forge-console uses **custom Visual Foundation** (surface hierarchy, semantic role tokens, spacing scale)
- Kanban uses **Tailwind defaults + shadcn/ui theme** (standard `--background`, `--foreground`, `--primary`, etc.)
- **No shared design system file or token import**

**Evidence from components:**

RoutePreview.tsx uses:
```tsx
border-[color:var(--border-vf)]
bg-[var(--surface-2)]
text-[length:var(--type-label-size)]
px-[var(--space-3)]
```

KanbanIntegrationPanel.tsx uses:
```tsx
border-[var(--border-vf)]
bg-[var(--surface-2)]
text-[var(--type-label-size)]
```

**Kanban components would use:**
```tsx
border-border
bg-card
text-sm
px-3
```

**Conclusion:** Theme systems incompatible. Not part of same suite visually.

---

## Simplicity & Clarity Assessment

### ✅ Navigation: Clear Workflow

**Routes:**
- `/dashboard` — operations summary (health, throughput, queues)
- `/intake` — list intake notes (CRUD grid with filters/pagination)
- `/intake/:id` — single note detail view
- `/pipeline/:intakeNoteId` — trace lineage for one note
- `/prompts` — list prompt generations
- `/deliveries` — list deliveries
- `/review`, `/rules`, `/dictionary`, `/templates`, `/targets` — config surfaces
- `/logs` — audit trail
- `/health` — backend/provider health
- `/settings` — runtime/secrets/integrations/projects

**User flow (note → delivery):**
1. Dashboard → see "Stuck notes" panel → click → `/intake/:id`
2. Intake list → find note → click "View trace" → `/pipeline/:id`
3. Pipeline trace → see prompt generation → click → `/prompts`
4. Prompts list → click "Apply to Kanban" or "Review delivery"

**Assessment:** Flow clear. No confusion. Intake/Prompts/Deliveries as separate list pages = correct decision (vs proposal to merge into tabs).

---

### ⚠️  Dashboard vs Health Overlap

**Dashboard shows:**
- API health card (status + latency)
- Database health card (status + latency)
- Queue depth, failures 24h, avg E2E latency
- Voice routing rollup (Kanban/review/unsupported counts)
- Needs attention panels (review queue, failed deliveries, failed processing, stuck notes)
- Project throughput table

**Health page shows:**
- API health card (status + latency) ← **duplicate**
- Database health card (status + latency) ← **duplicate**
- Provider health cards (if any)
- LLM run aggregate table (by provider/model)

**Overlap:** Both show API + DB health. Dashboard has 4 health cards total, Health has 2+ cards.

**Why they're still separate:**
- Health = infrastructure monitoring (provider probes, LLM run stats)
- Dashboard = work queue summary (throughput, attention items)

**Problem:** Operator sees backend health on **both** pages. Confusing which is "source of truth."

**Fix needed:**
- Remove API/DB cards from Dashboard (keep only queue/failures/throughput)
- Keep Health as **only** place for infra checks
- Or: merge Health into Dashboard as "System status" section (but adds ~40 LOC to already busy page)

**Verdict:** Weak separation. Not broken, but not optimal.

---

### ⚠️  Settings Page: 1028 LOC (Still Too Large)

**Current structure:**
- Single file `/lump/apps/prompt-forge-console/src/pages/Settings.tsx` = **1028 lines**
- No tabs (despite proposal recommending split)
- Inline sections: Runtime, Secrets, Kanban integration, Projects, Danger zone

**Component extraction status:**
- ✅ `KanbanIntegrationPanel` extracted (203 LOC, done)
- ✅ `RoutePreview` extracted (190 LOC, done)
- ❌ Settings tab split **not done** (proposal said 2h, would reduce cognitive load)

**What Settings includes:**
- Runtime config (vault path, webhook, LLM mode, Codex binary, reasoning effort, OpenAI/Anthropic base URLs, Kanban binding)
- Secret management (API keys with masked display)
- Kanban workspace discovery (now in `<KanbanIntegrationPanel>`)
- Project CRUD (create/edit/delete projects)
- Danger zone (purge archived notes, delete project)
- Role switcher, theme switcher, environment badge (duplicated from header)

**Proposal recommended:**
```
/settings
  - Tabs: Runtime | Secrets | Integrations | Projects
  - Runtime: LLM, webhook, folders
  - Secrets: API keys
  - Integrations: Kanban (extracted to <KanbanIntegrationPanel>)
  - Projects: project CRUD + scope switching
```

**Status:** Extraction done, but **tab split not implemented**. Settings still monolithic.

**Assessment:** Component extraction = success. Tab split = deferred. Still too large for easy navigation.

---

### ✅ Component Extraction: Executed Correctly

**RoutePreview component:**
- File: `/lump/apps/prompt-forge-console/src/components/pf/RoutePreview.tsx` (190 LOC)
- Props: `note`, `route`, `kanbanReady`, `kanbanBinding`, `scope`
- Used in: IntakeDetail, Pipeline (can reuse in Logs future)
- Styling: Visual Foundation tokens (`--surface-2`, `--border-vf`, `--space-*`, `--type-*`)
- **No duplication**, clean interface, no state management complexity

**KanbanIntegrationPanel component:**
- File: `/lump/apps/prompt-forge-console/src/components/pf/KanbanIntegrationPanel.tsx` (203 LOC)
- Props: `initialDraft`, `binding`, `onSubmit`
- Used in: Settings (can reuse in future admin views)
- Includes workspace discovery query (via `useKanbanWorkspaceDiscovery` hook)
- Styling: Visual Foundation tokens
- **Isolated Kanban logic**, no settings page coupling

**Assessment:** Both extractions done right. No over-engineering, no premature abstraction. Reusable where needed.

---

### ✅ Avoided Bad Proposal Ideas

**Original proposal flaws (from red-team v1):**
1. "Merge Intake + Prompts + Deliveries into Pipeline" — **REJECTED** (correct decision, would break list UX)
2. "Combine Dashboard + Health into Status" — **REJECTED** (still separate, though overlap exists)
3. Underestimated component extraction time — **CORRECTED** (actual work took ~6h not 3h, realistic)

**What shipped instead:**
- Kept Intake/Prompts/Deliveries as separate list pages ✅
- Extracted RoutePreview + KanbanIntegrationPanel ✅
- Dashboard + Health still separate (weak distinction, but not broken) ⚠️
- Settings still monolithic (tab split deferred) ⚠️

**Assessment:** Avoided breaking changes. Shipped value (extraction). Deferred risky work (merging).

---

## UX Clarity: Common Workflows

### Workflow 1: "Find stuck note and debug"
**Path:** Dashboard → "Stuck notes" panel → click note → `/intake/:id` → "Open pipeline" → `/pipeline/:id`

**Clarity:** ✅ Clear. Dashboard surfaces problem, detail view shows route context, pipeline shows trace.

**Friction:** None. 3 clicks to full trace (reasonable).

---

### Workflow 2: "Review prompt before delivery"
**Path:** Dashboard → "Requires review" panel → click prompt → `/pipeline/:id` (shows full lineage)

**Clarity:** ✅ Clear. Review queue links to pipeline (not prompts list). Operator sees note context + prompt + delivery status.

**Friction:** None. Direct link from queue to trace.

---

### Workflow 3: "Configure Kanban integration"
**Path:** Settings → scroll to "Kanban integration" section → enter baseUrl/workspaceId/passcode → Save

**Clarity:** ⚠️  Settings page long (1028 LOC). Kanban section ~200 lines down. No tabs = scroll hunting.

**Friction:** Medium. Hard to find setting without Cmd+F or scrolling.

**Fix:** Tab split ("Integrations" tab) would solve.

---

### Workflow 4: "Check backend health before deployment"
**Path:** `/health` → see API/DB/provider cards + LLM run table

**Clarity:** ✅ Clear. Single page for infra checks.

**Friction:** Dashboard also shows API/DB cards (duplication confuses "where do I check health?").

**Fix:** Remove health cards from Dashboard, keep only in `/health`.

---

## Visual Foundation Quality

**Design system maturity:**
- ✅ Surface hierarchy (5 levels: `--surface-0` to `--surface-4`)
- ✅ Typography roles (`--type-h1-*`, `--type-label-*`, `--type-code-*`)
- ✅ Spacing scale (`--space-1` to `--space-8`, 4px base unit)
- ✅ Border radius scale (`--radius-sm` to `--radius-xl`)
- ✅ Status palette (opaque HSL: blue, green, orange, red, purple)
- ✅ Border tokens (`--border-vf`, `--border-bright`, `--border-focus`, `--divider`)
- ✅ Light theme variant (`[data-theme="light"]`)
- ✅ High-contrast dark variant (`[data-theme="high-contrast-dark"]`)

**Assessment:** Design system internally consistent. Well-structured. GitHub/Sentry hybrid aesthetic works.

**But:** Not shared with Kanban. Each app has own theme.

---

## Theme Suite Alignment: Detailed Comparison

### Color palette

| Token | prompt-forge-console | Kanban web-ui |
|-------|---------------------|---------------|
| Page background | `--surface-0: hsl(220, 28%, 6%)` | `--background: hsl(220, 25%, 8%)` |
| Card surface | `--surface-2: hsl(220, 22%, 11%)` | `--card: hsl(220, 22%, 11%)` |
| Border | `--border-vf: hsl(220, 18%, 20%)` | `--border: hsl(220, 18%, 20%)` |
| Primary | `--primary: hsl(222, 75%, 52%)` | `--primary: hsl(222, 85%, 65%)` |
| Status success | `--status-green: hsl(145, 60%, 50%)` | shadcn default |
| Status danger | `--status-red: hsl(0, 72%, 60%)` | `--destructive: hsl(0, 72%, 55%)` |

**Surface levels:** prompt-forge uses 5-level hierarchy (`--surface-0` to `--surface-4`). Kanban uses shadcn defaults (`--background`, `--card`, `--popover`).

**Typography:** prompt-forge uses semantic role tokens (`--type-h1-size`, `--type-label-size`). Kanban uses Tailwind utility classes (`text-sm`, `text-lg`, etc.).

**Spacing:** prompt-forge uses `--space-*` scale. Kanban uses Tailwind spacing (`px-3`, `gap-4`, etc.).

**Verdict:** Different design token systems. Not interoperable. Would need **design system unification** to match suite.

---

## Is It Easy to Use?

**For operators (daily users):**
- ✅ Dashboard landing page shows actionable queues (stuck notes, failed deliveries)
- ✅ Intake/Prompts/Deliveries tables have clear filters, pagination, actions
- ✅ Pipeline trace view shows lineage + diagnostics (missing stages, orphan revisions)
- ⚠️  Settings hard to navigate (1028 LOC, no tabs)
- ⚠️  Health vs Dashboard confusion (where do I check API status?)

**For admins (config work):**
- ⚠️  Settings page overwhelming (6+ sections, long scroll)
- ✅ Kanban integration extracted (easier to reason about)
- ✅ Danger zone clearly marked (purge/delete actions)
- ✅ Projects CRUD inline (no separate page needed)

**Overall:** Daily ops = easy. Config work = medium (Settings needs tabs).

---

## Does It Look Like Part of Kanban Suite?

**No.** Different design systems.

**What would make them match:**
1. **Shared design tokens file** — export Visual Foundation from one app, import in others
2. **Unified component library** — extract shared UI kit (buttons, cards, badges) to `/lump/packages/ui`
3. **Consistent surface hierarchy** — all apps use `--surface-0` to `--surface-4` (or all use shadcn)
4. **Unified typography scale** — all apps use `--type-*` role tokens (or all use Tailwind)
5. **Shared status palette** — same HSL values for green/orange/red across apps

**Current state:** Each app independent. No visual cohesion beyond "dark theme + indigo primary."

**Effort to unify:** 2-4 days (extract tokens, create shared package, migrate both apps).

---

## Recommendations

### Priority 1: Fix Settings page (2-4 hours)

**Action:** Split Settings into tabs (Runtime | Secrets | Integrations | Projects).

**Why:** 1028 LOC too large. Tabs reduce cognitive load, improve findability.

**How:**
1. Use shadcn `<Tabs>` component (already available in `/lump/apps/prompt-forge-console/src/components/ui/tabs.tsx`)
2. Extract sections into components: `<RuntimeSettingsPanel>`, `<SecretsPanel>`, `<ProjectsPanel>`
3. Keep `<KanbanIntegrationPanel>` in "Integrations" tab
4. Share draft state via React context (avoid prop drilling)

**Acceptance criteria:**
- Each tab under 250 LOC
- No duplicate state (single source of truth for drafts)
- Save/Cancel buttons shared across tabs (or per-tab if independent)

---

### Priority 2: Deduplicate Health/Dashboard (1 hour)

**Action:** Remove API/DB health cards from Dashboard. Keep only in `/health`.

**Why:** Duplication confuses operators. Single source of truth for infra checks.

**How:**
1. Remove `<HealthCard title="API" />` and `<HealthCard title="Database" />` from Dashboard.tsx
2. Replace with link: `<Link to="/health">View system health →</Link>`
3. Keep queue/failures/throughput metrics on Dashboard (operational work focus)
4. Keep infra checks on `/health` (SRE/oncall focus)

**Acceptance criteria:**
- Dashboard shows **only** work queue state (no infra checks)
- Health shows **only** infra state (no work queues)
- Operator knows which page to check for what

---

### Priority 3: Unify Design System with Kanban (2-4 days)

**Action:** Extract Visual Foundation tokens to shared package, migrate both apps.

**Why:** Suite should look cohesive. Shared design system = easier maintenance, consistent UX.

**How:**
1. Create `/lump/packages/design-tokens` package
2. Export Visual Foundation (surfaces, typography, spacing, status palette, borders)
3. Publish as CSS variables + Tailwind theme config
4. Import in prompt-forge-console (already uses tokens, no change needed)
5. Migrate Kanban web-ui to use tokens (replace Tailwind defaults)

**Acceptance criteria:**
- Both apps import from `@lump/design-tokens`
- Surface hierarchy, typography roles, spacing scale identical
- Status palette (green/orange/red) same HSL values
- Light/dark themes consistent across apps

**Effort:** 2-4 days (design system extraction + migration + testing).

**Defer if:** Suite visual cohesion not a requirement. Current state = functional, just not unified.

---

## Final Verdict

### Simplicity: B+ (mostly simple, Settings too large)

**What works:**
- Navigation clear (Intake → Pipeline → Prompts flow obvious)
- Component extraction clean (RoutePreview, KanbanIntegrationPanel)
- Avoided bad proposal ideas (kept list pages separate)

**What needs work:**
- Settings page too large (tab split would fix)
- Health/Dashboard duplication (remove cards from Dashboard)

---

### Clarity: A- (clear workflow, minor overlaps)

**What works:**
- Dashboard surfaces actionable queues (stuck notes, failed deliveries)
- Pipeline trace view shows full lineage + diagnostics
- Intake/Prompts/Deliveries tables have filters, actions, help tips

**What needs work:**
- Settings findability (tabs would solve)
- Health vs Dashboard confusion (deduplicate cards)

---

### Theme Consistency with Kanban Suite: D (different design systems)

**What works:**
- Internal Visual Foundation consistent (surfaces, typography, spacing, status palette)
- Light/dark/high-contrast themes work
- GitHub/Sentry hybrid aesthetic polished

**What's missing:**
- No shared design tokens with Kanban
- Different surface hierarchy (prompt-forge: `--surface-*`, Kanban: shadcn defaults)
- Different typography scale (prompt-forge: `--type-*`, Kanban: Tailwind utilities)
- No unified component library

**To fix:** Extract design tokens to shared package, migrate both apps (2-4 days).

---

## Conclusion

prompt-forge-console is **simple and clear** for daily ops (A-), but **Settings needs tabs** (B+). Theme is **internally consistent** but **does not match Kanban suite** (D) — would need design system unification to look like one app family.

**Ship blockers:** None. App usable as-is.

**Quality-of-life fixes (recommended):**
1. Split Settings into tabs (2-4h)
2. Deduplicate Health/Dashboard cards (1h)

**Future work (optional):**
3. Unify design system with Kanban (2-4 days)
