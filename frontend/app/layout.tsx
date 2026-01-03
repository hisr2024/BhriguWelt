import type { Metadata, Viewport } from 'next'
import './globals.css'
import { PWAInstaller } from './components/PWAInstaller'

export const metadata: Metadata = {
  title: 'BhriguWelt - Discover Your Soul\'s Journey',
  description: 'Ancient Vedic wisdom meets modern AI. Explore past lives, present purpose, and future possibilities through comprehensive astrology.',
  keywords: 'astrology, vedic astrology, karmic journey, past lives, future prediction, spiritual guidance',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'BhriguWelt',
  },
  icons: {
    icon: [
      { url: '/icons/icon-192x192.svg', sizes: '192x192', type: 'image/svg+xml' },
      { url: '/icons/icon-512x512.svg', sizes: '512x512', type: 'image/svg+xml' },
    ],
    apple: [
      { url: '/icons/icon-152x152.svg', sizes: '152x152', type: 'image/svg+xml' },
      { url: '/icons/icon-192x192.svg', sizes: '192x192', type: 'image/svg+xml' },
    ],
  },
}

export const viewport: Viewport = {
  themeColor: '#00d9ff',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/icons/icon-192x192.svg" />
        <link rel="apple-touch-icon" href="/icons/icon-192x192.svg" />
      </head>
      <body className="font-sans">
        {children}
        <PWAInstaller />
      </body>
    </html>
  )
}
