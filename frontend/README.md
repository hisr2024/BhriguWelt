# BhriguWelt Frontend

Beautiful, cosmic-themed frontend for Vedic astrology platform.

## Features

- 🎨 Stunning cosmic UI with starry backgrounds
- 📱 Fully responsive design
- ⚡ Fast and optimized (Next.js 14)
- 🌊 Smooth animations (Framer Motion)
- 🎯 TypeScript for type safety
- 🎨 Tailwind CSS for styling

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

- `/` - Home page with features overview
- `/get-started` - Birth details form
- `/dashboard` - User dashboard (to be implemented)
- `/karmic-journey` - Karmic journey insights
- `/past-lives` - Past life regression
- `/future-lives` - Future life predictions
- `/present-life` - Current life analysis
- `/life-events` - Important events
- `/karmic-remedies` - Remedies and practices
- `/predictions` - Daily/Weekly/Monthly forecasts

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

### Colors

Edit `tailwind.config.js`:
```js
cosmic: {
  cyan: '#4DEEEA',
  purple: '#8A5CF6',
  lime: '#BEF264',
  yellow: '#FACC15',
  pink: '#EC4899',
}
```

### Fonts

Update in `app/layout.tsx`

### API Client

Modify `lib/api.ts` to add new endpoints

## License

MIT License
