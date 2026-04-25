import { useQuery } from "@tanstack/react-query";

import { useDebouncedValue } from "@/hooks/use-debounced-value";

export interface KanbanWorkspace {
  workspaceId: string;
  name: string;
  path: string;
  taskCounts: {
    backlog: number;
    inProgress: number;
    review: number;
    trash: number;
  };
}

export interface KanbanWorkspaceDiscoveryResponse {
  currentWorkspaceId: string | null;
  workspaces: KanbanWorkspace[];
}

async function fetchKanbanWorkspaces(baseUrl: string, passcode: string): Promise<KanbanWorkspaceDiscoveryResponse> {
  const response = await fetch(`${baseUrl}/workspaces`, {
    headers: { "X-Kanban-Passcode": passcode },
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  return response.json() as Promise<KanbanWorkspaceDiscoveryResponse>;
}

export const qk = {
  kanbanWorkspaces: (baseUrl: string, passcode: string) => ["kanban", "workspaces", baseUrl, passcode] as const,
};

const DISCOVERY_DEBOUNCE_MS = 500;

export function useKanbanWorkspaceDiscovery(baseUrl: string, passcode: string) {
  const debouncedBaseUrl = useDebouncedValue(baseUrl, DISCOVERY_DEBOUNCE_MS);
  const debouncedPasscode = useDebouncedValue(passcode, DISCOVERY_DEBOUNCE_MS);

  return useQuery({
    queryKey: qk.kanbanWorkspaces(debouncedBaseUrl, debouncedPasscode),
    queryFn: () => fetchKanbanWorkspaces(debouncedBaseUrl, debouncedPasscode),
    enabled: debouncedBaseUrl.trim() !== "",
  });
}
