import type { ReactNode } from "react";
import { useAppStore, canMutate, canAdmin } from "@/stores/app-store";
import type { Role } from "@/services/promptforge/types";
import { Lock } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  require: "viewer" | "operator" | "admin";
  children: ReactNode;
  fallback?: ReactNode;
  /** Inline mode renders children with disabled affordances + tooltip when blocked. */
  inline?: boolean;
}

function meets(role: Role, required: Props["require"]) {
  if (required === "viewer") return true;
  if (required === "operator") return canMutate(role);
  return canAdmin(role);
}

export function PermissionGuard({ require, children, fallback, inline }: Props) {
  const role = useAppStore((s) => s.role);
  if (meets(role, require)) return <>{children}</>;
  if (inline) {
    return (
      <span className={cn("inline-flex items-center gap-1 text-muted-foreground")} title={`Requires ${require} role`}>
        <Lock className="h-3.5 w-3.5" />
        {children}
      </span>
    );
  }
  return (
    <>{fallback ?? (
      <div className="rounded-md border border-dashed p-4 text-sm text-muted-foreground flex items-center gap-2">
        <Lock className="h-4 w-4" />
        This action requires the <strong className="text-foreground">{require}</strong> role.
      </div>
    )}</>
  );
}
