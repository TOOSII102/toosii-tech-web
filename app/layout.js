import './globals.css'
import AnimatedBackground from '../components/AnimatedBackground'
import BuyCoffee from '../components/BuyCoffee'
import ToosiiAiWidget from '../components/ToosiiAiWidget'

export const metadata = {
  title: 'Toosii Tech — AI Tools, Bots & Digital Experiences',
  description: 'A developer platform from Nairobi, Kenya. Explore AI chat, video & MP3 downloaders, WhatsApp session tools, DramaBox streaming, and more — all free, no sign-up.',
  keywords: 'Toosii Tech, developer tools, AI tools, WhatsApp bot, session generator, video downloader, MP3 downloader, DramaBox, Nairobi Kenya',
}

/* Proper responsive viewport — works on every device */
export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <AnimatedBackground />
        {children}
        <BuyCoffee />
        <ToosiiAiWidget />
      </body>
    </html>
  )
}
