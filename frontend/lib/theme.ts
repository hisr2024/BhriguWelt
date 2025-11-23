export const theme = {
  colors: {
    text: "#1f2a33",
    surface: "#fffdf8",
    panel: "#ffffff",
    border: "#eadfce",
    accent: "#d97757",
    accentAlt: "#e5b769",
    canvas: "#0f1720",
    canvasSurface: "#0b1021",
    canvasText: "#e8edff",
    muted: "#6b7379",
    success: "#155b30",
  },
  gradients: {
    brand: "linear-gradient(135deg, #e5b769, #d97757)",
    hero: "linear-gradient(165deg, #fdfbf6 0%, #f3f1ea 55%, #edf1ed 100%)",
    backdrop: "linear-gradient(180deg, #f7f4ec 0%, #eef2ec 40%, #e7e4db 100%)",
  },
  shadows: {
    card: "0 16px 40px rgba(0, 0, 0, 0.04)",
    soft: "0 10px 28px rgba(0, 0, 0, 0.04)",
  },
};

export type Theme = typeof theme;
