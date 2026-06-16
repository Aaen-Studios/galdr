# ᚷᚨᛚᛞᚱ — Style Guide

ᚠ ᚢ ᚦ ᚨ ᚱ ᚲ ᚷ ᚹ ᚺ ᚾ ᛁ ᛃ ᛇ ᛈ ᛉ ᛊ ᛏ ᛒ ᛖ ᛗ ᛚ ᛝ ᛟ ᛞ

---

## Philosophy

Minimal. Functional. Ancient meets terminal.
Every element earns its place. Nothing decorative serves only decoration — ornament is embedded in typography, layout, and the texture of the interface itself.

---

## Color Palette

| Token          | Hex       | Usage                          |
|----------------|-----------|--------------------------------|
| `--bg`         | `#000000` | Primary background             |
| `--fg`         | `#ffffff` | Primary text, borders          |
| `--bg-dim`     | `#111111` | Secondary surfaces, cards      |
| `--fg-dim`     | `#888888` | Muted text, placeholders       |
| `--fg-faint`   | `#333333` | Borders, dividers              |
| `--accent`     | `#ffffff` | Interactive elements (buttons) |

No colors. No gradients. No transparency except where functionally necessary (e.g., modal overlays at 80% opacity black).

---

## Typography

- **Primary font:** `"Courier New", "Liberation Mono", "Nimbus Mono PS", "Source Code Pro", monospace`
- **Headings:** Same monospace stack. All-caps. Letter-spacing `0.15em`.
- **Body:** Monospace only. Size `14px`–`16px`. Line-height `1.5`.
- **UI labels (buttons, badges):** All-caps. Letter-spacing `0.1em`.

No variable fonts, no serif, no sans-serif. Monospace is the only voice.

### Rune ornamentation

Section headings may be prefixed or suffixed with Elder Futhark runes. Use runes sparingly — as punctuation, not prose.

Common runes for decoration:

| Rune | Name   | Meaning / Use                   |
|------|--------|----------------------------------|
| ᚠ    | Fehu   | Wealth — start of a section     |
| ᚨ    | Ansuz  | Message — communication blocks  |
| ᚷ    | Gebo   | Gift — inputs, forms            |
| ᚲ    | Kaunan | Torch — highlights, callouts    |
| ᛏ    | Tiwaz  | Justice — actions, buttons      |
| ᛟ    | Oþalan | Heritage — footer, meta         |

---

## Spacing & Layout

- **Base unit:** `4px` (use multiples: `4`, `8`, `12`, `16`, `24`, `32`, `48`, `64`)
- **Content max-width:** `720px` (centered)
- **Border radius:** `0` — no rounded corners anywhere
- **Grid gaps:** `8px` or `16px`
- **Padding (containers):** `24px` or `32px`

---

## Borders & Dividers

- Standard border: `1px solid var(--fg-faint)`
- Horizontal rule: `一条` (one full row of the rune ᛟ repeated to fill width)
- Focus outline: `1px solid var(--fg)`, no offset

No shadows. No box-shadows, no drop-shadows, no filters (except the retro CRT scan-line effect noted below).

---

## Interactive Elements

### Buttons

- `background: var(--fg)`, `color: var(--bg)`
- Hover: invert (`background: var(--bg)`, `color: var(--fg)`, `border: 1px solid var(--fg)`)
- All-caps label, monospace
- No icon inside button (runes may appear adjacent)

### Inputs

- `background: transparent`, `border: 1px solid var(--fg-faint)`, `color: var(--fg)`
- Focus: `border-color: var(--fg)`
- Placeholder: `var(--fg-dim)`

### Links

- `color: var(--fg)`, `text-decoration: underline`
- No visited color change
- Hover: `text-decoration: none`

---

## Optional Retro Texture

A full-screen `::before` overlay with the following CSS may be applied to the root for a CRT feel:

```css
body::before {
  content: "";
  position: fixed;
  inset: 0;
  background: repeating-linear-gradient(
    0deg,
    transparent,
    transparent 2px,
    rgba(255, 255, 255, 0.015) 2px,
    rgba(255, 255, 255, 0.015) 4px
  );
  pointer-events: none;
  z-index: 9999;
}
```

This is optional and should be toggleable by the user.

---

## Component Patterns

### Terminal-style output blocks

- `background: var(--bg-dim)`, `padding: 16px`, monospace body
- Prefix each line with `> ` or `ᚠ ` for emphasis

### Cards / Panels

- `background: var(--bg-dim)`, `border: 1px solid var(--fg-faint)`, `padding: 24px`
- No border-radius, no shadow

### Badges / Tags

- All-caps monospace, `font-size: 11px`, `letter-spacing: 0.1em`
- `border: 1px solid var(--fg-dim)`, `padding: 2px 8px`

---

## Accessibility

- Maintain minimum contrast ratio of `4.5:1` (white-on-black exceeds this)
- Focus states must always be visible
- Rune decorations must use ARIA labels or `aria-hidden="true"` when purely decorative

---

## Writing Style

- All UI text in U.S. English
- Labels and headings: sentence case (not title case), unless all-caps is specified above
- Error messages: terse, factual. No friendly tone.
- No emoji anywhere in the interface.

---

*ᛗᛁᛚᛚᛁᚾ ᚨᛚᛚᛏ ᛖᚱ ᛏᚨᚲᚾᚨᛞᛟᛉ ᛏᛁᛚ ᛒᛖᛋᛏᚨᛞᚨᚱ*

*(Every pixel is accounted for.)*
