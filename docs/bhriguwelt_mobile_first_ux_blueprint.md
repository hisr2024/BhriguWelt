# BhriguWelt Mobile-First UX Blueprint

A sacred, modern, trust-driven experience for Bhrigu Samhita–based karmic intelligence. The blueprint is optimized for mobile-first usage with thumb-friendly patterns, bottom navigation, card-based layouts, and ritual-like pacing.

## Design North Stars
- Calm, premium, non-dogmatic expression; no astrology clichés or fear-based copy.
- Progressive disclosure: show one primary insight first, deepen with gentle expands.
- Thumb reachability: core actions anchored to bottom nav + floating "Ask Bhrigu" CTA.
- Typography-led: generous whitespace, high contrast, clear hierarchy.
- Dark mode as default; light mode available with the same hierarchy and spacing.
- Mobile-first components that scale to tablet/desktop without clutter.

## Design Tokens
- **Colors**
  - `primary`: Indigo #2E2A5A
  - `accent`: Saffron #F2B705
  - `secondary`: Sage #5F7D6E
  - `bg.light`: #F7F7F5
  - `bg.dark`: #0E0F1A
  - `text.primary`: #EDEDED (dark mode) / #1A1A1A (light mode)
  - `surface`: rgba(255,255,255,0.04) dark / rgba(14,15,26,0.06) light
  - `border`: rgba(242,183,5,0.18)
  - `state.positive`: #6BBF8B; `state.caution`: #F2B705 at 80%; `state.neutral`: #7A7A7A
- **Typography**
  - Headings: Inter / SF Pro, weights 600–700
  - Body: Inter / Source Sans 3, weights 400–500
  - Sutra references: Noto Serif / Mukta, weight 500
  - Data & code: JetBrains Mono, weight 500
  - Base size: 17–18 px; Heading L: 24–28 px; Caption: 13–14 px; Line-height 1.4–1.6
- **Spacing**
  - 4, 8, 12, 16, 20, 24, 32 px scale; mobile gutters 16–20 px; card padding 16–20 px.
- **Radius & Depth**
  - Corners 12–16 px on cards, 24 px on pills; shadows replaced by soft glows; subtle 1 px borders.
- **Grid**
  - Mobile single column; Tablet 8-col with 16 px gutters; Desktop 12-col with 24 px gutters.

## Motion System
- Duration 120–200 ms; ease-in-out. Reduced-motion respects OS settings (swap slide for fade).
- **Patterns**: fade + 4–8 px slide + 2–4% scale on card load; breathing dots/mandala for loading; soft pulse on confidence meters.
- **Gestures**: horizontal swipe for cards; vertical scroll for depth; long-press reveals tooltips; pull-to-refresh uses low-amplitude stretch.

## Component Library (mobile-first)
- **Bottom Navigation**: Home, Past, Future, Dashboard, Chat; 56–64 px height; active state uses saffron underline + indigo icon fill.
- **Floating CTA**: "Ask Bhrigu" pill above nav bar; indigo fill, saffron icon; haptic tap; opens chat sheet.
- **Cards**: layered surfaces with soft glow; include title, sublabel, confidence meter, CTA or expand chevron; optional sutra tag.
- **Buttons**: Primary filled (indigo bg, light text), Secondary outline (indigo stroke), Tertiary ghost. Minimum height 48–52 px.
- **Chips & Filters**: ghost background with saffron outline on select; used for themes, consent toggles, and time windows.
- **Confidence Meter**: thin line with pulsing dot; label shows qualitative states (Calmly Certain, Emerging, Exploratory) instead of numbers.
- **Timeline**: horizontal scroll with inertia; nodes use opacity to show certainty; tap to expand modal drawer.
- **Bento Tiles**: 2–3 column grid for Dashboard; tiles have icon, headline, 1–2 bullets, and optional action.
- **Modals/Sheets**: 80% height sheets with rounded top; used for consent flows, expanded stories, and filters.
- **Chat UI**: calm bubbles, wide padding, inline references (chips that open cards), quick prompts row, mic button optional.
- **Disclaimers**: persistent, soft bordered footers within modules; no fear language ("symbolic guidance, not literal")

## Screen-by-Screen UX
### 1) Home
- Greeting with name + day part; Karmic Epoch badge (e.g., "Epoch: Renewal").
- One primary insight card with expand; includes source tag (PL/FU) and confidence meter.
- Quick actions row (Past, Future, Matchmaking, Varshaphal) as large pills with icons; thumb reachable.
- Secondary strip: consent reminder + toggle for predictive depth.
- Background: calm indigo gradient with subtle geometry.

### 2) Past Lives (PL-1…PL-108)
- Swipeable stack of insight cards; each shows sutra reference, narrative preview (2–3 lines), and confidence meter.
- "Expand" opens sheet with full story + remedies; remedies shown as 2–3 actionable rituals with time estimate.
- Persistent disclaimer footer: symbolic guidance only.
- Top filter chips: Themes (Healing, Dharma, Relationships), Depth (Short / Detailed), Language toggle.
- Gesture: swipe to progress; long-press saves to Journal.

### 3) Future (FU-1…FU-84)
- Horizontal timeline with opacity-based certainty; tap node opens focus card with theme, directive, and optional consent.
- Consent UI: before showing dates/windows, sheet asks for confirmation; default view uses thematic guidance without dates.
- Transits & Varshaphal collapsible section; reveals charts/mini-cards with "expand" to see calculations.
- Focus cards show action prompts, micro-remedies, and "Add to calendar" (if consented).

### 4) Karmic Dashboard
- Bento grid tiles for Hotspots, Gifts, Active Themes, Assignments.
- Each tile shows icon, headline, 1–2 bullets, confidence meter or status chip; tap opens deeper card.
- "Assignments" tile uses stepper with checkmarks; allows saving to journal/reminders.
- Persistent filters for timeframe (Now, 30d, 90d) and modality (Guidance, Remedies, Reflection).

### 5) Matchmaking
- Dual-profile header with initials/avatars; status chips for Emotional, Spiritual, Communication harmony.
- Comparison cards show shared life paths, resonance notes, and gentle cautions framed as "Watch-fors" (no failure language).
- Action row: "Joint ritual", "Conversation prompt", "Calendar window" (consent-gated if date-based).
- Toggle to switch partner; add/replace partner CTA as ghost button.

### 6) Ask Bhrigu (AI Chat)
- Full-height chat with calming backdrop; sticky quick prompts ("What is my current theme?", "How to apply PL-12 today?").
- Inline reference chips link to Past/Future cards; tapping shows mini-preview without leaving chat.
- Input bar: pill with mic, send, and attachment for consented voice note.
- Typing indicator: breathing dots; system replies include expandable explanations and source tags.

## Information Architecture
- Bottom nav persistent; floating Ask Bhrigu CTA overlaps nav by 8–12 px for reachability.
- Progressive disclosure: primary insight on each module first; deeper content via expand sheets.
- Consent-first for predictions: date-specific info only after opt-in per session.
- Clear breadcrumbs within sheets (Home > Past > PL-07).

## Accessibility & Trust
- Minimum 44 px touch targets; generous spacing; high-contrast text.
- Support screen readers with semantic labels (e.g., "Confidence: Calmly Certain").
- Reduced motion and high-contrast toggles in settings and quick-access in profile avatar menu.
- Plain-language disclaimers, bilingual options, and respectful tone (no fear, no doom).
- Data privacy message near consent prompts; link to policy.

## Starter React Native Structure (Expo)
```
app/
  _layout.tsx            // Bottom tabs + theme provider + motion settings
  home.tsx               // Greeting, epoch badge, primary insight, quick actions
  past.tsx               // Swipeable PL cards, expand sheets
  future.tsx             // Timeline, consent sheet, transits accordion
  dashboard.tsx          // Bento grid tiles, assignments stepper
  matchmaking.tsx        // Dual profile comparator, harmony chips
  chat.tsx               // Ask Bhrigu chat with inline reference drawer
components/
  Card.tsx, InsightCard.tsx, Timeline.tsx, ConfidenceMeter.tsx,
  BentoTile.tsx, BottomNav.tsx, FloatingCTA.tsx, ConsentSheet.tsx,
  ChatBubble.tsx, QuickPromptChips.tsx
providers/
  themeTokens.ts, motion.ts, accessibility.ts
```

## Microcopy Guidelines
- Use calm, invitational phrasing: "Here is what feels active", "You may explore", "Symbolic guidance only".
- Avoid deterministic language; focus on agency and remedies.
- Keep numbers minimal; prefer qualitative states.

## Ritual-Like Pacing Examples
- Cards rise softly on load; expand sheets slide up with dimmed backdrop.
- Confidence meters pulse slowly; breathing dots for loading states.
- Timeline scroll uses inertia with gentle snap points.
- Success feedback: soft chime + glow; errors: amber outline with clear next step.

## Dark/Light Mode Notes
- Default dark mode with indigo base; light mode uses F7F7F5 background and indigo text.
- Maintain identical spacing and hierarchy; ensure accent colors pass contrast on both themes.
- Sacred geometry only as low-opacity overlays; never compete with text.
