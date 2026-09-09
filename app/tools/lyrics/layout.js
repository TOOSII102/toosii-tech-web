import { createShareMetadata } from '../../../lib/shareMetadata'

export const metadata = createShareMetadata({
  title: 'Lyrics Finder — Free Song Lyrics Search | Toosii Tech',
  description: 'Find full lyrics for any song in seconds — Bongo Flava, Afrobeats, Gengetone, gospel and international hits. Free, no sign-up, by Toosii Tech.',
  keywords: 'lyrics finder, song lyrics free, tanzania lyrics, bongo flava lyrics, afrobeats lyrics, Toosii Tech',
  path: '/tools/lyrics',
})

export default function LyricsLayout({ children }) {
  return children
}
