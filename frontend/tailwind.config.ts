import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        midnight: "#1a1a2e",
        aurora: "#8cf5d6",
        ember: "#f6b867",
        blush: "#f58db8",
      },
      boxShadow: {
        glow: "0 0 30px rgba(99, 102, 241, 0.35)",
      },
      backgroundImage: {
        "hero-gradient": "radial-gradient(circle at top, rgba(99,102,241,0.25), transparent 45%), radial-gradient(circle at 20% 20%, rgba(236,72,153,0.2), transparent 40%), linear-gradient(135deg, rgba(15,23,42,1) 0%, rgba(2,6,23,1) 100%)",
        "card-gradient": "linear-gradient(135deg, rgba(30,41,59,0.95) 0%, rgba(15,23,42,0.95) 100%)",
        "result-gradient": "linear-gradient(135deg, rgba(14,116,144,0.35) 0%, rgba(59,130,246,0.25) 45%, rgba(217,70,239,0.2) 100%)",
      },
    },
  },
  plugins: [],
};

export default config;
