import type { ReactNode } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type Tone = "success" | "warn" | "danger" | "info" | "neutral";

const toneClass: Record<Tone, string> = {
  success: "bg-status-success-muted text-status-success border-status-success/20",
  warn: "bg-status-warn-muted text-status-warn border-status-warn/30",
  danger: "bg-status-danger-muted text-status-danger border-status-danger/25",
  info: "bg-status-info-muted text-status-info border-status-info/20",
  neutral: "bg-status-neutral-muted text-foreground/80 border-border",
};

export interface OpsSurfaceMetric {
  label: string;
  value: ReactNode;
  detail?: ReactNode;
  tone?: Tone;
}

interface OpsSurfaceIntroProps {
  eyebrow?: string;
  title: string;
  purpose: ReactNode;
  description?: ReactNode;
  steps?: ReactNode[];
  metrics?: OpsSurfaceMetric[];
  note?: ReactNode;
  actions?: ReactNode;
  className?: string;
}

export function OpsSurfaceIntro({
  eyebrow,
  title,
  purpose,
  description,
  steps,
  metrics,
  note,
  actions,
  className,
}: OpsSurfaceIntroProps) {
  return (
    <Card
      className={cn(
        "relative overflow-hidden border-border/70 bg-gradient-to-br from-muted/50 via-card to-card shadow-sm",
        className,
      )}
    >
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/35 to-transparent" aria-hidden />
      <div className="grid gap-5 p-4 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-4">
          {eyebrow && <Badge variant="outline" className="w-fit tracking-wider uppercase">{eyebrow}</Badge>}
          <div className="space-y-2">
            <h2 className="text-lg font-semibold tracking-tight sm:text-xl">{title}</h2>
            <div className="max-w-2xl space-y-2 text-sm text-muted-foreground">
              <p>{purpose}</p>
              {description && <p>{description}</p>}
            </div>
          </div>
          {steps && steps.length > 0 && (
            <ol className="grid gap-2 sm:grid-cols-2">
              {steps.map((step, index) => (
                <li key={index} className="rounded-md border bg-background/70 px-3 py-2 text-sm">
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Step {index + 1}</div>
                  <div className="mt-1 leading-5">{step}</div>
                </li>
              ))}
            </ol>
          )}
          {note && (
            <div className="rounded-md border border-dashed border-border/70 bg-background/60 px-3 py-2 text-xs text-muted-foreground">
              {note}
            </div>
          )}
        </div>

        <div className="space-y-3">
          {actions && <div className="flex justify-end">{actions}</div>}
          {metrics && metrics.length > 0 && (
            <div className="grid gap-2 sm:grid-cols-2">
              {metrics.map((metric) => (
                <div key={metric.label} className="rounded-md border bg-background/80 px-3 py-2 shadow-sm">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{metric.label}</div>
                      <div className="mt-1 text-lg font-semibold tabular-nums leading-none">{metric.value}</div>
                    </div>
                    <Badge variant="outline" className={cn("shrink-0", metric.tone ? toneClass[metric.tone] : toneClass.neutral)}>
                      {metric.label}
                    </Badge>
                  </div>
                  {metric.detail && <div className="mt-2 text-xs text-muted-foreground">{metric.detail}</div>}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
