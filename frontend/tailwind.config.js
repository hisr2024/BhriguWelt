/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f5f3ff',
          100: '#ede9fe',
          200: '#ddd6fe',
          300: '#c4b5fd',
          400: '#a78bfa',
          500: '#8b5cf6',
          600: '#7c3aed',
          700: '#6d28d9',
          800: '#5b21b6',
          900: '#4c1d95',
        },
        cosmic: {
          cyan: '#4DEEEA',
          purple: '#8A5CF6',
          lime: '#BEF264',
          yellow: '#FACC15',
          pink: '#EC4899',
        },
        // Gen Z vibrant palette
        genz: {
          'electric-blue': '#00D9FF',
          'hot-pink': '#FF006E',
          'neon-green': '#39FF14',
          'cyber-yellow': '#FFD60A',
          'purple-haze': '#B983FF',
          'mint-fresh': '#94F9F0',
          'sunset-orange': '#FF6B35',
          'lavender-dream': '#C297FF',
          'coral-pop': '#FF5D8F',
          'lime-zest': '#CCFF00',
        },
        // Dark mode backgrounds
        dark: {
          base: '#0A0A0F',
          surface: '#121218',
          elevated: '#1A1A24',
          card: '#1F1F2E',
        },
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
        serif: ['var(--font-crimson-pro)', 'serif'],
        display: ['var(--font-space-grotesk)', 'var(--font-inter)', 'sans-serif'],
        mono: ['var(--font-jetbrains-mono)', 'Courier New', 'monospace'],
      },
      fontSize: {
        'display-xl': ['4.5rem', { lineHeight: '1.1', fontWeight: '800' }],
        'display-lg': ['3.5rem', { lineHeight: '1.1', fontWeight: '800' }],
        'display-md': ['2.5rem', { lineHeight: '1.2', fontWeight: '700' }],
      },
      backgroundImage: {
        'cosmic-gradient': 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        'starry-night': 'linear-gradient(180deg, #0f0c29 0%, #302b63 50%, #24243e 100%)',
        'genz-gradient': 'linear-gradient(135deg, #00D9FF 0%, #B983FF 50%, #FF006E 100%)',
        'sunset-gradient': 'linear-gradient(135deg, #FF6B35 0%, #FFD60A 50%, #FF006E 100%)',
        'cyber-gradient': 'linear-gradient(135deg, #39FF14 0%, #00D9FF 50%, #B983FF 100%)',
        'neon-glow': 'radial-gradient(circle at center, rgba(0, 217, 255, 0.3) 0%, transparent 70%)',
        'mesh-gradient': 'radial-gradient(at 40% 20%, hsla(280, 100%, 70%, 0.5) 0px, transparent 50%), radial-gradient(at 80% 0%, hsla(180, 100%, 70%, 0.4) 0px, transparent 50%), radial-gradient(at 0% 50%, hsla(330, 100%, 70%, 0.5) 0px, transparent 50%)',
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
        'genz-glow': '0 0 30px rgba(0, 217, 255, 0.5), 0 0 60px rgba(185, 131, 255, 0.3)',
        'neon-pink': '0 0 20px rgba(255, 0, 110, 0.6)',
        'neon-cyan': '0 0 20px rgba(0, 217, 255, 0.6)',
        'neon-green': '0 0 20px rgba(57, 255, 20, 0.6)',
        'glass': '0 8px 32px 0 rgba(31, 38, 135, 0.37)',
        'glass-lg': '0 20px 60px 0 rgba(31, 38, 135, 0.45)',
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
  plugins: [],
}
