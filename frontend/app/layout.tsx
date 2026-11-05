import type { Metadata, Viewport } from 'next'
import localFont from 'next/font/local'
import './globals.css'
import { SITE_URL } from '@/lib/site'
import { PWAInstaller } from './components/PWAInstaller'
import { Providers } from './providers'
import { AppShell } from '../components/nadi/AppShell'
import { GDPRNoticeLazy } from '../components/GDPRNoticeLazy'

// Self-hosted variable fonts (SIL OFL): no request to Google's servers,
// no render-blocking stylesheet, every weight 100–900 available.
const inter = localFont({
  src: './fonts/inter-latin-var.woff2',
  variable: '--font-inter',
  weight: '100 900',
  display: 'swap',
})
const cormorant = localFont({
  src: [
    { path: './fonts/cormorant-garamond-latin-var.woff2', style: 'normal' },
    { path: './fonts/cormorant-garamond-latin-italic-var.woff2', style: 'italic' },
  ],
  variable: '--font-cormorant',
  weight: '300 700',
  display: 'swap',
})
const notoDevanagari = localFont({
  src: './fonts/noto-serif-devanagari-var.woff2',
  variable: '--font-devanagari',
  weight: '100 900',
  display: 'swap',
  preload: false,
})

const SITE_DESCRIPTION =
  'Vedic astrology readings built on Bhrigu Samhita and Nadi Jyotisha principles: your chart computed with Swiss Ephemeris, dated dasha and transit windows, in plain language or full astrologer detail.'

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'BhriguWelt — Bhrigu Samhita & Nadi astrology readings',
    template: '%s · BhriguWelt',
  },
  description: SITE_DESCRIPTION,
  keywords: ['vedic astrology', 'bhrigu samhita', 'nadi jyotish', 'dasha', 'karmic astrology', 'birth chart'],
  applicationName: 'BhriguWelt',
  alternates: { canonical: '/' },
  openGraph: {
    type: 'website',
    siteName: 'BhriguWelt',
    title: 'BhriguWelt — Bhrigu Samhita & Nadi astrology readings',
    description: SITE_DESCRIPTION,
    url: '/',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary',
    title: 'BhriguWelt — Bhrigu Samhita & Nadi astrology readings',
    description: SITE_DESCRIPTION,
  },
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
  themeColor: '#07080F',
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
    <html lang="en" className={`${inter.variable} ${cormorant.variable} ${notoDevanagari.variable}`}>
      <head>
        <meta name="mobile-web-app-capable" content="yes" />
      </head>
      <body className="font-sans">
        <Providers>
          <AppShell>
            <main id="main-content">{children}</main>
          </AppShell>
          <PWAInstaller />
          <GDPRNoticeLazy />
        </Providers>
      </body>
    </html>
  )
}
