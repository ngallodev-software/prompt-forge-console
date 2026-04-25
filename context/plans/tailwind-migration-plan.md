# Tailwind CSS Migration: Align prompt-forge-console with Kanban Design System

## Context

Red-team review v2 found prompt-forge-console **does not match Kanban suite** visually (grade: D). Different design token systems prevent visual cohesion across apps:

- **prompt-forge**: Custom Visual Foundation (VF) with `--surface-0` to `--surface-4`, `--type-*` roles, `--space-*` scale, arbitrary CSS var syntax
- **Kanban**: Tailwind CSS 4.x with `@theme` directive, direct color tokens (`--color-surface-0`), utility classes (`bg-surface-1`, `text-sm`, `px-3`)

**Goal**: Replace prompt-forge VF implementation with Kanban's Tailwind-based design system. Keep existing cavekit-visual-foundation.md spec (surface hierarchy, themes, status palette) but implement via Tailwind utilities instead of arbitrary values.

**Rationale**: Suite-wide consistency. Both apps same visual language. Easier maintenance. Tailwind IntelliSense + faster dev experience.

## Plan

### Phase 1: Set Up Context Directory (Brownfield Adoption)

Follow `ck:brownfield-adoption` skill:

1. **Create context structure**:
```
context/
├── refs/
│   └── kanban-tailwind-reference.md    # Kanban globals.css + usage patterns
├── kits/
│   └── cavekit-tailwind-migration.md   # Migration requirements
└── plans/
    └── tailwind-migration-plan.md      # This plan
```

2. **Write `context/refs/kanban-tailwind-reference.md`**:
   - Copy `/lump/apps/kanban/web-ui/src/styles/globals.css` (already read)
   - Document Kanban Tailwind patterns from `board-card.tsx`
   - Extract token mapping (VF → Tailwind)

3. **Write `context/kits/cavekit-tailwind-migration.md`**:
   - **R1**: Replace CSS vars with Tailwind `@theme` directive
   - **R2**: Migrate component arbitrary values to utility classes
   - **R3**: Update tailwind.config.ts to match Kanban
   - **R4**: Preserve existing theme switcher behavior
   - **R5**: Maintain all acceptance criteria from cavekit-visual-foundation.md
   - Each requirement gets testable acceptance criteria

### Phase 2: Tailwind Config Migration

**File**: `/lump/apps/prompt-forge-console/tailwind.config.ts`

**Changes**:
1. Replace `theme.extend.colors` HSL var refs with direct Tailwind theme
2. Match Kanban's surface/border/text token structure
3. Keep existing status palette values (green/orange/red match between apps)

**Token mapping**:
```
VF → Tailwind
--surface-0 → --color-surface-0
--surface-1 → --color-surface-1
--border-vf → --color-border
--type-label-size → text-xs (Tailwind utility)
--space-3 → px-3 (Tailwind utility)
```

### Phase 3: CSS Variable Migration

**File**: `/lump/apps/prompt-forge-console/src/index.css`

**Replace**:
- Legacy `:root` HSL vars (`--surface-0`, `--type-*`, `--space-*`)
- `@layer base` blocks with VF vars

**With**:
- Tailwind `@theme` directive (CSS 4.x `@import "tailwindcss"`
 syntax)
- Direct token definitions matching Kanban `globals.css`

**Preserve**:
- `[data-theme="light"]`, `[data-theme="high-contrast-dark"]` selectors
- Surface hierarchy ordering (0-4)
- Status palette values

### Phase 4: Component Migration (Iteration Loop)

**Target**: 104 TSX files, 22 VF token usages

**Pattern**:
```tsx
// Before (VF arbitrary values)
className="bg-[var(--surface-2)] border-[color:var(--border-vf)] px-[var(--space-3)]"

// After (Tailwind utilities)
className="bg-surface-2 border-border px-3"
```

**Files to migrate** (priority order):
1. `RoutePreview.tsx` — 6 VF usages
2. `KanbanIntegrationPanel.tsx` — 9 VF usages
3. `Settings.tsx` — 3 VF usages
4. Remaining components with VF refs

**Iteration strategy**:
- Run codemod/manual migration in batches
- Check build after each file
- Verify visual regression with dev server
- Commit each batch

### Phase 5: Validation

**Acceptance criteria** (from cavekit-visual-foundation.md):
- [ ] All 5 surface tokens render correctly in dev server
- [ ] Theme switcher changes `data-theme` and updates visuals
- [ ] Status badges use correct palette colors
- [ ] Spacing matches design (4px base unit)
- [ ] Typography roles render at correct sizes
- [ ] Border radius scale consistent
- [ ] No console errors from missing CSS vars

**Visual regression check**:
1. Start dev server: `npm run dev`
2. Navigate to each page (Dashboard, Intake, Settings, Health)
3. Toggle theme (light/dark/high-contrast)
4. Compare screenshots to pre-migration baseline

**Test suite**:
- Run existing tests: `npm test`
- No new test failures
- Build succeeds: `npm run build`

### Phase 6: Documentation Update

**Update**:
- `context/kits/cavekit-visual-foundation.md` — note implementation now Tailwind-based
- Add migration notes to changelog section
- Document new component patterns for future work

## Critical Files

**Read before starting**:
- `/lump/apps/kanban/web-ui/src/styles/globals.css` — Tailwind theme reference
- `/lump/apps/prompt-forge-console/src/index.css` — Current VF implementation
- `/lump/apps/prompt-forge-console/context/kits/cavekit-visual-foundation.md` — Design requirements

**Modify**:
- `/lump/apps/prompt-forge-console/tailwind.config.ts`
- `/lump/apps/prompt-forge-console/src/index.css`
- `/lump/apps/prompt-forge-console/src/components/pf/*.tsx` (VF consumers)
- `/lump/apps/prompt-forge-console/src/pages/*.tsx` (VF consumers)

## Implementation Sequence

1. **Set up context directory** (30 min)
2. **Write migration cavekit** (45 min)
3. **Migrate tailwind.config.ts** (1 hour)
4. **Migrate index.css to @theme** (2 hours)
5. **Migrate components** (iteration loop, 4-6 hours)
6. **Validate + visual regression** (1 hour)
7. **Documentation** (30 min)

**Total estimate**: 10-12 hours over 2-3 sessions

## Risks and Mitigation

| Risk | Mitigation |
|------|------------|
| Breaking existing styles | Migrate incrementally, test after each batch |
| Theme switcher breaks | Test theme variants early in Phase 5 |
| Tailwind utilities missing for VF tokens | Add custom utilities to tailwind.config if needed |
| Visual regressions | Screenshot comparison before/after |
| Build failures from missing vars | Check build after CSS migration before component work |

## Exit Criteria

- [ ] Zero arbitrary CSS var syntax (`var(--surface-*)`) in components
- [ ] All components use Tailwind utilities (`bg-surface-2`, `border-border`)
- [ ] Theme switcher works across all 3 variants
- [ ] Visual match to Kanban design system (validated by side-by-side comparison)
- [ ] Build succeeds, no console errors
- [ ] All cavekit-visual-foundation.md acceptance criteria pass
- [ ] Red-team review v3 grades theme consistency A- or better
