---
created: "2026-04-25T00:00:00Z"
last_edited: "2026-04-25T00:00:00Z"
---

# Build Site

92 tasks across 4 tiers from 4 kits.

Granular decomposition for mini model delegation (haiku, gpt-5.4-mini). Each task = concrete file operation with exact paths.

---

## Tier 0 — No Dependencies (Start Here)

### Visual Foundation Token Migration

| Task | Title | Files | Effort |
|------|-------|-------|--------|
| T-001 | Define five surface tokens in index.css | `src/index.css` | S |
| T-002 | Remove legacy HSL variables from index.css | `src/index.css` | S |
| T-003 | Implement dark theme default (no data-theme) | `src/index.css` | S |
| T-004 | Implement light theme variant (data-theme="light") | `src/index.css` | M |
| T-005 | Implement high-contrast-dark theme (data-theme="high-contrast-dark") | `src/index.css` | M |
| T-006 | Define seven typography roles (h1-h3, body, small, code, label) | `src/index.css` | S |
| T-007 | Define sans font family (Geist, Inter, fallback) | `src/index.css` | S |
| T-008 | Define mono font family (SF Mono, Menlo, fallback) | `src/index.css` | S |
| T-009 | Define five theme-independent status tokens | `src/index.css` | S |
| T-010 | Define eight spacing tokens (4px base unit) | `src/index.css` | S |
| T-011 | Define four radius tokens (sm, md, lg, xl) | `src/index.css` | S |
| T-012 | Define border tokens (border, border-bright, border-focus, divider) | `src/index.css` | S |

**Details for T-001:**
```css
/* Add to src/index.css @layer base :root */
--surface-0: {dark theme deepest bg};
--surface-1: {dark theme base content bg};
--surface-2: {dark theme card bg};
--surface-3: {dark theme elevated bg};
--surface-4: {dark theme overlay bg};

/* Ensure luminance strictly increasing: surface-0 < surface-1 < surface-2 < surface-3 < surface-4 */
/* Document semantic roles in comment above tokens */
```

**Details for T-002:**
Delete or comment out from `src/index.css`:
- `--background`
- `--foreground`
- `--surface-raised`
- `--surface-sunken`
- All `--status-success`, `--status-warn`, `--status-danger` HSL tokens

**Details for T-003:**
Wrap existing surface tokens in `:root` (dark theme default). No `data-theme` selector.

**Details for T-004:**
```css
[data-theme="light"] {
  /* Invert depth: surface-0 lightest, surface-4 darkest */
  --surface-0: {light bg};
  --surface-1: {light content};
  /* ... all foundation tokens */
}
```

**Details for T-005:**
```css
[data-theme="high-contrast-dark"] {
  /* WCAG AAA: text-on-surface-1 >= 7:1 contrast */
  --surface-0: {high contrast dark deepest};
  /* ... all foundation tokens */
}
```

**Details for T-006:**
```css
/* Typography roles */
--type-h1-size: 2rem;
--type-h1-weight: 700;
--type-h1-line: 1.2;
/* ... h2, h3, body, small, code, label (all unique sizes) */
```

**Details for T-007:**
```css
--font-sans: "Geist", "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
```

**Details for T-008:**
```css
--font-mono: "SF Mono", "SFMono-Regular", ui-monospace, "Menlo", monospace;
```

**Details for T-009:**
```css
/* Theme-independent status palette */
--status-blue: {hex};
--status-green: {hex};
--status-orange: {hex};
--status-red: {hex};
--status-purple: {hex};
/* Same values in :root, [data-theme="light"], [data-theme="high-contrast-dark"] */
```

**Details for T-010:**
```css
--space-1: 4px;
--space-2: 8px;
--space-3: 12px;
--space-4: 16px;
--space-5: 24px;
--space-6: 32px;
--space-7: 48px;
--space-8: 64px;
```

**Details for T-011:**
```css
--radius-sm: 4px;
--radius-md: 8px;
--radius-lg: 12px;
--radius-xl: 16px;
```

**Details for T-012:**
```css
--border: {dark theme border color};
--border-bright: {lighter than --border in dark};
--border-focus: {focus ring color};
--divider: {hairline separator color};
/* No box-shadow > 2px blur */
```

---

## Tier 1 — Depends on Tier 0

### Component Extraction Foundation

| Task | Title | Files | blockedBy | Effort |
|------|-------|-------|-----------|--------|
| T-013 | Create RoutePreview TypeScript interface | `src/components/pf/RoutePreview.tsx` (new) | T-001, T-006, T-009, T-010, T-011, T-012 | S |
| T-014 | Implement RoutePreview header section | `src/components/pf/RoutePreview.tsx` | T-013 | S |
| T-015 | Implement RoutePreview route detail cells grid | `src/components/pf/RoutePreview.tsx` | T-013 | S |
| T-016 | Implement RoutePreview state cells (replay + Kanban binding) | `src/components/pf/RoutePreview.tsx` | T-013 | S |
| T-017 | Implement RoutePreview action buttons row | `src/components/pf/RoutePreview.tsx` | T-013 | S |
| T-018 | Implement RoutePreview footer with scope badge | `src/components/pf/RoutePreview.tsx` | T-013 | S |
| T-019 | Implement RoutePreview status badge tone mapping | `src/components/pf/RoutePreview.tsx` | T-014 | S |
| T-020 | Implement RoutePreview conditional rendering (null checks) | `src/components/pf/RoutePreview.tsx` | T-014, T-015, T-016, T-017, T-018 | S |
| T-021 | Apply Visual Foundation surface tokens to RoutePreview | `src/components/pf/RoutePreview.tsx` | T-020 | S |
| T-022 | Apply Visual Foundation typography to RoutePreview | `src/components/pf/RoutePreview.tsx` | T-020 | S |
| T-023 | Apply Visual Foundation spacing to RoutePreview | `src/components/pf/RoutePreview.tsx` | T-020 | S |
| T-024 | Apply Visual Foundation status palette to RoutePreview badge | `src/components/pf/RoutePreview.tsx` | T-019 | S |
| T-025 | Create KanbanIntegrationPanel TypeScript interface | `src/components/pf/KanbanIntegrationPanel.tsx` (new) | T-001, T-006, T-010, T-011, T-012 | S |
| T-026 | Implement KanbanIntegrationPanel draft state hooks | `src/components/pf/KanbanIntegrationPanel.tsx` | T-025 | M |
| T-027 | Implement KanbanIntegrationPanel scope chrome section | `src/components/pf/KanbanIntegrationPanel.tsx` | T-025 | S |
| T-028 | Implement KanbanIntegrationPanel input fields (baseUrl, workspaceId, passcode) | `src/components/pf/KanbanIntegrationPanel.tsx` | T-026 | M |
| T-029 | Implement KanbanIntegrationPanel save action (onSubmit callback) | `src/components/pf/KanbanIntegrationPanel.tsx` | T-026 | S |
| T-030 | Apply Visual Foundation surface tokens to KanbanIntegrationPanel | `src/components/pf/KanbanIntegrationPanel.tsx` | T-025 | S |
| T-031 | Apply Visual Foundation typography to KanbanIntegrationPanel | `src/components/pf/KanbanIntegrationPanel.tsx` | T-025 | S |
| T-032 | Apply Visual Foundation spacing to KanbanIntegrationPanel | `src/components/pf/KanbanIntegrationPanel.tsx` | T-025 | S |
| T-033 | Apply Visual Foundation border tokens to KanbanIntegrationPanel inputs | `src/components/pf/KanbanIntegrationPanel.tsx` | T-028 | S |

**Details for T-013:**
Create `src/components/pf/RoutePreview.tsx`:
```tsx
interface RoutePreviewProps {
  note: {
    id: string;
    deliveryId?: string | null;
    // ... fields from intake-note record
  };
  route: {
    routeStatus: string;
    routeStatusLabel: string;
    routeSummary: string;
    sourceFolder: string;
    routeFamily: string | null;
    routeTarget: string | null;
    routeContext: string;
    replayState: string;
    replayable: boolean;
  };
  kanbanReady: boolean;
  kanbanBinding: {
    baseUrl: string | null;
    workspaceId: string | null;
  };
  scope: {
    kind: "global" | "project";
    projectId: string | null;
    projectName: string | null;
  };
}

export function RoutePreview(props: RoutePreviewProps) {
  // Component skeleton
}
```

**Details for T-014:**
Implement header inside `RoutePreview`:
```tsx
<div className="..."> {/* surface-2 bg */}
  <div className="flex items-center justify-between">
    <h3>Route preview</h3>
    <Badge tone={getStatusTone(props.route.routeStatus)}>
      {props.route.routeStatusLabel}
    </Badge>
  </div>
  <p>{props.route.routeSummary}</p>
</div>
```

**Details for T-015:**
Four detail cells grid:
```tsx
<div className="grid grid-cols-2 gap-4">
  <DetailCell label="Source folder" value={props.route.sourceFolder} />
  <DetailCell label="Route family" value={props.route.routeFamily ?? "unsupported"} />
  <DetailCell label="Route target" value={props.route.routeTarget ?? "—"} />
  <DetailCell label="Route context" value={props.route.routeContext || "—"} />
</div>

function DetailCell({ label, value }: { label: string; value: string }) {
  return (
    <div className="border rounded-md p-2"> {/* border + radius-md tokens */}
      <div className="text-label">{label}</div>
      <code className="text-code">{value}</code>
    </div>
  );
}
```

**Details for T-016:**
Two state cells:
```tsx
<div className="grid grid-cols-2 gap-4">
  <div className="bg-surface-1 p-2"> {/* one step down from outer card */}
    <div className="text-label">Fallback/Replay state</div>
    <div>{props.route.replayState}</div>
  </div>
  <div className="bg-surface-1 p-2">
    <div className="text-label">Kanban binding</div>
    <div>{props.kanbanReady ? "Ready" : "Unavailable"}</div>
    <div className="text-small">
      Base URL: {props.kanbanBinding.baseUrl || "unset"}
    </div>
    <div className="text-small">
      Workspace ID: {props.kanbanBinding.workspaceId || "unset"}
    </div>
  </div>
</div>
```

**Details for T-017:**
Action buttons:
```tsx
<div className="flex gap-2">
  <Button asChild>
    <a href={`/pipeline/${props.note.id}`}>Open pipeline</a>
  </Button>
  {props.note.deliveryId && (
    <Button asChild variant="secondary">
      <a href={`/deliveries?id=${props.note.deliveryId}`}>Review delivery</a>
    </Button>
  )}
</div>
```

**Details for T-018:**
Footer:
```tsx
<div className="border-t pt-2"> {/* divider token */}
  <div className="flex items-center gap-2">
    <Badge>{props.scope.kind}</Badge>
    <span className="text-small">
      {props.scope.kind === "project" 
        ? props.scope.projectName 
        : "Global fallback scope"}
    </span>
  </div>
</div>
```

**Details for T-019:**
Status tone mapping:
```tsx
function getStatusTone(routeStatus: string): "success" | "warn" | "danger" {
  if (routeStatus === "direct_kanban") return "success";
  if (routeStatus === "queue_review") return "warn";
  return "danger"; // unavailable, unsupported, etc.
}
```

**Details for T-020:**
Add null checks to all cells:
```tsx
// Route family cell
value={props.route.routeFamily ?? "unsupported"}

// Route target cell
value={props.route.routeTarget ?? "—"}

// Route context cell (empty string also shows "—")
value={props.route.routeContext || "—"}
```

**Details for T-021:**
Replace Tailwind bg classes with CSS var references:
```tsx
// Outer card
className="... bg-[var(--surface-2)]"

// State cells
className="... bg-[var(--surface-1)]"
```

**Details for T-022:**
Apply typography roles:
```tsx
// Labels
className="text-[length:var(--type-label-size)] font-[var(--type-label-weight)] leading-[var(--type-label-line)]"

// Code values
className="font-[var(--font-mono)] text-[length:var(--type-code-size)]"

// Summary
className="text-[length:var(--type-body-size)] leading-[var(--type-body-line)]"
```

**Details for T-023:**
Replace hard-coded spacing with tokens:
```tsx
// Gap between cells
className="gap-[var(--space-4)]"

// Padding
className="p-[var(--space-3)]"
```

**Details for T-024:**
Status badge colors:
```tsx
// success tone
className="bg-[var(--status-green)] text-white"

// warn tone
className="bg-[var(--status-orange)] text-black"

// danger tone
className="bg-[var(--status-red)] text-white"
```

**Details for T-025:**
Create `src/components/pf/KanbanIntegrationPanel.tsx`:
```tsx
interface KanbanIntegrationPanelProps {
  initialDraft: {
    baseUrl: string;
    workspaceId: string;
    passcode: string;
  };
  binding: {
    scope: "global" | "project";
    projectId: string | null;
    projectName: string | null;
  };
  onSubmit: (draft: { baseUrl: string; workspaceId: string; passcode: string }) => void;
}

export function KanbanIntegrationPanel(props: KanbanIntegrationPanelProps) {
  // Component skeleton
}
```

**Details for T-026:**
Draft state management:
```tsx
const [draft, setDraft] = useState(props.initialDraft);

function handleBaseUrlChange(e: React.ChangeEvent<HTMLInputElement>) {
  setDraft(prev => ({ ...prev, baseUrl: e.target.value }));
}

function handleWorkspaceIdChange(e: React.ChangeEvent<HTMLInputElement>) {
  setDraft(prev => ({ ...prev, workspaceId: e.target.value }));
}

function handlePasscodeChange(e: React.ChangeEvent<HTMLInputElement>) {
  setDraft(prev => ({ ...prev, passcode: e.target.value }));
}

function handleSave() {
  props.onSubmit(draft);
}
```

**Details for T-027:**
Scope chrome:
```tsx
<div className="border-b pb-2"> {/* divider token */}
  <div className="flex items-center gap-2">
    <Badge>{props.binding.scope}</Badge>
    <span className="text-small">
      {props.binding.scope === "project" 
        ? props.binding.projectName 
        : "Global fallback scope"}
    </span>
  </div>
</div>
```

**Details for T-028:**
Input fields:
```tsx
<div className="space-y-4">
  <div>
    <label htmlFor="baseUrl" className="text-label">Base URL</label>
    <input
      id="baseUrl"
      type="text"
      value={draft.baseUrl}
      onChange={handleBaseUrlChange}
      className="border rounded-md px-2 py-1 w-full focus:border-focus"
    />
  </div>
  <div>
    <label htmlFor="workspaceId" className="text-label">Workspace ID</label>
    <input
      id="workspaceId"
      type="text"
      value={draft.workspaceId}
      onChange={handleWorkspaceIdChange}
      className="border rounded-md px-2 py-1 w-full focus:border-focus"
    />
  </div>
  <div>
    <label htmlFor="passcode" className="text-label">Passcode</label>
    <input
      id="passcode"
      type="password"
      value={draft.passcode}
      onChange={handlePasscodeChange}
      className="border rounded-md px-2 py-1 w-full focus:border-focus"
    />
  </div>
</div>
```

**Details for T-029:**
Save button:
```tsx
<Button onClick={handleSave}>Save</Button>
```

**Details for T-030-T-033:**
Apply Visual Foundation tokens same pattern as RoutePreview (surface-2 outer, spacing tokens, typography, border tokens).

### Integration Refactor Foundation

| Task | Title | Files | blockedBy | Effort |
|------|-------|-------|-----------|--------|
| T-034 | Create workspace discovery boundary module | `src/lib/kanban-discovery.ts` (new) | — | M |
| T-035 | Define discovery query key factory | `src/lib/kanban-discovery.ts` | T-034 | S |
| T-036 | Implement 500ms debounce gate in discovery hook | `src/lib/kanban-discovery.ts` | T-034 | M |
| T-037 | Implement empty base URL guard in discovery hook | `src/lib/kanban-discovery.ts` | T-036 | S |
| T-038 | Verify sanitizeErrorMessage exists in error-utils.ts | `src/lib/error-utils.ts` | — | S |
| T-039 | Add passcode redaction to sanitizeErrorMessage | `src/lib/error-utils.ts` | T-038 | S |
| T-040 | Add kanban_transport_error mapping to sanitizeErrorMessage | `src/lib/error-utils.ts` | T-038 | S |
| T-041 | Create route status tone mapping utility | `src/lib/route-status-utils.ts` (new) | T-009 | S |
| T-042 | Map unavailable status to danger tone | `src/lib/route-status-utils.ts` | T-041 | S |

**Details for T-034:**
Create `src/lib/kanban-discovery.ts`:
```tsx
import { useQuery } from '@tanstack/react-query';
import { useDebouncedValue } from '@/hooks/use-debounced-value';

interface KanbanWorkspace {
  workspaceId: string;
  name: string;
  path: string;
  taskCounts: {
    backlog: number;
    inProgress: number;
    review: number;
    trash: number;
  };
}

interface KanbanWorkspaceDiscoveryResponse {
  currentWorkspaceId: string | null;
  workspaces: KanbanWorkspace[];
}

// Fetcher function (calls backend endpoint)
async function fetchKanbanWorkspaces(
  baseUrl: string,
  passcode: string
): Promise<KanbanWorkspaceDiscoveryResponse> {
  // Implementation
}
```

**Details for T-035:**
Query key factory:
```tsx
export const qk = {
  kanbanWorkspaces: (baseUrl: string, passcode: string) => 
    ['kanban', 'workspaces', baseUrl, passcode] as const,
};
```

**Details for T-036:**
Debounced discovery hook:
```tsx
const DISCOVERY_DEBOUNCE_MS = 500;

export function useKanbanWorkspaceDiscovery(
  baseUrl: string,
  passcode: string
) {
  const debouncedBaseUrl = useDebouncedValue(baseUrl, DISCOVERY_DEBOUNCE_MS);
  const debouncedPasscode = useDebouncedValue(passcode, DISCOVERY_DEBOUNCE_MS);
  
  return useQuery({
    queryKey: qk.kanbanWorkspaces(debouncedBaseUrl, debouncedPasscode),
    queryFn: () => fetchKanbanWorkspaces(debouncedBaseUrl, debouncedPasscode),
    enabled: debouncedBaseUrl.trim() !== '',
  });
}
```

**Details for T-037:**
Already covered in T-036 `enabled` gate.

**Details for T-038:**
Read `src/lib/error-utils.ts` — verify `sanitizeErrorMessage` exists. If not, create it.

**Details for T-039:**
Add passcode redaction:
```tsx
export function sanitizeErrorMessage(error: unknown, passcode?: string): string {
  let message = /* extract error message */;
  
  // Redact passcode
  if (passcode) {
    message = message.replaceAll(passcode, '[REDACTED]');
  }
  
  // Redact file paths
  message = message.replace(/at .+:\d+:\d+/g, '');
  message = message.replace(/\.tsx?/g, '');
  
  return message;
}
```

**Details for T-040:**
Map transport errors:
```tsx
if (message.includes('kanban_transport_error:ConnectError')) {
  return 'Cannot connect to Kanban. Verify the base URL and that Kanban is running.';
}
```

**Details for T-041:**
Create `src/lib/route-status-utils.ts`:
```tsx
export type StatusTone = "success" | "warn" | "danger";

export function getRouteStatusTone(routeStatus: string): StatusTone {
  if (routeStatus === "direct_kanban") return "success";
  if (routeStatus === "queue_review") return "warn";
  return "danger";
}
```

**Details for T-042:**
Already covered in T-041 default case.

---

## Tier 2 — Depends on Tier 1

### Component Integration

| Task | Title | Files | blockedBy | Effort |
|------|-------|-------|-----------|--------|
| T-043 | Wire KanbanIntegrationPanel to discovery hook | `src/components/pf/KanbanIntegrationPanel.tsx` | T-025, T-034, T-036 | M |
| T-044 | Implement discovered-workspaces dropdown in KanbanIntegrationPanel | `src/components/pf/KanbanIntegrationPanel.tsx` | T-043 | M |
| T-045 | Implement current-workspace display in KanbanIntegrationPanel | `src/components/pf/KanbanIntegrationPanel.tsx` | T-043 | S |
| T-046 | Implement discovery error display with sanitization | `src/components/pf/KanbanIntegrationPanel.tsx` | T-043, T-038 | S |
| T-047 | Apply surface-3 token to discovered-workspaces dropdown | `src/components/pf/KanbanIntegrationPanel.tsx` | T-044 | S |
| T-048 | Apply status-red token to discovery error | `src/components/pf/KanbanIntegrationPanel.tsx` | T-046 | S |
| T-049 | Extract RoutePreview from IntakeDetail.tsx | `src/pages/IntakeDetail.tsx`, `src/components/pf/RoutePreview.tsx` | T-013, T-020 | M |
| T-050 | Add RoutePreview to Pipeline trace detail | `src/pages/Pipeline.tsx`, `src/components/pf/RoutePreview.tsx` | T-013, T-020 | S |
| T-051 | Remove inline route-header markup from IntakeDetail.tsx | `src/pages/IntakeDetail.tsx` | T-049 | S |
| T-052 | Verify no other pages have inline route-header duplication | `src/pages/*.tsx` | T-049, T-050 | S |

**Details for T-043:**
In `KanbanIntegrationPanel.tsx`:
```tsx
import { useKanbanWorkspaceDiscovery } from '@/lib/kanban-discovery';

export function KanbanIntegrationPanel(props: KanbanIntegrationPanelProps) {
  const [draft, setDraft] = useState(props.initialDraft);
  
  const discovery = useKanbanWorkspaceDiscovery(draft.baseUrl, draft.passcode);
  
  // ... rest of component
}
```

**Details for T-044:**
Discovered workspaces dropdown:
```tsx
{discovery.data && discovery.data.workspaces.length > 0 && (
  <div>
    <label className="text-label">Discovered workspaces</label>
    <select
      className="bg-surface-3 border rounded-md px-2 py-1 w-full"
      onChange={(e) => {
        const workspace = discovery.data.workspaces.find(
          w => w.workspaceId === e.target.value
        );
        if (workspace) {
          setDraft(prev => ({ ...prev, workspaceId: workspace.workspaceId }));
        }
      }}
    >
      <option value="">Select a workspace</option>
      {discovery.data.workspaces.map(ws => (
        <option key={ws.workspaceId} value={ws.workspaceId}>
          {ws.name} ({ws.path})
        </option>
      ))}
    </select>
  </div>
)}
```

**Details for T-045:**
Current workspace display:
```tsx
{discovery.data && draft.workspaceId && (
  <div className="text-small">
    Current: {
      discovery.data.workspaces.find(w => w.workspaceId === draft.workspaceId)?.name 
      ?? draft.workspaceId
    }
  </div>
)}
```

**Details for T-046:**
Error display:
```tsx
import { sanitizeErrorMessage } from '@/lib/error-utils';

{discovery.error && (
  <div className="text-small text-status-red">
    {sanitizeErrorMessage(discovery.error, draft.passcode)}
  </div>
)}
```

**Details for T-047:**
Already in T-044 dropdown className.

**Details for T-048:**
Already in T-046 text-status-red.

**Details for T-049:**
In `IntakeDetail.tsx`, replace inline route preview JSX (lines ~69-137) with:
```tsx
import { RoutePreview } from '@/components/pf/RoutePreview';

// Inside component render:
<RoutePreview
  note={note}
  route={describeVoiceRoute(note)}
  kanbanReady={isKanbanReady}
  kanbanBinding={{ baseUrl: settings.kanbanBaseUrl, workspaceId: settings.kanbanWorkspaceId }}
  scope={resolveScope(settings)}
/>
```

**Details for T-050:**
In `Pipeline.tsx`, add RoutePreview at head of trace view when note selected:
```tsx
import { RoutePreview } from '@/components/pf/RoutePreview';

// When noteId is present:
{selectedNote && (
  <RoutePreview
    note={selectedNote}
    route={describeVoiceRoute(selectedNote)}
    kanbanReady={isKanbanReady}
    kanbanBinding={{ baseUrl: settings.kanbanBaseUrl, workspaceId: settings.kanbanWorkspaceId }}
    scope={resolveScope(settings)}
  />
)}
```

**Details for T-051:**
Delete old inline JSX from `IntakeDetail.tsx` that was replaced in T-049.

**Details for T-052:**
Grep for route-header patterns:
```bash
grep -r "Route preview" src/pages/ --include="*.tsx"
grep -r "route detail cells" src/pages/ --include="*.tsx"
```
Verify only RoutePreview component imports remain.

### Page Consolidation Foundation

| Task | Title | Files | blockedBy | Effort |
|------|-------|-------|-----------|--------|
| T-053 | Create Settings tab state manager | `src/pages/Settings.tsx` | T-001, T-012, T-025 | M |
| T-054 | Create Settings Runtime tab component | `src/pages/Settings.tsx` | T-053 | M |
| T-055 | Create Settings Secrets tab component | `src/pages/Settings.tsx` | T-053 | M |
| T-056 | Create Settings Integrations tab component | `src/pages/Settings.tsx` | T-053, T-025, T-043 | M |
| T-057 | Create Settings Projects tab component | `src/pages/Settings.tsx` | T-053 | M |
| T-058 | Implement Settings tab control UI | `src/pages/Settings.tsx` | T-053 | M |
| T-059 | Apply surface-3 token to active tab | `src/pages/Settings.tsx` | T-058 | S |
| T-060 | Apply surface-2 token to inactive tabs | `src/pages/Settings.tsx` | T-058 | S |
| T-061 | Apply border + divider tokens to tab control | `src/pages/Settings.tsx` | T-058 | S |
| T-062 | Implement Settings tab persistence logic | `src/pages/Settings.tsx` | T-053, T-054, T-055, T-056, T-057 | M |
| T-063 | Add trace quick-link to Intake table actions column | `src/pages/Intake.tsx` | T-001 | S |

**Details for T-053:**
Tab state manager:
```tsx
type SettingsTab = "runtime" | "secrets" | "integrations" | "projects";

export function Settings() {
  const [activeTab, setActiveTab] = useState<SettingsTab>("runtime");
  
  // Per-tab draft state
  const [runtimeDraft, setRuntimeDraft] = useState(/* ... */);
  const [secretsDraft, setSecretsDraft] = useState(/* ... */);
  const [integrationsDraft, setIntegrationsDraft] = useState(/* ... */);
  const [projectsDraft, setProjectsDraft] = useState(/* ... */);
  
  return (
    <div>
      {/* Tab control */}
      {/* Tab content */}
    </div>
  );
}
```

**Details for T-054:**
Runtime tab:
```tsx
function RuntimeTab({ draft, onChange }: { 
  draft: RuntimeDraft; 
  onChange: (draft: RuntimeDraft) => void;
}) {
  return (
    <div>
      {/* Backend runtime settings form */}
      {/* Local console connectivity controls */}
      {/* Workspace selector */}
    </div>
  );
}
```

**Details for T-055:**
Secrets tab:
```tsx
function SecretsTab({ draft, onChange }: { 
  draft: SecretsDraft; 
  onChange: (draft: SecretsDraft) => void;
}) {
  return (
    <div>
      {/* Secrets management form */}
    </div>
  );
}
```

**Details for T-056:**
Integrations tab:
```tsx
import { KanbanIntegrationPanel } from '@/components/pf/KanbanIntegrationPanel';

function IntegrationsTab({ draft, onChange, binding }: { 
  draft: IntegrationsDraft; 
  onChange: (draft: IntegrationsDraft) => void;
  binding: { scope: "global" | "project"; projectId: string | null; projectName: string | null };
}) {
  return (
    <KanbanIntegrationPanel
      initialDraft={draft}
      binding={binding}
      onSubmit={onChange}
    />
  );
}
```

**Details for T-057:**
Projects tab:
```tsx
function ProjectsTab({ draft, onChange }: { 
  draft: ProjectsDraft; 
  onChange: (draft: ProjectsDraft) => void;
}) {
  return (
    <div>
      {/* Projects CRUD surface */}
    </div>
  );
}
```

**Details for T-058:**
Tab control:
```tsx
<div className="border-b">
  <div className="flex gap-1">
    {(["runtime", "secrets", "integrations", "projects"] as const).map(tab => (
      <button
        key={tab}
        onClick={() => setActiveTab(tab)}
        className={`px-4 py-2 border-b-2 ${
          activeTab === tab 
            ? "bg-surface-3 border-blue-500" 
            : "bg-surface-2 border-transparent"
        }`}
      >
        {tab.charAt(0).toUpperCase() + tab.slice(1)}
      </button>
    ))}
  </div>
</div>

{/* Tab content */}
<div className="p-4">
  {activeTab === "runtime" && <RuntimeTab draft={runtimeDraft} onChange={setRuntimeDraft} />}
  {activeTab === "secrets" && <SecretsTab draft={secretsDraft} onChange={setSecretsDraft} />}
  {activeTab === "integrations" && <IntegrationsTab draft={integrationsDraft} onChange={setIntegrationsDraft} binding={bindingScope} />}
  {activeTab === "projects" && <ProjectsTab draft={projectsDraft} onChange={setProjectsDraft} />}
</div>
```

**Details for T-059:**
Replace `bg-surface-3` with `bg-[var(--surface-3)]`.

**Details for T-060:**
Replace `bg-surface-2` with `bg-[var(--surface-2)]`.

**Details for T-061:**
Replace border classes with:
```tsx
className="border-b border-[var(--divider)]"
className="border-b-2 border-[var(--border-bright)]"
```

**Details for T-062:**
Tab switches preserve drafts — already implemented in T-053 separate draft state per tab.

**Details for T-063:**
In `Intake.tsx` table actions column:
```tsx
<div className="flex gap-2">
  <Button asChild size="icon">
    <a href={`/intake/${row.id}`} title="View details">
      <EyeIcon />
    </a>
  </Button>
  <Button asChild size="icon" variant="secondary">
    <a href={`/pipeline/${row.id}`} title="View trace">
      <ActivityIcon />
    </a>
  </Button>
</div>
```

### Integration Refactor Verification

| Task | Title | Files | blockedBy | Effort |
|------|-------|-------|-----------|--------|
| T-064 | Unify Settings discovery to use kanban-discovery boundary | `src/pages/Settings.tsx`, `src/lib/kanban-discovery.ts` | T-034, T-056 | M |
| T-065 | Unify Prompts discovery to use kanban-discovery boundary | `src/pages/Prompts.tsx`, `src/lib/kanban-discovery.ts` | T-034 | M |
| T-066 | Remove duplicate discovery implementations from Settings | `src/pages/Settings.tsx` | T-064 | S |
| T-067 | Remove duplicate discovery implementations from Prompts | `src/pages/Prompts.tsx` | T-065 | S |
| T-068 | Verify Settings and Prompts share query cache | Test | T-064, T-065 | S |

**Details for T-064:**
Settings already uses KanbanIntegrationPanel which uses discovery hook (T-043). Verify no parallel impl exists.

**Details for T-065:**
If Prompts page has inline discovery, replace with:
```tsx
import { useKanbanWorkspaceDiscovery } from '@/lib/kanban-discovery';

const discovery = useKanbanWorkspaceDiscovery(baseUrl, passcode);
```

**Details for T-066:**
Delete old discovery code from Settings if any exists.

**Details for T-067:**
Delete old discovery code from Prompts if any exists.

**Details for T-068:**
Check React Query DevTools — same `(baseUrl, passcode)` produces single cache entry.

---

## Tier 3 — Depends on Tier 2

### Page Consolidation Completion

| Task | Title | Files | blockedBy | Effort |
|------|-------|-------|-----------|--------|
| T-069 | Create Pipeline list view route component | `src/pages/PipelineList.tsx` (new) | T-063 | M |
| T-070 | Implement Pipeline list table with note rows | `src/pages/PipelineList.tsx` | T-069 | M |
| T-071 | Add Pipeline list route to router | `src/App.tsx` | T-069 | S |
| T-072 | Update Pipeline trace route to accept :noteId param | `src/App.tsx` | T-069 | S |
| T-073 | Add trace action to Pipeline list rows | `src/pages/PipelineList.tsx` | T-070 | S |
| T-074 | Implement responsive tab control (768px breakpoint) | `src/pages/Settings.tsx` | T-053, T-062 | M |
| T-075 | Implement horizontal tab bar for >= 768px | `src/pages/Settings.tsx` | T-074 | S |
| T-076 | Implement dropdown for < 768px | `src/pages/Settings.tsx` | T-074 | M |
| T-077 | Preserve active tab across responsive transition | `src/pages/Settings.tsx` | T-074 | S |
| T-078 | Preserve unsaved edits across responsive transition | `src/pages/Settings.tsx` | T-074, T-062 | S |
| T-079 | Apply spacing scale tokens to tab control | `src/pages/Settings.tsx` | T-074 | S |

**Details for T-069:**
Create `src/pages/PipelineList.tsx`:
```tsx
export function PipelineList() {
  const { data: notes } = useIntakeNotes();
  
  return (
    <div>
      <h1>Pipeline</h1>
      {/* Table */}
    </div>
  );
}
```

**Details for T-070:**
Pipeline list table:
```tsx
<DataTable
  columns={[
    { header: "Note", accessor: "relativePath" },
    { header: "Lineage status", accessor: "lineageStatus" },
    { header: "Created", accessor: "createdAt" },
    { header: "Actions", accessor: "id", cell: (id) => (
      <Button asChild size="icon">
        <a href={`/pipeline/${id}`}>
          <ActivityIcon />
        </a>
      </Button>
    )},
  ]}
  data={notes ?? []}
/>
```

**Details for T-071:**
In `App.tsx`:
```tsx
<Route path="/pipeline" element={<PipelineList />} />
<Route path="/pipeline/:noteId" element={<Pipeline />} />
```

**Details for T-072:**
In `Pipeline.tsx`:
```tsx
import { useParams } from 'react-router-dom';

export function Pipeline() {
  const { noteId } = useParams<{ noteId: string }>();
  
  // Render trace detail for noteId
}
```

**Details for T-073:**
Already in T-070 actions column.

**Details for T-074:**
Responsive tab control:
```tsx
const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

useEffect(() => {
  const handleResize = () => setIsMobile(window.innerWidth < 768);
  window.addEventListener('resize', handleResize);
  return () => window.removeEventListener('resize', handleResize);
}, []);

return (
  <div>
    {isMobile ? (
      <TabDropdown activeTab={activeTab} onChange={setActiveTab} />
    ) : (
      <TabBar activeTab={activeTab} onChange={setActiveTab} />
    )}
    {/* Tab content (same for both) */}
  </div>
);
```

**Details for T-075:**
TabBar already implemented in T-058.

**Details for T-076:**
TabDropdown:
```tsx
function TabDropdown({ activeTab, onChange }: {
  activeTab: SettingsTab;
  onChange: (tab: SettingsTab) => void;
}) {
  return (
    <select
      value={activeTab}
      onChange={(e) => onChange(e.target.value as SettingsTab)}
      className="w-full border rounded-md px-2 py-1"
    >
      <option value="runtime">Runtime</option>
      <option value="secrets">Secrets</option>
      <option value="integrations">Integrations</option>
      <option value="projects">Projects</option>
    </select>
  );
}
```

**Details for T-077:**
activeTab state persists across resize — already handled in T-074 (same state var).

**Details for T-078:**
Draft states persist across resize — already handled in T-053 (separate state vars).

**Details for T-079:**
Replace hard-coded spacing with:
```tsx
className="gap-[var(--space-2)]"
className="px-[var(--space-4)] py-[var(--space-2)]"
```

### Final Verification

| Task | Title | Files | blockedBy | Effort |
|------|-------|-------|-----------|--------|
| T-080 | Verify no inline route-header duplication remains | `src/pages/*.tsx` | T-049, T-050, T-051 | S |
| T-081 | Verify no inline discovery query duplication remains | `src/pages/*.tsx`, `src/components/*.tsx` | T-064, T-065, T-066, T-067 | S |
| T-082 | Verify tone mapping single-location reused | `src/lib/route-status-utils.ts`, `src/components/pf/RoutePreview.tsx` | T-041, T-019 | S |
| T-083 | Verify RoutePreview uses only Visual Foundation tokens | `src/components/pf/RoutePreview.tsx` | T-021, T-022, T-023, T-024 | S |
| T-084 | Verify KanbanPanel uses only Visual Foundation tokens | `src/components/pf/KanbanIntegrationPanel.tsx` | T-030, T-031, T-032, T-033 | S |
| T-085 | Verify Settings tabs use only Visual Foundation tokens | `src/pages/Settings.tsx` | T-059, T-060, T-061, T-079 | S |
| T-086 | Verify no component box-shadow > 2px blur | `src/components/pf/*.tsx` | T-021, T-030 | S |
| T-087 | Verify no legacy CSS vars referenced | `src/**/*.tsx` | T-002, T-021, T-030 | S |
| T-088 | Verify discovery boundary 500ms debounce documented | `src/lib/kanban-discovery.ts` | T-036 | S |
| T-089 | Verify sanitizeErrorMessage handles all Kanban errors | `src/lib/error-utils.ts` | T-038, T-039, T-040 | S |
| T-090 | Verify Pipeline list does not render trace timeline | `src/pages/PipelineList.tsx` | T-070 | S |
| T-091 | Verify Pipeline trace detail unchanged behavior | `src/pages/Pipeline.tsx` | T-050, T-072 | S |
| T-092 | Verify responsive tab control preserves state | `src/pages/Settings.tsx` | T-077, T-078 | S |

**Details for T-080:**
```bash
grep -r "Route preview" src/pages/ --include="*.tsx"
grep -r "route detail cells" src/pages/ --include="*.tsx"
# Should only find imports of RoutePreview component
```

**Details for T-081:**
```bash
grep -r "kanban.*workspace.*discover" src/pages/ --include="*.tsx"
grep -r "kanban.*workspace.*discover" src/components/ --include="*.tsx"
# Should only find imports of useKanbanWorkspaceDiscovery or KanbanIntegrationPanel
```

**Details for T-082:**
Verify RoutePreview imports getRouteStatusTone from route-status-utils:
```tsx
import { getRouteStatusTone } from '@/lib/route-status-utils';

// Uses it in status badge
tone={getRouteStatusTone(props.route.routeStatus)}
```

**Details for T-083:**
Read RoutePreview, verify all className uses var(--surface-*), var(--space-*), var(--status-*), var(--type-*), var(--radius-*), var(--border*).

**Details for T-084:**
Read KanbanIntegrationPanel, verify all className uses Visual Foundation tokens.

**Details for T-085:**
Read Settings.tsx, verify tab control uses Visual Foundation tokens.

**Details for T-086:**
```bash
grep -r "box-shadow" src/components/pf/ --include="*.tsx"
# Check blur values <= 2px
```

**Details for T-087:**
```bash
grep -r "var(--background)" src/ --include="*.tsx"
grep -r "var(--foreground)" src/ --include="*.tsx"
grep -r "var(--surface-raised)" src/ --include="*.tsx"
grep -r "var(--status-success)" src/ --include="*.tsx"
# Should return 0 matches
```

**Details for T-088:**
Verify kanban-discovery.ts has comment:
```tsx
// Discovery debounce: 500ms idle gate before firing request
const DISCOVERY_DEBOUNCE_MS = 500;
```

**Details for T-089:**
Read error-utils.ts, verify sanitizeErrorMessage handles:
- Stack traces (file paths, line:col)
- Passcode redaction
- kanban_transport_error mapping
- null/undefined → fallback
- Non-Error → fallback

**Details for T-090:**
Read PipelineList.tsx, verify no timeline/diff/root-cause components rendered.

**Details for T-091:**
Read Pipeline.tsx, verify trace detail still renders timeline/diff/root-cause when noteId present.

**Details for T-092:**
Test: resize window across 768px, verify activeTab stays same, draft states unchanged.

---

## Summary

| Tier | Tasks | Effort |
|------|-------|--------|
| 0 | 12 | 12S |
| 1 | 30 | 19S, 8M, 3L |
| 2 | 26 | 9S, 14M, 3L |
| 3 | 24 | 15S, 7M, 2L |

**Total: 92 tasks, 4 tiers**

**Effort distribution:**
- S (small): 55 tasks
- M (medium): 29 tasks
- L (large): 8 tasks

---

## Delegation Strategy

**Model allocation:**
- Tier 0 (S tasks, token definitions): haiku or gpt-5.4-mini
- Tier 1-3 (M/L tasks, component creation): mix of haiku (simple), gpt-5.4-mini (moderate), sonnet (complex coordination)
- Orchestration: sonnet (parent thread)

**Wave grouping:**
- Wave 1: T-001 through T-012 (all Tier 0, parallel, 4-6 builders)
- Wave 2: T-013 through T-033 (Tier 1 components, parallel, 4-6 builders)
- Wave 3: T-034 through T-042 (Tier 1 integration, parallel, 3-4 builders)
- Continue tier-by-tier until T-092

Each task-builder receives:
- Task number + title
- Exact file paths
- Detailed implementation instructions from task description
- Relevant kit acceptance criteria
- Visual Foundation token reference

Task-builder output:
- Modified files committed to isolated worktree
- One commit per task with message: "feat: [task title] (T-NNN)"
- Parent merges when wave completes
