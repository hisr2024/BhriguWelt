# BhriguWelt Frontend

Modern Gen Z-inspired UI/UX with vibrant cosmic themes for Vedic astrology platform.

## Features

- ✨ **Gen Z Modern Design** - Vibrant colors, neon glows, and futuristic aesthetics
- 🎨 **Cosmic-Themed UI** - Animated backgrounds with floating elements
- 📱 **Fully Responsive** - Mobile-first design with bottom navigation
- ⚡ **Blazing Fast** - Next.js 14 with optimized builds
- 🌊 **Smooth Animations** - Framer Motion for fluid interactions
- 🎯 **Type-Safe** - TypeScript throughout
- 💎 **Glass Morphism** - Modern card designs with backdrop blur
- 🔮 **Neon Accents** - Electric blue, hot pink, and neon green highlights

## Quick Start

### Development

1. Install dependencies:
   ```bash
   npm install
   ```

2. Set up environment:
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your backend URL
   ```

3. Run development server:
   ```bash
   npm run dev
   ```

4. Open http://localhost:3000

### Production Build

```bash
npm run build
npm start
```

### Deploy to Vercel

See `DEPLOYMENT_GUIDE.md` in root directory.

## Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `NEXT_PUBLIC_API_URL` | Backend API URL | `https://api.onrender.com` |
| `NEXT_PUBLIC_APP_NAME` | Application name | `BhriguWelt` |

## Pages

- `/` - Home page with Gen Z UI, features showcase, and cosmic animations
- `/get-started` - Multi-step birth details form with smooth transitions
- `/dashboard` - User dashboard with stats and quick access widgets
- `/birth-chart` - Birth chart visualization
- `/daily-insights` - Daily astrological insights
- `/horoscope` - Detailed horoscope readings
- `/matchmaking` - Compatibility analysis
- `/profile` - User profile management

## Tech Stack

- **Framework**: Next.js 14
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Animations**: Framer Motion
- **Icons**: Lucide React
- **HTTP Client**: Axios
- **State**: React hooks

## Project Structure

```
frontend/
├── app/                    # Next.js 14 app directory
│   ├── layout.tsx         # Root layout
│   ├── page.tsx           # Home page
│   ├── globals.css        # Global styles
│   └── get-started/       # Birth details page
├── components/            # Reusable components
├── lib/                   # Utilities
│   └── api.ts            # API client
├── public/               # Static assets
├── package.json
├── tailwind.config.js
├── next.config.js
└── tsconfig.json
```

## Customization

### Gen Z Color Palette

Edit `tailwind.config.js`:
```js
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
}
```

### Component Library

The frontend includes custom Gen Z-styled components:
- `GenZButton` - Vibrant buttons with variants (primary, outline, pill, neon)
- `GenZCard` - Glass-morphism cards with glow effects
- `GenZBadge` - Neon badges with pulse animations
- `AnimatedBackground` - Dynamic cosmic background
- `FloatingElements` - Animated emoji overlays
- `BottomNav` - Mobile navigation bar

### Fonts

Update in `app/layout.tsx`

### API Client

Modify `lib/api.ts` to add new endpoints

## License

MIT License
