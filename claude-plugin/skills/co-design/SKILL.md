---
name: co-design
description: Crash Override visual brand system for any agent. Use when generating or restyling decks, slides, and presentations; landing pages and marketing pages; product mockups and UI; diagrams and architecture drawings; social cards and OG images; README and docs styling; or any artifact that should look on-brand. Triggers on requests like make it on-brand, use the company colors, use our brand palette, apply brand fonts, brand this deck, on-brand mockup, social image, official colors, logo usage, dark theme, shadcn theme. Supplies the official palette and design tokens (color, typography, spacing, radius, shadow), light and dark themes, logo rules, and a shadcn component registry pointer. For voice, tone, and messaging rules see the brand-review skill in co-gtm.
---

# Crash Override visual brand (co-design)

This skill makes generated artifacts look on-brand: the right colors, fonts,
spacing, radius, themes, and logo usage. It is tool-agnostic. Use it whenever a
deck, page, mockup, diagram, social image, or doc should match the Crash
Override brand.

Read the brand rules first, then pull the exact values from the generated token
references. Everything this skill needs is inside this skill directory under
`references/`. The references prefixed with `tokens-` and `theme-` are generated
from the source design tokens, so they are the source of truth for literal
values; do not invent hex codes or sizes.

## How to use this skill

1. Read `references/visual-rules.md` for the brand essentials: dark-first
   surfaces, the official palette, typography roles, spacing and radius, and how
   to handle the logo.
2. Pull exact values from the token references (below). Quote the resolved
   value, not a guess.
3. For UI built on shadcn/ui, read `references/registry.md` to wire the
   component registry and theme.
4. Check `references/accessibility.md` before shipping color choices and text on
   colored surfaces.

## Reference router (read on demand)

Read only what the task needs. The `tokens-*` and `theme-*` files are generated
tables with a declared value, a fully resolved literal value, and a note per
token.

- `references/visual-rules.md`: start here. Palette, typography roles, spacing,
  radius, themes, logo usage. Read for any on-brand task.
- `references/tokens-index.md`: index of every generated token reference with
  row counts and a one-line purpose. Read to find which token file to open.
- `references/tokens-colors.md`: the core color palette, official brand colors,
  ramps, and alpha overlays. Read when you need an exact color value.
- `references/tokens-typography.md`: font families, sizes, line heights,
  weights, tracking. Read when setting type.
- `references/tokens-spacing.md`: spacing grid, radius, border widths, shadows,
  blur, layout, easing, transitions. Read for layout and rounding.
- `references/tokens-semantic.md`: semantic roles (text, surface, border,
  button) mapped per theme. Read when you need a role, not a raw color.
- `references/tokens-shadcn.md`: shadcn/ui variable names mapped to the brand,
  in light and dark. Read when theming shadcn components.
- `references/theme-corp.md`: the default corp theme, semantic roles expressed
  as core-token references. Read when applying the standard theme.
- `references/registry.md`: shadcn component registry pointer, namespace config,
  and install usage. Read when building on shadcn/ui.
- `references/accessibility.md`: contrast and legibility rules for color and
  text on colored surfaces. Read before finalizing color choices.
- `references/decks.md`: deck and slide guidance. Read for presentation work.

## Cross-reference

This skill governs visuals only. For voice and tone rules, messaging, naming,
and copy review, see the brand-review skill in co-gtm. Keep the split clean:
co-design decides how it looks, brand-review decides how it reads.
