# Impl Tracking: Recursive Voice Routing UI

## Status

- phase: complete
- branch: `fork/feature-request/recursive-voice-routing`
- implementation: complete

## Confirmed Facts

- `src/pages/Settings.tsx` already owns Kanban binding and workspace discovery.
- `src/pages/IntakeDetail.tsx` is the right place for source-path, route-family, and fallback explanation.
- `src/pages/Dashboard.tsx` should stay aggregate-only.
- `src/services/promptforge/types.ts` does not yet expose a dedicated route contract, so the console can derive route meaning from existing intake records and route metadata blobs.

## Planning Decisions Locked

- keep binding scope clarity in Settings
- show route meaning and replay state inline on Intake Detail
- fail closed on unsupported route families
- treat Kanban unavailability as queue/review fallback, not a page failure
- keep Dashboard as a rollup only

## Implemented

- added a pure voice-route parser and summarizer in `src/services/promptforge/voice-routing.ts`
- added canonical voice-route mock intake paths so local development exercises direct, fallback, and unsupported states
- added scope clarity card to Settings
- added Intake Detail route preview, fallback/replay, and Kanban binding state
- added deliveries-sheet deep-linking so replay/discovery can land on the selected delivery record
- added Dashboard routing rollup counts

## Validation

- `npm test`
  - pass
- `npm run build`
  - pass

## Remaining

- no dedicated replay mutation was added; the UI surfaces replay state and the existing delivery/pipeline drill-downs
- if the backend later exposes a first-class route contract, the helper should prefer that over local derivation
