# Decks and slides

How to build an on-brand Crash Override deck. Read this for any slide or
presentation work. It carries the rules and structure; the full-fidelity slide
masters and variant stylesheets live in the brand repo under `decks/` (pointers
below), not inside this skill.

## First, choose the variant

Decks come in variants. Before building, ask what the deck is for and pick one,
the same way `brand-review` selects a register by audience:

- **Sales** (`decks/sales/`): light surfaces, Fandango (purple) accent. For
  leave-behinds, printed handouts, and bright meeting rooms where a dark deck
  washes out.
- **Conference** (`decks/conference/`): the standard dark corporate deck, Black
  surfaces, Atomic lime accent. The default for a talk on a projector.
- **Hacker-con** (`decks/hacker-con/`): security/hacker-conference talks, a
  neon/CRT direction drawn from the film *Hackers* (1995). This variant is
  direction-only today (see `decks/hacker-con/DIRECTION.md`); there is no
  stylesheet yet, so do not build a hacker-con deck as if one exists. Fall back
  to conference and note the gap.

If the user does not say, ask: "Is this a sales deck, a conference talk, or a
hacker-con talk?" Then build with that variant.

## How a deck is put together

A deck is **shared slide masters + one variant remap**, all driven by semantic
roles. Nothing in a deck introduces a new color, font, or size.

1. **Slide masters** live in `decks/shared/`: `title.html` (opener),
   `content.html` (two-column steps + callout), `bigstat.html` (a single big
   number or quote), `capabilities.html` (the four-capability spine). Each is a
   1280x720 HTML slide that references brand semantic roles only. Use these as
   the structure for new slides; copy a master and change the copy, not the
   colors.
2. **The variant remap** (`decks/<variant>/theme.css`) selects the accent and,
   for sales, the surface mode. Apply it on top of the masters:
   - Conference: render on the default (dark) theme.
   - Sales: set `data-theme="light"` on the deck root so surfaces and text use
     the brand's AA-verified light mapping, then the sales remap moves the accent
     to Fandango (Atomic lime is illegible on white).

## Slide-construction rules

- **Roles, not raw colors.** Use semantic roles (`--surface-primary`,
  `--text-primary`, `--text-secondary`, `--accent`, `--text-emphasis`,
  `--border-hairline`) and pull literal values, when you need them, from the
  `tokens-*` references. Never hand-pick a hex. The masters already do this; keep
  it that way when you add slides.
- **Type.** JetBrains Mono (`--font-title`) for titles and eyebrows, Inter
  (`--font-body`) for body, Geist Mono (`--font-mono`) for code, labels, and
  data. Exact stacks and sizes are in `tokens-typography.md`.
- **Surfaces and shape.** Black `#161616` is the content surface on dark; cards
  separate with hairline borders, not a lighter lift. Rounding is sharp (4px,
  `--radius-md`). See `visual-rules.md` and `tokens-spacing.md`.
- **Logos.** Use the wordmark that contrasts with the surface: `logo-white.svg`
  on dark (conference, hacker-con), `logo-black.svg` on light (sales). The SVG
  lockups live in `assets/logos/` in the brand repo. Never re-typeset the
  wordmark; it is custom art. See `visual-rules.md` for clear-space and the
  guideline `guidelines/brand-logos.html`.
- **Accent discipline.** One accent per deck (the variant's): Atomic lime on
  dark, Fandango on light. The capability colors (Monitor/Inspect/Tag/Track) are
  for capability content, not general highlighting.

## Accessibility (required, not optional)

- Use only AA-passing role pairs for text. The dark and light pairs are listed
  in `accessibility.md`; the brand targets WCAG 2.2 AA on every surface.
- Every non-decorative image needs descriptive alt text: describe what a diagram
  shows (the relationship or outcome, not the shapes), name a logo
  (`alt="Crash Override wordmark"`), and mirror the description into
  `og:image:alt` for any export shared as a social card. Decorative textures and
  dividers use `alt=""` and `aria-hidden="true"`. Full guidance, including the
  CRT/neon decorative-layer rule for hacker-con, is in `accessibility.md`.
- Give interactive or animated elements a visible focus ring (Atomic lime on
  dark, Fandango-700 on light) and honor `prefers-reduced-motion` for any slide
  animation.

## Pointers (brand repo)

These are full-fidelity sources in the brand repo; read them when you need the
real template rather than the rules:

- `decks/README.md`: deck governance, the variant table, lockup/imagery per
  variant, and the binary-template (PPTX/Keynote) role-mapping policy.
- `decks/shared/*.html`: the four slide masters to copy from.
- `decks/sales/theme.css`, `decks/conference/theme.css`: the variant remaps.
- `decks/hacker-con/DIRECTION.md`: the hacker-con creative direction (no design
  yet).

## Output

Produce static HTML slides (one 1280x720 section per slide) that link the brand
stylesheet and apply the chosen variant, so the deck renders in a browser and
exports cleanly to PDF. Keep the copy in the user's voice; for wording and
messaging rules, defer to the `brand-review` skill in `co-gtm`.
