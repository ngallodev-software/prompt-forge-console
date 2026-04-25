# Kanban Tailwind Reference

Source material for migrating prompt-forge-console to Kanban's Tailwind-based design system.

## Source Files

- `/lump/apps/kanban/web-ui/src/styles/globals.css` — Tailwind `@theme` directive with color tokens
- `/lump/apps/kanban/web-ui/src/components/board-card.tsx` — Example component using Tailwind utilities

## Tailwind CSS 4.x @theme Directive

Kanban uses Tailwind CSS 4.x with the `@theme` directive for token definitions:

```css
@import "tailwindcss";

@theme {
  /* Surface hierarchy */
  --color-surface-0: #1F2428;
  --color-surface-1: #24292E;
  --color-surface-2: #2D3339;
  --color-surface-3: #353C43;
  --color-surface-4: #3E464E;

  /* Borders */
  --color-border: #30363D;
  --color-border-bright: #444C56;
  --color-border-focus: #0084FF;
  --color-divider: #141820;

  /* Text */
  --color-text-primary: #E6EDF3;
  --color-text-secondary: #8B949E;
  --color-text-tertiary: #6E7681;

  /* Accent / brand */
  --color-accent: #0084FF;
  --color-accent-hover: #339DFF;
  --color-accent-fg: #FFFFFF;

  /* Status colors */
  --color-status-blue: #4C9AFF;
  --color-status-green: #3FB950;
  --color-status-orange: #D29922;
  --color-status-red: #F85149;
  --color-status-purple: #A371F7;

  /* Typography */
  --font-sans: "Geist", "Inter", -apple-system, BlinkMacSystemFont, system-ui, sans-serif;
  --font-mono: ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace;

  /* Border radius */
  --radius-sm: 4px;
  --radius-md: 6px;
  --radius-lg: 8px;
  --radius-xl: 12px;
}
```

## Theme Variants

Kanban supports multiple themes via `[data-theme]` attribute:

```css
[data-theme="graphite"] {
  --color-surface-0: #1E1E1E;
  --color-surface-1: #252526;
  /* ... */
}

[data-theme="midnight"] {
  --color-surface-0: #121214;
  /* ... */
}

[data-theme="light"] {
  --color-surface-0: #FFFFFF;
  --color-surface-1: #fefefe;
  /* ... */
}
```

## Component Usage Patterns

From `board-card.tsx`:

```tsx
// Status colors referenced directly
const SESSION_ACTIVITY_COLOR = {
  thinking: "var(--color-status-blue)",
  success: "var(--color-status-green)",
  error: "var(--color-status-red)",
  warning: "var(--color-status-orange)",
} as const;

// Tailwind utilities for common patterns
// (No arbitrary values like bg-[var(--surface-2)])
// Instead: direct utility classes mapped to theme tokens
```

## Token Mapping: Visual Foundation → Tailwind

| VF Token | Tailwind Equivalent | Usage |
|----------|---------------------|-------|
| `--surface-0` | `--color-surface-0` / `bg-surface-0` | Page background |
| `--surface-1` | `--color-surface-1` / `bg-surface-1` | Base content surface |
| `--surface-2` | `--color-surface-2` / `bg-surface-2` | Card container |
| `--surface-3` | `--color-surface-3` / `bg-surface-3` | Elevated component |
| `--surface-4` | `--color-surface-4` / `bg-surface-4` | Overlay/modal |
| `--border-vf` | `--color-border` / `border-border` | Standard border |
| `--border-bright` | `--color-border-bright` / `border-border-bright` | Emphasized border |
| `--border-focus` | `--color-border-focus` / `ring-border-focus` | Focus ring |
| `--divider` | `--color-divider` / `border-divider` | Hairline separator |
| `--type-label-size` | `text-xs` | Small label text |
| `--type-body-size` | `text-sm` | Body text |
| `--type-h2-size` | `text-2xl` | H2 heading |
| `--space-1` | `p-1` / `m-1` / `gap-1` (4px) | Spacing step 1 |
| `--space-2` | `p-2` / `m-2` / `gap-2` (8px) | Spacing step 2 |
| `--space-3` | `p-3` / `m-3` / `gap-3` (12px) | Spacing step 3 |
| `--space-4` | `p-4` / `m-4` / `gap-4` (16px) | Spacing step 4 |
| `--radius-sm` | `--radius-sm` / `rounded-sm` | Small radius |
| `--radius-md` | `--radius-md` / `rounded-md` | Medium radius |
| `--radius-lg` | `--radius-lg` / `rounded-lg` | Large radius |
| `--radius-xl` | `--radius-xl` / `rounded-xl` | XL radius |
| `--status-blue` | `--color-status-blue` | Info status |
| `--status-green` | `--color-status-green` | Success status |
| `--status-orange` | `--color-status-orange` | Warning status |
| `--status-red` | `--color-status-red` | Error status |
| `--status-purple` | `--color-status-purple` | Accent status |

## Migration Pattern Examples

### Before (VF arbitrary values)

```tsx
<div className="bg-[var(--surface-2)] border-[color:var(--border-vf)] px-[var(--space-3)] rounded-[var(--radius-lg)]">
  <h2 className="text-[length:var(--type-h2-size)] font-[var(--type-h2-weight)]">Title</h2>
  <p className="text-[length:var(--type-body-size)]">Body text</p>
</div>
```

### After (Tailwind utilities)

```tsx
<div className="bg-surface-2 border-border px-3 rounded-lg">
  <h2 className="text-2xl font-bold">Title</h2>
  <p className="text-sm">Body text</p>
</div>
```

## Key Differences from VF System

1. **No arbitrary values**: Tailwind utilities replace `bg-[var(--surface-2)]` with `bg-surface-2`
2. **Direct token names**: `--color-surface-0` instead of `--surface-0`
3. **Standard spacing scale**: Tailwind's 4px base unit (`p-3` = 12px) matches VF `--space-3`
4. **Typography via utilities**: `text-xs`, `text-sm`, `text-2xl` instead of `--type-*` vars
5. **@theme directive**: Tokens defined in CSS `@theme` block, not `:root`
