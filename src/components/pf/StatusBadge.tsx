import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

type Tone = "success" | "warn" | "danger" | "info" | "neutral";

const toneClass: Record<Tone, string> = {
  success: "bg-status-success-muted text-status-success border-status-success/20",
  warn: "bg-status-warn-muted text-status-warn border-status-warn/30",
  danger: "bg-status-danger-muted text-status-danger border-status-danger/25",
  info: "bg-status-info-muted text-status-info border-status-info/20",
  neutral: "bg-status-neutral-muted text-foreground/80 border-border",
};

// Map any PromptForge enum value to a tone.
export function statusTone(value: string): Tone {
  switch (value) {
    case "delivered":
    case "acked":
    case "completed":
    case "rendered":
    case "processed":
    case "ok":
      return "success";
    case "queued":
    case "dispatching":
    case "running":
    case "transforming":
    case "structured_validating":
    case "preprocessed":
    case "imported":
    case "new":
      return "info";
    case "draft":
    case "not_started":
    case "archived":
    case "created":
      return "neutral";
    case "degraded":
      return "warn";
    case "failed":
    case "error":
    case "down":
      return "danger";
    default:
      return "neutral";
  }
}

interface Props {
  value: string;
  tone?: Tone;
  icon?: ReactNode;
  className?: string;
  size?: "sm" | "md";
}

export function StatusBadge({ value, tone, icon, className, size = "sm" }: Props) {
  const t = tone ?? statusTone(value);
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border font-medium tabular-nums",
        size === "sm" ? "px-2 py-0.5 text-[11px]" : "px-2.5 py-1 text-xs",
        toneClass[t],
        className,
      )}
    >
      {icon}
      <span className="capitalize">{value.replace(/_/g, " ")}</span>
    </span>
  );
}
