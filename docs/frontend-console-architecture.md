# PromptForge Frontend / Console Architecture

## Modeling assumptions
- Directly evidenced current structures: the console is a browser-based operator surface, most reads hydrate through `/console/bootstrap`, mutations already exist for several admin actions, and the backend is the canonical state holder.
- Minimally inferred from backend console capabilities: a modular admin console split into setup, configuration, review, operations, observability, and assist workflows.
- Future-state elements: stronger authN/authZ, richer realtime sync, safer destructive-action UX, and multi-operator readiness. These are proposed only unless explicitly implemented.

## 1. Frontend System Context Diagram

**CURRENT STATE**

```mermaid
flowchart LR
  operator[Local operator]
  obsidian[Obsidian\nPrimary intake surface]
  console[PromptForge Console\nOperator/admin control plane]
  api[PromptForge API / Backend\nCanonical app logic]
  pg[(Postgres\nSystem of record)]
  n8n[n8n\nOptional automation]
  llm[External LLM providers]
  targets[Delivery targets\nCodex / Claude / Chat / Notes / Queue]

  operator --> obsidian
  operator --> console
  obsidian -->|raw structured voice notes| api
  console -->|read views, bootstrap, mutations| api
  api -->|persist canonical state| pg
  api -->|trigger workflows / delivery events| n8n
  api -->|LLM assist / generation / review| llm
  api -->|dispatch / status / retries| targets
  targets -->|delivery status / ack / failure| api
  n8n -->|optional downstream automation| api

  subgraph boundary1[Local trusted environment]
    operator
    obsidian
    console
    api
    pg
  end

  subgraph boundary2[External / downstream]
    n8n
    llm
    targets
  end
```

**GAPS**
- Obsidian is the intake truth, but console UX can still look like it owns workflow truth if lineage labels are vague.
- Delivery targets are not all necessarily executable live targets yet.
- LLM assist and downstream automation must remain visibly backend-controlled, not UI-implied.

**FUTURE STATE**
- The console remains a control plane only, with clearer separation between intake, generation, delivery, and automation.
- Live target capabilities are explicit per target type and failure mode.

**What this shows**
- The console is not the primary intake surface.
- Postgres and backend orchestration own truth.

---

## 2. Frontend Container / Runtime Diagram

**CURRENT STATE**

```mermaid
flowchart TB
  subgraph browser[Browser boundary]
    ui[PromptForge Console UI\nSPA / client runtime]
    cache[Query cache / local UI state]
    forms[Form state / drafts / confirmations]
  end

  subgraph local[Local / self-hosted boundary]
    api[PromptForge API / Backend]
    db[(Postgres)]
  end

  ui --> cache
  ui --> forms
  ui -->|HTTP fetch / mutations| api
  api -->|SQL / canonical persistence| db
  api -->|bootstrap hydration| ui

  note1[[Trust boundary:\nBrowser cannot own canonical truth]]
  note2[[Trust boundary:\nBackend controls mutations and validation]]

  ui -.-> note1
  api -.-> note2
```

**GAPS**
- Current browser runtime still needs to avoid any implied source-of-truth behavior.
- Hosted preview can drift toward fallback paths if API routing is weak.

**FUTURE STATE**
- The frontend can stay a thin SPA, or be server-served by the backend, but the trust boundary stays the same.
- Query cache and optimistic state remain temporary only.

**What this shows**
- Browser state is temporary.
- Backend and Postgres remain canonical.

---

## 3. Frontend Module / Component Architecture Diagram

**CURRENT STATE**

```mermaid
flowchart TB
  subgraph shared[Shared infrastructure]
    shell[Shell / navigation]
    api[Shared API client]
    query[Shared query / cache layer]
    forms[Form + validation layer]
    errors[Error / loading / toast layer]
    help[Shared contextual help / tooltip layer]
  end

  subgraph config[Configuration modules]
    bootstrap[Bootstrap / setup]
    settings[Settings / secrets / runtime config]
    rules[Rulesets / rules]
    dict[Dictionary]
    templates[Templates]
    targets[Targets]
  end

  subgraph review[Review / inspection modules]
    prompts[Prompt generation review]
    deliveries[Delivery operations]
    lineage[Lineage / inspection]
    logs[Logs / metrics / audit]
    assist[LLM assist]
  end

  subgraph ops[Operational modules]
    dashboard[Dashboard]
    health[Health]
    intake[Intake / intake detail]
    reviewq[Review queue]
  end

  shell --> bootstrap
  shell --> settings
  shell --> rules
  shell --> dict
  shell --> templates
  shell --> targets
  shell --> prompts
  shell --> deliveries
  shell --> lineage
  shell --> logs
  shell --> assist
  shell --> dashboard
  shell --> health
  shell --> intake
  shell --> reviewq

  bootstrap --> api
  settings --> api
  rules --> api
  dict --> api
  templates --> api
  targets --> api
  prompts --> api
  deliveries --> api
  lineage --> api
  logs --> api
  assist --> api
  dashboard --> query
  health --> query
  intake --> query
  reviewq --> query

  api --> query
  query --> forms
  forms --> errors
  forms --> help
```

**GAPS**
- Shared help and shared error handling need to stay consistent across all screens.
- Operational, configuration, and inspection surfaces must not collapse into one generic CRUD pattern.

**FUTURE STATE**
- Deeper submodules per domain can emerge, but the top-level split should remain stable.
- Shared infrastructure should stay centralized to prevent drift in validation, help, and mutation handling.

**What this shows**
- The console is domain-sliced, not feature-sliced by generic widgets.
- Shared infrastructure should be reused everywhere.

---

## 4. Screen Map / Information Architecture Diagram

**CURRENT STATE**

```mermaid
flowchart TB
  root[Console landing / dashboard]

  setup[Bootstrap / initial setup]
  config[Configure]
  review[Review]
  operate[Operate]
  observe[Observe]

  root --> setup
  root --> config
  root --> review
  root --> operate
  root --> observe

  config --> settings[Settings]
  config --> rulesets[Rulesets]
  config --> dictionary[Dictionary]
  config --> templates[Templates]
  config --> targets[Targets]

  review --> prompts[Prompts]
  review --> deliveries[Deliveries]
  review --> lineage[Audit / lineage]
  review --> assist[LLM assist]

  operate --> intake[Intake]
  operate --> intakeDetail[Intake detail]
  operate --> retry[Retry / reroute / reprioritize]
  operate --> archive[Archive / force review]

  observe --> health[Health]
  observe --> logs[Logs]
  observe --> metrics[Metrics]
  observe --> runs[Processing runs]

  setup --> bootstrap[Bootstrap screen]
  settings --> runtime[Runtime / secrets]
  rulesets --> rules[Rules editor]
  dictionary --> terms[Term editor]
  templates --> templateEditor[Template editor]
  targets --> targetHealth[Target health / dispatch]
```

**GAPS**
- Navigation should make operator workflows obvious, not force users to infer them from page names.
- Some screens are still partly inventory views instead of fully operational surfaces.

**FUTURE STATE**
- Each top-level group becomes a stable operator journey.
- Screen grouping should mirror the backend lifecycle: intake, generation, delivery, observation, recovery.

**What this shows**
- The console should read like an operator map.
- Page grouping should follow workflow, not implementation artifact.

---

## 5. Data Flow Diagram (Frontend ↔ Backend)

**CURRENT STATE**

```mermaid
flowchart LR
  subgraph ui[Frontend UI]
    view[Screen / card / form]
    local[Local UI state]
    cache[Query cache]
  end

  subgraph client[API client layer]
    adapter[PromptForge API adapter]
    keys[Query keys / invalidation]
  end

  subgraph backend[Backend]
    routes[Console/admin routes]
    logic[Domain logic / transitions]
    audit[Audit + history]
  end

  subgraph storage[Persistent state]
    pg[(Postgres)]
  end

  view <--> local
  view <--> cache
  view --> adapter
  adapter --> keys
  adapter --> routes
  routes --> logic
  logic --> audit
  logic --> pg
  pg --> logic
  logic --> routes
  routes --> adapter
  adapter --> cache
  cache --> view

  source[[Canonical truth lives in backend + Postgres]]
  view -.-> source
```

**GAPS**
- Mutations must never be treated as successful if the backend rejects or cannot persist them.
- Snapshot/bootstrap data should not outlive a successful refetch.

**FUTURE STATE**
- More reads should come from dedicated backend routes instead of bootstrap-derived client synthesis.
- Mutations should emit consistent invalidation behavior and explicit failure state.

**What this shows**
- The frontend is a client of canonical backend state.
- Backend-controlled transitions own data integrity.

---

## 6. Sequence Diagrams

### 6.1 Bootstrap / Initial Setup Flow

**CURRENT STATE**

```mermaid
sequenceDiagram
  autonumber
  actor Operator
  participant UI as Console UI
  participant API as Backend
  participant DB as Postgres

  Operator->>UI: Open console
  UI->>API: GET /console/bootstrap
  API->>DB: Read canonical bootstrap state
  DB-->>API: Projects, rulesets, templates, targets, notes, deliveries
  API-->>UI: Hydration payload
  Operator->>UI: Review setup state
  UI->>API: POST /console/settings or other setup mutations
  API->>DB: Persist setup changes
  DB-->>API: Commit
  API-->>UI: Success + refreshed state
```

**GAPS**
- Setup must not imply the console creates the workflow engine.
- Unsupported setup fields should fail explicitly.

**FUTURE STATE**
- Setup may include stronger validation and clearer first-run guidance.

**What this shows**
- Bootstrap is a hydration step, not a source of truth.
- Setup mutations flow through backend persistence.

### 6.2 Rules / Template Edit Flow

**CURRENT STATE**

```mermaid
sequenceDiagram
  autonumber
  actor Operator
  participant UI as Rules/Templates UI
  participant API as Backend
  participant DB as Postgres

  Operator->>UI: Edit rule or template
  UI->>API: Submit create/update request
  API->>DB: Validate and persist versioned change
  DB-->>API: Stored canonical row/version
  API-->>UI: Mutation result
  UI->>API: Refetch lists and detail
  API->>DB: Read updated rule/template state
  DB-->>API: Refreshed state
  API-->>UI: Updated view
```

**GAPS**
- Local-only draft behavior should not masquerade as persistence.
- Versioning, precedence, and activation semantics must remain transparent.

**FUTURE STATE**
- Editor can show diff-aware previews, validation hints, and safer commit flows.

**What this shows**
- Rule and template edits must be canonical backend mutations.

### 6.3 Prompt Review Flow

**CURRENT STATE**

```mermaid
sequenceDiagram
  autonumber
  actor Operator
  participant UI as Prompts / Pipeline UI
  participant API as Backend
  participant DB as Postgres

  Operator->>UI: Inspect intake note
  UI->>API: GET lineage / prompt / delivery data
  API->>DB: Query intake, revisions, prompts, deliveries
  DB-->>API: Lineage rows
  API-->>UI: Reviewable prompt view
  Operator->>UI: Inspect generation details
  Operator->>UI: Follow lineage to downstream delivery
  UI->>API: Optional mutation (force review / priority / clone)
  API->>DB: Persist action and history
  DB-->>API: Commit
  API-->>UI: Updated review state
```

**GAPS**
- The UI must distinguish synthesized lineage from complete backend lineage.
- Missing hops and partial lineages should be obvious.

**FUTURE STATE**
- Richer inspection can include diff, provenance, and validation overlays.

**What this shows**
- Prompt review is an inspection workflow, not an intake workflow.

### 6.4 Delivery Operations Flow

**CURRENT STATE**

```mermaid
sequenceDiagram
  autonumber
  actor Operator
  participant UI as Deliveries UI
  participant API as Backend
  participant DB as Postgres
  participant T as Target adapter

  Operator->>UI: Open queued / failed delivery
  UI->>API: GET delivery history / target health
  API->>DB: Read delivery record and attempt history
  DB-->>API: Delivery rows
  API-->>UI: Delivery detail
  Operator->>UI: Retry / reroute / reprioritize
  UI->>API: POST/PATCH delivery mutation
  API->>T: Dispatch or route decision
  T-->>API: Accepted / rejected / failed
  API->>DB: Persist attempt and state transition
  DB-->>API: Commit
  API-->>UI: Result + refreshed state
```

**GAPS**
- Delivery actions must never be shown as consumer-style buttons.
- Unsupported target types should fail visibly and explicitly.

**FUTURE STATE**
- Delivery UI can show richer target diagnostics and live attempt progress.

**What this shows**
- Delivery lifecycle is separate from prompt generation lifecycle.

### 6.5 Logs / Metrics Inspection Flow

**CURRENT STATE**

```mermaid
sequenceDiagram
  autonumber
  actor Operator
  participant UI as Logs / Metrics UI
  participant API as Backend
  participant DB as Postgres

  Operator->>UI: Open logs or metrics page
  UI->>API: GET logs / aggregates / failed runs
  API->>DB: Query indexed events, processing runs, fingerprints
  DB-->>API: Result set
  API-->>UI: Tables, cards, charts
  Operator->>UI: Filter / drill into run
  UI->>API: Refetch scoped query
  API->>DB: Query with filter params
  DB-->>API: Narrowed results
  API-->>UI: Updated view
```

**GAPS**
- Observability UX should separate signals from raw dumps.
- Filter, drilldown, and error fingerprint semantics must stay stable.

**FUTURE STATE**
- More direct traceability from logs to lineage and delivery history.

**What this shows**
- Observability is read-centric but still backend-canonical.

### 6.6 LLM Assist Flow

**CURRENT STATE**

```mermaid
sequenceDiagram
  autonumber
  actor Operator
  participant UI as LLM Assist UI
  participant API as Backend
  participant LLM as External provider
  participant DB as Postgres

  Operator->>UI: Request assist or review action
  UI->>API: Submit assist payload
  API->>DB: Read context, policy, and lineage
  DB-->>API: Canonical context
  API->>LLM: Send backend-controlled request
  LLM-->>API: Response / suggestion
  API->>DB: Persist assist event / audit trail
  DB-->>API: Commit
  API-->>UI: Suggested result + operator decision state
```

**GAPS**
- The browser must not talk directly to providers as if it owns policy.
- Assist outcomes should be reviewable and auditable.

**FUTURE STATE**
- Assist may become more structured with stronger approval and provenance UX.

**What this shows**
- LLM interactions are backend-controlled operator tools.

### 6.7 Error Recovery Flow

**CURRENT STATE**

```mermaid
sequenceDiagram
  autonumber
  actor Operator
  participant UI as Console UI
  participant API as Backend
  participant DB as Postgres

  Operator->>UI: Trigger mutation or refresh stale view
  UI->>API: Send request
  API-->>UI: Validation error / unsupported / conflict / stale state
  UI->>UI: Render inline error state / toast / disabled action
  Operator->>UI: Correct input or retry
  UI->>API: Resubmit request
  API->>DB: Persist if valid
  DB-->>API: Commit
  API-->>UI: Success + invalidation
```

**GAPS**
- Error states must distinguish unsupported, stale, unauthorized, and failed persistence.
- The frontend must not invent success when the backend says no.

**FUTURE STATE**
- Recovery UX can become more guided with conflict resolution and safer confirmations.

**What this shows**
- Error handling is a first-class operator workflow.

---

## 7. Frontend State Management Diagram

**CURRENT STATE**

```mermaid
flowchart TB
  subgraph uiOnly[UI-only state]
    nav[Navigation selection]
    modal[Open/close dialogs]
    focus[Keyboard focus / hover state]
    confirm[Action confirmation state]
  end

  subgraph clientTemp[Temporary client memory]
    draft[Form drafts]
    optimistic[Optimistic mutation shadow]
    cache[Query cache]
    poll[Polling / refresh timers]
  end

  subgraph serverState[Backend / system of record]
    canon[Canonical rows and versions]
    audit[Audit / history / attempts]
    health[Health / validation / status]
  end

  nav --> draft
  modal --> confirm
  focus --> draft
  draft --> optimistic
  optimistic --> cache
  cache --> poll
  poll --> canon
  canon --> cache
  canon --> audit
  canon --> health

  noteA[[UI-only:\nshould disappear on reload]]
  noteB[[Client memory:\nmay be stale, must refetch]]
  noteC[[Server state:\ncanonical truth]]

  uiOnly -.-> noteA
  clientTemp -.-> noteB
  serverState -.-> noteC
```

**GAPS**
- Optimistic state must be used sparingly and always reconciled.
- Backend truth should invalidate client state after mutations.

**FUTURE STATE**
- More selective cache invalidation and explicit stale-state indicators.

**What this shows**
- Browser memory is temporary.
- Workflow truth stays in backend state.

---

## 8. Trust Boundary / Security Diagram

**CURRENT STATE**

```mermaid
flowchart LR
  subgraph browser[Browser boundary]
    ui[Console UI]
    localprefs[Local preferences / drafts]
  end

  subgraph trusted[Local / self-hosted trusted boundary]
    api[Backend API]
    db[(Postgres)]
    secrets[Secrets storage / references]
  end

  subgraph external[External provider boundary]
    llm[LLM providers]
    n8n[n8n / downstream systems]
    targets[Live delivery targets]
  end

  ui -->|header hints only:\nx-promptforge-role / actor| api
  api --> db
  api --> secrets
  api --> llm
  api --> n8n
  api --> targets

  risk1[[Weakness:\nminimal authN/authZ]]
  risk2[[Weakness:\nsecret exposure risk if console is exposed broadly]]
  risk3[[Weakness:\noperator actions need stronger confirmation and audit]]
  risk4[[Weakness:\nlive target delivery may not exist for all types]]

  ui -.-> risk1
  ui -.-> risk2
  api -.-> risk3
  targets -.-> risk4
```

**GAPS**
- Header-only role hints are not production-grade authorization.
- Secrets and privileged actions need explicit, hardened treatment.
- Exposing the console outside trusted local/self-hosted use is risky.

**FUTURE STATE**
- Real authN/authZ, better secret handling, and safer admin workflows.

**What this shows**
- The browser is the least trusted layer.
- External systems must be isolated behind backend policy.

---

## 9. Gap Analysis Diagram

**CURRENT STATE**

```mermaid
flowchart TB
  console[Frontend / Console]

  gapAuth[Gap: weak authN/authZ]
  gapBoundary[Gap: fuzzy frontend/backend boundary maturity]
  gapConflict[Gap: stale state / conflict handling is thin]
  gapObs[Gap: observability UX is not fully mature]
  gapMulti[Gap: multi-user operator model unclear]
  gapSecrets[Gap: secret-management UX is hardened only partially]
  gapAdmin[Gap: admin surfaces may be overbroad]
  gapTargets[Gap: unsupported live delivery targets remain incomplete]
  gapFlow[Gap: operational vs public flows can blur]

  console --> gapAuth
  console --> gapBoundary
  console --> gapConflict
  console --> gapObs
  console --> gapMulti
  console --> gapSecrets
  console --> gapAdmin
  console --> gapTargets
  console --> gapFlow

  impact1[[Impact:\nsecurity risk]]
  impact2[[Impact:\noperator confusion]]
  impact3[[Impact:\nwrong retry / reroute decisions]]
  impact4[[Impact:\nunsupported features appear real]]

  gapAuth --> impact1
  gapSecrets --> impact1
  gapBoundary --> impact2
  gapMulti --> impact2
  gapConflict --> impact3
  gapObs --> impact3
  gapTargets --> impact4
  gapFlow --> impact4
  gapAdmin --> impact1
```

**GAPS**
- These are not cosmetic issues; they affect operator safety and correctness.

**FUTURE STATE**
- Each gap should either be closed by backend capability or made explicit in the UI.

**What this shows**
- The console still has safety and clarity gaps that must be visible, not hidden.

---

## 10. Current-State vs Future-State Console Architecture Diagram

**CURRENT STATE**

```mermaid
flowchart LR
  subgraph current[CURRENT STATE: minimal single-operator console]
    curShell[Shell / navigation]
    curSetup[Bootstrap / setup]
    curConfig[Settings / rules / templates / targets]
    curReview[Prompts / deliveries / lineage]
    curObserve[Logs / metrics / health]
    curHelp[Contextual help / tooltips]
  end

  subgraph future[FUTURE STATE: structured operator console]
    futShell[Domain shell]
    futConfig[Stronger configuration modules]
    futOps[Operational control modules]
    futReview[Review / lineage / recovery modules]
    futSecurity[Hardened auth / RBAC]
    futAudit[Audit-first mutation flows]
    futRealtime[Safer refresh / invalidation / live status]
  end

  curShell --> curSetup
  curShell --> curConfig
  curShell --> curReview
  curShell --> curObserve
  curShell --> curHelp

  curShell -.-> futShell
  curConfig -.-> futConfig
  curReview -.-> futReview
  curObserve -.-> futOps
  curHelp -.-> futAudit
  curObserve -.-> futRealtime
  futShell --> futSecurity
  futConfig --> futAudit
  futOps --> futRealtime
```

**GAPS**
- Current console is still closer to an operational MVP than a hardened admin surface.
- Security, auditability, and live-state quality need more structure.

**FUTURE STATE**
- Domain modules become more explicit and safer.
- The console becomes more maintainable without pretending to be SaaS-grade.

**What this shows**
- The console evolves by hardening operator flows, not by turning into a public app.

---

## 11. Frontend Deployment / Serving Diagram

**CURRENT STATE**

```mermaid
flowchart TB
  subgraph localdev[Current / implied local-dev and self-hosted option]
    browser[Local browser]
    spa[PromptForge Console SPA]
    backend[PromptForge backend]
    pg[(Postgres)]
  end

  subgraph futuredeploy[FUTURE / proposed deployment options]
    option1[Backend serves console assets]
    option2[Separate frontend container / static hosting]
    option3[Shared local network access]
  end

  browser --> spa
  spa --> backend
  backend --> pg

  backend -.-> option1
  spa -.-> option2
  browser -.-> option3

  note[[Current truth:\nlocal/self-hosted, operator-only, backend-backed]]
  localdev -.-> note
```

**GAPS**
- Preview and deployment routing must not fall back to localhost assumptions.
- Serving model should be explicit so the browser always knows which backend is authoritative.

**FUTURE STATE**
- The console can be served by the backend or separately, but contract routing stays stable.

**What this shows**
- The app should work in a local/self-hosted topology first.
- Serving strategy is secondary to backend correctness.

---

## 12. Operator Workflow Diagram

**CURRENT STATE**

```mermaid
flowchart TB
  start[Start]
  bootstrap[Bootstrap system]
  configure[Configure rules / templates / targets / settings]
  inspect[Inspect prompts / lineage]
  deliveries[Inspect deliveries]
  failures[Handle failures]
  logs[Check logs / metrics / runs]
  assist[Invoke LLM assist]
  done[Return to monitoring]

  start --> bootstrap
  bootstrap --> configure
  configure --> inspect
  inspect --> deliveries
  deliveries -->|success| logs
  deliveries -->|failure| failures
  failures --> logs
  logs --> assist
  assist --> inspect
  logs --> done
  done --> inspect

  note1[[Bootstrap is first-run and recovery entrypoint]]
  note2[[Configuration precedes operational review]]
  note3[[Failures should loop into logs and assist, not silent retry]]

  bootstrap -.-> note1
  configure -.-> note2
  failures -.-> note3
```

**GAPS**
- The workflow must remain linear enough for operators to understand, but flexible enough for recovery.
- Silent state changes break the workflow model.

**FUTURE STATE**
- More explicit decision points for retry, reroute, archive, and escalation.

**What this shows**
- The console should support a clear operator loop from setup to recovery.

