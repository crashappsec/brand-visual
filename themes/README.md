# Themes

A theme is a small role-remap file that tells the design system which approved
core tokens to use for each semantic role. Themes do not introduce new values;
they select among values already defined in the core token layer.

---

## The three-layer model

```
tokens/colors.css   tokens/fonts.css   tokens/spacing.css  ...
        |                   |                   |
        v                   v                   v
             tokens/semantic.css       (semantic roles)
                     |
                     v
             themes/<name>/theme.css   (variant)
```

**Layer 1 -- Core tokens** (`tokens/*.css`)
Atomic values: hex swatches, named font families, spacing steps. These are
the approved brand assets. Only the brand team adds values here.

**Layer 2 -- Semantic roles** (`tokens/semantic.css`)
Maps core tokens to context-meaningful names (`--surface-primary`,
`--text-emphasis`, `--btn-primary-bg`, etc.). The default mapping is the corp
dark-mode look. Light mode is an opt-in override on the same layer.

**Layer 3 -- Variants** (`themes/<name>/theme.css`)
A theme overrides a subset of semantic roles, pointing them at different
approved core tokens. A variant can darken a surface, swap the primary accent
from Atomic lime to Fandango, or adjust a border colour -- all without adding
new values.

---

## Governance rules

1. **Variants select; they do not add.**
   Every value in a `theme.css` file must be a `var(--...)` reference to a
   token defined in `tokens/*.css`. Raw hex, rgb, hsl, and oklch literals
   are rejected by CI (brand-contract check).

2. **New values enter core first.**
   If a variant genuinely needs a colour or font not in `tokens/colors.css` /
   `tokens/fonts.css`, open a PR to add it there, get marketing approval, then
   reference it from the theme file.

3. **CODEOWNERS review requirements:**
   - Changes to `tokens/` (core layer): marketing is a required reviewer.
   - New or changed `themes/*/theme.css` files: marketing plus the proposing
     team are required reviewers.
   - `themes/README.md`: marketing is a required reviewer.

4. **CI brand-contract check.**
   A script (landing in a later task) runs on every PR touching `themes/`.
   It greps `theme.css` files for raw colour literals and fails the build if
   any are found. Every referenced custom property must resolve to a token
   defined in `tokens/*.css`.

---

## Current themes

| Theme | Path | Status | Description |
|-------|------|--------|-------------|
| corp  | `themes/corp/theme.css` | stable | Default corp dark look; restates semantic.css defaults |

`themes/platform/` and `themes/open-source/` are authored by their respective
teams when needed. No placeholder directories exist until a team opens a PR.

---

## Authoring a new theme

1. Read `themes/corp/theme.css`. It is the canonical template; every section
   is annotated with what variants are allowed to change.

2. Create `themes/<your-theme>/theme.css`. Override only the roles relevant to
   your context. Roles you do not override inherit the semantic default.

3. Assign roles to core token references only:

   ```css
   /* correct */
   --accent: var(--color-fandango);

   /* wrong -- raw value */
   --accent: #823AA4;
   ```

4. Verify locally before opening a PR:

   ```sh
   # No raw colour literals -- must return empty
   grep -Pn '(#[0-9a-fA-F]{3,8}|rgb\(|rgba\(|hsl\(|hsla\(|oklch\()' \
     themes/<your-theme>/theme.css

   # Every var() reference resolves to a token in tokens/
   node scripts/brand-contract-check.mjs themes/<your-theme>/theme.css
   ```

5. Open a PR. Marketing is added automatically by CODEOWNERS.

6. Once merged, register the theme in this README table.

---

## Light mode and dark mode

Themes do not have separate files for light/dark. Instead, follow the same
pattern as `tokens/semantic.css`: define your dark (default) roles at `:root`,
then add a `[data-theme="light"]` block that overrides only the roles that
need to change. Corp light-mode overrides live in `tokens/semantic.css` and
remain the reference implementation.
