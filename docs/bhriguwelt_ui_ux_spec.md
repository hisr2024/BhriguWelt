# Bhriguwelt UI/UX Specification

Design language and interaction blueprint for a serene, minimalistic, and universally intuitive astrology experience rooted in Bhrigu Samhita. The intent is to keep the interface uncluttered, bilingual, and accessible across Gen-Z, middle-aged adults, and seniors.

## Core Philosophy
- **Minimalism over ornamentation:** every element must justify its presence; prioritize whitespace, legible type, and direct actions.
- **Sacred calm:** subtle Bharat-inspired geometry, pastel gradients, earth tones, cosmic blues, and quiet gold accents.
- **Universal accessibility:** large high-contrast typography, generous tap targets, and senior-friendly readability.
- **Nature-first ambience:** sunrise skies, river/forest motifs, gentle clouds, and always-on but toggleable natural soundscapes.

## Visual Theme
- **Palette:** pastel gradients (sky-blue → blush-peach), earth browns, forest greens, cosmic indigo, and soft gold highlights for active states.
- **Geometry:** thin sacred geometry outlines (yantra-inspired circles/triangles) used sparingly behind cards or headers; avoid busy patterns.
- **Backgrounds:** interchangeable scenes (sunrise horizon, slow river, soft mountains, cloud mist). Low-opacity overlays keep content readable.
- **Lighting:** diffuse glow on focus states; no hard shadows. Use depth via layered cards and subtle blur.
- **Animations:** slow fades and gentle slides only; timing 300–450 ms with easing (ease-in-out). Avoid bounce or aggressive scaling.

## Typography & Accessibility
- **Primary font:** clean, slightly thick sans-serif (e.g., Inter, Noto Sans, or Manrope). Avoid thin weights; prefer 500–600 for headings, 400–500 for body.
- **Scale:** base font 18–20 px; headline 24–28 px; bilingual labels in same size for parity. Support in-app font scaling (90%–140%).
- **Contrast:** minimum WCAG AA; dark ink on light backgrounds or vice versa. Avoid low-opacity text.
- **Bilingual labels:** show English + Hindi for all horoscope components (e.g., `House 1 — Self (स्वयं)` … `House 12 — Loss/Closure (व्यय)`).
- **Tap targets:** minimum 44 px height; spacious form fields and buttons.
- **Accessibility controls:** font-size slider, sound toggle, high-contrast switch, and voice input option on chat/input screens.

## Component Library
- **Cards:** soft-rounded corners, 2–4 px radius, thin border with low-opacity gold or slate. Matte surfaces with light gradient wash.
- **Buttons:** pill or rounded rectangles; primary with soft gold fill and dark text; secondary outlined with subtle indigo stroke.
- **Inputs:** underlined or card fields with gentle icons; clear labels + helper text. Date/time pickers use large numerals.
- **Chips/filters:** low-profile, ghost backgrounds; highlight with gold outline on selection.
- **Icons:** line-based, slightly thick strokes. Planet icons remain clear at 24–32 px. Use nature-inspired accent icons for guidance themes.
- **Dividers:** thin, high-opacity lines with ample padding. Consider sacred geometry dots for section separators.

## Core Input Screen
- **Fields:** Full Name, Date of Birth, Time of Birth, Time Zone, Place of Birth (optional auto-suggest).
- **Layout:** single vertical flow inside a soft card; wide padding and large labels. Gentle inline icons (calendar, clock, globe, pin).
- **Flow:** step-by-step with progress dots; each field reveals after the prior is confirmed for clarity.
- **Assistance:** tooltips for timezone and place lookup; map modal optional but keep minimal. Voice entry and keypad-friendly inputs.

## Holistic Horoscope Dashboard
- **Chart:** minimal 12-house chart with bilingual labels; high-contrast planet icons. Hover/tap highlights a house with soft glow.
- **States:** selection animates with a slow fade + gold outline; planet transitions slide gracefully between houses.
- **Layout:** chart on left/top, interpretive cards on right/bottom. Plenty of whitespace; no dense grids.
- **Filters:** category chips (Overview, Houses, Planets, Remedies) with gentle underline animation.
- **Legend:** small, fixed legend for planets and aspects; uses concise labels.

## Past Lives (Symbolic)
- **Tone:** reflective, mythic narratives with soft ancient-scroll textures behind cards and subtle golden geometry overlays.
- **Presentation:** story mode carousel; each card shows 2–3 lines of symbolic text and a minimal illustration silhouette.
- **Transitions:** slow cross-fades between cards; background ambience slightly warmer. Include clear disclaimer: “Symbolic guidance, not literal history.”

## Future Directives (Symbolic Guidance)
- **Cards:** modern stacked cards with icon + theme title (e.g., Growth, Emotional Balance, Dharma, Clarity).
- **Color coding:** gentle hues per theme (growth=green, balance=teal, dharma=gold, clarity=indigo). Avoid saturated tones.
- **Content:** concise bullets focusing on evolution, not prediction. Optional “Deepen” link for longer text.

## Karmic Journey Flow / Charts
- **Structure:** vertical or circular flow with three nodes — Past (कर्म-स्मृति), Present (मार्ग), Future Direction (ऊर्जा-प्रवाह).
- **Visuals:** soft connecting lines with gradient glow; nodes are tappable chips revealing 1–2 line insights.
- **Animation:** meditative pulsing on the active node; transitions emit a gentle chime or water-drop sound.
- **Context:** subtle background geometry and light aurora gradient; no heavy imagery.

## Bhrigu Samhita Wisdom Mode
- **Experience:** scrollable stream of short symbolic insights over calm cosmic visuals.
- **Typography:** clean sans-serif, generous line spacing; cards with quiet indigo gradients and thin gold accents.
- **Interaction:** frictionless vertical scroll; optional “Save” or “Share” icon kept discreet.

## Bhrigu Chat Guide (AI Assistant)
- **Layout:** minimal chat bubbles with soft shadow and nature-inspired backdrop. Messages have high contrast and ample padding.
- **Input bar:** floating pill with mic icon for optional voice input. Typing indicator uses gentle dot pulse.
- **Readability:** large text, no cramped bubbles; timestamps muted. Quick-reply chips at the bottom for ease.

## Audio Environment
- **Default:** always-on serene nature loop (wind, water, leaves, light chimes) at low volume; prominent toggle in header or player bar.
- **Feedback:** micro-sounds for navigation (soft chime) and flow advancement (water drop). Never play harsh or loud cues.
- **Accessibility:** full mute, volume slider, and captions/transcripts for any narrated content.

## Icon System
- **Style:** thick-stroke line icons; filled variants only for emphasis. Use consistent corner radii.
- **Planets:** clear glyphs for Sun, Moon, Mars, Mercury, Jupiter, Venus, Saturn, Rahu, Ketu at 24–32 px with strong contrast.
- **Themes:** nature metaphors for guidance (leaf for growth, wave for flow, lamp for clarity, mountain for resilience).

## Nature-Inspired Backgrounds
- **Library:** sunrise gradient sky, flowing river shimmer, soft forest canopy, mountain silhouettes, cloud mist.
- **Usage:** pair with translucent overlay (5–15%) to preserve legibility; rotate scenes across sections to avoid monotony.

## Interaction Flow Summary
1. **Splash Screen:** serene animation of soft geometry + sunrise gradient; “Enter Birth Details” CTA after 2–3 seconds.
2. **Core Input:** stepwise form with progress markers; completes with “Generate Chart.”
3. **Dashboard:** 12-house chart + overview cards; users can tap houses/planets, adjust font size, toggle sound.
4. **Past Lives / Future Directives / Karmic Flow:** accessible via tabs; each preserves minimal layouts and calm animations.
5. **Wisdom Mode:** continuous scroll of Bhrigu insights.
6. **Chat Guide:** available as floating action; opens drawer or full screen with context-aware suggestions.
7. **Settings:** quick access to accessibility controls, language, and sound.

## Bilingual House Labels
- House 1 — Self (स्वयं)
- House 2 — Wealth (धन)
- House 3 — Courage (पराक्रम)
- House 4 — Home/Roots (मूल)
- House 5 — Creativity (सृजन)
- House 6 — Service/Health (सेवा/स्वास्थ्य)
- House 7 — Partnerships (साझेदारी)
- House 8 — Transformation (परिवर्तन)
- House 9 — Purpose (धर्म)
- House 10 — Career (कर्म)
- House 11 — Gains (लाभ)
- House 12 — Loss/Closure (व्यय)

## Accessible States & Feedback
- **Focus/hover:** soft glow ring and subtle scale (max 1.02x); maintain contrast for WCAG AA.
- **Errors:** gentle outline + microcopy beneath field; avoid red walls of text. Provide suggested fixes (e.g., timezone autodetect).
- **Success:** quiet checkmark animation; minimal confetti or heavy effects.
- **Loading:** radial breathing dots or linear shimmer; keep wait messaging soothing.

## Splash & Microanimations
- **Splash:** unfolding sacred geometry line drawing over sunrise gradient; fades into home in <3 seconds.
- **House highlights:** gold outline grows softly; planet icons glide to the selected house.
- **Story mode:** cards fade/slide with 400 ms cadence; background hue shifts subtly per story.
- **Karmic flow:** nodes pulse with a slow ripple; connecting lines shimmer lightly on progression.

## Deliverables Checklist
- Full UI layouts for input, dashboard, past lives, future directives, karmic flow, wisdom mode, and chat.
- Component library covering cards, buttons, inputs, chips, icons, backgrounds, and accessibility controls.
- Interaction flow from splash to settings, with sound design guidelines.
- Bilingual labels and font scaling baked into every view.
- Consistent minimalistic, calm, and Bhrigu-authentic visual language.
