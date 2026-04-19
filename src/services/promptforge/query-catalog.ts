// Query catalog (Q1–Q20) — used by QueryInspector and Settings → Query Catalog page.

export interface CatalogQuery {
  id: string;
  title: string;
  pages: string[];
  params: string[];
  description: string;
  sql: string;
}

export const QUERY_CATALOG: CatalogQuery[] = [
  {
    id: "Q1",
    title: "Latest intake notes with project + latest prompt + latest delivery",
    pages: ["/intake", "/dashboard"],
    params: ["project_id", "status", "watch_eligible", "source_device", "limit", "offset"],
    description: "Server-paginated table backing the intake explorer.",
    sql: "SELECT i.*, p.name, pg.id AS latest_prompt_generation_id, d.id AS latest_delivery_id ... LATERAL ...",
  },
  { id: "Q2", title: "Intake by status counts (24h, 7d, 30d)", pages: ["/dashboard"], params: [], description: "Stacked status counts per window.", sql: "SELECT window_name, status, COUNT(*) FROM intake_notes ..." },
  { id: "Q3", title: "Notes requiring review", pages: ["/review", "/prompts"], params: ["limit", "offset"], description: "Prompt generations with requires_review=true.", sql: "SELECT pg.* FROM prompt_generations pg WHERE pg.requires_review = TRUE ..." },
  { id: "Q4", title: "Failed processing runs with stage + message", pages: ["/review", "/dashboard"], params: ["limit", "offset"], description: "Processing failures by stage with error_text.", sql: "SELECT pr.* FROM processing_runs pr WHERE pr.status = 'failed' ..." },
  { id: "Q5", title: "Failed deliveries and retry candidates", pages: ["/deliveries", "/review"], params: ["max_retries", "limit", "offset"], description: "Failed deliveries flagged as retry candidates.", sql: "SELECT d.*, CASE WHEN d.status = 'failed' AND d.retry_count < $1 THEN TRUE ... END AS retry_candidate FROM deliveries d ..." },
  { id: "Q6", title: "Queue depth by priority and destination", pages: ["/dashboard", "/deliveries"], params: [], description: "Counts of queued/dispatching deliveries grouped.", sql: "SELECT priority, destination, COUNT(*) FROM deliveries WHERE status IN ('queued','dispatching') GROUP BY priority, destination" },
  { id: "Q7", title: "Full lineage for a note_relative_path", pages: ["/pipeline/:intakeNoteId"], params: ["note_relative_path"], description: "End-to-end joined lineage row set.", sql: "SELECT i.id, u.id, tr.id, pg.id, d.id, pr.id FROM intake_notes i LEFT JOIN ..." },
  { id: "Q8", title: "Transcript revision timeline for utterance_id", pages: ["/pipeline/:intakeNoteId"], params: ["utterance_id"], description: "Ordered revisions for a single utterance.", sql: "SELECT tr.* FROM transcript_revisions tr WHERE tr.utterance_id = $1 ORDER BY tr.created_at ASC" },
  { id: "Q9", title: "Diff source query for adjacent transcript revisions", pages: ["/pipeline/:intakeNoteId"], params: ["revision_id"], description: "Pairs current revision with immediately previous.", sql: "SELECT current_rev.*, prev_rev.* FROM transcript_revisions current_rev LEFT JOIN LATERAL ..." },
  { id: "Q10", title: "Prompt generations with validation/render status", pages: ["/prompts"], params: ["status", "limit", "offset"], description: "Server-paginated prompt generation list.", sql: "SELECT pg.* FROM prompt_generations pg WHERE ..." },
  { id: "Q11", title: "LLM run latency/token usage summary per model/provider", pages: ["/dashboard", "/health"], params: ["from", "to"], description: "Aggregated LLM stats.", sql: "SELECT provider_name, model_name, COUNT(*), AVG(latency_ms), SUM(input_tokens), SUM(output_tokens) FROM llm_runs GROUP BY ..." },
  { id: "Q12", title: "Project-level throughput/failure rate", pages: ["/dashboard"], params: [], description: "Per-project counts and failure rates.", sql: "SELECT p.id, p.name, COUNT(DISTINCT i.id), ... FROM projects p LEFT JOIN ..." },
  { id: "Q13", title: "Active rulesets/rules by scope and project", pages: ["/rules"], params: ["scope", "project_id"], description: "Ruleset + rules join.", sql: "SELECT rs.*, r.* FROM rulesets rs LEFT JOIN rules r ON r.ruleset_id = rs.id WHERE rs.active = TRUE ..." },
  { id: "Q14", title: "Term dictionary entries by scope/project", pages: ["/dictionary"], params: ["scope", "project_id", "limit", "offset"], description: "Server-paginated term dictionary.", sql: "SELECT td.* FROM term_dictionary td WHERE ..." },
  { id: "Q15", title: "Prompt templates active by prompt_type and scope", pages: ["/templates"], params: ["prompt_type", "scope", "project_id"], description: "Active templates filtered.", sql: "SELECT pt.* FROM prompt_templates pt WHERE pt.is_active = TRUE ..." },
  { id: "Q16", title: "Delivery targets and safety flags", pages: ["/targets"], params: ["target_type"], description: "Delivery targets with safety flags.", sql: "SELECT dt.* FROM delivery_targets dt WHERE ..." },
  { id: "Q17", title: "Orphan/consistency checks", pages: ["/health", "/settings"], params: [], description: "Cross-table integrity diagnostic.", sql: "SELECT 'prompt_without_intake' AS issue_type, ... UNION ALL ..." },
  { id: "Q18", title: "Notes skipped for eligibility reasons", pages: ["/intake", "/review"], params: ["limit", "offset"], description: "Intake notes with eligibility/skip metadata.", sql: "SELECT i.* FROM intake_notes i WHERE (i.metadata_json ->> 'eligibility_reason' IS NOT NULL OR ...)" },
  { id: "Q19", title: "Top recurring error_text fingerprints", pages: ["/logs", "/review"], params: ["limit"], description: "Error fingerprints by occurrence count.", sql: "SELECT md5(error_text) AS error_fingerprint, error_text, COUNT(*) FROM processing_runs GROUP BY ..." },
  { id: "Q20", title: "End-to-end SLA query (imported_at -> terminal latency)", pages: ["/dashboard", "/health"], params: ["from", "to", "limit", "offset"], description: "End-to-end latency per intake note.", sql: "SELECT i.id, i.created_at AS imported_at, final_delivery.status, ... FROM intake_notes i LEFT JOIN LATERAL ..." },
];

export function getQueriesForPage(path: string): CatalogQuery[] {
  return QUERY_CATALOG.filter((q) =>
    q.pages.some((p) => {
      const re = new RegExp("^" + p.replace(/:[^/]+/g, "[^/]+") + "$");
      return re.test(path);
    }),
  );
}
