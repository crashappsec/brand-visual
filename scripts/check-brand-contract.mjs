#!/usr/bin/env node
// check-brand-contract.mjs
// Lints theme/deck CSS for the brand contract:
//   Every declaration must assign a custom property whose value is a
//   var(--...) reference, and the referenced property must be defined in
//   tokens/*.css. Any raw colour literal (hex / rgb / rgba / hsl / hsla /
//   oklch) or a var() pointing at an unknown target fails with file:line.
//
// Comments are exempt (the corp theme intentionally lists hexes in its
// normalization comment block). Only themes/ and decks/ are subject to the
// contract; tokens/semantic.css is allowed to carry raw literals.
//
// Run: node scripts/check-brand-contract.mjs

import { readFileSync, readdirSync, existsSync, statSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve, join, relative } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, "..");

// ── Collect every custom property NAME defined anywhere in tokens/*.css.
// These are the only legal var() targets a theme/deck may reference.
function collectTokenNames() {
  const tokensDir = resolve(repoRoot, "tokens");
  const names = new Set();
  for (const entry of readdirSync(tokensDir)) {
    if (!entry.endsWith(".css")) continue;
    const css = readFileSync(join(tokensDir, entry), "utf8").replace(
      /\/\*[\s\S]*?\*\//g,
      ""
    );
    const re = /(--[a-z0-9-]+)\s*:/gi;
    let m;
    while ((m = re.exec(css)) !== null) names.add(m[1].trim());
  }
  return names;
}

// ── Gather *.css files under themes/ and (when present) decks/.
function gatherFiles() {
  const roots = ["themes", "decks"];
  const files = [];
  for (const root of roots) {
    const abs = resolve(repoRoot, root);
    if (!existsSync(abs)) continue;
    walk(abs, files);
  }
  return files;
}

function walk(dir, out) {
  for (const entry of readdirSync(dir)) {
    const p = join(dir, entry);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (entry.endsWith(".css")) out.push(p);
  }
}

// Replace block comments with equal-length whitespace (preserving newlines)
// so reported line numbers stay accurate and comment contents are exempt.
function blankComments(css) {
  return css.replace(/\/\*[\s\S]*?\*\//g, (m) =>
    m.replace(/[^\n]/g, " ")
  );
}

const COLOR_LITERAL = /(#[0-9a-fA-F]{3,8}\b|\brgba?\s*\(|\bhsla?\s*\(|\boklch\s*\()/;
const VAR_REF = /^var\(\s*(--[a-z0-9-]+)\s*(?:,[\s\S]*)?\)$/i;

function lintFile(path, tokenNames, errors) {
  const rel = relative(repoRoot, path);
  const raw = readFileSync(path, "utf8");
  const code = blankComments(raw);
  const lines = code.split("\n");

  // Match custom-property declarations: `--name: value;`
  const declRe = /(--[a-z0-9-]+)\s*:\s*([^;]+);/g;
  let m;
  while ((m = declRe.exec(code)) !== null) {
    const prop = m[1].trim();
    const value = m[2].trim();
    const line = code.slice(0, m.index).split("\n").length;

    // Rule 1: declaration must assign a semantic-role custom property.
    // (All theme declarations are custom properties; a bare CSS property
    // like `color: ...` is not allowed inside a contract file.)
    // declRe only matches --custom-properties, so prop is always a role.

    // Rule 2: a raw colour literal anywhere in the value fails.
    if (COLOR_LITERAL.test(value)) {
      errors.push(
        `${rel}:${line}: raw colour literal in ${prop}: \`${value}\` ` +
          `(themes/decks must reference core tokens via var(--...), never literals)`
      );
      continue;
    }

    // Rule 3: value must be a single var(--...) reference.
    const varMatch = value.match(VAR_REF);
    if (!varMatch) {
      // Allow keyword-only structural values that carry no colour and no
      // token reference (e.g. `transparent` on --btn-secondary-bg).
      if (/^(transparent|inherit|currentcolor|none)$/i.test(value)) continue;
      errors.push(
        `${rel}:${line}: ${prop} value must be var(--...) referencing a token: ` +
          `got \`${value}\``
      );
      continue;
    }

    // Rule 4: the var() target must be a property defined in tokens/.
    const target = varMatch[1];
    if (!tokenNames.has(target)) {
      errors.push(
        `${rel}:${line}: ${prop} references unknown token \`var(${target})\` ` +
          `(not defined in tokens/*.css)`
      );
    }
  }

  return lines.length;
}

function main() {
  const tokenNames = collectTokenNames();
  const files = gatherFiles();
  const errors = [];

  for (const f of files) lintFile(f, tokenNames, errors);

  if (errors.length > 0) {
    console.error("Brand contract check FAILED:");
    for (const e of errors) console.error("  - " + e);
    console.error(`\n${errors.length} violation(s) across ${files.length} file(s).`);
    process.exit(1);
  }

  console.log(
    `Brand contract check passed: ${files.length} theme/deck file(s) reference only known tokens.`
  );
}

main();
