import { Suspense } from 'react'
import Layout from '../../components/Layout'
import SearchClient from './SearchClient'
import { createShareMetadata } from '../../lib/shareMetadata'

export const metadata = createShareMetadata({
  title: 'Search — Toosii Tech',
  description: 'Search Toosii Tech tools, API resources, movies, series, anime, and Live TV.',
  path: '/search',
})

export default function SearchPage() {
  return <Layout><Suspense fallback={<main className="global-search-page"><div className="global-search-inner"><p>Loading search…</p></div></main>}><SearchClient /></Suspense></Layout>
}
