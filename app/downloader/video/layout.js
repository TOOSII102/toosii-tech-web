import { createShareMetadata } from '../../../lib/shareMetadata'

export const metadata = createShareMetadata({
  title: 'Free Video Downloader — YouTube, TikTok, Instagram & More | Toosii Tech',
  description: 'Download videos from YouTube, TikTok, Instagram, Facebook, Twitter, and 20+ platforms for free. No account, no watermark, multiple quality options.',
  keywords: 'free video downloader, YouTube downloader, TikTok downloader, Instagram video download, Facebook video download, download online videos, Toosii Tech',
  path: '/downloader/video',
})

export default function VideoDownloaderLayout({ children }) {
  return children
}
