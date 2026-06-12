# `crash-override-design` zip audit (2026-06)

Phase 5 of the brand-visual rollout (spec section 2 decision 5, section 8 phase 5)
begins by locating and auditing the old downloadable `crash-override-design`
skill zip, then merging only its genuinely unique, on-brand visual assets into
this repo and retiring the zip. This document is the file-by-file inventory and
disposition record. It is committed in the same PR as the merges so review sees
the inventory and the action together.

## 1. Location and provenance

The zip was located on the sponsor's machine in `~/Downloads`. It was a manual
download (not a checked-in artifact), consistent with RFC section 7.1 gap B8
("a downloaded zip"). Two copies were present, both the same logical artifact:

| File | Size (bytes) | sha256 | Notes |
|---|---|---|---|
| `Crash Override Design System.zip` | 6071577 | `b05127106520a652e67719f8586a5b110e4654888e527640c11e1c69685d6bd1` | earlier download (canonical for this audit) |
| `Crash Override Design System (1).zip` | 6071577 | `e9b26fc4bd1e5b738f68ad690b6d5a894878b3f3d6a851a966ea8fa024d666f7` | re-download; identical file list (277 files), differing only in zip container metadata / compression ordering |

Both unzip to the same 277-file tree with the same per-file contents. The
~6 MB size and 277-file count match the RFC section 6.1 expectation exactly
(SKILL.md + CSS tokens + React primitives with `.prompt.md` files + console and
marketing UI kits + slides + assets). The first file is treated as canonical;
both hashes are recorded for the retirement step.

The `digital-marketing` private monorepo and the Google Drive mounts were also
checked; the monorepo holds no `crash-override-design*.zip` and the Drive mounts
were not synced locally. The Downloads copy is the artifact.

## 2. Inventory and dispositions

Every file carries exactly one of four dispositions:

- **superseded**: tokens, rules, references, and assets now generated or
  authored canonically in `brand-visual`. The cheap default.
- **merge to `decks/`**: slide and deck templates worth keeping.
- **merge to `assets/`**: logos / imagery not already present and on-brand.
- **out of scope**: React primitives and `.prompt.md` generation prompts; their
  successors live in `react-design-system`'s registry (spec section 5).

### Summary by group (277 files total)

| Group | Files | Disposition | Reason |
|---|---:|---|---|
| `tokens/` (7 CSS) | 7 | superseded | `brand-visual/tokens/` is canon (Brand Book v1, recolored to Black `#161616`). The zip's tokens predate the recolor. |
| `styles.css` | 1 | superseded | repo has its own `styles.css` entry point. |
| `SKILL.md`, `DEVELOPER_HANDOFF.md`, `readme.md` | 3 | superseded | the zip's SKILL.md encodes the legacy brand (Black `#0B1221`, slate `#2A2E3A` raised cards, a different capability mapping). The `co-design` skill in `claude-plugin/` is the current authored replacement. |
| `guidelines/` (20 HTML) | 20 | superseded | `brand-visual/guidelines/` is the canonical 20-page set (plus an accessibility page the zip lacks). |
| `assets/` (13: logos + illustrations) | 13 | superseded | **byte-identical** to `brand-visual/assets/` (sha256 compared). Nothing unique. |
| `slides/` (4 HTML masters) | 4 | **merge to `decks/`** | clean, semantic-role-only slide masters (title / content / bigstat / capabilities). See section 3. |
| `decks/` (`Crash Override Sales Deck.html`, `deck-stage.js`) | 2 | superseded (historical) | a composite runtime deck + a generic slide-runner web component. Both carry raw hex (`#000`, off-brand amber `#F5A623`, generic chrome colors in `deck-stage.js`) and are lower fidelity than the `slides/` masters. Recorded as historical; not merged. |
| `export/Crash-Override-Sales-Deck.pptx` | 1 | superseded (historical) | a one-off export of the composite deck above; pre-recolor styling baked in. Not merged as a canonical binary template (see Risks in the plan). The `decks/shared/` HTML masters are the lintable canon instead. |
| `components/` (60 `.jsx` + 60 `.d.ts` + 60 `.prompt.md` + 16 `.card.html`) | 196 | out of scope | React primitives and their generation prompts. Successors live in `react-design-system`'s shadcn registry. Follow-up below. |
| `ui_kits/console/`, `ui_kits/marketing/` | 14 | out of scope | React demo apps loading a compiled `_ds_bundle.js` and CDN React. Not reusable brand assets; the marketing kit is the react-design-system's surface. |
| `screenshots/` (`console-light.png`, `marketing.png`) | 2 | superseded | preview specimens. `console-light.png` is a product Console mockup (react-design-system domain); `marketing.png` is a 3.7 KB near-black thumbnail. Neither is a reusable marketing visual. |
| `uploads/` (9 screenshots + 1 nested logo zip) | 10 | mixed (see section 4) | the nested `LOGO MAY 2025` zip is the original vector logo source; the 9 screenshots are working captures. |
| `_ds_bundle.js`, `_ds_manifest.json`, `_adherence.oxlintrc.json`, `.thumbnail` | 4 | superseded | build/runtime internals of the old skill bundle. |

### Net merge outcome

- **4 files merged to `decks/shared/`**: the slide masters (section 3).
- **4 files merged to `assets/logos/`**: vector wordmark + lockup SVGs recovered
  from the nested logo source (section 4). These fill the documented Phase 1
  gap (spec section 4.1; issue #1 item 2).
- **Everything else superseded or out of scope.** The audit confirms the spec's
  expectation: the zip is overwhelmingly stale, and `brand-visual` already holds
  the current canon.

## 3. Slide masters merged to `decks/shared/`

The four `slides/*.html` files are HTML slide masters that consume **semantic
roles only** (`var(--surface-primary)`, `var(--text-primary)`, `var(--font-title)`,
`var(--color-neon-400)`, etc.). Every custom property they reference exists in
the current `tokens/`. They carried no raw brand-color literals (one `#000` in a
`mask-image` gradient stencil in the title master was changed to the `black`
keyword on merge; a mask stencil is not a surface color).

| Source | Merged to | Role |
|---|---|---|
| `slides/title.html` | `decks/shared/title.html` | title / opener |
| `slides/content.html` | `decks/shared/content.html` | section / content (two-column steps + callout) |
| `slides/bigstat.html` | `decks/shared/bigstat.html` | big-stat / quote |
| `slides/capabilities.html` | `decks/shared/capabilities.html` | content (four-capability spine) |

On-merge changes (load-bearing only): stylesheet `href` rewritten
`../styles.css` -> `../../styles.css` (the masters now sit two levels under the
repo root); the title master's logo `src` rewritten to the merged
`logo-white.svg` with descriptive alt text; the title mask `#000` -> `black`.
Slide body copy is preserved verbatim (copied canon content).

The composite `decks/Crash Override Sales Deck.html`, `decks/deck-stage.js`, and
the `export/*.pptx` were **not** merged: they predate the recolor, carry raw and
off-brand color literals, and are superseded by the clean masters plus the
`co-design` skill's deck guidance.

## 4. Logo vectors merged to `assets/logos/`

The zip's `uploads/LOGO MAY 2025-20260607T150707Z-3-001.zip` is the original
marketing-supplied logo source set (dated 2025-04-28). It contains true vector
exports of the full wordmark and the icon+wordmark lockup, **not** auto-traces.
Inspected for legacy values: the black variants fill at `#161616` (current
canonical Black) and the white variants fill at `white`. No legacy navy
(`#0B1221`), violet (`#823AA4`), or slate (`#2A2E3A`) anywhere.

The repo previously had the full lockups in PNG only (`logo-black.png`,
`logo-white.png`, `iconlogo-black.png`, `iconlogo-white.png`). Spec section 4.1
flags this gap ("full logo lockups are PNG-only, add SVGs") and issue #1 item 2
tracks it as a v1.1.0 follow-up requiring marketing-supplied vectors. These are
exactly those vectors.

| Source (inside `LOGO MAY 2025/`) | Merged to | Fill |
|---|---|---|
| `Logo Crash Override Black.svg` | `assets/logos/logo-black.svg` | `#161616` |
| `Logo Crash Override White.svg` | `assets/logos/logo-white.svg` | `white` |
| `Icon Logo Crash Override Black.svg` | `assets/logos/iconlogo-black.svg` | `#161616` |
| `Icon Logo Crash Override White.svg` | `assets/logos/iconlogo-white.svg` | `white` |

The remaining files in the nested zip (PNG/JPG raster variants, white-background
variants) are byte-identical raster sources of marks the repo already carries,
or raster formats the repo does not need; they are not merged.

## 5. Pre-recolor / historical content (excluded)

Per the plan task 3 step 2, anything carrying pre-recolor brand values is
excluded rather than re-exported here:

- The zip `SKILL.md` / `DEVELOPER_HANDOFF.md` / `readme.md` describe Black as
  `#0B1221` and slate `#2A2E3A` raised cards. **Historical, do not use.** The
  current rule is Black `#161616` as the single content surface (no raised
  lift); see `claude-plugin/skills/co-design/references/visual-rules.md`.
- The composite sales deck HTML/JS/PPTX use off-brand amber (`#F5A623`) in the
  "Tag. Track. Trust." traffic-light lockup and Fandango-family raw hex for the
  primary CTA. **Historical, do not use.** Deck color comes from semantic roles.

The legacy-value gate passes after merge:
`grep -ri '0B1221' assets/ decks/` returns nothing, and a broader scan for
`823AA4 | 0B0F19 | 2A2E3A` across `assets/` and `decks/` returns nothing.

## 6. Follow-ups (not done in this PR)

- **Component generation prompts -> react-design-system.** The 60 `.prompt.md`
  files (one-line "what & when" + usage per component) may be worth folding into
  the registry item docs in `react-design-system`. Routed as a follow-up, not
  merged here (spec section 5; plan task 2 step 2 "out of scope" note).

## 7. Retirement

Recorded for the retirement step (plan task 7), to be completed by the sponsor:

- The artifact is a manual `~/Downloads` copy, not served from a distribution
  channel under this repo's control. Archival recommendation: attach
  `Crash Override Design System.zip` (sha256 above) as a `zip-archive` asset on
  a `brand-visual` release so the artifact and this disposition record live
  together, then delete the local copies.
- Tombstone for any place the zip was shared: point at the `co-design` plugin
  (installed from `crashappsec/brand-visual`) and this repo.

Retirement date: _pending sponsor action (tracked in issue #1 / Phase 5 PR)._
