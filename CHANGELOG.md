# Changelog

All notable changes to `@crashoverride/brand-tokens` (this repo) are recorded
here. Versions match the git tags consumers pin to
(`github:crashappsec/brand-visual#vX.Y.Z`). Format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/); versions follow
[Semantic Versioning](https://semver.org/).

## [1.2.0] - Unreleased

Brand book v1 (PDF, produced by BBB) is canon. When this repo and the book
disagree, the book wins and this repo is corrected. Decision by the brand owner
in [crashappsec/digital-marketing#2286](https://github.com/crashappsec/digital-marketing/issues/2286)
and [#2287](https://github.com/crashappsec/digital-marketing/issues/2287).
Token names are unchanged; values change. Nothing downstream reads these values
until consumers are re-wired (crashappsec/digital-marketing#2286 step 3).

### Fixed

- **Four of the five official colours did not match the book.** Corrected to the
  book's colour page (Screen HEX):

  | Colour | Token (plus aliases that restate it) | Was | Now (book) |
  | --- | --- | --- | --- |
  | Black | `--color-co-black` (`--color-dark-surface`, dark `--surface-primary`) | `#161616` | `#0B1221` |
  | Fandango | `--color-fandango` (`--color-cobalt-500`, `--color-fandango-500`, `--color-amber-400`) | `#823AA4` | `#523AA4` |
  | Jazzberry | `--color-jazzberry` (`--color-magenta-400`, `--color-magenta-500`, `--color-jazzberry-500`, `--color-teal-400`) | `#FF3F86` | `#FF2F8E` |
  | Thunder | `--color-thunder` (`--color-thunder-500`, `--color-grey-100`) | `#E8E2DC` | `#E6E2DC` |
  | Atomic lime | `--color-atomic-lime` (`--color-neon-400`) | `#B3FF00` | `#B3FF00` (unchanged) |

  Alias tokens that restated an official colour now reference it with `var()`
  instead of repeating the hex, so the value lives in one place.
- Alpha overlays derived from the corrected colours are recomputed from the new
  bases: Fandango `rgba(130, 58, 164, a)` becomes `rgba(82, 58, 164, a)`
  (`--color-cobalt-500-*`, `--color-amber-400-*`); Jazzberry
  `rgba(255, 63, 134, a)` becomes `rgba(255, 47, 142, a)`
  (`--color-magenta-400-*`, `--color-teal-400-*`). Alphas are unchanged.
- `tokens/shadcn.css` oklch equivalents now round-trip to the book HEX: Fandango
  `oklch(0.438 0.163 288)`, Black `oklch(0.184 0.033 264)`, Jazzberry
  `oklch(0.664 0.245 359.8)`. The Atomic lime equivalent was also wrong
  (`oklch(0.93 0.25 124)` renders `#C6FF00`, not `#B3FF00`); it is now
  `oklch(0.915 0.24 128.2)`.
- Guideline pages, the co-design skill references, deck docs, and the README no
  longer restate the old hexes; quoted contrast ratios are re-measured.

### Changed

- **No off-book white (brand-owner decision, 2026-10-10).** The book specifies no
  white; the light end of the palette is Thunder. Token names are unchanged:

  | Token | Was | Now |
  | --- | --- | --- |
  | `--color-white` (and every role that uses it) | `#F7F6F5` | `var(--color-thunder-tint-10)` = `#FCFCFB` |
  | dark `--text-primary` | `hsl(225, 25%, 98%)` | `var(--color-white)` = `#FCFCFB` |
  | dark `--btn-enterprise-text`; light `--btn-primary-text`, `--text-invert` | `#FFFFFF` / `#F5F5F5` | `var(--color-white)` = `#FCFCFB` |
  | light `--surface-primary`, `--surface-card` | `#FFFFFF` | `var(--color-thunder-tint-10)` = `#FCFCFB` |
  | light `--surface-secondary` | `#F7F7F7` | `var(--color-thunder-tint-9)` = `#F9F8F7` |
  | light `--surface-invert` | `#EFEFEF` | `var(--color-thunder-tint-6)` = `#F0EEEB` |
  | light `--btn-secondary-hover-bg` | `#F0F0F0` | `var(--color-thunder-tint-6)` = `#F0EEEB` |
  | light `--color-code-bg` | `hsl(120, 14%, 97%)` | `var(--color-thunder-tint-9)` = `#F9F8F7` |
  | `--color-white-8`, dark `--border-hairline` | `rgba(255, 255, 255, 0.08)` | `rgba(252, 252, 251, 0.08)` |
  | `--color-code-border` | `rgba(255, 255, 255, 0.10)` | `rgba(252, 252, 251, 0.10)` |
  | `.co-accent-underline` text (`tokens/base.css`) | `#FFFFFF` | `var(--color-white)` |
  | shadcn whites `oklch(1 0 0)`, `oklch(0.97 0.004 90)`; light `--sidebar` | white / near-white | `oklch(0.991 0.001 106)` (tint-10); sidebar tint-9 |

  Near-white surfaces map to the nearest book Thunder tint by luminance. Greys
  used for text, borders, and disabled states are not whites and are unchanged.

### Added

- The book's tint ramps, ten steps per colour (50 tokens):
  `--color-co-black-tint-{1..10}`, `--color-fandango-tint-{1..10}`,
  `--color-jazzberry-tint-{1..10}`, `--color-thunder-tint-{1..10}`,
  `--color-atomic-lime-tint-{1..10}`. The step number is the book's position
  (1 = the colour, 10 = lightest). Numbered `-tint-N` rather than `-100..-1000`
  because the existing `-100..-900` scales run light to dark and some of those
  names (`--color-fandango-100`, `--color-thunder-500`, ...) already exist with
  other values.
- `scripts/expected-palette.json` now guards the five colours, the white role, and
  all 50 tints, so `npm run check:tokens` fails on any transcription drift.
- `npm run report:contrast` (`check-contrast.mjs --report`) prints every governed
  ratio, pass or fail, as a table.
- This changelog.

### Known discrepancies in the book (documented, not resolved)

- For four ramps the book's first tint swatch differs from its own colour page:
  Fandango `#523AA0` vs `#523AA4`, Jazzberry `#FF2F8A` vs `#FF2F8E`, Thunder
  `#E2DED8` vs `#E6E2DC`, Atomic lime `#AFFF00` vs `#B3FF00`. Black matches. The
  published steps 2-10 are consistent with those tint bases mixed with
  10%-90% white. Tokens use the colour-page HEX as tint-1 and transcribe steps
  2-10 as published, without recomputing. Side effect: the Thunder primary is one
  unit per channel lighter than Thunder tint-2 (`#E5E1DC`). Needs a call from BBB.

### Not changed (no book basis, needs a brand decision)

- The legacy intermediate ramp steps generated around the old bases:
  `--color-cobalt-100..400, -600`, `--color-fandango-100/300/700`,
  `--color-magenta-100/700/900`, `--color-jazzberry-100/700`,
  `--color-thunder-100/300/700`, `--color-neon-*`, `--color-grey-200..900`,
  amber/teal deprecated steps. After the correction the Fandango ramp is no longer
  monotonic (`--color-cobalt-600` `#6A2E86` is lighter than the base `#523AA4`).
- Dark slate surfaces (`--color-dark-surface-secondary` `#2A2E3A`,
  `-invert` `#353B49`, `-green` `#11161F`) and `--color-code-bg` `#0E0F10`, which no
  longer shares a hue with the navy Black.
- Light-mode greys (`#1A1A1A`, `#595959`, `#4A4A4A`, `#9D9D9D`, `#E5E5E5`,
  `#CCCCCC`, `#8E8E8E`), the dark `#0B0F19` primary-button label, and the light
  `rgba(0, 0, 0, 0.08)` hairline.
- Logo artwork in `assets/logos/` (`logo-black`, `iconlogo-black`,
  `icon-black-bg`, `icon-color`) fills the black at `#161616`, inherited from the
  marketing-supplied May 2025 vector set. Recolouring artwork is out of scope.

### Contrast

`npm run check` stays green: no governed pair changes from pass to fail or fail to
pass. Measured on the corrected values (`npm run report:contrast`):

| Pair (context) | Before | After |
| --- | --- | --- |
| primary text on surface (dark) | 17.23 | 18.22 |
| secondary text on surface (dark) | 10.57 | 10.92 |
| tertiary text on surface (dark) | 5.06 | 5.23 |
| Atomic lime emphasis on surface (dark) | 14.84 | 15.34 |
| error text on surface (dark) | 5.03 | 5.20 |
| primary text on surface (light) | 17.40 | 16.95 |
| Fandango emphasis on surface (light) | 6.80 | 8.18 |
| light primary button label on Fandango | 6.80 | 8.18 |
| default border on surface (light, 3:1) | 3.28 | 3.19 |

## [1.1.1] - 2026-06-12

- Docs follow the `react-design-system` to `react-registry` rename (#9).
- Repo settings auto-offer the gibson marketplace (#8).
- No token changes.

## [1.1.0] - 2026-06-12

- Deck layer: shared slide masters, the `sales` and `conference` variants under
  the brand contract, and the `hacker-con` direction note (#6).
- Audit of the old `crash-override-design` zip and the recovered SVG logo lockups
  (#6, #7).
- No token changes.

## [1.0.1] - 2026-06-11

- The "Tag. Track. Trust." tagline uses the traffic-light tokens (`tokens/base.css`,
  #4).

## [1.0.0] - 2026-06-11

- First tagged release: tokens, guidelines, assets, fonts, corp theme, co-design
  skill, and the CI guardrails (token integrity, brand contract, WCAG contrast)
  moved here from `react-design-system`. Distributed by git tag (#3).
- Light `--border-default2` set to `#8E8E8E` to clear WCAG 2.2 SC 1.4.11
  (was 2.71:1) (#2).
