import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { ConsoleSettings, Role } from "@/services/promptforge/types";

export type Theme = "light" | "dark";
export type Workspace = { scope: "global" | "project"; projectId: string | null };

export const defaultConsoleSettings: ConsoleSettings = {
  apiBaseUrl: "http://localhost:8090",
  bootstrapPath: "/console/bootstrap",
};

const defaultWorkspace: Workspace = { scope: "global", projectId: null };
const defaultPollingMs = 15000;

function sanitizePollingMs(ms: number): number {
  if (!Number.isFinite(ms)) return defaultPollingMs;
  return Math.max(1000, Math.round(ms));
}

interface AppState {
  theme: Theme;
  role: Role;
  workspace: Workspace;
  environment: "dev" | "staging" | "prod";
  useMockData: boolean;
  consoleSettings: ConsoleSettings;
  debug: boolean; // shows QueryInspector overlays etc.
  pollingMs: number;
  setTheme: (t: Theme) => void;
  toggleTheme: () => void;
  setRole: (r: Role) => void;
  setWorkspace: (w: Workspace) => void;
  setEnvironment: (e: AppState["environment"]) => void;
  setUseMockData: (enabled: boolean) => void;
  updateConsoleSettings: (patch: Partial<ConsoleSettings>) => void;
  resetConsoleSettings: () => void;
  resetOperatorPreferences: () => void;
  setDebug: (d: boolean) => void;
  setPollingMs: (ms: number) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      theme: typeof window !== "undefined" && window.matchMedia?.("(prefers-color-scheme: dark)").matches ? "dark" : "light",
      role: "operator",
      workspace: defaultWorkspace,
      environment: "dev",
      useMockData: true,
      consoleSettings: defaultConsoleSettings,
      debug: false,
      pollingMs: defaultPollingMs,
      setTheme: (t) => set({ theme: t }),
      toggleTheme: () => set({ theme: get().theme === "dark" ? "light" : "dark" }),
      setRole: (r) => set({ role: r }),
      setWorkspace: (w) => set({ workspace: w }),
      setEnvironment: (e) => set({ environment: e }),
      setUseMockData: (enabled) => set({ useMockData: enabled }),
      updateConsoleSettings: (patch) => set({ consoleSettings: { ...get().consoleSettings, ...patch } }),
      resetConsoleSettings: () => set({ consoleSettings: defaultConsoleSettings }),
      resetOperatorPreferences: () => set({ theme: "light", role: "operator", workspace: defaultWorkspace, environment: "dev", debug: false, pollingMs: defaultPollingMs }),
      setDebug: (d) => set({ debug: d }),
      setPollingMs: (ms) => set({ pollingMs: sanitizePollingMs(ms) }),
    }),
    {
      name: "promptforge.app",
      version: 3,
      migrate: (persistedState) => {
        if (!persistedState || typeof persistedState !== "object") return persistedState;
        const state = persistedState as Partial<AppState> & { consoleSettings?: Partial<ConsoleSettings> };
        return {
          ...state,
          workspace: state.workspace ?? defaultWorkspace,
          useMockData: state.useMockData ?? true,
          consoleSettings: {
            apiBaseUrl: state.consoleSettings?.apiBaseUrl ?? defaultConsoleSettings.apiBaseUrl,
            bootstrapPath: state.consoleSettings?.bootstrapPath ?? defaultConsoleSettings.bootstrapPath,
          },
          pollingMs: sanitizePollingMs(state.pollingMs ?? defaultPollingMs),
        };
      },
    },
  ),
);

// Capability matrix
export function canMutate(role: Role): boolean {
  return role === "operator" || role === "admin";
}
export function canAdmin(role: Role): boolean {
  return role === "admin";
}
