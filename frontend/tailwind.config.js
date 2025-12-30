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
        midnight: "#1a1a2e",
        aurora: "#8cf5d6",
        ember: "#f6b867",
        blush: "#f58db8",
        lotus: "#f4a3c2",
        sand: "#e7d7b8",
        sunrise: "#ffc48d",
        dusk: "#7c3aed",
        aether: "#78a8b6",
      },
      boxShadow: {
        glow: "0 0 30px rgba(99, 102, 241, 0.35)",
      },
      fontSize: {
        "fluid-sm": "clamp(0.85rem, 0.8rem + 0.35vw, 1rem)",
        "fluid-base": "clamp(1rem, 0.95rem + 0.5vw, 1.125rem)",
        "fluid-lg": "clamp(1.25rem, 1.1rem + 0.8vw, 1.5rem)",
        "fluid-xl": "clamp(1.6rem, 1.2rem + 1.6vw, 2.4rem)",
        "fluid-2xl": "clamp(2rem, 1.5rem + 2.4vw, 3rem)",
      },
      spacing: {
        "safe-bottom": "env(safe-area-inset-bottom)",
        "safe-top": "env(safe-area-inset-top)",
      },
      backgroundImage: {
        "hero-gradient":
          "radial-gradient(circle at top, rgba(99,102,241,0.25), transparent 45%), radial-gradient(circle at 20% 20%, rgba(236,72,153,0.2), transparent 40%), linear-gradient(135deg, rgba(15,23,42,1) 0%, rgba(2,6,23,1) 100%)",
        "card-gradient": "linear-gradient(135deg, rgba(30,41,59,0.95) 0%, rgba(15,23,42,0.95) 100%)",
        "result-gradient": "linear-gradient(135deg, rgba(14,116,144,0.35) 0%, rgba(59,130,246,0.25) 45%, rgba(217,70,239,0.2) 100%)",
        "cosmic-radial":
          "radial-gradient(circle at 20% 20%, rgba(99,102,241,0.2), transparent 40%), radial-gradient(circle at 80% 10%, rgba(236,72,153,0.25), transparent 45%), radial-gradient(circle at 50% 80%, rgba(14,165,233,0.18), transparent 45%)",
        "cosmic-glow": "radial-gradient(circle, rgba(99,102,241,0.3), transparent 65%)",
      },
    },
  },
};
