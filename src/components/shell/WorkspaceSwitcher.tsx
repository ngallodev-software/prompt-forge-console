import { useAppStore } from "@/stores/app-store";
import { useQuery } from "@tanstack/react-query";
import { listProjects, qk } from "@/services/promptforge";
import { Globe, FolderGit2, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ErrorState } from "@/components/pf/ErrorState";

export function WorkspaceSwitcher() {
  const workspace = useAppStore((s) => s.workspace);
  const setWorkspace = useAppStore((s) => s.setWorkspace);
  const { data: projects = [], error, isError } = useQuery({
    queryKey: qk.projects,
    queryFn: listProjects,
    throwOnError: false,
  });

  const current = workspace.scope === "global" ? null : projects.find((p) => p.id === workspace.projectId);
  const label = current ? current.name : "Global workspace";
  const Icon = current ? FolderGit2 : Globe;
  const hasProjects = projects.length > 0;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Icon className="h-3.5 w-3.5" />
          <span className="truncate max-w-[140px]">{label}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-64 p-1">
        <button
          onClick={() => setWorkspace({ scope: "global", projectId: null })}
          className="flex w-full items-center justify-between gap-2 rounded px-2 py-1.5 text-sm hover:bg-accent"
        >
          <span className="flex items-center gap-2">
            <Globe className="h-3.5 w-3.5" />
            Global workspace
          </span>
          {workspace.scope === "global" && <Check className="h-3.5 w-3.5" />}
        </button>
        <div className="my-1 h-px bg-border" />
        <div className="px-2 py-1 text-[10px] uppercase tracking-wider text-muted-foreground">Projects</div>
        {isError ? (
          <ErrorState
            className="mt-2"
            title="Projects load failed"
            message={error instanceof Error ? error.message : "The backend rejected the projects request."}
          />
        ) : hasProjects ? (
          projects.map((p) => (
            <button
              key={p.id}
              onClick={() => setWorkspace({ scope: "project", projectId: p.id })}
              className="flex w-full items-center justify-between gap-2 rounded px-2 py-1.5 text-sm hover:bg-accent"
            >
              <span className="flex items-center gap-2 min-w-0">
                <FolderGit2 className="h-3.5 w-3.5" />
                <span className="truncate">{p.name}</span>
              </span>
              {workspace.projectId === p.id && <Check className="h-3.5 w-3.5" />}
            </button>
          ))
        ) : (
          <ErrorState
            className="mt-2"
            title="No projects returned"
            message="The backend returned an empty projects list, so project-scoped workspace selection is unavailable."
          />
        )}
      </PopoverContent>
    </Popover>
  );
}
