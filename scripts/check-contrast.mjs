#!/usr/bin/env node
// check-contrast.mjs
// Verifies WCAG 2.x contrast for the role pairs declared in
// scripts/contrast-pairs.json across three kinds of context:
//   1. core dark    -- tokens/*.css :root (dark default)
//   2. core light   -- core dark, then [data-theme="light"] overrides
//   3. theme overlay -- core dark, then each themes/<name>/theme.css :root
//
// Method:
//   (a) build a custom-property map per context, resolve each pair's two
//       roles through the var() chain to a literal colour;
//   (b) parse literals (hex / rgb(a) / hsl(a) / oklch) with colorjs.io,
//       convert to sRGB, compute WCAG relative-luminance contrast;
//   (c) fail listing pair, context, ratio, and required minimum.
//
// A theme variant that fails AA fails CI exactly like a rogue hex would.
//
// Run:  node scripts/check-contrast.mjs
//       node scripts/check-contrast.mjs --self-test

import { readFileSync, readdirSync, existsSync, statSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve, join, basename } from "node:path";
import Color from "colorjs.io";

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, "..");

// ── WCAG relative luminance + contrast (sRGB) ──────────────────────────────
// sRGB channel linearization per WCAG 2.x definition.
function linearize(channel) {
  const c = channel; // expects 0..1
  return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}

function relativeLuminance([r, g, b]) {
  return (
    0.2126 * linearize(r) + 0.7152 * linearize(g) + 0.0722 * linearize(b)
  );
}

// Contrast ratio from two sRGB triplets (each channel 0..1).
function contrastRatio(srgbA, srgbB) {
  const lA = relativeLuminance(srgbA);
  const lB = relativeLuminance(srgbB);
  const lighter = Math.max(lA, lB);
  const darker = Math.min(lA, lB);
  return (lighter + 0.05) / (darker + 0.05);
}

// Parse any CSS colour literal to an sRGB [r,g,b] triplet (0..1) via colorjs.io.
function toSrgb(literal) {
  const color = new Color(literal);
  const srgb = color.to("srgb");
  // Clamp to gamut so out-of-range oklch values map to a real sRGB colour.
  const [r, g, b] = srgb.coords.map((c) => Math.min(1, Math.max(0, c)));
  return [r, g, b];
}

// ── CSS parsing: declarations grouped by selector block ────────────────────
function stripComments(css) {
  return css.replace(/\/\*[\s\S]*?\*\//g, "");
}

// Returns array of { selectors: string[], decls: Map<prop,value> }.
function parseBlocks(css) {
  const clean = stripComments(css);
  const blocks = [];
  const re = /([^{}]+)\{([^{}]*)\}/g;
  let m;
  while ((m = re.exec(clean)) !== null) {
    const selectors = m[1]
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    const decls = new Map();
    const declRe = /(--[a-z0-9-]+)\s*:\s*([^;]+);/g;
    let d;
    while ((d = declRe.exec(m[2])) !== null) {
      decls.set(d[1].trim(), d[2].trim());
    }
    if (decls.size > 0) blocks.push({ selectors, decls });
  }
  return blocks;
}

const DARK_SELECTORS = new Set([":root", "[data-theme=\"dark\"]", ".dark"]);
const LIGHT_SELECTORS = new Set(["[data-theme=\"light\"]", ".light"]);

// Merge declarations from blocks whose selector set intersects `wanted`.
// Later blocks win (source order), matching the cascade for equal specificity.
function mergeBlocks(blocks, wanted, target) {
  for (const block of blocks) {
    if (block.selectors.some((s) => wanted.has(s))) {
      for (const [k, v] of block.decls) target.set(k, v);
    }
  }
}

// Load all tokens/*.css and return { dark, light } property maps.
function loadCoreContexts() {
  const tokensDir = resolve(repoRoot, "tokens");
  const allBlocks = [];
  for (const entry of readdirSync(tokensDir)) {
    if (!entry.endsWith(".css")) continue;
    allBlocks.push(
      ...parseBlocks(readFileSync(join(tokensDir, entry), "utf8"))
    );
  }
  const dark = new Map();
  mergeBlocks(allBlocks, DARK_SELECTORS, dark);

  // Light = dark base, then light overrides layered on top.
  const light = new Map(dark);
  mergeBlocks(allBlocks, LIGHT_SELECTORS, light);

  return { dark, light };
}

// Build a theme-overlay context: core dark base, then theme :root on top.
function overlayTheme(coreDark, themePath) {
  const merged = new Map(coreDark);
  const blocks = parseBlocks(readFileSync(themePath, "utf8"));
  // A theme's dark default lives under :root (and dark aliases).
  mergeBlocks(blocks, DARK_SELECTORS, merged);
  return merged;
}

function gatherThemeFiles() {
  const themesDir = resolve(repoRoot, "themes");
  const out = [];
  if (!existsSync(themesDir)) return out;
  for (const entry of readdirSync(themesDir)) {
    const themeCss = join(themesDir, entry, "theme.css");
    if (existsSync(themeCss) && statSync(themeCss).isFile()) out.push(themeCss);
  }
  return out;
}

// ── Resolve a role through the var() chain to a literal colour string ──────
const VAR_REF = /^var\(\s*(--[a-z0-9-]+)\s*(?:,\s*([\s\S]*))?\)$/i;

function resolveRole(role, context, seen = new Set()) {
  if (seen.has(role)) {
    throw new Error(`circular var() reference at ${role}`);
  }
  seen.add(role);

  if (!context.has(role)) {
    throw new Error(`undefined custom property ${role}`);
  }
  let value = context.get(role).trim();

  const varMatch = value.match(VAR_REF);
  if (varMatch) {
    const target = varMatch[1];
    const fallback = varMatch[2];
    if (context.has(target)) {
      return resolveRole(target, context, seen);
    }
    if (fallback !== undefined) {
      return resolveLiteralOrVar(fallback.trim(), context, seen);
    }
    throw new Error(`${role} -> var(${target}) which is undefined`);
  }
  return value;
}

function resolveLiteralOrVar(value, context, seen) {
  const varMatch = value.match(VAR_REF);
  if (varMatch) {
    const target = varMatch[1];
    if (context.has(target)) return resolveRole(target, context, seen);
    throw new Error(`fallback var(${target}) is undefined`);
  }
  return value;
}

// ── Pair checking ──────────────────────────────────────────────────────────
// A pair runs in a context when it has no `contexts` restriction, or when the
// context name starts with one of the listed prefixes (e.g. "core dark",
// "theme:"). This scopes pairs to the contexts where the roles co-occur.
function pairAppliesTo(pair, contextName) {
  if (!Array.isArray(pair.contexts) || pair.contexts.length === 0) return true;
  return pair.contexts.some((prefix) => contextName.startsWith(prefix));
}

function checkContext(contextName, context, pairs, failures) {
  for (const pair of pairs) {
    if (!pairAppliesTo(pair, contextName)) continue;
    let fgLiteral, bgLiteral, fgSrgb, bgSrgb, ratio;
    try {
      fgLiteral = resolveRole(pair.foreground, context);
      bgLiteral = resolveRole(pair.background, context);
      fgSrgb = toSrgb(fgLiteral);
      bgSrgb = toSrgb(bgLiteral);
      ratio = contrastRatio(fgSrgb, bgSrgb);
    } catch (err) {
      failures.push(
        `[${contextName}] ${pair.name} (${pair.foreground} on ${pair.background}): ` +
          `resolution error: ${err.message}`
      );
      continue;
    }

    const rounded = Math.round(ratio * 100) / 100;
    if (ratio + 1e-9 < pair.min) {
      const kind = pair.uiComponent
        ? " (UI component, SC 1.4.11)"
        : pair.largeTextOnly
          ? " (large text only)"
          : "";
      failures.push(
        `[${contextName}] ${pair.name}${kind}: ${pair.foreground} (${fgLiteral}) on ` +
          `${pair.background} (${bgLiteral}) = ${rounded}:1, required >= ${pair.min}:1`
      );
    }
  }
}

// ── Self-test: validate the ratio function against known WCAG examples ─────
function selfTest() {
  const cases = [
    { fg: "#000000", bg: "#FFFFFF", expected: 21.0, tol: 0.05 },
    { fg: "#777777", bg: "#FFFFFF", expected: 4.48, tol: 0.05 },
  ];
  let ok = true;
  for (const c of cases) {
    const ratio = contrastRatio(toSrgb(c.fg), toSrgb(c.bg));
    const rounded = Math.round(ratio * 100) / 100;
    const pass = Math.abs(ratio - c.expected) <= c.tol;
    ok = ok && pass;
    console.log(
      `  ${c.fg} on ${c.bg}: ${rounded}:1 (expected ~${c.expected}:1) ` +
        (pass ? "OK" : "MISMATCH")
    );
  }
  if (!ok) {
    console.error("Self-test FAILED.");
    process.exit(1);
  }
  console.log("Self-test passed.");
}

function main() {
  if (process.argv.includes("--self-test")) {
    selfTest();
    return;
  }

  const pairsManifest = JSON.parse(
    readFileSync(resolve(here, "contrast-pairs.json"), "utf8")
  );
  const pairs = pairsManifest.pairs;
  const { dark, light } = loadCoreContexts();

  const contexts = [
    ["core dark (:root)", dark],
    ['core light ([data-theme="light"])', light],
  ];
  for (const themePath of gatherThemeFiles()) {
    const name = basename(dirname(themePath));
    contexts.push([`theme:${name} (overlay on core dark)`, overlayTheme(dark, themePath)]);
  }

  const failures = [];
  for (const [name, ctx] of contexts) checkContext(name, ctx, pairs, failures);

  if (failures.length > 0) {
    console.error("Contrast check FAILED:");
    for (const f of failures) console.error("  - " + f);
    console.error(
      `\n${failures.length} failing pair(s) across ${contexts.length} context(s).`
    );
    process.exit(1);
  }

  console.log(
    `Contrast check passed: ${pairs.length} pair(s) clear their minimum across ` +
      `${contexts.length} context(s).`
  );
}

main();
