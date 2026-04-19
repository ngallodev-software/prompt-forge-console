import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface Props {
  data: unknown;
  className?: string;
  collapsed?: boolean;
  maxHeight?: string;
}

export function JsonViewer({ data, className, collapsed = false, maxHeight = "60vh" }: Props) {
  const [copied, setCopied] = useState(false);
  const [open, setOpen] = useState(!collapsed);
  const text = typeof data === "string" ? data : JSON.stringify(data, null, 2);
  return (
    <div className={cn("relative rounded-md border bg-surface-sunken", className)}>
      <div className="flex items-center justify-between border-b px-3 py-1.5">
        <button onClick={() => setOpen((o) => !o)} className="text-xs text-muted-foreground hover:text-foreground">
          {open ? "▾ JSON" : "▸ JSON"}
        </button>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 gap-1.5 text-xs"
          onClick={async () => {
            await navigator.clipboard.writeText(text);
            setCopied(true);
            setTimeout(() => setCopied(false), 1200);
          }}
        >
          {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
          {copied ? "Copied" : "Copy"}
        </Button>
      </div>
      {open && (
        <pre
          className="overflow-auto p-3 text-mono leading-relaxed text-foreground/85"
          style={{ maxHeight }}
        >
          {text}
        </pre>
      )}
    </div>
  );
}
