import { JsonViewer } from "./JsonViewer";

interface Props {
  original: Record<string, unknown>;
  current: Record<string, unknown>;
}

export function FrontmatterCompare({ original, current }: Props) {
  const allKeys = Array.from(new Set([...Object.keys(original), ...Object.keys(current)])).sort();
  return (
    <div className="space-y-3">
      <div className="rounded-md border overflow-hidden">
        <div className="grid grid-cols-3 border-b bg-surface-sunken text-xs font-medium uppercase tracking-wider text-muted-foreground">
          <div className="px-3 py-1.5">Field</div>
          <div className="border-l px-3 py-1.5">Original</div>
          <div className="border-l px-3 py-1.5">Current</div>
        </div>
        <div className="divide-y text-mono">
          {allKeys.map((k) => {
            const a = JSON.stringify(original[k]);
            const b = JSON.stringify(current[k]);
            const changed = a !== b;
            return (
              <div key={k} className="grid grid-cols-3 items-start">
                <div className="px-3 py-1.5 font-medium">{k}</div>
                <div className={`border-l px-3 py-1.5 ${changed ? "bg-status-danger-muted/40" : ""}`}>{a ?? <span className="text-muted-foreground">—</span>}</div>
                <div className={`border-l px-3 py-1.5 ${changed ? "bg-status-success-muted/40" : ""}`}>{b ?? <span className="text-muted-foreground">—</span>}</div>
              </div>
            );
          })}
        </div>
      </div>
      <details className="text-xs">
        <summary className="cursor-pointer text-muted-foreground">Raw JSON</summary>
        <div className="mt-2 grid gap-2 md:grid-cols-2">
          <JsonViewer data={original} collapsed />
          <JsonViewer data={current} collapsed />
        </div>
      </details>
    </div>
  );
}
