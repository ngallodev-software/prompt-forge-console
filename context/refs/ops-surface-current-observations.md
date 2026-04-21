# Ops Surface Current Observations

This document records the current behavior and pain points of the PromptForge console operational pages as observed from the codebase and user feedback.

## Pages in scope
- Review queue
- Deliveries
- Prompts
- Pipeline trace
- Intake explorer
- Logs

## Current behavior summary

### Review queue
- Aggregates prompt generations requiring review, failed prompt generations, failed deliveries, and failed processing runs.
- Current row presentation often degenerates to a prompt type label plus UUID.
- The page does not clearly explain whether the next action is review, retry, reroute, or trace inspection.

### Deliveries
- Shows delivery rows, queue depth, a detail sheet, and operational actions.
- Many rows look nearly identical unless the user already knows the UUID or short suffix.
- The page does not explain the conceptual difference between a delivery row, a retry candidate, and the detail pane.

### Prompts
- Shows prompt generations with status, review flag, destination, priority, and detail tabs.
- The row list is informative, but repeated IDs make the page feel like a database index rather than an operator surface.
- The page does not clearly answer "what is a prompt generation in this system?" for a new operator.

### Pipeline trace
- Displays a note-centric lineage view with revisions, prompt generations, deliveries, and processing runs.
- This is the strongest page structurally, but the entry point and usage model are not obvious.
- The page needs clearer guidance about when to use it and how to start from an intake note or a review item.

### Intake explorer
- Shows note path, status, watch eligibility, source device, and updated time.
- "Watch" and "watch_eligible" are not self-explanatory to a user.
- The note path is technically correct but too low-level to carry meaning on its own.

### Logs
- Shows a backend activity stream derived from persisted records, not raw container stdout.
- The service filter is now functional, but the page still needs explicit labeling so users understand what the stream represents.
- The current data shape can feel synthetic because several related rows often share the same timestamp.

## Shared current issues
- Identity-first presentation: UUIDs dominate where human meaning should dominate.
- Repetition without context: many rows look the same unless the user inspects secondary metadata.
- Weak job framing: pages often describe data categories instead of the operator action they support.
- Inconsistent terminology: "watch", "review", "delivery", and "prompt" are not introduced as a shared workflow.
- Detail is hidden in sheet/secondary tabs, so the list surfaces do not teach the mental model.

