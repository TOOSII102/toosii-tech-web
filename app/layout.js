import './globals.css'
  import AnimatedBackground from '../components/AnimatedBackground'
  import NavigationHistory from '../components/NavigationHistory'
  import { Analytics } from '@vercel/analytics/next'
  import { SpeedInsights } from '@vercel/speed-insights/next'
import PageTracker from '../components/PageTracker'
import PwaRegister from '../components/PwaRegister'
import InstallPrompt from '../components/InstallPrompt'
import { createShareMetadata } from '../lib/shareMetadata'

export const metadata = createShareMetadata({
  title: 'Toosii Tech — Live TV, Free Tools, WhatsApp Bot & Movie Streaming',
  description: '8,400+ live TV channels from 177 countries, HD movies, video and MP3 downloaders, 17 free tools, a WhatsApp bot with 150+ commands and a free public API. Built in Kenya — no account, no cost.',
  keywords: 'Toosii Tech, live TV free, free web tools, WhatsApp bot, movie streaming, video downloader, MP3 downloader, vocal remover, free public API, temp email, APK download, developer platform, Kenya, African tech',
  manifest: '/manifest.webmanifest',
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
          <InstallPrompt />
          <PageTracker />
          <Analytics />
          <SpeedInsights />
        </body>
      </html>
    )
  }
