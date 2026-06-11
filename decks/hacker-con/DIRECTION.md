# Hacker-con deck variant: creative direction

Status: DIRECTION ONLY. This is a creative-direction note, not a design. No
stylesheet exists in this directory and none should be added in Phase 5. Nothing
here can pass or fail CI because there is nothing to render yet (spec section
4.1 marks this variant "to iterate"). When it is designed, it becomes a normal
deck variant governed exactly like the others.

## Intent

The hacker-con variant is for security and hacker conference talks (the rooms
where the audience would get the reference). It leans hard into the company's
namesake: the 1995 film *Hackers*, where "Crash Override" is the handle. The
aesthetic is neon-on-black, CRT-era: phosphor glow, scanlines, terminal type, a
bit of deliberate analog-screen grain. It is the most expressive end of the
brand, not the everyday corporate look.

## Seeds already in the repo

- `assets/illustrations/crt-tv.svg` and `assets/illustrations/crt-tv-dark.svg`
  are the visual seed: a CRT television, on-brand, already in the asset set.
- Atomic lime (`#B3FF00`) reads as phosphor green on Black (`#161616`) and is the
  natural primary glow color. Jazzberry and Fandango are the natural secondary
  neons for a multi-color CRT look.
- JetBrains Mono / Geist Mono carry the terminal feel without leaving the brand
  type system.

## Hard governance constraints (apply when it is designed)

This variant gets no exemption from the brand contract or accessibility. When a
`theme.css` (or equivalent) is authored here, it must:

1. **Select among approved core values only.** Like every variant, it remaps
   semantic roles to existing core tokens via `var(--...)`. Neon glow, scanline,
   and CRT effects are built from the existing palette and from structural CSS
   (gradients, masks, filters) in the slide masters, not from new brand colors.
   A novel hex fails `check-brand-contract.mjs` (spec section 9).
2. **Pass WCAG 2.2 AA.** A high-energy neon treatment is exactly where contrast
   slips. The contrast assertions (`check-contrast.mjs`) apply to this variant's
   role pairs like any other; a hacker-con remap that fails AA fails CI like a
   rogue hex would (spec section 4.5). Glow and grain are decorative layers
   behind AA-passing text, never the text contrast itself.
3. **Keep effects decorative and reduced-motion-aware.** Scanline and flicker
   motion must honor `prefers-reduced-motion`. CRT background textures are
   decorative (`alt=""`, `aria-hidden="true"` for SVG) per
   `claude-plugin/skills/co-design/references/accessibility.md`.

## How it will plug in (when built)

It will follow the same shape as `decks/sales/` and `decks/conference/`: a
contract-clean role-remap stylesheet that the shared slide masters in
`decks/shared/` consume. The shared masters already drive everything through
semantic roles, so most of the hacker-con character will live in the remap plus
optional decorative layers in the masters, not in a parallel set of slides.
