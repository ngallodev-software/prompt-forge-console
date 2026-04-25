---
created: "2026-04-24T23:00:00Z"
last_edited: "2026-04-24T23:00:00Z"
---

# Cavekit: Visual Foundation

## Scope
Defines the design token foundation for the prompt-forge-console frontend: the surface hierarchy, theme variants, typography scale, status palette, spacing scale, border radius scale, and elevation rules. Replaces the legacy HSL semantic variable system (`--background`, `--foreground`, `--surface-raised`, `--surface-sunken`, `--primary`, `--status-*`) with a surface-numbered token system aligned to the Kanban design language. This kit is the single source of truth for color, type, spacing, radius, and elevation tokens consumed by all downstream UI work.

## Requirements

### R1: Surface Hierarchy
**Description:** The token system exposes a five-level surface hierarchy (`surface-0` through `surface-4`) that establishes a consistent depth ordering for all background fills. `surface-0` is the deepest (page chrome / app background), `surface-1` is the base content surface, `surface-2` is for cards and panels, `surface-3` is for elevated containers, and `surface-4` is for the highest-elevation overlays. Legacy tokens (`--background`, `--foreground`, `--surface-raised`, `--surface-sunken`) are no longer present.
**Acceptance Criteria:**
- [ ] Exactly five surface tokens exist: `surface-0`, `surface-1`, `surface-2`, `surface-3`, `surface-4`.
- [ ] In the default (dark) theme, the resolved luminance of each surface is strictly greater than the surface immediately below it (i.e. `surface-0` < `surface-1` < `surface-2` < `surface-3` < `surface-4` by perceived lightness).
- [ ] No CSS variables named `--background`, `--foreground`, `--surface-raised`, or `--surface-sunken` are defined or referenced anywhere in the token foundation.
- [ ] Each surface token resolves to a single opaque color value (no alpha channel, no gradient).
- [ ] The five surface tokens are documented with a stated semantic role (page, base, card, elevated, overlay).
**Dependencies:** none

### R2: Theme Variants
**Description:** Three theme variants are supported and selectable via a `data-theme` attribute on a root element: dark (default, applied when no attribute is present), light, and high-contrast-dark. Switching the attribute swaps the resolved values of the foundation tokens (surfaces, borders, text, accents) without requiring any consumer to change which token name it references.
**Acceptance Criteria:**
- [ ] With no `data-theme` attribute set, the dark theme values resolve.
- [ ] Setting `data-theme="light"` resolves the foundation tokens to a light palette where `surface-0` is lighter than `surface-4` (inverted depth ordering relative to dark).
- [ ] Setting `data-theme="high-contrast-dark"` resolves the foundation tokens to values whose text-on-surface contrast ratio meets or exceeds WCAG AAA (7:1) for primary text on `surface-1`.
- [ ] All three themes define values for the same complete set of foundation tokens (no theme is missing a token defined by another theme).
- [ ] Changing `data-theme` at runtime updates resolved colors without requiring a page reload.

### R3: Typography Scale
**Description:** Typography is defined as a named scale of at least seven roles: `h1`, `h2`, `h3`, `body`, `small`, `code`, and `label`. Each role specifies a font family token, a font size, a line height, and a font weight. Two font family tokens exist: a sans family (Geist / Inter / system fallback) and a mono family (SF Mono / Menlo / system mono fallback). The `code` role uses the mono family; all other roles use the sans family.
**Acceptance Criteria:**
- [ ] At least seven distinct named typography roles are defined: `h1`, `h2`, `h3`, `body`, `small`, `code`, `label`.
- [ ] The seven roles resolve to at least seven distinct font-size values (no two roles share the same size).
- [ ] A sans font-family token is defined whose first-listed family is `Geist` and which includes `Inter` and a system fallback.
- [ ] A mono font-family token is defined whose first-listed monospace family is one of `SF Mono` / `SFMono-Regular` / `ui-monospace` and which includes `Menlo` as a fallback.
- [ ] The `code` typography role resolves to the mono family; the other six roles resolve to the sans family.
- [ ] Each typography role defines a line-height and a font-weight in addition to font-size.

### R4: Status Palette
**Description:** A status color palette of exactly five named colors is defined: `status-blue`, `status-green`, `status-orange`, `status-red`, `status-purple`. The status palette is theme-independent: status tokens resolve to the same values across all three theme variants, so a "red" status badge looks the same hue in dark, light, and high-contrast-dark.
**Acceptance Criteria:**
- [ ] Exactly five status tokens exist: `status-blue`, `status-green`, `status-orange`, `status-red`, `status-purple`.
- [ ] Each of the five status tokens resolves to the same color value under `data-theme="light"`, `data-theme="high-contrast-dark"`, and the default dark theme.
- [ ] No legacy status token names (`--status-success`, `--status-warn`, `--status-danger`) are defined or referenced.
- [ ] Each status token resolves to an opaque color value (no alpha channel).
- [ ] Each status token has a documented semantic role (informational, success, warning, error, neutral-accent).

### R5: Spacing Scale
**Description:** A spacing scale of exactly eight tokens is defined on a 4px base unit, with the values 4, 8, 12, 16, 24, 32, 48, and 64 pixels. The scale is the only sanctioned source of spacing values for downstream UI work.
**Acceptance Criteria:**
- [ ] Exactly eight spacing tokens are defined.
- [ ] The eight spacing tokens resolve, in ascending order, to 4px, 8px, 12px, 16px, 24px, 32px, 48px, and 64px.
- [ ] Each spacing token name encodes its scale step in a stable ordering (e.g. `space-1` through `space-8`, or equivalent named steps).
- [ ] Spacing tokens are theme-independent (their resolved values do not change across theme variants).

### R6: Border Radius Scale
**Description:** A border radius scale of exactly four tokens is defined: `radius-sm`, `radius-md`, `radius-lg`, `radius-xl`, with strictly increasing values.
**Acceptance Criteria:**
- [ ] Exactly four radius tokens exist: `radius-sm`, `radius-md`, `radius-lg`, `radius-xl`.
- [ ] The four tokens resolve to strictly increasing pixel values (`sm` < `md` < `lg` < `xl`).
- [ ] Radius tokens are theme-independent.
- [ ] Each radius token resolves to a single length value (not a shorthand of multiple values).

### R7: Elevation via Border and Background Shift
**Description:** Elevation between adjacent surface levels is communicated by combining a background change (moving up the surface hierarchy) and a border using the foundation border tokens. Heavy drop shadows are not part of the elevation system. The foundation defines at least three border tokens (`border`, `border-bright`, `border-focus`) and a `divider` token used for hairline separators.
**Acceptance Criteria:**
- [ ] The foundation defines border tokens named `border`, `border-bright`, and `border-focus`.
- [ ] The foundation defines a `divider` token distinct from the border tokens.
- [ ] No elevation token defines a `box-shadow` value with blur radius greater than 2px.
- [ ] The documented elevation pattern requires a surface-level change plus a border token, with no reliance on `box-shadow` for the primary depth cue.
- [ ] In the default dark theme, `border-bright` resolves to a lighter value than `border` (so it reads as more prominent against shared surfaces).

## Out of Scope
- Component-level styling (button variants, input states, badge layouts, card chrome) — owned by the Component Extraction domain.
- Page-specific layouts, grids, and route-level composition — owned by the Page Consolidation domain.
- Motion / animation tokens (durations, easings, transition primitives).
- Iconography sizing, stroke weights, and icon set selection.
- Z-index scale and stacking context rules.
- Form validation copy, microcopy, or any content concerns.
- Accessibility behavior beyond the contrast guarantees called out in R2 (focus ring shape, keyboard nav, ARIA patterns).
- Data visualization palettes (chart series colors, sequential / diverging scales).

## Cross-References
- cavekit-component-extraction.md — consumes Visual Foundation tokens (surfaces, borders, text, status, radius, spacing, typography) for all component styling.
- cavekit-page-consolidation.md — consumes Visual Foundation spacing and surface tokens for page-level layout.
- cavekit-tailwind-migration.md — implementation migration from custom CSS vars to Tailwind utilities.

## Changelog
- 2026-04-25: **Implementation migrated to Tailwind CSS**. Requirements R1-R7 unchanged (surface hierarchy, themes, status palette, spacing, radius, typography, elevation). Implementation method changed from custom CSS variables (`--surface-0`, `--type-*`, `--space-*`) to Tailwind utilities via `--color-*` token layer. Components now use `bg-surface-2`, `text-xs`, `px-3` instead of arbitrary values. Visual output identical, suite-aligned with Kanban design system.
- 2026-04-24: Initial brownfield cavekit. Captures the migration target from the legacy HSL semantic variable system in `prompt-forge` `index.css` to the Kanban surface-numbered token system, defining R1-R7 covering surface hierarchy, theme variants, typography, status palette, spacing, radius, and elevation rules.
