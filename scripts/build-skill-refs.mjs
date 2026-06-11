#!/usr/bin/env node
// ============================================================
// build-skill-refs.mjs
// Generate markdown token references for the co-design skill
// from the CSS token layer and theme variants.
//
// Inputs : tokens/*.css (7 files) and themes/<name>/theme.css
// Outputs: claude-plugin/skills/co-design/references/
//            tokens-<basename>.md   (one per token file)
//            theme-<name>.md        (one per theme)
//            tokens-index.md        (row counts + purpose)
//
// Design goals:
//   - Deterministic: source order preserved, no timestamps, LF endings,
//     so `git diff --exit-code` is a valid staleness gate.
//   - Resolution: var() chains resolved to a literal value against a
//     single context loaded from all 7 token files (themes resolve
//     against that same context plus their own declarations).
//   - Fail loud: exit non-zero on an unparseable custom-property
//     declaration, an empty output file, or an unresolved var().
// ============================================================

import { readFileSync, writeFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, basename } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(__dirname, '..');

const TOKEN_FILES = [
  'base.css',
  'colors.css',
  'fonts.css',
  'semantic.css',
  'shadcn.css',
  'spacing.css',
  'typography.css',
];

const OUT_DIR = join(repoRoot, 'claude-plugin', 'skills', 'co-design', 'references');

// One-line purpose per token file, for tokens-index.md.
const FILE_PURPOSE = {
  'base.css': 'Base element styles and brand utility classes (no token declarations).',
  'colors.css': 'Core color palette: official brand colors, ramps, alpha overlays.',
  'fonts.css': '@font-face declarations for the self-hosted brand fonts (no token declarations).',
  'semantic.css': 'Semantic role layer: maps the palette to text, surface, border, and button roles per theme.',
  'shadcn.css': 'shadcn/ui variable bridge: exact Radix + Tailwind variable names in light and dark.',
  'spacing.css': 'Spacing grid, radius, border widths, shadows, blur, layout, easing, transitions.',
  'typography.css': 'Type tokens: font families, font sizes, line heights, weights, tracking.',
};

// Token files that carry no custom-property declarations by design (element
// styles, @font-face descriptors). Their reference files are provenance-only
// and that is NOT an error; every other token file must yield at least one row.
const DECLARATION_FREE = new Set(['base.css', 'fonts.css']);

const MAX_DEPTH = 8;

// ── Declaration regex (per task spec) ──────────────────────────
// Captures: 1=property, 2=value, 3=trailing /* comment */ (optional).
const DECL_RE = /^\s*(--[a-z0-9-]+)\s*:\s*([^;]+);(?:\s*\/\*\s*(.*?)\s*\*\/)?/;
// A line that begins (after whitespace) with a custom property name and a
// colon is *meant* to be a declaration; if DECL_RE fails on it, that is a
// hard parse error rather than a line we silently skip.
const LOOKS_LIKE_DECL_RE = /^\s*--[a-z0-9-]+\s*:/;

// ── Parse a CSS file into ordered selector blocks of declarations ──
// Returns { blocks: [{ selector, decls: [{ prop, value, note }] }], errors: [] }
// Block comments (/* ... */) spanning one or more lines are stripped from
// brace/selector tracking but trailing single-line declaration comments are
// preserved by DECL_RE.
function parseCss(text, fileLabel) {
  const errors = [];
  const blocks = [];

  // Strip block comments so they never interfere with brace matching or get
  // misread as declarations. We must NOT strip the *trailing* comment on a
  // declaration line (DECL_RE handles that), so we strip comments only when
  // they are not the trailing comment of a declaration. Simplest correct
  // approach: tokenize lines, and for each physical line decide its role.
  //
  // Strategy: walk the file char-by-char to track block-comment state and
  // brace depth, emitting "logical lines" only outside comments. Within a
  // declaration we keep its own trailing comment because DECL_RE re-reads the
  // raw line. To preserve trailing comments we operate per raw line but track
  // multi-line comment state across lines.

  const rawLines = text.split('\n');
  let inBlockComment = false;
  // Stack of open blocks. Each entry: { selector, decls }. Top of stack is the
  // innermost block; declarations attach there. Supports nesting (@media, etc.)
  // without erroring: at-rule wrappers simply become outer stack entries whose
  // `decls` typically stay empty and are dropped at emit time.
  const stack = [];
  let pendingSelector = ''; // accumulates selector text before '{'
  let openCounter = 0; // assigns each block a stable open-order index

  for (let i = 0; i < rawLines.length; i++) {
    const raw = rawLines[i];

    // Produce a "code view" of this line with block comments removed, while
    // tracking multi-line comment state. We keep a trailing single-line
    // comment ONLY if the code portion looks like a declaration (so DECL_RE
    // can capture its note); otherwise comments are noise.
    let code = '';
    let trailingComment = '';
    let j = 0;
    while (j < raw.length) {
      if (inBlockComment) {
        const end = raw.indexOf('*/', j);
        if (end === -1) { j = raw.length; break; }
        inBlockComment = false;
        j = end + 2;
        continue;
      }
      const open = raw.indexOf('/*', j);
      if (open === -1) {
        code += raw.slice(j);
        j = raw.length;
        break;
      }
      code += raw.slice(j, open);
      const end = raw.indexOf('*/', open + 2);
      if (end === -1) {
        inBlockComment = true;
        j = raw.length;
        break;
      }
      // A fully-closed comment on this line. If what we have so far in `code`
      // looks like a declaration (ends with ';'), treat this as its trailing
      // note; otherwise drop it.
      const inner = raw.slice(open + 2, end);
      if (/;\s*$/.test(code) || LOOKS_LIKE_DECL_RE.test(code)) {
        trailingComment = inner.trim();
      }
      j = end + 2;
    }

    // Re-assemble a candidate declaration line: code + trailing comment,
    // because DECL_RE expects the `/* ... */` syntax for group 3.
    const declLine = trailingComment
      ? `${code.replace(/\s*$/, '')} /* ${trailingComment} */`
      : code;

    // Interpret `code` for structure (selectors, braces) and declarations.
    // We split the line at brace boundaries so that a declaration on the same
    // physical line as a brace is still attributed to the correct block.
    let segment = '';
    const flushDecl = () => {
      const codeTrimmed = segment.trim();
      segment = '';
      if (!codeTrimmed.length || codeTrimmed === '}' || codeTrimmed === '{') return;
      if (!stack.length) return; // declaration outside any block: ignore
      // Build a candidate declaration string with the trailing note appended
      // so DECL_RE can capture group 3.
      const candidate = trailingComment
        ? `${codeTrimmed.replace(/\s*$/, '')} /* ${trailingComment} */`
        : codeTrimmed;
      const m = candidate.match(DECL_RE);
      if (m) {
        stack[stack.length - 1].decls.push({
          prop: m[1],
          value: m[2].trim(),
          note: (m[3] || '').trim(),
        });
        trailingComment = ''; // consumed
      } else if (LOOKS_LIKE_DECL_RE.test(codeTrimmed)) {
        errors.push(
          `${fileLabel}:${i + 1}: unparseable custom-property declaration: ${codeTrimmed}`
        );
      }
      // else: non-custom-property content inside a block (element styles in
      // base.css, @font-face descriptors in fonts.css) is ignored.
    };

    let k = 0;
    while (k < code.length) {
      const ch = code[k];
      if (ch === '{') {
        // Open a block. Selector is pending text (top level) or the segment
        // accumulated since the last brace (nested).
        const selRaw = (stack.length ? segment : pendingSelector);
        const sel = selRaw.replace(/\s+/g, ' ').trim();
        pendingSelector = '';
        segment = '';
        stack.push({ selector: sel, decls: [], openIndex: openCounter++ });
        k++;
        continue;
      }
      if (ch === '}') {
        flushDecl();
        if (!stack.length) {
          errors.push(`${fileLabel}:${i + 1}: unexpected '}'`);
        } else {
          const closed = stack.pop();
          blocks.push(closed);
        }
        k++;
        continue;
      }
      if (ch === ';') {
        // End of a declaration (or statement). Flush within a block; at top
        // level accumulate into the selector buffer (shouldn't happen in CSS).
        segment += ch;
        flushDecl();
        k++;
        continue;
      }
      if (stack.length) segment += ch;
      else pendingSelector += ch;
      k++;
    }
    // End of physical line. In the token layer every declaration lives on one
    // physical line terminated by ';' (already flushed above). Any leftover
    // `segment` that still looks like a custom-property declaration therefore
    // never closed properly: flag it as unparseable (rule 7). Non-declaration
    // leftovers (partial selectors, element-style fragments) are ignored.
    if (stack.length && LOOKS_LIKE_DECL_RE.test(segment.trim())) {
      errors.push(
        `${fileLabel}:${i + 1}: unparseable custom-property declaration: ${segment.trim()}`
      );
    }
    segment = '';
  }

  if (inBlockComment) errors.push(`${fileLabel}: unterminated block comment`);
  if (stack.length) errors.push(`${fileLabel}: ${stack.length} unterminated selector block(s)`);

  // Blocks are pushed on close, so a nesting wrapper closes after its children.
  // Sort by open order so emitted tables follow source order deterministically.
  blocks.sort((a, b) => a.openIndex - b.openIndex);
  return { blocks, errors };
}

// ── var() resolution ───────────────────────────────────────────
// context: Map<prop, declaredValue> built from all token files.
// localFirst: Map<prop, declaredValue> for the current parse (theme or file),
//   consulted before the global context so theme-scoped redefinitions resolve
//   against their own value.
const VAR_RE = /var\(\s*(--[a-z0-9-]+)\s*(?:,\s*([^)]*))?\)/;

function resolveValue(value, context, localFirst, seen = new Set(), depth = 0) {
  if (depth > MAX_DEPTH) {
    throw new Error(`var() resolution exceeded depth ${MAX_DEPTH} on: ${value}`);
  }
  const m = value.match(VAR_RE);
  if (!m) return value; // literal (hex, hsl, oklch, font stack, calc, size...)

  const target = m[1];
  const fallback = m[2];

  if (seen.has(target)) {
    throw new Error(`var() cycle detected at ${target}`);
  }

  let targetValue;
  if (localFirst && localFirst.has(target)) targetValue = localFirst.get(target);
  else if (context.has(target)) targetValue = context.get(target);

  if (targetValue === undefined) {
    if (fallback !== undefined && fallback !== '') {
      // Resolve the fallback expression itself.
      const resolvedFallback = resolveValue(
        fallback.trim(), context, localFirst, new Set(seen), depth + 1
      );
      // Substitute the resolved fallback back into the original string.
      return value.replace(VAR_RE, resolvedFallback);
    }
    throw new Error(`unresolved var(): ${target} is not defined`);
  }

  const nextSeen = new Set(seen);
  nextSeen.add(target);
  const resolvedTarget = resolveValue(targetValue, context, localFirst, nextSeen, depth + 1);

  // Replace just this var() occurrence, then continue resolving any siblings.
  const substituted = value.replace(VAR_RE, resolvedTarget);
  if (VAR_RE.test(substituted)) {
    return resolveValue(substituted, context, localFirst, seen, depth + 1);
  }
  return substituted;
}

// ── Markdown emission ──────────────────────────────────────────
function escapeCell(s) {
  return String(s).replace(/\|/g, '\\|');
}

function renderTable(decls, context, localFirst, errors, fileLabel) {
  const lines = [];
  lines.push('| token | value | resolved | note |');
  lines.push('| --- | --- | --- | --- |');
  for (const d of decls) {
    let resolved;
    try {
      resolved = resolveValue(d.value, context, localFirst);
    } catch (e) {
      errors.push(`${fileLabel}: ${d.prop}: ${e.message}`);
      resolved = '(unresolved)';
    }
    lines.push(
      `| \`${escapeCell(d.prop)}\` | ${escapeCell(d.value)} | ${escapeCell(resolved)} | ${escapeCell(d.note)} |`
    );
  }
  return lines.join('\n');
}

function renderDoc(provenance, blocks, context, localFirst, errors, fileLabel) {
  const parts = [provenance, ''];
  for (const block of blocks) {
    if (!block.decls.length) continue; // skip declaration-free blocks
    parts.push(`## \`${block.selector}\``);
    parts.push('');
    parts.push(renderTable(block.decls, context, localFirst, errors, fileLabel));
    parts.push('');
  }
  return parts.join('\n').replace(/\n+$/, '\n');
}

// ── Main ───────────────────────────────────────────────────────
function main() {
  const errors = [];

  // 1. Parse all token files; build the global resolution context.
  const tokenParses = [];
  const context = new Map();
  for (const file of TOKEN_FILES) {
    const path = join(repoRoot, 'tokens', file);
    if (!existsSync(path)) {
      errors.push(`missing token file: tokens/${file}`);
      continue;
    }
    const text = readFileSync(path, 'utf8');
    const parsed = parseCss(text, `tokens/${file}`);
    errors.push(...parsed.errors);
    for (const block of parsed.blocks) {
      for (const d of block.decls) {
        // Last write wins; core tokens are unique, so this keeps the canonical
        // value while still loading every declaration into the context.
        if (!context.has(d.prop)) context.set(d.prop, d.value);
      }
    }
    tokenParses.push({ file, parsed });
  }

  // 2. Discover themes: themes/<name>/theme.css
  const themesDir = join(repoRoot, 'themes');
  const themes = [];
  if (existsSync(themesDir)) {
    for (const name of readdirSync(themesDir).sort()) {
      const themePath = join(themesDir, name, 'theme.css');
      if (existsSync(themePath) && statSync(themePath).isFile()) {
        themes.push({ name, path: themePath });
      }
    }
  }

  // 3. Emit token reference files.
  const indexRows = [];
  for (const { file, parsed } of tokenParses) {
    const base = basename(file, '.css');
    const provenance = `Generated from tokens/${file} by scripts/build-skill-refs.mjs. Do not edit.`;
    // A token file resolves against the global context; same-file decls win.
    const localFirst = new Map();
    for (const block of parsed.blocks) {
      for (const d of block.decls) if (!localFirst.has(d.prop)) localFirst.set(d.prop, d.value);
    }
    const doc = renderDoc(provenance, parsed.blocks, context, localFirst, errors, `tokens/${file}`);
    const outName = `tokens-${base}.md`;
    const body = doc.endsWith('\n') ? doc : doc + '\n';
    writeFileSync(join(OUT_DIR, outName), body, 'utf8');
    const rowCount = parsed.blocks.reduce((n, b) => n + b.decls.length, 0);
    indexRows.push({ out: outName, source: `tokens/${file}`, rows: rowCount, purpose: FILE_PURPOSE[file] || '' });
    // Empty-output gate (rule 7): a written file must at least carry its
    // provenance line. A token file expected to declare tokens must also yield
    // rows; the declaration-free files are provenance-only by design.
    if (!body.trim().length) errors.push(`empty output: ${outName} has no content`);
    else if (rowCount === 0 && !DECLARATION_FREE.has(file)) {
      errors.push(`empty output: ${outName} has zero rows`);
    }
  }

  // 4. Emit theme reference files (resolve against tokens + own declarations).
  for (const { name, path } of themes) {
    const text = readFileSync(path, 'utf8');
    const parsed = parseCss(text, `themes/${name}/theme.css`);
    errors.push(...parsed.errors);
    const localFirst = new Map();
    for (const block of parsed.blocks) {
      for (const d of block.decls) if (!localFirst.has(d.prop)) localFirst.set(d.prop, d.value);
    }
    const provenance = `Generated from themes/${name}/theme.css by scripts/build-skill-refs.mjs. Do not edit.`;
    const doc = renderDoc(provenance, parsed.blocks, context, localFirst, errors, `themes/${name}/theme.css`);
    const outName = `theme-${name}.md`;
    writeFileSync(join(OUT_DIR, outName), doc.endsWith('\n') ? doc : doc + '\n', 'utf8');
    const rowCount = parsed.blocks.reduce((n, b) => n + b.decls.length, 0);
    indexRows.push({ out: outName, source: `themes/${name}/theme.css`, rows: rowCount, purpose: `Corp theme variant: restates the default semantic mapping as core-token references.` });
    if (rowCount === 0) errors.push(`empty output: ${outName} has zero rows`);
  }

  // 5. Emit tokens-index.md
  const indexLines = [];
  indexLines.push('Generated by scripts/build-skill-refs.mjs. Do not edit.');
  indexLines.push('');
  indexLines.push('# Token reference index');
  indexLines.push('');
  indexLines.push('| reference | source | rows | purpose |');
  indexLines.push('| --- | --- | --- | --- |');
  for (const r of indexRows) {
    indexLines.push(`| \`${r.out}\` | \`${r.source}\` | ${r.rows} | ${escapeCell(r.purpose)} |`);
  }
  indexLines.push('');
  writeFileSync(join(OUT_DIR, 'tokens-index.md'), indexLines.join('\n'), 'utf8');

  // 6. Fail loud.
  if (errors.length) {
    console.error('build-skill-refs.mjs failed:');
    for (const e of errors) console.error('  - ' + e);
    process.exit(1);
  }

  console.log(`build-skill-refs.mjs: wrote ${indexRows.length} reference files + tokens-index.md`);
}

main();
