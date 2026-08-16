import { createShareMetadata } from '../../../lib/shareMetadata'

export const metadata = createShareMetadata({
  title: 'Free MP3 Downloader — YouTube to MP3 Converter | Toosii Tech',
  description: 'Convert and download YouTube videos to MP3 audio for free. High quality, fast conversion, no account needed — download any song, podcast, or audio track instantly.',
  keywords: 'YouTube to MP3, free MP3 downloader, YouTube converter, download audio free, music downloader, Toosii Tech',
  path: '/downloader/audio',
})

export default function AudioDownloaderLayout({ children }) {
  return children
}
