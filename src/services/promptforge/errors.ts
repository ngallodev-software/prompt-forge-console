export class ApiError extends Error {
  readonly name: string;
  readonly cause?: unknown;

  constructor(
    public readonly status: number,
    public readonly detail: string,
    public readonly retryable: boolean,
    cause?: unknown
  ) {
    super(detail);
    Object.setPrototypeOf(this, new.target.prototype);
    this.name = new.target.name;
    this.cause = cause;
  }
}

export class BackendUnavailableError extends ApiError {
  constructor(detail = "Service temporarily unavailable", cause?: unknown) {
    super(503, detail, true, cause);
  }
}

export class NotFoundError extends ApiError {
  constructor(detail = "Resource not found", cause?: unknown) {
    super(404, detail, false, cause);
  }
}

export class ValidationError extends ApiError {
  constructor(status: 400 | 422 = 400, detail = "Invalid request", cause?: unknown) {
    super(status, detail, false, cause);
  }
}

export class StrictModeError extends Error {
  readonly name: string;
  readonly retryable = false;
  readonly cause?: unknown;

  constructor(message = "Strict backend required", cause?: unknown) {
    super(message);
    Object.setPrototypeOf(this, new.target.prototype);
    this.name = new.target.name;
    this.cause = cause;
  }
}
