import type { Metadata } from 'next'
import './globals.css'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'

export const metadata: Metadata = {
  title: {
    default: 'Toosii Tech | TOOSII XD ULTRA WhatsApp Bot',
    template: '%s | Toosii Tech',
  },
  description: 'Toosii Tech — Self-taught developer behind TOOSII XD ULTRA, a powerful WhatsApp Multi-Device bot. Generate sessions, download videos, convert MP3s.',
  keywords: ['WhatsApp bot', 'session generator', 'TOOSII XD ULTRA', 'Toosii Tech', 'MP3 downloader', 'video downloader'],
  authors: [{ name: 'Toosii Tech' }],
  openGraph: {
    title: 'Toosii Tech | TOOSII XD ULTRA',
    description: 'Powerful WhatsApp bot, session generator and media tools by Toosii Tech.',
    images: [{ url: 'https://files.catbox.moe/qbcebp.jpg' }],
    type: 'website',
  },
  twitter: {
    card: 'summary',
    images: ['https://files.catbox.moe/qbcebp.jpg'],
  },
  themeColor: '#25d366',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet" />
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css" />
      </head>
      <body>
        <Navbar />
        <main className="relative z-10">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  )
}
