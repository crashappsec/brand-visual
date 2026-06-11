#!/usr/bin/env node
// check-version-sync.mjs
// Asserts that the tag name passed as argv[2] (e.g. v1.0.0) matches both
// package.json#version and claude-plugin/.claude-plugin/plugin.json#version
// after stripping the leading "v". Exits non-zero and prints all mismatches.
//
// Run: node scripts/check-version-sync.mjs v1.0.0

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, "..");

const tag = process.argv[2];
if (!tag) {
  console.error("Usage: node scripts/check-version-sync.mjs <tag>  (e.g. v1.0.0)");
  process.exit(1);
}

if (!/^v\d+\.\d+\.\d+$/.test(tag)) {
  console.error(`Tag "${tag}" does not match expected format v<major>.<minor>.<patch>`);
  process.exit(1);
}

const expectedVersion = tag.slice(1); // strip leading "v"

const pkgPath = resolve(repoRoot, "package.json");
const pluginPath = resolve(repoRoot, "claude-plugin/.claude-plugin/plugin.json");

const pkg = JSON.parse(readFileSync(pkgPath, "utf8"));
const plugin = JSON.parse(readFileSync(pluginPath, "utf8"));

const mismatches = [];

if (pkg.version !== expectedVersion) {
  mismatches.push(
    `  package.json#version is "${pkg.version}", expected "${expectedVersion}"`
  );
}

if (plugin.version !== expectedVersion) {
  mismatches.push(
    `  claude-plugin/.claude-plugin/plugin.json#version is "${plugin.version}", expected "${expectedVersion}"`
  );
}

if (mismatches.length > 0) {
  console.error(`Version mismatch for tag ${tag}:`);
  for (const msg of mismatches) console.error(msg);
  process.exit(1);
}

console.log(`Version sync OK: tag ${tag} matches package.json and plugin.json (${expectedVersion})`);
