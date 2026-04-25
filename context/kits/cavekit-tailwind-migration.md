# Cavekit: Tailwind CSS Migration

---
created: "2026-04-25T07:00:00Z"
last_edited: "2026-04-25T07:00:00Z"
---

## Scope

Migrate prompt-forge-console from custom Visual Foundation (VF) CSS variables to Kanban's Tailwind CSS 4.x design system. Replace arbitrary value syntax (`bg-[var(--surface-2)]`) with Tailwind utility classes (`bg-surface-2`). Align token structure, theme variants, and component patterns with `/lump/apps/kanban/web-ui` for suite-wide visual consistency. Preserve all requirements from `cavekit-visual-foundation.md` (surface hierarchy, themes, status palette, typography, spacing, radius) but implement via Tailwind instead of custom CSS vars.

## Requirements

### R1: Tailwind CSS 4.x @theme Directive

**Description:** Replace `:root` CSS variable definitions with Tailwind CSS 4.x `@theme` directive in `src/index.css`. All design tokens (surfaces, borders, text, accent, status, radius) defined in `@theme` block following Kanban's pattern. Import statement changes from `@tailwind base/components/utilities` to `@import "tailwindcss"`.

**Acceptance Criteria:**
- [ ] `src/index.css` contains `@import "tailwindcss"` as first line
- [ ] `@theme { }` block defines all color tokens with `--color-*` prefix
- [ ] Surface tokens: `--color-surface-0` through `--color-surface-4` (5 levels)
- [ ] Border tokens: `--color-border`, `--color-border-bright`, `--color-border-focus`, `--color-divider`
- [ ] Text tokens: `--color-text-primary`, `--color-text-secondary`, `--color-text-tertiary`
- [ ] Accent tokens: `--color-accent`, `--color-accent-hover`, `--color-accent-fg`
- [ ] Status tokens: `--color-status-blue`, `--color-status-green`, `--color-status-orange`, `--color-status-red`, `--color-status-purple`
- [ ] Radius tokens: `--radius-sm`, `--radius-md`, `--radius-lg`, `--radius-xl`
- [ ] Font family tokens: `--font-sans`, `--font-mono`
- [ ] No legacy VF tokens (`--surface-0`, `--border-vf`, `--type-*`, `--space-*`) in `@theme` block

**Dependencies:** None

### R2: Theme Variant Preservation

**Description:** Preserve existing theme switcher behavior for `data-theme="light"`, `data-theme="high-contrast-dark"`, and default dark theme. Theme variants override `--color-*` tokens via attribute selectors. Theme switching updates visuals without page reload.

**Acceptance Criteria:**
- [ ] `[data-theme="light"]` selector overrides surface/border/text/accent tokens
- [ ] `[data-theme="high-contrast-dark"]` selector overrides tokens
- [ ] Default theme (no `data-theme` attribute) uses dark values
- [ ] Light theme: `--color-surface-0` lighter than `--color-surface-4` (inverted hierarchy)
- [ ] High-contrast theme: text-on-surface contrast ≥ 7:1 (WCAG AAA)
- [ ] All three themes define same complete token set (no missing tokens)
- [ ] Changing `data-theme` attribute updates rendered colors without reload

**Dependencies:** R1

### R3: Tailwind Config Token Mapping

**Description:** Update `tailwind.config.ts` to expose design tokens as Tailwind utilities. Remove HSL `var()` references from `theme.extend.colors`. Add custom color utilities mapping to `--color-*` tokens. Spacing scale uses Tailwind defaults (4px base unit). Typography uses standard Tailwind size utilities (`text-xs`, `text-sm`, `text-2xl`).

**Acceptance Criteria:**
- [ ] `tailwind.config.ts` removes all `hsl(var(--*))` color definitions
- [ ] Custom colors defined for surfaces: `surface: { 0: "var(--color-surface-0)", ... 4: "var(--color-surface-4)" }`
- [ ] Border colors: `border: "var(--color-border)"`, `border-bright: "var(--color-border-bright)"`
- [ ] Text colors: `text-primary: "var(--color-text-primary)"`, etc.
- [ ] Status colors: `status-blue`, `status-green`, `status-orange`, `status-red`, `status-purple`
- [ ] Spacing scale unchanged (Tailwind default 4px base: `p-1` = 4px, `p-3` = 12px)
- [ ] No custom `--space-*` or `--type-*` tokens in config
- [ ] Radius tokens exposed: `borderRadius: { sm: "var(--radius-sm)", md: "var(--radius-md)", lg: "var(--radius-lg)", xl: "var(--radius-xl)" }`

**Dependencies:** R1

### R4: Component Migration to Utility Classes

**Description:** Replace all arbitrary CSS variable syntax in TSX components with Tailwind utility classes. Pattern: `bg-[var(--surface-2)]` → `bg-surface-2`, `border-[color:var(--border-vf)]` → `border-border`, `px-[var(--space-3)]` → `px-3`. Typography: `text-[length:var(--type-label-size)]` → `text-xs`. Zero arbitrary value syntax remaining after migration.

**Acceptance Criteria:**
- [ ] Zero occurrences of `var(--surface-` in `src/**/*.tsx` files
- [ ] Zero occurrences of `var(--border-` in `src/**/*.tsx` files
- [ ] Zero occurrences of `var(--space-` in `src/**/*.tsx` files
- [ ] Zero occurrences of `var(--type-` in `src/**/*.tsx` files
- [ ] All surface backgrounds use utility classes: `bg-surface-0`, `bg-surface-1`, etc.
- [ ] All borders use utility classes: `border-border`, `border-border-bright`
- [ ] All spacing uses Tailwind scale: `px-3`, `py-4`, `gap-2`, etc.
- [ ] All typography uses Tailwind utilities: `text-xs`, `text-sm`, `text-2xl`, `font-bold`
- [ ] RoutePreview.tsx migrated (6 VF usages → 0)
- [ ] KanbanIntegrationPanel.tsx migrated (9 VF usages → 0)
- [ ] Settings.tsx migrated (3 VF usages → 0)

**Dependencies:** R1, R2, R3

### R5: Visual Foundation Compliance

**Description:** All acceptance criteria from `cavekit-visual-foundation.md` remain satisfied after migration. Surface hierarchy, theme variants, typography scale, status palette, spacing scale, border radius scale, and elevation rules unchanged functionally. Implementation method changes (Tailwind utilities vs custom vars) but visual output identical.

**Acceptance Criteria:**
- [ ] Five surface tokens render correctly in dev server
- [ ] Surface luminance ordering preserved (dark: 0 < 1 < 2 < 3 < 4; light: 0 > 1 > 2 > 3 > 4)
- [ ] Status palette colors match pre-migration values (green: `#3FB950`, orange: `#D29922`, red: `#F85149`)
- [ ] Spacing scale 4px base unit: 4, 8, 12, 16, 24, 32, 48, 64px
- [ ] Border radius scale: sm < md < lg < xl
- [ ] Typography roles render at correct sizes (h1: 2.5rem, body: ~0.875rem, label: 0.75rem)
- [ ] Theme switcher UI functional (toggles `data-theme` attribute)
- [ ] No console errors related to missing CSS variables

**Dependencies:** R4

### R6: Build and Test Validation

**Description:** Application builds without errors, existing test suite passes, dev server runs without warnings. No regressions introduced by migration.

**Acceptance Criteria:**
- [ ] `npm run build` succeeds with zero errors
- [ ] `npm test` passes all existing tests (no new failures)
- [ ] `npm run dev` starts dev server without CSS-related warnings
- [ ] No browser console errors on Dashboard, Intake, Settings, Health pages
- [ ] TypeScript compilation succeeds (no new type errors)

**Dependencies:** R4, R5

## Out of Scope

- Changing theme color values (palette stays identical to pre-migration)
- Adding new components or features
- Modifying component logic or behavior
- Changing page layouts or navigation structure
- Updating shadcn/ui component library
- Adding new theme variants beyond existing three (dark, light, high-contrast-dark)
- Motion/animation token migration (not part of VF → Tailwind scope)

## Cross-References

- `cavekit-visual-foundation.md` — Design requirements this migration must preserve
- `context/refs/kanban-tailwind-reference.md` — Reference patterns from Kanban
- `cavekit-component-extraction.md` — Components consuming migrated tokens

## Changelog

- 2026-04-25: Initial migration cavekit. Defines R1-R6 for migrating VF CSS vars to Tailwind 4.x utilities following Kanban patterns.
