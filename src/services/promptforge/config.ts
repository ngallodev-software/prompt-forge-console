import { useAppStore } from "@/stores/app-store";

export type RuntimeEnvironment = "development" | "staging" | "production";

function readProcessEnv(name: string): string | undefined {
  if (typeof process === "undefined" || !process?.env) return undefined;
  return process.env[name];
}

function readImportMetaEnv(name: string): string | undefined {
  const env = import.meta.env as Record<string, string | boolean | undefined>;
  const value = env[name];
  return typeof value === "string" ? value : undefined;
}

function readEnvValue(name: string): string | undefined {
  return readProcessEnv(name) ?? readImportMetaEnv(name);
}

function parseBoolean(value: string | undefined): boolean {
  return String(value || "").toLowerCase() === "true";
}

function detectFromHostname(hostname: string): RuntimeEnvironment {
  if (hostname === "localhost" || hostname === "127.0.0.1" || hostname === "0.0.0.0" || hostname.endsWith(".local")) {
    return "development";
  }
  if (hostname.includes("staging") || hostname.includes("preview")) {
    return "staging";
  }
  return "production";
}

export function detectRuntimeEnvironment(): RuntimeEnvironment {
  const nodeEnv = readProcessEnv("NODE_ENV")?.toLowerCase();
  if (nodeEnv === "development" || nodeEnv === "dev") return "development";
  if (nodeEnv === "staging") return "staging";
  if (nodeEnv === "production" || nodeEnv === "prod") return "production";

  if (typeof window !== "undefined" && window.location?.hostname) {
    return detectFromHostname(window.location.hostname.toLowerCase());
  }

  return "development";
}

export const RUNTIME_ENVIRONMENT = detectRuntimeEnvironment();
export const STRICT_BACKEND =
  RUNTIME_ENVIRONMENT !== "development" ||
  parseBoolean(readEnvValue("STRICT_BACKEND")) ||
  parseBoolean(readEnvValue("VITE_PROMPTFORGE_STRICT_BACKEND"));

export function createStrictBackendError(cause?: unknown): Error {
  const error = new Error("Backend unavailable in strict mode");
  if (cause !== undefined) {
    (error as Error & { cause?: unknown }).cause = cause;
  }
  return error;
}

export function shouldUseMockData(): boolean {
  if (STRICT_BACKEND) return false;
  return useAppStore.getState().useMockData;
}

export function logBackendFallback(context: string, error: unknown): void {
  if (!shouldUseMockData()) return;
  console.warn("[promptforge] " + context + " failed; using mock data in development", error);
}
