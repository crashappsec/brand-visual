# Accessibility rules for co-design

Read this before finalizing any color choice or placing text on a colored surface.
The target for every Crash Override brand surface is WCAG 2.2 Level AA.

## Core rule: use semantic role tokens

Always use semantic role tokens rather than raw palette values for text and
surfaces. The semantic layer (`tokens-semantic.md`) is designed to pass AA in
every supported theme variant; raw palette values may not.

- Text on dark surfaces: use `--text-primary` (18.22:1), `--text-secondary`
  (10.92:1), or `--text-tertiary` (5.23:1) against `--surface-primary` (#0B1221).
- Text on light surfaces: use `--text-primary` which resolves to #1A1A1A on
  `--surface-primary` which resolves to #FCFCFB in the light theme (16.95:1).
  The brand has no white: the light surface is Thunder tint-10 (#FCFCFB).

Ratios are measured by `npm run report:contrast` in the brand repo.

## AA-passing role pairs

These pairs are asserted to pass AA. CI enforces them on every PR via
`scripts/check-contrast.mjs` against `scripts/contrast-pairs.json`.

### Dark theme (default)

| pair | foreground | background | ratio |
| --- | --- | --- | --- |
| primary text on surface | `--text-primary` #FCFCFB | `--surface-primary` #0B1221 | 18.22:1 |
| secondary text on surface | `--text-secondary` hsl(225,25%,80%) | `--surface-primary` #0B1221 | 10.92:1 |
| tertiary text on surface | `--text-tertiary` hsl(225,25%,58%) | `--surface-primary` #0B1221 | 5.23:1 |
| emphasis (Atomic lime) on surface | `--text-emphasis` #B3FF00 | `--surface-primary` #0B1221 | 15.34:1 |
| primary button text on lime fill | #0B0F19 | `--btn-primary-bg` #B3FF00 | 15.70:1 |

### Light theme ([data-theme="light"])

| pair | foreground | background | ratio |
| --- | --- | --- | --- |
| primary text on surface | `--text-primary` #1A1A1A | `--surface-primary` #FCFCFB | 16.95:1 |
| emphasis (Fandango) on surface | `--text-emphasis` #523AA4 | `--surface-primary` #FCFCFB | 8.18:1 |
| Fandango text on fandango tint | `--color-fandango-700` #5A2173 | `--color-fandango-100` #F1E7F7 | 9.22:1 |
| Jazzberry text on jazzberry tint | `--color-jazzberry-700` #B01E5A | `--color-jazzberry-100` #FFE3EE | 5.50:1 |

## AA-aware tokens (asserted facts)

Some token values were chosen specifically to guarantee a passing ratio. The
comment `/* AA text on light tints */` on `--color-fandango-700` in
`tokens/colors.css` is a contract, not a note. Do not change these values
without re-verifying the ratio and updating the CI pairs manifest.

- `--color-fandango-700` (#5A2173): AA text on fandango-100 (#F1E7F7). This is
  also the primary action color in light mode because Atomic lime (#B3FF00)
  fails on the light surface (1.19:1 on #FCFCFB, do not use).
- `--color-jazzberry-700` / `--color-magenta-700` (#B01E5A): AA text on
  jazzberry-100 / magenta-100 (#FFE3EE).

## Focus visible

All interactive elements must carry a visible focus indicator at 3:1 contrast
against adjacent colors (SC 2.4.11 targeting AA).

- Dark surfaces: Atomic lime (#B3FF00) focus ring.
- Light surfaces: Fandango-700 (#5A2173) focus ring.

Do not remove `:focus-visible` outlines without providing a custom replacement
that clears the 3:1 ratio.

## Alt text for decks and marketing artifacts

All non-decorative images in decks, social cards, OG images, and marketing pages
require descriptive alt text.

- Diagrams and architecture drawings: describe the relationship or outcome being
  shown, not the visual appearance (e.g. "data flow from ingest to store with
  three labeled hops" not "a box connected by arrows").
- Logo placements: use `alt="Crash Override wordmark"` or `alt="Crash Override
  icon"` as appropriate; never `alt=""` for a logo in a content context.
- Decorative dividers and background textures: use `alt=""` (empty string) and,
  for SVG, `aria-hidden="true"`.
- Social cards and OG images: the `og:image:alt` meta tag must carry the same
  description you would use for an `alt` attribute on the image itself.
- Screenshot illustrations in docs: describe what the interface is doing or
  showing, not just "screenshot of the app."

When in doubt, read the image description aloud and ask whether a person who
cannot see the image would understand why it is there and what it conveys.
