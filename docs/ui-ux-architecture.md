# Universal UI/UX Architecture

## 1. IA
- Root
  - Home
  - Engines
    - Horoscope
    - Timeline
    - Career
    - Dashboard
    - Matchmaking
    - Annual Report
    - Relocation
  - Reports
  - Settings

## 2. Navigation
- Fixed Top Bar: Logo (Home), Engine Switcher dropdown, Reports, Settings
- No sidebar or hamburger; always visible navigation

## 3. Screen Templates
1. Home / Engine Picker
2. Single-Person Input Screen
3. Dual-Person Input Screen
4. Engine Processing Screen
5. Results Viewer
6. Comparison Viewer
7. Dashboard Panel
8. Reports Library
9. Settings Screen

## 4. Input System
- Reusable Module: Name, Date of Birth (calendar), Time of Birth (time picker), Place of Birth (geo autocomplete), Birth Time Accuracy (Exact/Approximate/Unknown)
- Prefill from saved profiles; no duplicate data entry; identical component everywhere

## 5. Engine Flows
- Standard: Home → Select Engine → Input Screen → Validate → Generate → Results Viewer → Save/Export
- Matchmaking: Home → Matchmaking → Input A → Input B → Validate Both → Generate → Results Viewer

## 6. Results Viewer Spec
- Vertical section stack with Title and Expand/Collapse per section
- Sticky Table of Contents on desktop; scroll navigation; no pagination or infinite scroll
- Controls: Save, Export PDF, Copy Section, Jump to Section

## 7. Matchmaking Spec
- Dual layout: Left Person A, Right Person B, Center Compatibility Summary
- Tabs: Guna Milan, Emotional, Practical Life, Risks, Guidance
- Text-first; no charts or graphs

## 8. Dashboard Spec
- Grid: 2 columns desktop, 1 column mobile
- Panels: Karma Hotspots, Strengths, Current Themes, Action Items
- Each panel: Label, Status, Action button

## 9. Reports Spec
- List view: Report Name, Engine Type, Date Generated
- Actions: View, Export, Delete
- No folders or tags

## 10. Settings Spec
- Language, Text Size (Small/Medium/Large), Theme (Light/Dark), Data Reset, Export Defaults

## 11. State Model
- activeEngine, inputData, partnerData, generationStatus, reportOutput, savedReports, uiPreferences

## 12. Error Handling
- Inline validation only; clear error text; Retry always visible; navigation never blocked

## 13. Accessibility Rules
- Minimum font size 16px; contrast AA+; keyboard navigation; screen reader labels; no color-only signals

## 14. Visual Rules
- Typeface system default; flat colors: background, text, one accent
- Animations only for expand/collapse and loading indicator
