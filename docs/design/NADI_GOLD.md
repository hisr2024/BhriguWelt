# Nadi Gold design system

One premium look for BhriguWelt: ink-night sky, champagne gold, ivory text, and motifs from the Nadi palm-leaf manuscripts.

## Rules (three layers)

1. **Engine:** never changed by design work. This covers API calls, chart calculation, encryption, caching and storage keys.
2. **Flows:** never changed by design work. This covers steps, questions, validation, button actions and navigation targets.
3. **Skin:** the only layer a redesign touches. This covers colours, type, spacing, radii, icons, motion and page layout.

## Tokens

| Token | Value | Use |
| --- | --- | --- |
| `--ink` | `#07080F` | Page background |
| `--card` | `#141828` | Cards |
| `--gold` | `#D4AF5F` | The single accent: primary button, active tab, key dates |
| `--gold-hi` | `#EBCB86` | Gold text on dark |
| `--ivory` | `#F3EDE0` | Body text |
| `--text-2` | `#BDB3A0` | Secondary text |
| `--muted` | `#9A907E` | Captions (≥ 4.5:1 on ink) |
| `--kumkum` | `#C0563A` | Rare emphasis and "avoid" lists |
| `--sage` | `#8FB38A` | Success |

Tailwind colour families are remapped onto this palette (`purple`, `cyan`, `pink` and so on become gold; `gray` and `slate` become warm neutrals; `green` becomes sage; `red` becomes kumkum). Legacy classes therefore render on-brand. New code should use `gold-*`, `ivory`, `ink-*` and the `nadi-*` classes.

## Type

- **Cormorant Garamond** (`font-display`, `h1`–`h3`): headings and verses.
- **Inter** (`font-sans`): everything you tap or read in UI.
- **Noto Serif Devanagari** (`font-deva`, `:lang(sa)`): Sanskrit, line-height 2.

All fonts are self-hosted from `app/fonts` (SIL OFL), so no requests go to Google.

## Components

- `nadi-card`: card with a gold hairline border.
- `nadi-leaf`: the palm-leaf card with two string holes, the signature object.
- `nadi-btn`: the gold primary action. Use one per view.
- `nadi-btn-ghost`: the secondary action.
- `nadi-input`: text inputs.
- `nadi-chip`: small labels.
- `nadi-eyebrow`: small uppercase label above a heading.
- `nadi-rule`: gold divider.
- Icons: `components/nadi/icons.tsx` provides engraved line icons in SVG. Never use emoji in the UI.
- Navigation: `components/nadi/AppShell.tsx` provides five tabs (Today, Readings, Chart, Match, Me). It is a bottom bar on phones and a top bar on desktop.

## Accessibility

- Text contrast is at least 4.5:1.
- Tap targets are at least 44px.
- Every control has a visible focus ring.
- Every input has a label.
- Ambient motion stops under `prefers-reduced-motion`.
