/** @type {import('tailwindcss').Config} */
/* eslint-disable no-undef */
/* eslint-env node */

module.exports = {
  darkMode: "class",
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./lib/**/*.{js,ts,jsx,tsx}",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: {
          950: "#05070f",
          900: "#0b1020",
          850: "#11182b",
          800: "#151d33",
          700: "#1b2742",
        },
        aurora: {
          400: "#64ffda",
          500: "#22d3ee",
          600: "#38bdf8",
        },
        neon: {
          cyan: "#22d3ee",
          pink: "#f472b6",
          violet: "#a855f7",
          lime: "#4ade80",
          amber: "#facc15",
        },
        stardust: "#e2e8f0",
        carbon: "#0b0f1a",
      },
      fontFamily: {
        sans: ["var(--font-body)", "Inter", "system-ui", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "sans-serif"],
        display: ["var(--font-display)", "Poppins", "system-ui", "sans-serif"],
      },
      boxShadow: {
        neon: "0 0 18px rgba(34, 211, 238, 0.25), 0 0 60px rgba(168, 85, 247, 0.25)",
        glass: "0 35px 90px rgba(3, 7, 18, 0.55)",
        elevated: "0 20px 50px rgba(2, 6, 23, 0.45)",
      },
      backgroundImage: {
        "cosmic-hero":
          "radial-gradient(circle at 15% 20%, rgba(34, 211, 238, 0.22), transparent 45%), radial-gradient(circle at 85% 15%, rgba(244, 114, 182, 0.2), transparent 40%), radial-gradient(circle at 50% 80%, rgba(168, 85, 247, 0.22), transparent 45%), linear-gradient(135deg, rgba(5,7,15,1) 0%, rgba(10,16,32,1) 100%)",
        "cosmic-grid":
          "linear-gradient(to right, rgba(148,163,184,0.08) 1px, transparent 1px), linear-gradient(to bottom, rgba(148,163,184,0.08) 1px, transparent 1px)",
        "glass-sheen":
          "linear-gradient(120deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.02) 45%, rgba(255,255,255,0.08) 100%)",
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-12px)" },
        },
        pulseGlow: {
          "0%, 100%": { opacity: "0.55", transform: "scale(1)" },
          "50%": { opacity: "1", transform: "scale(1.05)" },
        },
        spinSlow: {
          from: { transform: "rotate(0deg)" },
          to: { transform: "rotate(360deg)" },
        },
        shimmer: {
          "0%, 100%": { transform: "translateX(-10%)" },
          "50%": { transform: "translateX(10%)" },
        },
        drift: {
          "0%": { transform: "translate3d(0, 0, 0)" },
          "50%": { transform: "translate3d(0, -14px, 0)" },
          "100%": { transform: "translate3d(0, 0, 0)" },
        },
      },
      animation: {
        float: "float 8s ease-in-out infinite",
        "pulse-glow": "pulseGlow 4.5s ease-in-out infinite",
        "spin-slow": "spinSlow 20s linear infinite",
        shimmer: "shimmer 6s ease-in-out infinite",
        drift: "drift 10s ease-in-out infinite",
      },
    },
  },
};
