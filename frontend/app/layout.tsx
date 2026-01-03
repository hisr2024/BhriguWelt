import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'BhriguWelt - Discover Your Soul\'s Journey',
  description: 'Ancient Vedic wisdom meets modern AI. Explore past lives, present purpose, and future possibilities through comprehensive astrology.',
  keywords: 'astrology, vedic astrology, karmic journey, past lives, future prediction, spiritual guidance',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="font-sans">
        {children}
      </body>
    </html>
  )
}
