# Tracking

## Current Status
- implementation complete

## Notes
- The Settings page already has the right section for Kanban binding, so the remaining work is mostly clarity and fallback signaling.
- Intake Detail is now the primary route-explanation surface; Dashboard stays aggregate-only.

## Open Questions
- Whether the backend should eventually expose a first-class route contract instead of the console deriving it from existing intake fields.
- Whether a dedicated replay mutation is worth adding later, or if the current drill-down links are enough for v1.
