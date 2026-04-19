import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Role } from "@/services/promptforge/types";

type Theme = "light" | "dark";
type Workspace = { scope: "global" | "project"; projectId: string | null };

interface AppState {
  theme: Theme;
  role: Role;
  workspace: Workspace;
  environment: "dev" | "staging" | "prod";
  debug: boolean; // shows QueryInspector overlays etc.
  pollingMs: number;
  setTheme: (t: Theme) => void;
  toggleTheme: () => void;
  setRole: (r: Role) => void;
  setWorkspace: (w: Workspace) => void;
  setEnvironment: (e: AppState["environment"]) => void;
  setDebug: (d: boolean) => void;
  setPollingMs: (ms: number) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      theme: typeof window !== "undefined" && window.matchMedia?.("(prefers-color-scheme: dark)").matches ? "dark" : "light",
      role: "operator",
      workspace: { scope: "global", projectId: null },
      environment: "dev",
      debug: false,
      pollingMs: 15000,
      setTheme: (t) => set({ theme: t }),
      toggleTheme: () => set({ theme: get().theme === "dark" ? "light" : "dark" }),
      setRole: (r) => set({ role: r }),
      setWorkspace: (w) => set({ workspace: w }),
      setEnvironment: (e) => set({ environment: e }),
      setDebug: (d) => set({ debug: d }),
      setPollingMs: (ms) => set({ pollingMs: ms }),
    }),
    { name: "promptforge.app" },
  ),
);

// Capability matrix
export function canMutate(role: Role): boolean {
  return role === "operator" || role === "admin";
}
export function canAdmin(role: Role): boolean {
  return role === "admin";
}
