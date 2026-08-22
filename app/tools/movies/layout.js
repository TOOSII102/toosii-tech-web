import { createShareMetadata } from '../../../lib/shareMetadata'

export const metadata = createShareMetadata({
  title: 'TOOSIIFLIX — Movies, Series, Anime & Live TV',
  description: 'Discover movies, series, anime, and live events on TOOSIIFLIX by Toosii Tech. Search, browse, stream, and download available titles on any device.',
  keywords: 'TOOSIIFLIX, Toosii movies, Toosii series, movies online, HD streaming, anime, live TV, Toosii Tech',
  path: '/tools/movies',
})

export default function MoviesLayout({ children }) {
  return children
}
