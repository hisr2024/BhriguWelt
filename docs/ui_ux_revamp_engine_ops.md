# UI/UX Revamp Engine — Bhrigu System Ops Mode

## 1. Information Architecture (IA)
- Global shells: Home/Engine Selector, Dashboard, Settings, Saved Reports Library, Print/Export Tools.
- Engines: Horoscope, Matchmaking, Life Timeline, Career, Annual Report, Relocation.
- Shared modules: Single Person Input, Dual Input, Section Card Stack, Data TOC Sidebar, Notifications.
- Data stores: User Profile, Preferences (theme/language/layout), Saved Inputs, Saved Reports, Export Jobs.
- Utility layers: Geo lookup, Timezone resolver, PDF/export service, Auth/profile service.

## 2. Navigation System
- Primary top app bar: Logo, Engine switcher (dropdown), Saved, Settings, Profile avatar, Global search.
- Secondary rail (desktop) / bottom tab bar (mobile): Home, Dashboard, Engines, Library, Chat/Assistant.
- In-engine TOC sidebar (collapsible): anchors to section cards, status dots (completed/locked), print/export shortcut.
- Breadcrumbs for deep states: Home > Engine > Output Section.
- Keyboard shortcuts: `/` search, `g+h` Home, `g+d` Dashboard, `g+s` Saved, `g+p` Print/Export.

## 3. Page Templates / Screens
- Home / Engine Selector: grid of engine cards with key CTA, recent activity list.
- Birth Data Input Module: single-column form card, stepper header, validation summary bar.
- Result Renderer: Section Card Stack with TOC sidebar, lazy-loaded sections, copy/export controls.
- Matchmaking Dual-Input Module: two-column inputs, sync/swap controls, compatibility summary ribbon.
- Dashboard Panel: KPI cards, quick links, recent reports, saved profiles, notifications.
- Annual Report Selector: year picker, scope chips, preview of included sections, generate CTA.
- Timeline Viewer: interactive timeline with zoom, filter chips, event detail drawer.
- Career Engine Workspace: focus area selector, skills/cycles cards, recommendation queue.
- Relocation Comparison Interface: location compare table, map mini-view, pros/cons cards.
- Saved Reports Library: list/grid toggle, tags, filters (engine, date, status), bulk actions.
- Print / Export Tools: format picker (PDF/CSV), include/exclude sections, watermark toggle.
- Settings: theme selector, language toggle, data reset, notification prefs, timezone defaults.

## 4. Component Inventory
- Form controls: text input, DOB picker, TOB picker, timezone auto-fill, POB autocomplete, checkbox set for focus areas, approximate time flag, validation helper.
- Dual input controls: person A/B containers, sync, swap, copy from profile.
- Layout: responsive grid (12/8/1 columns), TOC sidebar, section cards, stacked headers, modal drawers.
- Data display: KPI card, list item, timeline lane, comparison table, map preview tile, chart placeholder, badges (status/accent), stepper.
- Actions: primary/secondary buttons, icon buttons (copy, export, collapse, refresh), segmented controls, toggle chips, filters.
- Feedback: inline validation, toast/alert banner, skeleton loaders, empty states, loading shimmer, progress bar for generation.

## 5. Data Input Modules
- Single Person Input: fields Name, DOB picker, TOB picker, POB autocomplete (geo API), timezone auto-detect display, focus areas checkbox set, approximate birth time toggle, validation summary.
- Dual Input: two single-person stacks; sync timezone; swap inputs; link to saved profiles; shared validation summary; generate compatibility CTA.
- Validation rules: required fields, format checks, timezone resolution with fallback selector, missing fields blocking generate, approximate flag alters confidence badge in results.

## 6. Interaction Workflow
- Core flow: Select engine → enter inputs (stepper with inline validation) → review summary bar → generate results (progress) → view Section Card Stack with TOC → optional export/save.
- Matchmaking flow: load dual input → sync/swap if needed → validate both → generate compatibility → review section cards → export/share.
- Timeline flow: select profile + timeframe → generate timeline lanes → zoom/pan → open event drawer → export snapshot.
- Career flow: pick focus areas → input profile → generate recommendations queue → accept/save to library.
- Relocation flow: input base profile + comparison locations → compute scores → view comparison table/cards → pick preferred and export.
- Annual report flow: choose year scope → confirm inputs → generate sections → schedule export if long-running.
- Settings: adjust theme/language/timezone defaults → apply globally without reload.

## 7. State Model
- Form state: draft inputs, validation flags per field, timezone resolution status, approximate flag, sync/swap status for dual inputs.
- Generation state: idle → validating → generating → ready → error → retry; progress value + cancel token.
- Section state: collapsed/expanded, loaded/unloaded (lazy), copied/exported flags, anchor active.
- TOC state: active anchor, completed/attention badges, filter for section types.
- Library state: filters (engine/tag/date), selection set for bulk actions, sort mode.
- User prefs: theme (light/dark/contrast), language, font scale, audio toggle.
- Network/error state: online/offline, API error codes, retry backoff status.

## 8. Error / Edge Handling
- Input errors: inline helper under field; disable Generate until resolved; validation summary banner with scroll-to-field.
- Geo/timezone failure: show manual timezone selector + POB manual entry; mark confidence low.
- Approximate time: display confidence badge on results; allow quick adjust for ±30 mins recalculation.
- Generation timeout: show retry with persisted inputs; option to queue export.
- Offline: cache recent inputs; disable generate/export; show offline banner; allow local save draft.
- Export failure: retry with status indicator; download audit log link.

## 9. Tool Integration Points
- Geo API: hooked to POB autocomplete with debounce; returns lat/long + timezone suggestion.
- Timezone resolver: auto-populates TOB zone; manual override stored in form state.
- Export/PDF service: called from Section Card Stack and Print/Export Tools with payload {engine, sections[], format, watermark}.
- Auth/profile: fetch saved profiles, preferences; used in autofill dropdowns.
- Analytics/telemetry: events for form completion, section expand/collapse, exports, errors; tied to consent setting.
- Notification service: export ready, scheduled annual report completion, retry prompts.

## 10. Minimalistic Visual Framework
- Grid: 12-col desktop (24px gutters), 8-col tablet (20px), 1-col mobile (16px); 4px spacing scale.
- Typography tokens: font sizes xs/sm/md/lg/xl; weights 400/500/600; line-height 1.4–1.6.
- Color tokens: neutral palette (ink, slate, mist) + single accent tone; high-contrast text; focus ring accent.
- Radius: 6px corners on cards/inputs/buttons; single subtle shadow for elevation.
- Iconography: line icons 24px baseline; consistent stroke weight; accent fill for active states only.
- Motion: 200–300 ms ease-in-out for expand/collapse; reduced motion respects system settings.
- Density: whitespace prioritized; no redundant borders; responsive stacking on mobile.

## 11. API-plane ↔ UI-plane Handshake
- Request schema: {person(s), dob, tob, pob {text, lat, lon}, timezone, focusAreas[], engine, options{approxFlag, year, locations[], exportFormat}}.
- Response schema: {sections: [{id, title, anchor, content, confidence, actions}], meta {duration, confidence}, errors[], exportLinks?}.
- UI consumption: hydrate Section Card Stack from sections; TOC anchors derive from section ids; confidence badges reflect approximate flag.
- Error mapping: API error codes → UI helper texts; network errors → offline state; validation errors → field-level hints.

## 12. Interaction Patterns
- Stepper form with inline validation; auto-advance on valid input.
- Collapsible section cards with copy/export icons; anchor jump via TOC.
- Filterable chips for scope (years, focus areas, section types).
- Drag-to-reorder sections in Result Renderer (desktop); long-press reorder (mobile).
- Quick actions row: Save, Export, Share, Print pinned under hero/summary.
- Keyboard/accessibility: tab order logical; Enter to submit; space/enter toggles collapses; aria labels on icons.

## 13. Layout Grids & Hierarchy
- Header (fixed) → Content area split: TOC sidebar (min 240px collapsible) + main stack; mobile collapses TOC to overlay drawer.
- Card hierarchy: Section header (title, badges, actions) → body content → footer (tags/links).
- Dashboard hierarchy: top KPIs row → quick links row → lists/grid → lower charts/cards.
- Timeline: top controls (filters/zoom) → lanes → detail drawer.
- Relocation: comparison table atop; map + cards below; export CTA persistent at bottom.

## 14. Tooling Integration & Repo Alignment
- Componentized architecture: shared form modules, SectionCard, TOC sidebar, ExportModal, Timeline, ComparisonTable, KPI cards.
- Theming via tokens in design system; CSS variables for spacing/typography/color/radius/shadow.
- API clients isolated per service (geo, timezone, export, analytics) with hooks for UI state.
- Support server-side rendering and static export-ready states; print styles included in Section Card Stack.
