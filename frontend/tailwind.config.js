/** @type {import('tailwindcss').Config} */
/* eslint-disable no-undef */
/* eslint-env node */

module.exports = {
  darkMode: "class",
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  plugins: [require("tailwindcss"), require("autoprefixer")],
  theme: {
    extend: {
      colors: {
        aurora: "#9ef0ff",
        cosmic: {
          900: "#060816",
          800: "#0b1024",
          700: "#101738",
        },
        neon: {
          cyan: "#4deeea",
          pink: "#ff5bd3",
          purple: "#8b5cf6",
          lime: "#b2ff59",
        },
        glass: "rgba(255, 255, 255, 0.08)",
      },
      boxShadow: {
        cosmic: "0 30px 80px -40px rgba(56, 189, 248, 0.55)",
        neon: "0 0 30px rgba(77, 238, 234, 0.4)",
        pulse: "0 0 45px rgba(139, 92, 246, 0.35)",
      },
      animation: {
        float: "float 6s ease-in-out infinite",
        orbit: "orbit 14s linear infinite",
        pulseGlow: "pulseGlow 4s ease-in-out infinite",
        shimmer: "shimmer 2.5s ease-in-out infinite",
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-10px)" },
        },
        orbit: {
          "0%": { transform: "rotate(0deg)" },
          "100%": { transform: "rotate(360deg)" },
        },
        pulseGlow: {
          "0%, 100%": { opacity: 0.6, transform: "scale(1)" },
          "50%": { opacity: 1, transform: "scale(1.05)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "0% 50%" },
          "100%": { backgroundPosition: "100% 50%" },
        },
      },
      backgroundImage: {
        "neon-radial":
          "radial-gradient(circle at top, rgba(77, 238, 234, 0.28), transparent 55%), radial-gradient(circle at 30% 30%, rgba(139, 92, 246, 0.25), transparent 40%), radial-gradient(circle at 80% 20%, rgba(255, 91, 211, 0.25), transparent 45%)",
        "glass-sheen": "linear-gradient(130deg, rgba(255, 255, 255, 0.2), rgba(255, 255, 255, 0))",
      },
    },
  },
};
