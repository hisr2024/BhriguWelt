# BhriguWelt Design System Generator (Figma Plugin)

This plugin programmatically builds a calm, premium, spiritual-tech design system for **BhriguWelt**. It creates pages, tokens, reusable components, and iPhone-sized core screens ready for handoff to React Native developers.

## What it generates
- Pages named exactly: 🧬 Foundations, 🧱 Components, 📱 Mobile – Core Screens, ✨ Motion & States, 🧠 Flows.
- Color styles, text styles, and spacing tokens based on the mobile-first blueprint.
- Reusable components: primary/secondary/ghost buttons, insight card, breathing indicator, bottom navigation, and bento tile.
- Mobile frames sized 390×844 for Home, Past Lives, Future, Karmic Dashboard, Matchmaking, and Ask Bhrigu (Chat).
- Motion & states references plus flow starting points.

## Prerequisites
- Figma desktop (development plugins require the desktop app).
- Node.js 18+ (for building the TypeScript file).

## Install dependencies
```bash
cd figma-plugin
npm install
```

## Build the plugin
```bash
npm run build
```
This compiles `code.ts` into `dist/code.js` referenced by `manifest.json`.

## Run inside Figma
1. Open **Figma Desktop**.
2. Go to **Plugins → Development → Import plugin from manifest…**.
3. Select `figma-plugin/manifest.json` from this repository.
4. Run **BhriguWelt Design System Generator** from the Plugins menu.
5. The plugin will create the full page + screen hierarchy and set the current page to **📱 Mobile – Core Screens**.

### Notes
- The plugin uses Auto Layout for all generated frames and components, sized for 390×844 iPhone canvases.
- Typography uses Inter and Noto Serif (both available in Figma by default). If your team prefers local fonts, update the font declarations in `code.ts` before building.
- The design language avoids astrology clichés and leans into calm, premium, spiritual-tech cues suitable for production handoff.
