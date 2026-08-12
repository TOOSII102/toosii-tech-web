import './globals.css'
import './refurbishment.css'
import { headers } from 'next/headers'
import AnimatedBackground from '../components/AnimatedBackground'
import NavigationHistory from '../components/NavigationHistory'
import { Analytics } from '@vercel/analytics/next'
import { SpeedInsights } from '@vercel/speed-insights/next'
import PageTracker from '../components/PageTracker'

const SITE_TITLE = 'Toosii Tech — Free Tools, WhatsApp Bot & Movie Streaming'
const SITE_DESCRIPTION = 'A developer platform from Kenya. 11+ free web tools, a WhatsApp bot with 150+ commands, HD movie streaming, video & MP3 downloads, vocal removal, and more — no account, no cost, always free.'
const SITE_KEYWORDS = 'Toosii Tech, free web tools, WhatsApp bot, movie streaming, video downloader, MP3 downloader, vocal remover, temp email, APK download, developer platform, Kenya, African tech'

export async function generateMetadata() {
  const requestHeaders = headers()
  const host = requestHeaders.get('x-forwarded-host') || requestHeaders.get('host') || 'www.toosiitech.org'
  const protocol = requestHeaders.get('x-forwarded-proto') || 'https'
  const siteUrl = `${protocol}://${host}`
  const pathname = requestHeaders.get('x-toosii-path') || '/'
  const pageUrl = `${siteUrl}${pathname === '/' ? '' : pathname}`
  const previewImage = `${siteUrl}/opengraph-image`

  return {
    metadataBase: new URL(siteUrl),
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    keywords: SITE_KEYWORDS,
    alternates: { canonical: pageUrl },
    icons: { icon: '/logo.png', shortcut: '/logo.png', apple: '/logo.png' },
    openGraph: {
      type: 'website',
      locale: 'en_KE',
      url: pageUrl,
      siteName: 'Toosii Tech',
      title: SITE_TITLE,
      description: SITE_DESCRIPTION,
      images: [{ url: previewImage, width: 1200, height: 630, alt: 'Toosii Tech developer platform from Kenya' }],
    },
    twitter: {
      card: 'summary_large_image',
      title: SITE_TITLE,
      description: SITE_DESCRIPTION,
      images: [previewImage],
    },
  }
}

/* Responsive — works naturally on every device */
export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <NavigationHistory />
        <AnimatedBackground />
        {children}
        <PageTracker />
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  )
}
