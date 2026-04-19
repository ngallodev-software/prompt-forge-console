import { describe, it, expect } from "vitest";
import { adaptPageResult } from "../api";
import { ApiError, BackendUnavailableError, NotFoundError, ValidationError, StrictModeError } from "../errors";

// ──────────────────────────── Error classes

describe("ApiError", () => {
  it("sets status, detail, retryable", () => {
    const err = new ApiError(500, "server error", true);
    expect(err.status).toBe(500);
    expect(err.detail).toBe("server error");
    expect(err.retryable).toBe(true);
    expect(err.message).toBe("server error");
  });

  it("instanceof check works across subclasses", () => {
    const err = new BackendUnavailableError();
    expect(err instanceof ApiError).toBe(true);
    expect(err instanceof BackendUnavailableError).toBe(true);
  });

  it("name reflects subclass", () => {
    expect(new BackendUnavailableError().name).toBe("BackendUnavailableError");
    expect(new NotFoundError().name).toBe("NotFoundError");
    expect(new ValidationError().name).toBe("ValidationError");
  });
});

describe("BackendUnavailableError", () => {
  it("status=503, retryable=true", () => {
    const err = new BackendUnavailableError("db down");
    expect(err.status).toBe(503);
    expect(err.retryable).toBe(true);
  });
});

describe("NotFoundError", () => {
  it("status=404, retryable=false", () => {
    const err = new NotFoundError("intake_not_found");
    expect(err.status).toBe(404);
    expect(err.retryable).toBe(false);
  });
});

describe("ValidationError", () => {
  it("status=400, retryable=false", () => {
    const err = new ValidationError(400, "invalid_status");
    expect(err.status).toBe(400);
    expect(err.retryable).toBe(false);
  });

  it("status=422 accepted", () => {
    const err = new ValidationError(422, "unprocessable");
    expect(err.status).toBe(422);
  });
});

describe("StrictModeError", () => {
  it("retryable=false", () => {
    const err = new StrictModeError();
    expect(err.retryable).toBe(false);
    expect(err.name).toBe("StrictModeError");
  });
});

// ──────────────────────────── adaptPageResult

describe("adaptPageResult", () => {
  it("maps offset=0, limit=25 to page=1", () => {
    const raw = {
      intakeNotes: [{ id: "1" }],
      pagination: { total: 100, limit: 25, offset: 0, has_more: true },
    };
    const result = adaptPageResult(raw as never, "intakeNotes", 25);
    expect(result.rows).toHaveLength(1);
    expect(result.total).toBe(100);
    expect(result.page).toBe(1);
    expect(result.pageSize).toBe(25);
  });

  it("maps offset=25, limit=25 to page=2", () => {
    const raw = {
      intakeNotes: [],
      pagination: { total: 100, limit: 25, offset: 25, has_more: true },
    };
    const result = adaptPageResult(raw as never, "intakeNotes", 25);
    expect(result.page).toBe(2);
  });

  it("maps offset=50, limit=10 to page=6", () => {
    const raw = {
      logs: [],
      pagination: { total: 200, limit: 10, offset: 50, has_more: true },
    };
    const result = adaptPageResult(raw as never, "logs", 10);
    expect(result.page).toBe(6);
  });

  it("missing items key returns rows=[]", () => {
    const raw = {
      pagination: { total: 0, limit: 25, offset: 0, has_more: false },
    };
    const result = adaptPageResult(raw as never, "intake_notes", 25);
    expect(result.rows).toEqual([]);
    expect(result.total).toBe(0);
  });

  it("zero limit returns page=1", () => {
    const raw = {
      logs: [],
      pagination: { total: 0, limit: 0, offset: 0, has_more: false },
    };
    const result = adaptPageResult(raw as never, "logs", 200);
    expect(result.page).toBe(1);
  });

  it("preserves all items in rows", () => {
    const items = [{ id: "a" }, { id: "b" }, { id: "c" }];
    const raw = {
      promptGenerations: items,
      pagination: { total: 3, limit: 25, offset: 0, has_more: false },
    };
    const result = adaptPageResult(raw as never, "promptGenerations", 25);
    expect(result.rows).toEqual(items);
  });
});
