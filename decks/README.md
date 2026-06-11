# Decks

On-brand slide and deck templates for Crash Override. This directory is the
full-fidelity source for decks; the `co-design` skill carries the rules and
points here (it does not bundle these templates). The companion skill reference
is `claude-plugin/skills/co-design/references/decks.md`.

## How it fits the brand system

Decks consume the same three-layer token model as everything else (spec section
4.4). Slide masters reference **semantic roles only**; variants remap those roles
to approved core values; nothing here introduces a new color, font, or size.

```
tokens/colors.css + tokens/fonts.css   core    atomic brand values
tokens/semantic.css                    roles   --surface-*, --text-*, --accent, ...
themes/<name>/theme.css                theme   default + product/OSS remaps
decks/<variant>/theme.css              deck    deck-specific role selection
decks/shared/*.html                    masters slide layouts, roles only
```

A deck variant is a **theme remap plus a cover/imagery selection**, not a new
design. Variants *select* among approved assets (which lockup, which accent,
which imagery set); they never add their own values. That rule is enforced
mechanically, not by policy:

- `check-brand-contract.mjs` lints `decks/**/*.css`: every declaration must
  assign a semantic role to a core token via `var(--...)`. A raw hex/rgb/hsl/
  oklch literal, or a `var()` pointing at an unknown token, fails CI with
  `file:line`.
- The HTML slide masters (`decks/shared/*.html`) are not CSS files, so they are
  not linted; they stay on-brand by construction because they reference only
  semantic roles and the merged on-brand logos. Treat any raw color a master
  needs (a mask stencil, a gradient stop) as structural, never as a brand color.

## Layout

```
decks/
  README.md            this file
  shared/              master slide layouts (roles only), shared by all variants
    title.html         opener: neon bar, wordmark, agenda
    content.html       section/content: two-column steps + callout
    bigstat.html       big stat / quote
    capabilities.html  four-capability spine (colored accent cards)
  sales/
    theme.css          variant: light surfaces + Fandango accent
  conference/
    theme.css          variant: standard dark corp (Atomic lime)
  hacker-con/
    DIRECTION.md        creative-direction note only (no design yet)
```

The four masters in `shared/` came from the audited `crash-override-design` zip
(see `docs/zip-audit-2026-06.md`); they were already semantic-role-only and
needed only path fixes on merge.

## Variants

Each variant is a thin role-remap stylesheet that the shared masters consume.
Build a deck by rendering the shared masters with the variant's `theme.css`
applied (and, for sales, with `data-theme="light"` on the deck root).

| Variant | Surfaces | Accent | Lockup | When |
|---|---|---|---|---|
| `conference/` | dark (default) | Atomic lime | white wordmark (`logo-white.svg`) on Black | the standard corporate deck; projector in a dark room |
| `sales/` | light (`data-theme="light"`) | Fandango (`#5A2173` text/focus, brand Fandango fills) | black wordmark (`logo-black.svg`) on light | leave-behinds, bright rooms, where dark washes out |
| `hacker-con/` | TBD | TBD | TBD | security/hacker-con talks; *Hackers* (1995) neon/CRT direction; design pending (`DIRECTION.md`) |

### Why sales does not remap surfaces

The sales variant does **not** set surface or text roles. Light surfaces come
from the brand's existing `[data-theme="light"]` mapping, which
`check-contrast.mjs` already verifies for WCAG 2.2 AA in its "core light"
context. The variant only selects an approved accent: Atomic lime is illegible
on white (1.7:1), so the action/accent role moves to Fandango, using
`--color-fandango-700` (`#5A2173`, asserted "AA text on light tints") for text
and focus. This keeps the variant additive-free and avoids shipping an unchecked
surface/text pairing.

## Lockups and imagery per variant

- **conference** uses the white wordmark (`assets/logos/logo-white.svg`) on the
  Black surface, and the white icon where an icon-only mark is needed.
- **sales** uses the black wordmark (`assets/logos/logo-black.svg`) on the light
  surface.
- All variants draw from the same approved illustration set in
  `assets/illustrations/`. New imagery enters `assets/` first (marketing review),
  then a variant may select it; a variant never ships its own imagery.

## Binary templates (PPTX / Keynote)

There are no binary deck templates checked in. The HTML masters are the canon
because the brand contract can lint the CSS path and the masters render in any
browser and export cleanly to PDF. If a PPTX or Keynote master is added later,
store it here as a binary and document its role mapping in this README (which
master color maps to which semantic role), since the linter cannot read inside a
binary. Binary template edits are marketing-reviewed via CODEOWNERS.

The old `crash-override-design` zip shipped a `Crash-Override-Sales-Deck.pptx`;
it predates the Black recolor and is recorded as historical in
`docs/zip-audit-2026-06.md`, not merged.

## Accessibility

Decks follow the same WCAG 2.2 AA target as every brand surface. Use only
AA-passing role pairs for text, give interactive elements a visible focus ring,
and provide alt text for every non-decorative image. The full rules, including
the alt-text guidance for diagrams, logos, and social/OG images, are in
`claude-plugin/skills/co-design/references/accessibility.md`.
