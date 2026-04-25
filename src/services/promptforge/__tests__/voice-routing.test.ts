import { describe, expect, it } from "vitest";
import type { IntakeNote } from "../types";
import { describeVoiceRoute, parseVoiceRoute, summarizeVoiceRouteFamilies } from "../voice-routing";

function makeNote(path: string, route?: Record<string, unknown>): IntakeNote {
  return {
    id: "note-1",
    project_id: "project-1",
    note_relative_path: path,
    status: "imported",
    watch_eligible: true,
    source_device: "iphone",
    body_text: "# Voice memo",
    frontmatter_original: route ? { route } : {},
    frontmatter_current: route ? { route } : {},
    metadata_json: route ? { route } : {},
    created_at: "2026-04-24T00:00:00.000Z",
    updated_at: "2026-04-24T00:00:00.000Z",
  };
}

describe("parseVoiceRoute", () => {
  it("parses canonical Inbox/Voice kanban folders", () => {
    const note = makeNote("Inbox/Voice/kanban/prompt-forge/research/note.md");
    const route = parseVoiceRoute(note);
    expect(route.inCanonicalRoot).toBe(true);
    expect(route.routeFamily).toBe("kanban");
    expect(route.routeTarget).toBe("prompt-forge");
    expect(route.routeContext).toBe("research");
  });

  it("fails closed outside Inbox/Voice", () => {
    const note = makeNote("Notes/Voice/note.md");
    const route = parseVoiceRoute(note);
    expect(route.inCanonicalRoot).toBe(false);
    expect(route.routeFamily).toBeNull();
  });
});

describe("describeVoiceRoute", () => {
  it("describes direct kanban routing when binding is ready", () => {
    const note = makeNote("Inbox/Voice/kanban/prompt-forge/research/note.md", {
      source_relative_path: "Inbox/Voice/kanban/prompt-forge/research/note.md",
      route_family: "kanban",
      route_target: "prompt-forge",
      route_context: ["research", "ops"],
      route_status: "recognized",
      replayable: true,
    });
    const route = describeVoiceRoute(note, true);
    expect(route.routeStatus).toBe("direct_kanban");
    expect(route.replayable).toBe(true);
    expect(route.routeSummary).toContain("Kanban workspace key prompt-forge");
    expect(route.routeContext).toBe("research/ops");
  });

  it("describes kanban fallback when binding is unavailable", () => {
    const note = makeNote("Inbox/Voice/kanban/prompt-forge/research/note.md");
    const route = describeVoiceRoute(note, false);
    expect(route.routeStatus).toBe("unavailable");
    expect(route.replayable).toBe(true);
    expect(route.replayState).toContain("Replayable after Kanban recovers");
  });

  it("marks unsupported families as fail-closed", () => {
    const note = makeNote("Inbox/Voice/experimental/voice-lab/research/note.md");
    const route = describeVoiceRoute(note, true);
    expect(route.routeStatus).toBe("unsupported");
    expect(route.replayable).toBe(false);
  });
});

describe("summarizeVoiceRouteFamilies", () => {
  it("counts route families", () => {
    const notes = [
      makeNote("Inbox/Voice/kanban/prompt-forge/research/note.md"),
      makeNote("Inbox/Voice/review/triage/research/note.md"),
      makeNote("Inbox/Voice/experimental/voice-lab/research/note.md"),
      makeNote("Notes/voice/note.md"),
    ];
    const summary = summarizeVoiceRouteFamilies(notes);
    expect(summary.kanban).toBe(1);
    expect(summary.queueReview).toBe(1);
    expect(summary.unsupported).toBe(1);
    expect(summary.outsideRoot).toBe(1);
  });
});
