import { cn } from "@/lib/utils";

interface Props {
  before: string;
  after: string;
  beforeLabel?: string;
  afterLabel?: string;
  className?: string;
}

// Tiny line-level diff. Sufficient to convey revision changes; swap for a
// full diff lib (e.g. diff) when tying to the real backend.
export function DiffViewer({ before, after, beforeLabel = "previous", afterLabel = "current", className }: Props) {
  const a = before.split(/\r?\n/);
  const b = after.split(/\r?\n/);
  const max = Math.max(a.length, b.length);
  const rows: { left?: string; right?: string; type: "same" | "add" | "del" | "mod" }[] = [];
  for (let i = 0; i < max; i++) {
    const left = a[i];
    const right = b[i];
    if (left === right) rows.push({ left, right, type: "same" });
    else if (left === undefined) rows.push({ right, type: "add" });
    else if (right === undefined) rows.push({ left, type: "del" });
    else rows.push({ left, right, type: "mod" });
  }
  return (
    <div className={cn("rounded-md border overflow-hidden", className)}>
      <div className="grid grid-cols-2 border-b text-xs font-medium">
        <div className="border-r bg-surface-sunken px-3 py-1.5 text-muted-foreground">{beforeLabel}</div>
        <div className="bg-surface-sunken px-3 py-1.5 text-muted-foreground">{afterLabel}</div>
      </div>
      <div className="grid grid-cols-2 text-mono leading-relaxed max-h-[60vh] overflow-auto">
        <div className="border-r">
          {rows.map((r, i) => (
            <div key={i} className={cn("min-h-[1.4rem] whitespace-pre-wrap break-all px-3", r.type === "del" || r.type === "mod" ? "bg-status-danger-muted/60" : "")}>{r.left ?? " "}</div>
          ))}
        </div>
        <div>
          {rows.map((r, i) => (
            <div key={i} className={cn("min-h-[1.4rem] whitespace-pre-wrap break-all px-3", r.type === "add" || r.type === "mod" ? "bg-status-success-muted/60" : "")}>{r.right ?? " "}</div>
          ))}
        </div>
      </div>
    </div>
  );
}
