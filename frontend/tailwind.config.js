/** @type {import('tailwindcss').Config} */
const plugin = require('tailwindcss/plugin')

module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    // Mobile-first breakpoints
    screens: {
      'xs': '375px',    // Small phones
      'sm': '640px',    // Large phones / small tablets
      'md': '768px',    // Tablets
      'lg': '1024px',   // Laptops
      'xl': '1280px',   // Desktops
      '2xl': '1536px',  // Large desktops
      // Max-width variants for mobile-first
      'max-xs': { 'max': '374px' },
      'max-sm': { 'max': '639px' },
      'max-md': { 'max': '767px' },
      'max-lg': { 'max': '1023px' },
      // Touch device detection
      'touch': { 'raw': '(hover: none) and (pointer: coarse)' },
      'stylus': { 'raw': '(hover: none) and (pointer: fine)' },
      'mouse': { 'raw': '(hover: hover) and (pointer: fine)' },
      // Safe area detection for notched devices
      'has-notch': { 'raw': '(display-mode: standalone)' },
    },
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
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        serif: ['Crimson Pro', 'Georgia', 'serif'],
        display: ['Space Grotesk', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'SF Mono', 'Courier New', 'monospace'],
      },
      fontSize: {
        // Mobile-optimized typography scale
        'mobile-xs': ['0.6875rem', { lineHeight: '1rem' }],        // 11px
        'mobile-sm': ['0.8125rem', { lineHeight: '1.25rem' }],     // 13px
        'mobile-base': ['0.9375rem', { lineHeight: '1.375rem' }],  // 15px
        'mobile-lg': ['1.0625rem', { lineHeight: '1.5rem' }],      // 17px
        'mobile-xl': ['1.1875rem', { lineHeight: '1.625rem' }],    // 19px
        'mobile-2xl': ['1.375rem', { lineHeight: '1.75rem' }],     // 22px
        'mobile-3xl': ['1.625rem', { lineHeight: '2rem' }],        // 26px
        'mobile-4xl': ['2rem', { lineHeight: '2.25rem' }],         // 32px
        // Display sizes
        'display-xl': ['4.5rem', { lineHeight: '1.1', fontWeight: '800' }],
        'display-lg': ['3.5rem', { lineHeight: '1.1', fontWeight: '800' }],
        'display-md': ['2.5rem', { lineHeight: '1.2', fontWeight: '700' }],
        'display-sm': ['1.875rem', { lineHeight: '1.2', fontWeight: '700' }],
      },
      // Mobile-friendly spacing
      spacing: {
        'safe-top': 'env(safe-area-inset-top)',
        'safe-bottom': 'env(safe-area-inset-bottom)',
        'safe-left': 'env(safe-area-inset-left)',
        'safe-right': 'env(safe-area-inset-right)',
        '4.5': '1.125rem',  // 18px
        '13': '3.25rem',    // 52px
        '15': '3.75rem',    // 60px
        '18': '4.5rem',     // 72px
        '22': '5.5rem',     // 88px - bottom nav height
      },
      // Mobile touch target sizes
      minHeight: {
        'touch': '44px',      // WCAG 2.1 AAA minimum
        'touch-lg': '48px',   // Comfortable touch
        'touch-xl': '56px',   // Large touch targets
        'screen-safe': 'calc(100vh - env(safe-area-inset-top) - env(safe-area-inset-bottom))',
      },
      minWidth: {
        'touch': '44px',
        'touch-lg': '48px',
        'touch-xl': '56px',
      },
      // Mobile-optimized max widths
      maxWidth: {
        'mobile': '100vw',
        'mobile-content': 'calc(100vw - 2rem)',
        'readable': '65ch',
        'card-mobile': '20rem',
      },
      // Mobile heights
      height: {
        'screen-safe': 'calc(100vh - env(safe-area-inset-top) - env(safe-area-inset-bottom))',
        'screen-dvh': '100dvh',
        'screen-svh': '100svh',
        'screen-lvh': '100lvh',
        'mobile-header': '3.5rem',
        'mobile-nav': '4.5rem',
      },
      backgroundImage: {
        'cosmic-gradient': 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        'starry-night': 'linear-gradient(180deg, #0f0c29 0%, #302b63 50%, #24243e 100%)',
        'genz-gradient': 'linear-gradient(135deg, #00D9FF 0%, #B983FF 50%, #FF006E 100%)',
        'sunset-gradient': 'linear-gradient(135deg, #FF6B35 0%, #FFD60A 50%, #FF006E 100%)',
        'cyber-gradient': 'linear-gradient(135deg, #39FF14 0%, #00D9FF 50%, #B983FF 100%)',
        'neon-glow': 'radial-gradient(circle at center, rgba(0, 217, 255, 0.3) 0%, transparent 70%)',
        'mesh-gradient': 'radial-gradient(at 40% 20%, hsla(280, 100%, 70%, 0.5) 0px, transparent 50%), radial-gradient(at 80% 0%, hsla(180, 100%, 70%, 0.4) 0px, transparent 50%), radial-gradient(at 0% 50%, hsla(330, 100%, 70%, 0.5) 0px, transparent 50%)',
        // Mobile-optimized gradients (less complex for performance)
        'mobile-gradient': 'linear-gradient(180deg, #0A0A0F 0%, #1A1A24 100%)',
        'mobile-card': 'linear-gradient(145deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)',
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
        // Mobile-optimized animations (shorter durations)
        'mobile-slide-up': 'slideUp 0.3s ease-out',
        'mobile-slide-down': 'slideDown 0.3s ease-out',
        'mobile-fade': 'fadeIn 0.2s ease-out',
        'mobile-scale': 'scaleIn 0.2s ease-out',
        'sheet-up': 'sheetUp 0.35s cubic-bezier(0.32, 0.72, 0, 1)',
        'sheet-down': 'sheetDown 0.35s cubic-bezier(0.32, 0.72, 0, 1)',
        'drawer-left': 'drawerLeft 0.3s cubic-bezier(0.32, 0.72, 0, 1)',
        'drawer-right': 'drawerRight 0.3s cubic-bezier(0.32, 0.72, 0, 1)',
        'tap-highlight': 'tapHighlight 0.15s ease-out',
        'pull-refresh': 'pullRefresh 0.6s ease-out',
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
        // Mobile sheet animations
        sheetUp: {
          '0%': { transform: 'translateY(100%)' },
          '100%': { transform: 'translateY(0)' },
        },
        sheetDown: {
          '0%': { transform: 'translateY(0)' },
          '100%': { transform: 'translateY(100%)' },
        },
        drawerLeft: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(0)' },
        },
        drawerRight: {
          '0%': { transform: 'translateX(100%)' },
          '100%': { transform: 'translateX(0)' },
        },
        tapHighlight: {
          '0%': { transform: 'scale(1)', opacity: '1' },
          '50%': { transform: 'scale(0.97)', opacity: '0.8' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        pullRefresh: {
          '0%': { transform: 'translateY(-100%) rotate(0deg)' },
          '100%': { transform: 'translateY(0) rotate(360deg)' },
        },
      },
      boxShadow: {
        'genz-glow': '0 0 30px rgba(0, 217, 255, 0.5), 0 0 60px rgba(185, 131, 255, 0.3)',
        'neon-pink': '0 0 20px rgba(255, 0, 110, 0.6)',
        'neon-cyan': '0 0 20px rgba(0, 217, 255, 0.6)',
        'neon-green': '0 0 20px rgba(57, 255, 20, 0.6)',
        'glass': '0 8px 32px 0 rgba(31, 38, 135, 0.37)',
        'glass-lg': '0 20px 60px 0 rgba(31, 38, 135, 0.45)',
        // Mobile-optimized shadows (lighter for performance)
        'mobile-sm': '0 1px 2px rgba(0, 0, 0, 0.2)',
        'mobile-md': '0 2px 8px rgba(0, 0, 0, 0.25)',
        'mobile-lg': '0 4px 16px rgba(0, 0, 0, 0.3)',
        'mobile-sheet': '0 -4px 24px rgba(0, 0, 0, 0.4)',
        'mobile-card': '0 2px 12px rgba(0, 0, 0, 0.15), 0 0 1px rgba(255, 255, 255, 0.1)',
        'mobile-active': 'inset 0 2px 4px rgba(0, 0, 0, 0.2)',
      },
      backdropBlur: {
        xs: '2px',
        '3xl': '64px',
      },
      borderRadius: {
        '4xl': '2rem',
        '5xl': '2.5rem',
        'mobile': '1.25rem',   // 20px - optimized for mobile
        'sheet': '1.5rem',     // 24px - for bottom sheets
      },
      // Touch-friendly transition durations
      transitionDuration: {
        '50': '50ms',
        '250': '250ms',
        '350': '350ms',
        '400': '400ms',
      },
      // Z-index for mobile layers
      zIndex: {
        'header': '40',
        'drawer': '50',
        'modal': '60',
        'sheet': '70',
        'toast': '80',
        'tooltip': '90',
        'max': '9999',
      },
    },
  },
  plugins: [
    // Orientation variants
    plugin(({ addVariant }) => {
      addVariant('portrait', '@media (orientation: portrait)')
      addVariant('landscape', '@media (orientation: landscape)')
    }),
    // Mobile-specific utilities plugin
    plugin(({ addUtilities, addComponents, matchUtilities, theme }) => {
      // Safe area padding utilities
      addUtilities({
        '.safe-top': { paddingTop: 'env(safe-area-inset-top)' },
        '.safe-bottom': { paddingBottom: 'env(safe-area-inset-bottom)' },
        '.safe-left': { paddingLeft: 'env(safe-area-inset-left)' },
        '.safe-right': { paddingRight: 'env(safe-area-inset-right)' },
        '.safe-x': {
          paddingLeft: 'env(safe-area-inset-left)',
          paddingRight: 'env(safe-area-inset-right)',
        },
        '.safe-y': {
          paddingTop: 'env(safe-area-inset-top)',
          paddingBottom: 'env(safe-area-inset-bottom)',
        },
        '.safe-all': {
          paddingTop: 'env(safe-area-inset-top)',
          paddingBottom: 'env(safe-area-inset-bottom)',
          paddingLeft: 'env(safe-area-inset-left)',
          paddingRight: 'env(safe-area-inset-right)',
        },
        // Margin safe area utilities
        '.mt-safe': { marginTop: 'env(safe-area-inset-top)' },
        '.mb-safe': { marginBottom: 'env(safe-area-inset-bottom)' },
        '.ml-safe': { marginLeft: 'env(safe-area-inset-left)' },
        '.mr-safe': { marginRight: 'env(safe-area-inset-right)' },
      })

      // Touch interaction utilities
      addUtilities({
        '.touch-none': { touchAction: 'none' },
        '.touch-pan-x': { touchAction: 'pan-x' },
        '.touch-pan-y': { touchAction: 'pan-y' },
        '.touch-pan-left': { touchAction: 'pan-left' },
        '.touch-pan-right': { touchAction: 'pan-right' },
        '.touch-pan-up': { touchAction: 'pan-up' },
        '.touch-pan-down': { touchAction: 'pan-down' },
        '.touch-pinch-zoom': { touchAction: 'pinch-zoom' },
        '.touch-manipulation': { touchAction: 'manipulation' },
        // iOS touch callout
        '.no-callout': { WebkitTouchCallout: 'none' },
        '.no-tap-highlight': { WebkitTapHighlightColor: 'transparent' },
        // User select for touch
        '.select-touch-none': {
          WebkitUserSelect: 'none',
          userSelect: 'none',
          WebkitTouchCallout: 'none',
        },
      })

      // Scroll utilities for mobile
      addUtilities({
        '.scroll-smooth': { scrollBehavior: 'smooth' },
        '.scroll-snap-x': { scrollSnapType: 'x mandatory' },
        '.scroll-snap-y': { scrollSnapType: 'y mandatory' },
        '.scroll-snap-start': { scrollSnapAlign: 'start' },
        '.scroll-snap-center': { scrollSnapAlign: 'center' },
        '.scroll-snap-end': { scrollSnapAlign: 'end' },
        '.overscroll-none': { overscrollBehavior: 'none' },
        '.overscroll-contain': { overscrollBehavior: 'contain' },
        '.momentum-scroll': { WebkitOverflowScrolling: 'touch' },
        // Hide scrollbar but keep functionality
        '.scrollbar-hide': {
          '-ms-overflow-style': 'none',
          'scrollbar-width': 'none',
          '&::-webkit-scrollbar': {
            display: 'none',
          },
        },
        // Thin scrollbar for mobile
        '.scrollbar-thin': {
          'scrollbar-width': 'thin',
          '&::-webkit-scrollbar': {
            width: '4px',
            height: '4px',
          },
        },
      })

      // Mobile visibility utilities
      addUtilities({
        '.mobile-only': {
          '@media (min-width: 768px)': {
            display: 'none !important',
          },
        },
        '.desktop-only': {
          '@media (max-width: 767px)': {
            display: 'none !important',
          },
        },
        '.tablet-only': {
          '@media (max-width: 639px), (min-width: 1024px)': {
            display: 'none !important',
          },
        },
      })

      // Mobile-optimized text utilities
      addUtilities({
        '.text-balance': { textWrap: 'balance' },
        '.text-pretty': { textWrap: 'pretty' },
        '.hyphenate': { hyphens: 'auto' },
        '.no-hyphenate': { hyphens: 'none' },
        '.line-clamp-mobile': {
          display: '-webkit-box',
          WebkitLineClamp: '3',
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
        },
      })

      // GPU acceleration for mobile animations
      addUtilities({
        '.gpu': {
          transform: 'translateZ(0)',
          backfaceVisibility: 'hidden',
          perspective: '1000px',
        },
        '.gpu-light': {
          willChange: 'transform, opacity',
        },
        '.gpu-heavy': {
          transform: 'translate3d(0, 0, 0)',
          backfaceVisibility: 'hidden',
          perspective: '1000px',
          willChange: 'transform, opacity',
        },
      })

      // Mobile button/touch target components
      addComponents({
        '.btn-touch': {
          minHeight: '44px',
          minWidth: '44px',
          padding: '12px 16px',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          touchAction: 'manipulation',
          WebkitTapHighlightColor: 'transparent',
          cursor: 'pointer',
          userSelect: 'none',
        },
        '.btn-touch-lg': {
          minHeight: '48px',
          minWidth: '48px',
          padding: '14px 20px',
        },
        '.btn-touch-xl': {
          minHeight: '56px',
          minWidth: '56px',
          padding: '16px 24px',
        },
        // Mobile card component
        '.card-mobile': {
          borderRadius: '1.25rem',
          padding: '1rem',
          backgroundColor: 'rgba(255, 255, 255, 0.05)',
          backdropFilter: 'blur(12px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          '@media (min-width: 768px)': {
            borderRadius: '1.5rem',
            padding: '1.5rem',
          },
        },
        // Mobile input component
        '.input-mobile': {
          minHeight: '44px',
          padding: '12px 16px',
          fontSize: '16px',
          borderRadius: '12px',
          backgroundColor: 'rgba(255, 255, 255, 0.05)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          color: 'white',
          touchAction: 'manipulation',
          '&::placeholder': {
            color: 'rgba(255, 255, 255, 0.5)',
          },
          '&:focus': {
            outline: 'none',
            borderColor: '#00D9FF',
            boxShadow: '0 0 0 2px rgba(0, 217, 255, 0.2)',
          },
        },
        // Mobile container
        '.container-mobile': {
          width: '100%',
          paddingLeft: '1rem',
          paddingRight: '1rem',
          '@media (min-width: 640px)': {
            paddingLeft: '1.5rem',
            paddingRight: '1.5rem',
          },
          '@media (min-width: 768px)': {
            maxWidth: '768px',
            marginLeft: 'auto',
            marginRight: 'auto',
          },
          '@media (min-width: 1024px)': {
            maxWidth: '1024px',
          },
          '@media (min-width: 1280px)': {
            maxWidth: '1280px',
          },
        },
      })
    }),
  ],
}
