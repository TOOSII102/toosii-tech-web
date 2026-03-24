import './globals.css'
import AnimatedBackground from '../components/AnimatedBackground'
import BuyCoffee from '../components/BuyCoffee'
import NavigationHistory from '../components/NavigationHistory'

export const metadata = {
  title: 'Toosii Tech — AI-Powered Tools & Intelligent Automation',
  description: 'A precision-built developer platform from Nairobi, Kenya — delivering AI-powered tools, WhatsApp automation, HD movie streaming, media utilities, and intelligent digital experiences. All free. No sign-up.',
  keywords: 'Toosii Tech, AI tools, WhatsApp automation, developer platform, video downloader, MP3 downloader, movie streaming, vocal remover, Nairobi Kenya, African tech',
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
        <BuyCoffee />
      </body>
    </html>
  )
}
