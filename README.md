# brand-visual

Visual brand canon for Crash Override. This repo is the single source of truth for tokens, guidelines, assets, themes, deck templates, and the co-design plugin. Verbal brand lives in the marketplace's co-gtm plugin.

## Contents

- `tokens/`: CSS design tokens (colors, typography, spacing, semantic, shadcn, base)
- `guidelines/`: HTML guideline pages (color, type, spacing, logos, icons, animation, imagery, theming)
- `assets/logos/`: logo and icon files (PNG + SVG)
- `assets/illustrations/`: illustration SVGs
- `styles.css`: root CSS entry point that imports all tokens
- `fonts/`: vendored OFL font files (JetBrains Mono, Inter, Geist Mono), self-hosted and installable
- `themes/`: governed variant layer (corp mapping today; platform and open-source onboard later)
- `decks/`: on-brand slide masters (`shared/`) and deck variants (`sales/`, `conference/`, `hacker-con/`) as theme remaps under the brand contract; see `decks/README.md`
- `docs/`: audit and decision records (e.g. the `crash-override-design` zip audit)
- `claude-plugin/`: the co-design skill with generated token references for agent tools
- `scripts/`: reference generator and CI guardrails (token integrity, brand contract, WCAG contrast)

Convention note: authored prose in this repo avoids em-dashes (brand rule). CSS comments inside copied canon files and generated tables that quote them are exempt.

## Consuming the tokens

Distribution is by git tag (decided 2026-06-11). The `@crashoverride/brand-tokens` package is installed straight from this repo at a tagged version; npm resolves git refs natively, so no registry account is needed:

```jsonc
// package.json
{
  "dependencies": {
    "@crashoverride/brand-tokens": "github:crashappsec/brand-visual#v1.0.0"
  }
}
```

Then import what you need (the `exports` map exposes tokens, themes, and fonts):

```css
@import "@crashoverride/brand-tokens/tokens/colors.css";
@import "@crashoverride/brand-tokens/tokens/semantic.css";
@import "@crashoverride/brand-tokens/themes/corp/theme.css";
```

Pin to a tag, not a branch, so token changes arrive as reviewable dependency bumps. A future npm channel (`npm i @crashoverride/brand-tokens`) can be added without changing this repo; consumers would only swap the dependency line.

The shadcn component registry (themed React components) is a separate channel served from react-design-system; see `claude-plugin/skills/co-design/references/registry.md`.

## Provenance

Tokens, guidelines, assets, and styles were copied from:

- Source repo: https://github.com/crashappsec/react-design-system
- Source commit: cb52e9f1fa82a9ae5afdb70e3e4056a865952851
- Date: 2026-06-11

Cross-repo git history cannot be preserved via copy; the commit SHA above is the audit trail. All canonical Black values are `#161616`.
