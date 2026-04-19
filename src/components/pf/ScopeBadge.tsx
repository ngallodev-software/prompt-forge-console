import { cn } from "@/lib/utils";
import { Globe, User, FolderGit2 } from "lucide-react";
import type { PfScope } from "@/services/promptforge/types";

const map: Record<PfScope, { className: string; Icon: typeof Globe; label: string }> = {
  global: { className: "bg-status-info-muted text-status-info border-status-info/20", Icon: Globe, label: "global" },
  user: { className: "bg-accent text-accent-foreground border-accent/40", Icon: User, label: "user" },
  project: { className: "bg-status-success-muted text-status-success border-status-success/20", Icon: FolderGit2, label: "project" },
};

export function ScopeBadge({ value, className }: { value: PfScope; className?: string }) {
  const cfg = map[value];
  const Icon = cfg.Icon;
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium", cfg.className, className)}>
      <Icon className="h-3 w-3" />
      {cfg.label}
    </span>
  );
}
