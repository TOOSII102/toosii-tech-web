import MoviesPage from '../page'
import { createShareMetadata } from '../../../../lib/shareMetadata'

function text(value, fallback = '') {
  return String(value || fallback).trim()
}

export async function generateMetadata({ searchParams }) {
  const title = text(searchParams?.title, searchParams?.q ? `Search results for ${searchParams.q}` : 'Shared movie')
  const cover = text(searchParams?.cover)
  const query = text(searchParams?.q)
  const season = text(searchParams?.season)
  const episode = text(searchParams?.episode)
  const position = season ? ` S${season}${episode ? ` E${episode}` : ''}` : ''
  const hasSeason = season && new RegExp(`\\bS${season}\\b`, 'i').test(title)
  const hasEpisode = !episode || new RegExp(`\\bE${episode}\\b`, 'i').test(title)
  const shareTitle = `${title}${season && !hasSeason ? ` S${season}` : ''}${episode && !hasEpisode ? ` E${episode}` : ''}`
  return createShareMetadata({
    title: `${shareTitle} — Toosii Tech Movies`,
    description: query ? `Browse Toosii Tech movie and series results for ${query}.` : `Watch ${shareTitle} on Toosii Tech Movies & Series.`,
    keywords: `${title}, movies, series, streaming, Toosii Tech`,
    path: '/tools/movies/watch',
    type: 'video.movie',
    previewParams: {
      layout: query ? 'movies-search' : 'movie-detail',
      title: shareTitle,
      cover,
      query,
            type: text(searchParams?.type),
        season: text(searchParams?.season),
        episode: text(searchParams?.episode),
        },

  })
}

export default async function SharedMoviePage({ searchParams }) {
  return (
    <MoviesPage
      shared={{
        id: text(searchParams?.id),
        title: text(searchParams?.title, 'Shared movie'),
        cover: text(searchParams?.cover),
        type: text(searchParams?.type),
        season: text(searchParams?.season),
        episode: text(searchParams?.episode),
        query: text(searchParams?.q),
      }}
    />
  )
}
