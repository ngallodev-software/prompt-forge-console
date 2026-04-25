export type StatusTone = "success" | "warn" | "danger";

export function getRouteStatusTone(routeStatus: string): StatusTone {
  if (routeStatus === "direct_kanban") return "success";
  if (routeStatus === "queue_review") return "warn";
  return "danger";
}
