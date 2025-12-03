export const theme = {
  colors: {
    text: "#0e1b27",
    surface: "#fdfcfb",
    panel: "#ffffff",
    border: "#dfe7f1",
    accent: "#2ec5b6",
    accentAlt: "#f08db6",
    canvas: "#0a1020",
    canvasSurface: "#0c1528",
    canvasText: "#e8f5ff",
    muted: "#4b5563",
    success: "#2fbf71",
  },
  gradients: {
    brand: "linear-gradient(125deg, #2ec5b6, #7be3ff, #f08db6)",
    hero: "linear-gradient(160deg, #f7fbff 0%, #eef6ff 40%, #f8f2ff 100%)",
    backdrop: "radial-gradient(circle at 20% 20%, rgba(46, 197, 182, 0.12), transparent 32%), radial-gradient(circle at 80% 10%, rgba(240, 141, 182, 0.16), transparent 30%), linear-gradient(180deg, #fdfcfb 0%, #f3f7fb 45%, #eef2ff 100%)",
    mvGradientSunrise: "linear-gradient(135deg, #ffb16f, #ffd98e)",
    mvGradientOcean: "linear-gradient(145deg, #1fb4c6, #7ae2ff)",
    mvGradientAurora: "linear-gradient(140deg, #f28abf, #b9b3ff)",
  },
  shadows: {
    card: "0 18px 48px rgba(5, 30, 73, 0.12)",
    soft: "0 12px 28px rgba(5, 30, 73, 0.08)",
  },
};

export type Theme = typeof theme;
