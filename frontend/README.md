# Frontend (Experience Layer)

This directory is reserved for the presentation layer that consumes the Bhrigu
Samhita predictions computed by the backend. Use any modern stack—React, Next,
Svelte, Flutter web, etc.—and keep the following goals in mind:

- **Fidelity**: show the manuscript citations provided by the backend alongside
  each prediction block.
- **Localization**: support Indian languages that match the Bhrigu folios used in
  the data corpus.
- **Accessibility**: ensure WCAG-compliant typography for astrological charts and
  remedial prescriptions.

## Suggested layout

```
frontend/
├── public/        # Static assets (fonts, icons, manifest)
└── src/           # Application code (React components, state, routing)
```

Replace the `.gitkeep` placeholders once you scaffold your chosen framework.
