# PromptForge Service Error Policy

This service layer uses typed errors so callers can decide whether to retry, surface, or fall back.

## Error Types

| Error | When it is thrown | Retryable | User-facing message |
| --- | --- | --- | --- |
| `BackendUnavailableError` | `fetchJson()` receives HTTP 503 | Yes | `Service temporarily unavailable` |
| `NotFoundError` | `fetchJson()` receives HTTP 404 | No | `Resource not found` |
| `ValidationError` | `fetchJson()` receives HTTP 400 or 422 | No | `Invalid request` or a field-specific validation message from the backend |
| `ApiError` | `fetchJson()` hits a network failure or an unmapped HTTP failure | Network failures are retryable; unmapped HTTP failures are handled per status | Use the `detail` string when present; otherwise fall back to a short service-unavailable message |
| `StrictModeError` | Strict backend mode requires the backend and a fallback path is not allowed | No | The strict-backend message should be shown as-is |

## Retry Policy

- `503` and network failures are retryable.
- `404` is not retryable because the resource is missing.
- `400` and `422` are not retryable because the request must be corrected.
- `StrictModeError` is not retryable because the caller must either fix the backend or stop using the fallback path.

## User-Facing Guidance

- `503`: show `Service temporarily unavailable` and offer a retry action when the caller supports one.
- `404`: show `Resource not found` and do not auto-retry.
- `400/422`: show validation details, preferably tied to the field or request input that needs correction.
- Network errors: show a short connectivity message such as `Unable to reach the service`.
- `StrictModeError`: show the strict-backend failure message; this is a configuration problem, not a transient outage.

## Surface vs Swallow

- Surface to the user:
  - `ValidationError`
  - `NotFoundError`
  - `StrictModeError`
  - Any non-retryable `ApiError` that has no fallback path
- Swallow only in service wrappers that have an explicit fallback path:
  - bootstrap hydration in non-strict mode
  - health checks in non-strict mode
  - mutation helpers in non-strict mode when they intentionally return optimistic fallback data

When an error is swallowed, the caller should log the failure and return fallback data only if the fallback is deterministic and safe.
