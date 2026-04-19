#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..");
const apiPath = path.join(repoRoot, "src/services/promptforge/api.ts");
const errorsPath = path.join(repoRoot, "src/services/promptforge/errors.ts");
const manifestPath = path.join(repoRoot, "docs/required-endpoints.json");

const requiredErrors = ["ApiError", "BackendUnavailableError", "NotFoundError", "ValidationError"];

function readText(filePath) {
  return fs.readFileSync(filePath, "utf8");
}

function writeJson(filePath, data) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(data, null, 2)}\n`);
}

function uniqueSorted(values) {
  return [...new Set(values)].sort((a, b) => a.localeCompare(b));
}

function extractEndpoints(apiSource) {
  const endpoints = new Set();
  const constPaths = new Map();

  for (const line of apiSource.split(/\r?\n/)) {
    const constMatch = line.match(/^\s*const\s+([A-Z][A-Z0-9_]*)\s*=.*?(["\'])(\/console\/[^"\']+?)\2/);
    if (constMatch) {
      constPaths.set(constMatch[1], constMatch[3]);
    }
  }

  for (const match of apiSource.matchAll(/fetchPageResult(?:<[^>]+>)?\s*\(\s*buildQueryPath\(\s*(["\'])(\/console\/[^"\']+?)\1/gs)) {
    endpoints.add(match[2]);
  }

  for (const match of apiSource.matchAll(/fetchJson(?:<[^>]+>)?\s*\(\s*(["\'])(\/console\/[^"\']+?)\1/gs)) {
    endpoints.add(match[2]);
  }

  for (const match of apiSource.matchAll(/fetchJson(?:<[^>]+>)?\s*\(\s*([A-Z][A-Z0-9_]*)\b/gs)) {
    const resolved = constPaths.get(match[1]);
    if (resolved) endpoints.add(resolved);
  }

  return uniqueSorted(endpoints);
}

function extractErrorExports(errorsSource) {
  const exports = new Set();
  for (const match of errorsSource.matchAll(/^\s*export\s+class\s+([A-Za-z_][A-Za-z0-9_]*)\b/gm)) {
    exports.add(match[1]);
  }
  return uniqueSorted(exports);
}

function loadManifest() {
  if (!fs.existsSync(manifestPath)) return null;
  return JSON.parse(readText(manifestPath));
}

function buildManifest(apiSource, errorsSource) {
  return {
    endpoints: extractEndpoints(apiSource),
    errorExports: extractErrorExports(errorsSource),
  };
}

function isManifestShape(value) {
  return value && typeof value === "object" && Array.isArray(value.endpoints) && Array.isArray(value.errorExports);
}

function diffMissing(expected, actual) {
  const actualSet = new Set(actual);
  return expected.filter((item) => !actualSet.has(item));
}

function main() {
  const apiSource = readText(apiPath);
  const errorsSource = readText(errorsPath);
  const current = buildManifest(apiSource, errorsSource);
  const manifest = loadManifest();

  if (!isManifestShape(manifest)) {
    writeJson(manifestPath, current);
    console.log(`generated ${path.relative(repoRoot, manifestPath)}`);
    return;
  }

  const missingEndpoints = diffMissing(manifest.endpoints, current.endpoints);
  const missingErrorExports = diffMissing(requiredErrors, current.errorExports);

  if (missingEndpoints.length || missingErrorExports.length) {
    if (missingEndpoints.length) {
      console.error(`missing endpoints: ${missingEndpoints.join(", ")}`);
    }
    if (missingErrorExports.length) {
      console.error(`missing error exports: ${missingErrorExports.join(", ")}`);
    }
    process.exit(1);
  }

  console.log("compatibility check passed");
}

main();
