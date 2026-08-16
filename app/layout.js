import './globals.css'
import AnimatedBackground from '../components/AnimatedBackground'

export const metadata = {
  title: 'Toosii Tech — WhatsApp Bot & Developer Tools',
  description: 'Self-taught developer from Nairobi, Kenya building powerful WhatsApp bots and web tools. Session generator, video & MP3 downloaders.',
  keywords: 'Toosii Tech, WhatsApp bot, session generator, video downloader, MP3 downloader, Nairobi Kenya developer',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <AnimatedBackground />
        {children}
      </body>
    </html>
  )
}
