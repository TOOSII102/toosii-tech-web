import Layout from '../../components/Layout'
import MediaLibraryPanel from '../../components/MediaLibraryPanel'
import { createShareMetadata } from '../../lib/shareMetadata'
import './library.css'

export const metadata = createShareMetadata({
  title: 'My Library — Toosii Tech',
  description: 'Resume watched movies, series, anime, Live TV, saved titles, and download activity on Toosii Tech.',
  path: '/library',
})

export default function LibraryPage() {
  return <Layout><main className="library-page"><MediaLibraryPanel /></main></Layout>
}
