import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { listIntakeNotes, qk } from "@/services/promptforge";

const routes = [
  { label: "Dashboard", to: "/dashboard", group: "Pages" },
  { label: "Intake", to: "/intake", group: "Pages" },
  { label: "Prompts", to: "/prompts", group: "Pages" },
  { label: "Deliveries", to: "/deliveries", group: "Pages" },
  { label: "Review queue", to: "/review", group: "Pages" },
  { label: "Rules", to: "/rules", group: "Pages" },
  { label: "Dictionary", to: "/dictionary", group: "Pages" },
  { label: "Templates", to: "/templates", group: "Pages" },
  { label: "Targets", to: "/targets", group: "Pages" },
  { label: "Logs", to: "/logs", group: "Pages" },
  { label: "Health", to: "/health", group: "Pages" },
  { label: "Settings", to: "/settings", group: "Pages" },
];

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const { data } = useQuery({ queryKey: qk.intakeList({ pageSize: 8 }), queryFn: () => listIntakeNotes({ pageSize: 8 }) });

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const recentNotes = useMemo(() => data?.rows ?? [], [data]);

  const go = (to: string) => {
    setOpen(false);
    navigate(to);
  };

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        className="w-full max-w-sm justify-between gap-2 bg-surface-sunken/50 text-muted-foreground"
        onClick={() => setOpen(true)}
      >
        <span className="flex items-center gap-2">
          <Search className="h-3.5 w-3.5" />
          <span className="text-xs">Search notes, deliveries, IDs…</span>
        </span>
        <kbd className="hidden sm:inline-flex items-center rounded border bg-background px-1.5 py-0.5 text-[10px] font-mono">⌘K</kbd>
      </Button>
      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder="Type a command, page or note path…" />
        <CommandList>
          <CommandEmpty>No results.</CommandEmpty>
          <CommandGroup heading="Pages">
            {routes.map((r) => (
              <CommandItem key={r.to} onSelect={() => go(r.to)}>
                {r.label}
                <span className="ml-auto text-xs text-muted-foreground font-mono">{r.to}</span>
              </CommandItem>
            ))}
          </CommandGroup>
          {recentNotes.length > 0 && (
            <CommandGroup heading="Recent intake notes">
              {recentNotes.map((n) => (
                <CommandItem key={n.id} onSelect={() => go(`/intake/${n.id}`)}>
                  <span className="truncate">{n.note_relative_path}</span>
                  <span className="ml-auto text-xs text-muted-foreground font-mono">{n.id}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          )}
        </CommandList>
      </CommandDialog>
    </>
  );
}
