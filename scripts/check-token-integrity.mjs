#!/usr/bin/env node
// check-token-integrity.mjs
// Asserts that every key in scripts/expected-palette.json is defined in
// tokens/colors.css with the exact expected value (case-insensitive hex
// compare). Exits non-zero and prints named diffs on any mismatch.
//
// Run: node scripts/check-token-integrity.mjs

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, "..");
const colorsPath = resolve(repoRoot, "tokens/colors.css");
const palettePath = resolve(here, "expected-palette.json");

// Parse `--token: value;` declarations from a CSS source. Strips block
// comments first so a commented-out token never shadows a real one.
function parseCustomProperties(css) {
  const withoutComments = css.replace(/\/\*[\s\S]*?\*\//g, "");
  const map = new Map();
  const re = /(--[a-z0-9-]+)\s*:\s*([^;]+);/gi;
  let m;
  while ((m = re.exec(withoutComments)) !== null) {
    // Last write wins, matching CSS cascade order within the file.
    map.set(m[1].trim(), m[2].trim());
  }
  return map;
}

// Normalize a hex color for comparison: lowercase, expand 3/4-digit shorthand
// to 6/8 digits. Non-hex values are returned lowercased and trimmed so an
// exact-string compare still works for them.
function normalizeColor(value) {
  const v = value.trim().toLowerCase();
  const hexMatch = v.match(/^#([0-9a-f]{3,8})$/);
  if (!hexMatch) return v;
  let hex = hexMatch[1];
  if (hex.length === 3 || hex.length === 4) {
    hex = hex
      .split("")
      .map((c) => c + c)
      .join("");
  }
  return "#" + hex;
}

function main() {
  const css = readFileSync(colorsPath, "utf8");
  const expected = JSON.parse(readFileSync(palettePath, "utf8"));
  const tokens = parseCustomProperties(css);

  const diffs = [];
  for (const [token, expectedValue] of Object.entries(expected)) {
    if (!tokens.has(token)) {
      diffs.push(`${token}: MISSING from tokens/colors.css (expected ${expectedValue})`);
      continue;
    }
    const actual = tokens.get(token);
    if (normalizeColor(actual) !== normalizeColor(expectedValue)) {
      diffs.push(`${token}: expected ${expectedValue}, found ${actual}`);
    }
  }

  if (diffs.length > 0) {
    console.error("Token integrity check FAILED:");
    for (const d of diffs) console.error("  - " + d);
    console.error(`\n${diffs.length} mismatch(es) against scripts/expected-palette.json.`);
    process.exit(1);
  }

  console.log(
    `Token integrity check passed: ${Object.keys(expected).length} token(s) match tokens/colors.css.`
  );
}

main();
