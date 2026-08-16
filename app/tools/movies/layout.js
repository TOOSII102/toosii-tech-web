import { createShareMetadata } from '../../../lib/shareMetadata'

export const metadata = createShareMetadata({
  title: 'Free HD Movie Streaming — Toosii Tech',
  description: 'Stream and browse thousands of HD movies and series for free — no sign-up, no subscription. Browse by genre, search by title, and watch instantly.',
  keywords: 'free movie streaming, HD movies online, watch movies free, free series streaming, Kenya movies, Toosii Tech movies, stream without account',
  path: '/tools/movies',
})

export default function MoviesLayout({ children }) {
  return children
}
