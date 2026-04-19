import { useAppStore } from "@/stores/app-store";
import { Eye, Wrench, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import type { Role } from "@/services/promptforge/types";

const roles: { value: Role; label: string; Icon: typeof Eye; hint: string }[] = [
  { value: "viewer", label: "Viewer", Icon: Eye, hint: "Read-only" },
  { value: "operator", label: "Operator", Icon: Wrench, hint: "Run + retry" },
  { value: "admin", label: "Admin", Icon: ShieldCheck, hint: "Full mutations" },
];

export function RoleSwitcher() {
  const role = useAppStore((s) => s.role);
  const setRole = useAppStore((s) => s.setRole);
  const current = roles.find((r) => r.value === role)!;
  const Icon = current.Icon;
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Icon className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">{current.label}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-60 p-1">
        <div className="px-2 py-1 text-[10px] uppercase tracking-wider text-muted-foreground">Dev role switcher</div>
        {roles.map((r) => {
          const RIcon = r.Icon;
          const active = r.value === role;
          return (
            <button
              key={r.value}
              onClick={() => setRole(r.value)}
              className={`flex w-full items-start gap-2 rounded px-2 py-1.5 text-left hover:bg-accent ${active ? "bg-accent" : ""}`}
            >
              <RIcon className="h-4 w-4 mt-0.5" />
              <div>
                <div className="text-sm font-medium">{r.label}</div>
                <div className="text-xs text-muted-foreground">{r.hint}</div>
              </div>
            </button>
          );
        })}
      </PopoverContent>
    </Popover>
  );
}
