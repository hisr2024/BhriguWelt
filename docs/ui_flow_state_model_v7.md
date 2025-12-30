# Revamped UI Operational Spec (v7)

1. IA
- Home: entry hub for engines, matchmaking, dashboard, annual report, relocation.
- Engines: engine selection + context summary.
- Input Screens: user/partner data capture with validation.
- Generation: status + structured report assembly.
- Rendering: visual layouts for sections (compatibility, KPIs, monthly/quarterly, relocation).
- Save/Export: PDF/export controls and saved reports list.
- Settings: theme, language, accessibility toggles.

2. Navigation Map
- Home → Select Engine → Input Screen → Validate → Generate → Render Result → Save/Export.
- Home → Matchmaking → Input A + Input B → Validate Both → Generate → Render Compatibility Sections → Save/Export.
- Home → Dashboard → Input → Generate → Render KPI Panels → Save.
- Home → Annual Report → Select Year/Period → Input → Generate → Render Monthly/Quarterly Sections → Save/Export.
- Home → Relocation → Input → Validate → Generate → Render Relocation Guidance → Save/Export.

3. Screen Templates
- Home: hero CTA tiles for engines, quick access to saved reports, settings button, status ticker for recent generations.
- Engine Selection: card grid with engine name, short description, select button, analytics hook on selection.
- Input Screen: stacked form fields (name, DOB, TOB, POB with geo search, timezone, partner data when applicable), inline validation, helper text, skeleton loader placeholders.
- Validation: summary card showing completeness, disabled submit when required fields missing, error highlights, retry/resolve controls.
- Generation: loading panel with progress indicator, skeleton states, cancel/retry, displays apiRequestState.
- Render Result: sectioned cards (compatibility subsections, KPI panels, monthly/quarterly tables, relocation recommendations), export toolbar, save control.
- Save/Export: modal with file name, format options (PDF, image), local save toggle, confirmation toast.
- Settings: theme toggle, language selector, accessibility options (font scale, high contrast, reduced motion), audio toggle.

4. Component List
- FormField (label, helper, validation states).
- DatePicker/TimePicker (large numerals, re-open on invalid TOB).
- GeoSearchInput (integrates Geo API for POB).
- EngineCard (selectable, analytics hook).
- ProgressIndicator (stepper + percentage for slow generation).
- SkeletonLoader (cards, tables, text blocks).
- ResultCard (compatibility, KPI, monthly/quarterly, relocation guidance).
- ExportBar (PDF/export, share, save).
- SavedReportList (local storage load/save).
- Modal (confirmation, export, error retry).
- Toast (success/error/fallback notices).
- Sidebar/Drawer (navigation, settings, saved reports).

5. Workflows
- Standard Flow: Home → Select Engine → Input Screen → Validate → Generate → Render Result → Save/Export.
- Matchmaking Flow: Home → Matchmaking → Input A + Input B → Validate Both → Generate → Render Compatibility Sections → Save/Export.
- Dashboard Flow: Home → Dashboard → Input → Generate → Render KPI Panels → Save.
- Annual Report Flow: Home → Annual Report → Select Year / Period → Input → Generate → Render Monthly/Quarterly Sections → Save/Export.
- Relocation Flow: Home → Relocation → Input → Validate → Generate → Render Relocation Guidance → Save/Export.

6. State Model
- userInput: object.
- partnerInput: object.
- selectedEngine: id/name.
- validationState: field-level + form-level flags.
- apiRequestState: idle | loading | success | error.
- reportData: structured sections for current engine.
- savedReports: array of saved/exported reports.
- appSettings: theme, language, accessibility.
- uiState: { activeSection, modalOpen, sidebarOpen, exportMode }.

7. Error Handling
- Missing DOB → disable submit, highlight DOB field, show helper text.
- Invalid TOB → reopen time picker with inline message.
- API fail → show retry button, keep inputs intact.
- Empty result sections → display fallback module with guidance copy.
- Slow generation → show skeleton loaders + progress indicator.

8. Tool Integration Points
- LLM Engine Requests: preparePayload() before send, sendToModel() handles transport, receiveStructuredResponse() parses, normalization layer standardizes output for reportData.
- PDF Export: ExportBar triggers export handler; uses reportData + styling tokens.
- LocalStorage Save/Load: SavedReportList persists savedReports; load hydrates reportData + uiState.
- Geo API (POB search): GeoSearchInput calls geo client; updates userInput/partnerInput and validationState.
- Analytics hooks: engine-selected (EngineCard select), report-generated (post normalize), report-saved (on save/export confirmation).

9. Minimal Style Rules
- Layout: single-column mobile; two-column desktop for input/result + sidebar/drawer; container padding 24 px, internal padding 16 px.
- Typography: headers semi-bold, body regular; base size 18–20 px; bilingual labels where applicable.
- Controls: primary solid accent button; secondary outline button.
- Cards: light background, subtle border #e0e0e0; no shadow except modals.
- States: focus glow ring, gold outline for active; disabled keeps readability (≥60% opacity).
- Animations: gentle fades/slides 300–450 ms ease-in-out; honor reduced-motion setting.
