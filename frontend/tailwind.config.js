/** @type {import('tailwindcss').Config} */
const plugin = require('tailwindcss/plugin')

const GOLD = {
  50: '#FBF6EA', 100: '#F5EAD0', 200: '#EBCB86', 300: '#E2BC70', 400: '#D4AF5F',
  500: '#B08A40', 600: '#8A6A2E', 700: '#6B5225', 800: '#4A3A1D', 900: '#2E2414', 950: '#1A140B',
}
const NEUTRAL = {
  50: '#F3EDE0', 100: '#EAE3D5', 200: '#D8D0C0', 300: '#BDB3A0', 400: '#A39985',
  500: '#857B6A', 600: '#3A3F55', 700: '#262B3F', 800: '#181C2C', 900: '#0E1120', 950: '#07080F',
}
const SAGE = {
  50: '#F1F6EF', 100: '#E3EDE0', 200: '#C7DBC1', 300: '#A9C5A0', 400: '#8FB38A',
  500: '#6E9668', 600: '#557A50', 700: '#3F5C3B', 800: '#2A3F28', 900: '#1A2819', 950: '#101910',
}
const KUMKUM = {
  50: '#FBEDE9', 100: '#F5D3CA', 200: '#EBAE9E', 300: '#E08A73', 400: '#D06A50',
  500: '#C0563A', 600: '#9E4430', 700: '#7C3526', 800: '#5A271C', 900: '#3B1A13', 950: '#26100B',
}

module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      // "Nadi Gold" design system. Every legacy colour family (purple, cyan,
      // pink, neon "genz", "cosmic"…) is remapped onto this palette, so the
      // whole app wears one look without touching any component logic.
      colors: {
        ink: { DEFAULT: '#07080F', night: '#0B0E1C', surface: '#10131F', card: '#141828', raised: '#1B2033' },
        gold: GOLD,
        ivory: { DEFAULT: '#F3EDE0', 2: '#BDB3A0', muted: '#9A907E' },
        kumkum: KUMKUM,
        sage: SAGE,
        primary: GOLD,
        purple: GOLD, violet: GOLD, indigo: GOLD, fuchsia: GOLD, pink: GOLD,
        cyan: GOLD, sky: GOLD, blue: GOLD, teal: GOLD,
        yellow: GOLD, amber: GOLD, orange: GOLD,
        green: SAGE, emerald: SAGE, lime: SAGE,
        red: KUMKUM, rose: KUMKUM,
        gray: NEUTRAL, slate: NEUTRAL, zinc: NEUTRAL, neutral: NEUTRAL, stone: NEUTRAL,
        cosmic: { cyan: GOLD[300], purple: GOLD[400], lime: SAGE[300], yellow: GOLD[200], pink: GOLD[500] },
        genz: {
          'electric-blue': GOLD[400],
          'hot-pink': GOLD[500],
          'neon-green': SAGE[300],
          'cyber-yellow': GOLD[200],
          'purple-haze': GOLD[300],
          'mint-fresh': '#F3EDE0',
          'sunset-orange': GOLD[500],
          'lavender-dream': GOLD[200],
          'coral-pop': KUMKUM[400],
          'lime-zest': SAGE[300],
        },
        dark: { base: '#07080F', surface: '#10131F', elevated: '#141828', card: '#1B2033' },
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'Inter', 'system-ui', '-apple-system', 'Segoe UI', 'var(--font-devanagari)', 'sans-serif'],
        serif: ['var(--font-cormorant)', 'Cormorant Garamond', 'var(--font-devanagari)', 'Georgia', 'serif'],
        display: ['var(--font-cormorant)', 'Cormorant Garamond', 'var(--font-devanagari)', 'Georgia', 'serif'],
        deva: ['var(--font-devanagari)', 'Noto Serif Devanagari', 'serif'],
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'Consolas', 'monospace'],
      },
      fontSize: {
        'display-xl': ['4.5rem', { lineHeight: '1.1', fontWeight: '800' }],
        'display-lg': ['3.5rem', { lineHeight: '1.1', fontWeight: '800' }],
        'display-md': ['2.5rem', { lineHeight: '1.2', fontWeight: '700' }],
      },
      backgroundImage: {
        'cosmic-gradient': 'linear-gradient(180deg, #EBCB86 0%, #D4AF5F 55%, #B8913F 100%)',
        'starry-night': 'radial-gradient(120% 60% at 50% -10%, #1A1F3A 0%, #0B0E1C 45%, #07080F 100%)',
        'genz-gradient': 'linear-gradient(180deg, #EBCB86 0%, #D4AF5F 55%, #B8913F 100%)',
        'sunset-gradient': 'linear-gradient(180deg, #EBCB86 0%, #D4AF5F 55%, #B8913F 100%)',
        'cyber-gradient': 'linear-gradient(180deg, #EBCB86 0%, #D4AF5F 55%, #B8913F 100%)',
        'neon-glow': 'radial-gradient(circle at center, rgba(212, 175, 95, 0.12) 0%, transparent 70%)',
        'mesh-gradient': 'radial-gradient(120% 60% at 50% -10%, rgba(26, 31, 58, 0.9) 0%, transparent 60%)',
        'gold-leaf': 'linear-gradient(180deg, #EBCB86 0%, #D4AF5F 55%, #B8913F 100%)',
      },
      animation: {
        'bounce-slow': 'bounce 3s infinite',
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'wiggle': 'wiggle 1s ease-in-out infinite',
        'slide-up': 'slideUp 0.5s ease-out',
        'slide-down': 'slideDown 0.5s ease-out',
        'slide-left': 'slideLeft 0.5s ease-out',
        'slide-right': 'slideRight 0.5s ease-out',
        'fade-in': 'fadeIn 0.5s ease-out',
        'scale-in': 'scaleIn 0.3s ease-out',
        'shimmer': 'shimmer 2s infinite',
        'float-slow': 'float 6s ease-in-out infinite',
      },
      keyframes: {
        wiggle: {
          '0%, 100%': { transform: 'rotate(-3deg)' },
          '50%': { transform: 'rotate(3deg)' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideDown: {
          '0%': { transform: 'translateY(-20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideLeft: {
          '0%': { transform: 'translateX(20px)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        slideRight: {
          '0%': { transform: 'translateX(-20px)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.9)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-1000px 0' },
          '100%': { backgroundPosition: '1000px 0' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-30px)' },
        },
      },
      boxShadow: {
        'genz-glow': '0 10px 30px -14px rgba(212, 175, 95, 0.45)',
        'neon-pink': '0 10px 30px -14px rgba(212, 175, 95, 0.45)',
        'neon-cyan': '0 10px 30px -14px rgba(212, 175, 95, 0.45)',
        'neon-green': '0 10px 30px -14px rgba(143, 179, 138, 0.4)',
        'glass': '0 12px 32px -16px rgba(0, 0, 0, 0.7)',
        'glass-lg': '0 24px 60px -24px rgba(0, 0, 0, 0.8)',
        'gold': '0 8px 24px -10px rgba(212, 175, 95, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.35)',
      },
      backdropBlur: {
        xs: '2px',
      },
      borderRadius: {
        '4xl': '2rem',
        '5xl': '2.5rem',
      },
    },
  },
  plugins: [
    plugin(({ addVariant }) => {
      addVariant('portrait', '@media (orientation: portrait)')
      addVariant('landscape', '@media (orientation: landscape)')
    }),
  ],
}
