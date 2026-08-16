import MoviesPage from '../page'
import { createShareMetadata } from '../../../../lib/shareMetadata'

function text(value, fallback = '') {
  return String(value || fallback).trim()
}

export async function generateMetadata({ searchParams }) {
  const title = text(searchParams?.title, searchParams?.q ? `Search results for ${searchParams.q}` : 'Shared movie')
  const cover = text(searchParams?.cover)
  const query = text(searchParams?.q)
  return createShareMetadata({
    title: `${title} — Toosii Tech Movies`,
    description: query ? `Browse Toosii Tech movie and series results for ${query}.` : `Watch ${title} on Toosii Tech Movies & Series.`,
    keywords: `${title}, movies, series, streaming, Toosii Tech`,
    path: '/tools/movies/watch',
    type: 'video.movie',
    previewParams: {
      layout: query ? 'movies-search' : 'movie-detail',
      title,
      cover,
      query,
      type: text(searchParams?.type),
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
        query: text(searchParams?.q),
      }}
    />
  )
}
