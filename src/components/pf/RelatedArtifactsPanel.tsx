import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Link } from "react-router-dom";
import type { ReactNode } from "react";
import { ChevronRight } from "lucide-react";

export interface ArtifactLink {
  id: string;
  label: string;
  to: string;
  meta?: ReactNode;
  type: string;
}

export function RelatedArtifactsPanel({ items, className }: { items: ArtifactLink[]; className?: string }) {
  if (items.length === 0) return null;
  return (
    <Card className={cn("", className)}>
      <div className="border-b px-4 py-3">
        <h3 className="text-sm font-semibold">Related artifacts</h3>
      </div>
      <ul className="divide-y">
        {items.map((it) => (
          <li key={it.id}>
            <Link to={it.to} className="flex items-center gap-3 px-4 py-2.5 hover:bg-accent/30">
              <span className="rounded bg-secondary px-1.5 py-0.5 text-[10px] uppercase tracking-wider text-muted-foreground">{it.type}</span>
              <span className="flex-1 truncate text-sm font-medium">{it.label}</span>
              {it.meta}
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </Link>
          </li>
        ))}
      </ul>
    </Card>
  );
}
