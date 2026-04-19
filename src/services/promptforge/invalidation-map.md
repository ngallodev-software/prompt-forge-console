# PromptForge Mutation Invalidation Map

All console mutations invalidate query caches only after the mutation succeeds.
None of the current console mutations use optimistic cache invalidation.

The current `qk` object in `src/services/promptforge/api.ts` does not expose a single
`qk.dashboardMetrics` key. The dashboard-relevant query families are currently
`qk.slaSummary`, `qk.projectThroughput`, and `qk.queueDepth`, all of which sit under
the delivery/metrics prefixes below.

## Mutation groups

| Mutation group | Invalidated query keys | Timing |
| --- | --- | --- |
| Delivery retry, reroute, status update | `qk.deliveriesList`, `qk.delivery`, `qk.deliveryByPrompt`, `qk.deliveryHistory`, `qk.queueDepth`, `qk.slaSummary`, `qk.projectThroughput` | Post-confirmation |
| Rule patch | `qk.rulesets`, `qk.rulesByRuleset` | Post-confirmation |
| Dictionary upsert | `qk.termDict` | Post-confirmation |
| Template activate | `qk.templates`, `qk.promptList`, `qk.prompt`, `qk.promptByNote` | Post-confirmation |
| Force review | `qk.promptList`, `qk.prompt`, `qk.promptByNote` | Post-confirmation |
| Clone prompt | `qk.promptList`, `qk.prompt`, `qk.promptByNote` | Post-confirmation |
| Prompt priority patch | `qk.promptList`, `qk.prompt`, `qk.promptByNote` | Post-confirmation |
| Intake archive | `qk.intakeList`, `qk.intake`, `qk.intakeStatusCounts` | Post-confirmation |

## Exported invalidation sets

The corresponding typed invalidation sets are exported from
`src/services/promptforge/mutation-invalidation.ts`:

- `DELIVERY_MUTATION_KEYS`
- `RULE_MUTATION_KEYS`
- `DICTIONARY_MUTATION_KEYS`
- `TEMPLATE_MUTATION_KEYS`
- `PROMPT_MUTATION_KEYS`
- `INTAKE_MUTATION_KEYS`
