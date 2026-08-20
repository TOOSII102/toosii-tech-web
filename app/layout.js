import './globals.css'
  import AnimatedBackground from '../components/AnimatedBackground'
  import NavigationHistory from '../components/NavigationHistory'
  import { Analytics } from '@vercel/analytics/next'
  import { SpeedInsights } from '@vercel/speed-insights/next'
import PageTracker from '../components/PageTracker'
import PwaRegister from '../components/PwaRegister'
import { createShareMetadata } from '../lib/shareMetadata'

export const metadata = createShareMetadata({
  title: 'Toosii Tech — Free Tools, WhatsApp Bot & Movie Streaming',
  description: 'A developer platform from Kenya. 11+ free web tools, a WhatsApp bot with 150+ commands, HD movie streaming, video & MP3 downloads, vocal removal, and more — no account, no cost, always free.',
  keywords: 'Toosii Tech, free web tools, WhatsApp bot, movie streaming, video downloader, MP3 downloader, vocal remover, temp email, APK download, developer platform, Kenya, African tech',
  manifest: '/manifest.webmanifest',
  themeColor: '#090b0f',
  path: '/',
})

  /* Responsive — works naturally on every device */
  export const viewport = {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 5,
    themeColor: '#090b0f',
  }

  export default function RootLayout({ children }) {
    return (
      <html lang="en">
        <body>
          <NavigationHistory />
          <PwaRegister />
          <AnimatedBackground />
          {children}
          <PageTracker />
          <Analytics />
          <SpeedInsights />
        </body>
      </html>
    )
  }
  