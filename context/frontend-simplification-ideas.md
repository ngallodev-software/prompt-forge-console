# Frontend Simplification Ideas

## Current Pain Points

### Navigation Confusion
- 7 top-level pages (Dashboard, Intake, Prompts, Deliveries, Logs, Health, Settings)
- Unclear workflow: where do I start? what's the sequence?
- Intake → Prompts → Deliveries flow hidden across 3 pages
- Dashboard shows summary but no clear actions

### Settings Overload
- Single massive Settings page with 6+ sections
- Kanban integration UI 200+ lines inline
- Hard to find specific setting
- No visual hierarchy between runtime, secrets, Kanban

### Route Preview Duplication
- IntakeDetail shows route preview inline (75+ lines)
- No reuse across Logs or other surfaces
- Route logic lives in service layer but UI is coupled to one page

### Information Architecture
- Logs page shows mixed event types (notes, utterances, prompts, deliveries)
- No clear "project home" view
- Health page isolated from main workflow

## Proposed Simplifications

### 1. Merge Intake + Prompts + Deliveries into "Pipeline"
**Why:** These represent one continuous flow. Splitting confuses users.

```
/pipeline
  - Tabs: Notes → Prompts → Deliveries
  - Each tab shows its stage of the pipeline
  - Clicking a note shows full pipeline for that note (inline detail or modal)
  - Route preview component reusable across all tabs
```

**Benefits:**
- One place to see end-to-end work
- Clearer mental model
- Less nav clicks

### 2. Split Settings into Tabbed Sections
**Why:** Current Settings is 800+ lines, overwhelming.

```
/settings
  - Tabs: Runtime | Secrets | Integrations | Projects
  - Runtime: LLM, webhook, folders
  - Secrets: API keys
  - Integrations: Kanban (extracted to <KanbanIntegrationPanel>)
  - Projects: project CRUD + scope switching
```

**Benefits:**
- Faster to find relevant setting
- Kanban settings isolated
- Each tab under 200 lines

### 3. Extract Reusable Components
**Current duplication:**
- Route preview logic in IntakeDetail only
- Scope badge repeated in 3 places
- Error states inline everywhere

**Extract:**
- `<RoutePreview note={note} kanbanReady={bool} />` — shows route family/target/context
- `<KanbanIntegrationPanel />` — workspace discovery, binding, settings
- `<ErrorBoundary>` — wraps pages, sanitizes all errors
- `<ScopeSelector>` — unified scope/project picker for Settings and filters

### 4. Combine Dashboard + Health into "Status"
**Why:** Both show system state. Dashboard is summary, Health is deep-dive.

```
/status
  - Top: Runtime health (services up/down, queue depth, errors)
  - Bottom: Activity summary (recent notes, prompts in flight, delivery status)
  - Link to /pipeline for action
```

**Benefits:**
- One place for "what's happening now"
- Dashboard gains actionable health info
- Health gains context

### 5. Make Logs Filterable by Pipeline Stage
**Current:** Logs mixed, hard to trace one note through pipeline.

**Proposal:**
- Filter by: Note | Utterance | Prompt | Delivery
- Click note in Logs → jump to /pipeline with that note selected
- Use route preview component inline for note logs

## Implementation Order

1. **Extract `<RoutePreview>` component** (1 hour)
   - Move from IntakeDetail to `src/components/pf/RoutePreview.tsx`
   - Reuse in Logs, Pipeline (future)

2. **Extract `<KanbanIntegrationPanel>` component** (2 hours)
   - Move Kanban section from Settings
   - Include workspace discovery, binding, scope display

3. **Split Settings into tabs** (2 hours)
   - Create tabbed layout
   - Move sections: Runtime, Secrets, Integrations (Kanban panel), Projects

4. **Merge Intake + Prompts + Deliveries into Pipeline** (4 hours)
   - Create `/pipeline` route with 3 tabs
   - Reuse existing queries, just change layout
   - Add inline detail view or modal for note deep-dive

5. **Combine Dashboard + Health into Status** (2 hours)
   - Merge UI, preserve both summary and detail views
   - Add quick links to Pipeline

6. **Add Logs filtering by pipeline stage** (1 hour)
   - Add filter dropdown
   - Link log entries to Pipeline page

## Deferred (Not Urgent)

- Project-scoped URL routing (`/projects/:id/pipeline`)
- Global search across pipeline
- Bulk actions (archive multiple notes)
- Custom dashboards per project

## Success Metrics

- User can go from new note → delivered prompt in 2 clicks (currently 4+)
- Settings page load time under 300ms (split reduces bundle size)
- Zero duplicate route preview code
- 50% reduction in "where do I find X" questions

## Notes

- Keep `/logs` as separate page — it's auditing, not primary workflow
- Don't touch CRUD operations (create prompt, create delivery) — those work
- Focus on reducing navigation depth and visual clutter
