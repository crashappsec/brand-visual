# Crash Override visual rules

The brand essentials. Read this first, then pull exact values from the
`tokens-*` and `theme-*` references in this directory. Do not invent hex codes,
sizes, or font names; quote the resolved value from the generated tables.

## Dark first

The brand is dark by default. Black `#161616` is THE surface for every content
area: pages, cards, and sections all sit on it. Cards and sections separate
through hairline borders and structure, never through a lighter background lift.
Light mode exists and is opt-in; when you build light, surfaces and text invert
but the brand accents stay. See `tokens-semantic.md` and `theme-corp.md` for the
role mapping in each mode.

## Official palette

Five official brand colors. The brand has no blue.

- Atomic lime `#B3FF00`: the primary, signature accent. Interactive, highlight,
  and CTA color on dark surfaces.
- Fandango `#823AA4`: the brand purple. Secondary accent, and the primary action
  color in light mode (Atomic lime is illegible as a fill on white).
- Jazzberry `#FF3F86`: hot-pink tertiary accent.
- Thunder `#E8E2DC`: warm off-white neutral.
- Black `#161616`: the brand dark and default surface.

Use the ramps and alpha overlays in `tokens-colors.md` rather than hand-mixing
tints. Prefer semantic roles (`tokens-semantic.md`) over raw palette values when
you are styling text, surfaces, borders, or buttons.

## Typography roles

Three brand fonts, each with a fixed role. Pull exact stacks, sizes, and weights
from `tokens-typography.md`.

- JetBrains Mono: titles, headings, and brand wordmark treatments.
- Inter: body copy and documentation.
- Geist Mono: code, data, and terminal text.

Headings use tight tracking; uppercase eyebrow labels use wide tracking. The
fonts are self-hosted (vendored under SIL OFL 1.1) under `fonts/` in the brand
repo; for office tools install the ttf/otf files directly.

## Spacing and radius

The layout grid is 8px based. Rounding is deliberately sharp: the default radius
is 4px (`--radius-md`) for cards, inputs, and buttons; 6px for larger code
panels. Shadows are low, dark, and restrained. Exact spacing, radius, border
width, shadow, blur, and easing values are in `tokens-spacing.md`.

## Themes

The default theme is corp (dark). `theme-corp.md` restates the default semantic
mapping using core-token references; variants copy that file and remap only the
roles they change. New colors or fonts enter `tokens/colors.css` or
`tokens/fonts.css` first, never a theme file. For shadcn/ui apps, the matching
variable bridge is in `tokens-shadcn.md`.

## Logo usage

Do not improvise logo treatment. The authoritative rules (clear space, minimum
size, approved backgrounds, what not to do) live in `guidelines/brand-logos.html`
in the brand repo, and the actual files live in `assets/logos/`. Read both
before placing a logo. Available marks include the full wordmark
(`logo-black.png`, `logo-white.png`), the icon in several treatments
(`icon-color`, `icon-white`, `icon-black-bg` as svg and png), the combined
icon-plus-wordmark lockups (`iconlogo-black.png`, `iconlogo-white.png`), and
`favicon.svg`. Pick the mark whose contrast suits the background, and follow the
guideline for spacing and sizing. The wordmark CRASH OVERRIDE is custom art, not
a webfont; never re-typeset it.
