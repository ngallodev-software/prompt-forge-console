import type { IntakeNote } from "./types";

type RouteRecord = Record<string, unknown>;

export type VoiceRouteStatus = "direct_kanban" | "queue_review" | "unsupported" | "unavailable";

export interface ParsedVoiceRoute {
  sourcePath: string;
  sourceFolder: string;
  inCanonicalRoot: boolean;
  routeFamily: string | null;
  routeTarget: string | null;
  routeContext: string | null;
}

export interface VoiceRouteSummary extends ParsedVoiceRoute {
  kanbanReady: boolean;
  routeStatus: VoiceRouteStatus;
  routeStatusLabel: string;
  routeSummary: string;
  replayState: string;
  replayable: boolean;
}

function isRecord(value: unknown): value is RouteRecord {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function getString(record: RouteRecord, keys: string[]): string | undefined {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return undefined;
}

function getBoolean(record: RouteRecord, keys: string[]): boolean | undefined {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "boolean") return value;
  }
  return undefined;
}

function getRouteRecord(note: IntakeNote): RouteRecord | undefined {
  const candidates = [note.frontmatter_current, note.frontmatter_original, note.metadata_json];
  for (const candidate of candidates) {
    if (!isRecord(candidate)) continue;
    const route = candidate.promptforge_route ?? candidate.promptforgeRoute;
    if (isRecord(route)) return route;
  }
  return undefined;
}

function normalizePath(path: string): string {
  return path.replace(/\\/g, "/").replace(/^\/+/, "").replace(/\/+$/, "");
}

function dirname(path: string): string {
  const normalized = normalizePath(path);
  const index = normalized.lastIndexOf("/");
  return index > 0 ? normalized.slice(0, index) : normalized;
}

function splitRoute(path: string): ParsedVoiceRoute {
  const normalized = normalizePath(path);
  const parts = normalized.split("/").filter(Boolean);
  const sourceFolder = dirname(normalized);

  const inboxIndex = parts.findIndex((part, index) => part.toLowerCase() === "inbox" && parts[index + 1]?.toLowerCase() === "voice");
  if (inboxIndex < 0) {
    return {
      sourcePath: normalized,
      sourceFolder,
      inCanonicalRoot: false,
      routeFamily: null,
      routeTarget: null,
      routeContext: null,
    };
  }

  const routeParts = parts.slice(inboxIndex + 2);
  const fileParts = routeParts.length > 0 ? routeParts.slice(0, -1) : [];

  return {
    sourcePath: normalized,
    sourceFolder,
    inCanonicalRoot: true,
    routeFamily: fileParts[0] ?? null,
    routeTarget: fileParts[1] ?? null,
    routeContext: fileParts.length > 2 ? fileParts.slice(2).join("/") : null,
  };
}

function summarizeRoute(parsed: ParsedVoiceRoute, kanbanReady: boolean): VoiceRouteSummary {
  const family = parsed.routeFamily?.toLowerCase() ?? null;
  const supported = family === "kanban" || family === "queue" || family === "review";

  if (!parsed.inCanonicalRoot) {
    return {
      ...parsed,
      kanbanReady,
      routeStatus: "unsupported",
      routeStatusLabel: "unsupported family",
      routeSummary: "Source path is outside Inbox/Voice, so route policy fails closed.",
      replayState: "Not replayable until the source path is re-homed under Inbox/Voice.",
      replayable: false,
    };
  }

  if (!supported) {
    return {
      ...parsed,
      kanbanReady,
      routeStatus: "unsupported",
      routeStatusLabel: "unsupported family",
      routeSummary: "The first segment under Inbox/Voice is not a recognized route family, so the item is not silently remapped.",
      replayState: "Not replayable until the route policy explicitly grows this family.",
      replayable: false,
    };
  }

  if (family === "kanban" && kanbanReady) {
    return {
      ...parsed,
      kanbanReady,
      routeStatus: "direct_kanban",
      routeStatusLabel: "direct to kanban",
      routeSummary: `This note routes directly to the Kanban workspace key ${parsed.routeTarget ?? "unset"}.`,
      replayState: "Replay keeps the same source path and workspace key.",
      replayable: true,
    };
  }

  if (family === "kanban") {
    return {
      ...parsed,
      kanbanReady,
      routeStatus: "unavailable",
      routeStatusLabel: "kanban unavailable",
      routeSummary: "Kanban is unavailable or incompletely bound, so the note is held in queue/review until replay is possible.",
      replayState: "Replayable after Kanban recovers or the binding is fixed.",
      replayable: true,
    };
  }

  return {
    ...parsed,
    kanbanReady,
    routeStatus: "queue_review",
    routeStatusLabel: "queue / review fallback",
    routeSummary: "This family intentionally stays in the queue/review lane instead of dispatching to Kanban.",
    replayState: "Replay stays within queue/review unless policy changes.",
    replayable: true,
  };
}

function getSourcePath(note: IntakeNote): string {
  const routeRecord = getRouteRecord(note);
  const explicitPath = routeRecord ? getString(routeRecord, ["source_path", "sourcePath"]) : undefined;
  const metadataPath = isRecord(note.metadata_json) ? getString(note.metadata_json, ["source_path", "sourcePath"]) : undefined;
  return normalizePath(explicitPath ?? metadataPath ?? note.note_relative_path);
}

function parseExplicitRoute(note: IntakeNote): ParsedVoiceRoute | null {
  const routeRecord = getRouteRecord(note);
  if (!routeRecord) return null;

  const sourcePath = getString(routeRecord, ["source_path", "sourcePath"]);
  const routeFamily = getString(routeRecord, ["route_family", "routeFamily"]);
  const routeTarget = getString(routeRecord, ["route_target", "routeTarget"]);
  const routeContext = getString(routeRecord, ["route_context", "routeContext"]);
  if (!sourcePath && !routeFamily && !routeTarget && !routeContext) return null;

  const parsed = splitRoute(sourcePath ?? note.note_relative_path);
  return {
    sourcePath: normalizePath(sourcePath ?? parsed.sourcePath),
    sourceFolder: parsed.sourceFolder,
    inCanonicalRoot: parsed.inCanonicalRoot,
    routeFamily: routeFamily ?? parsed.routeFamily,
    routeTarget: routeTarget ?? parsed.routeTarget,
    routeContext: routeContext ?? parsed.routeContext,
  };
}

export function parseVoiceRoute(note: IntakeNote): ParsedVoiceRoute {
  return parseExplicitRoute(note) ?? splitRoute(getSourcePath(note));
}

export function describeVoiceRoute(note: IntakeNote, kanbanReady: boolean): VoiceRouteSummary {
  const explicit = parseExplicitRoute(note);
  const parsed = explicit ?? splitRoute(getSourcePath(note));
  const routeRecord = getRouteRecord(note);
  const summary = summarizeRoute(parsed, kanbanReady);
  const declaredStatus = routeRecord ? getString(routeRecord, ["route_status", "routeStatus"]) : undefined;
  const declaredReplayable = routeRecord ? getBoolean(routeRecord, ["replayable"]) : undefined;
  const declaredReplayState = routeRecord ? getString(routeRecord, ["replay_state", "replayState"]) : undefined;

  return {
    ...summary,
    routeStatus: (declaredStatus as VoiceRouteStatus | undefined) ?? summary.routeStatus,
    replayable: declaredReplayable ?? summary.replayable,
    replayState: declaredReplayState ?? summary.replayState,
  };
}

export function summarizeVoiceRouteFamilies(notes: IntakeNote[]) {
  return notes.reduce(
    (acc, note) => {
      const parsed = parseVoiceRoute(note);
      const family = parsed.routeFamily?.toLowerCase() ?? null;
      if (!parsed.inCanonicalRoot) {
        acc.outsideRoot += 1;
        return acc;
      }
      if (family === "kanban") {
        acc.kanban += 1;
        return acc;
      }
      if (family === "queue" || family === "review") {
        acc.queueReview += 1;
        return acc;
      }
      acc.unsupported += 1;
      return acc;
    },
    { kanban: 0, queueReview: 0, unsupported: 0, outsideRoot: 0 },
  );
}
