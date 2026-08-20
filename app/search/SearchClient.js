'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import './search.css'

const SITE_ITEMS = [
  { title: 'Toosii AI', description: 'AI chat and creative assistance.', href: '/tools/ai', category: 'Tools' },
  { title: 'ToosiiFlix Movies & Series', description: 'Movies, series, anime, and Live TV streams and downloads.', href: '/tools/movies', category: 'Media' },
  { title: 'Anime & Live TV', description: 'Anime episodes, Live TV events, and replays.', href: '/tools/movies?catalog=animeTrending', category: 'Media' },
  { title: 'MP3 Downloader', description: 'Convert public video links to named MP3 files.', href: '/downloader/audio', category: 'Tools' },
  { title: 'Video Downloader', description: 'Download public videos from supported platforms.', href: '/downloader/video', category: 'Tools' },
  { title: 'Spotify Downloader', description: 'Search and download supported Spotify tracks.', href: '/downloader/spotify', category: 'Tools' },
  { title: 'Vocal Remover', description: 'Separate vocals and instrumental audio stems.', href: '/tools/vocal-remover', category: 'Tools' },
  { title: 'Configuration Inspector', description: 'Inspect supported configuration files without decrypting protected formats.', href: '/tools/config-inspector', category: 'Tools' },
  { title: 'Toosii API', description: 'Interactive endpoint reference and live health dashboard.', href: '/api', category: 'Developer' },
  { title: 'Contact and Feedback', description: 'Send feedback, feature requests, and collaboration enquiries.', href: '/contact', category: 'Support' },
  { title: 'My Library', description: 'Recently watched, My List, and download activity.', href: '/library', category: 'Personal' },
  { title: 'Privacy Policy', description: 'How Toosii Tech handles site and tool data.', href: '/privacy-policy', category: 'Legal' },
  { title: 'Terms of Use', description: 'Responsible-use rules for the platform.', href: '/terms', category: 'Legal' },
]

export default function SearchClient() {
  const params = useSearchParams()
  const [query, setQuery] = useState(params.get('q') || '')
  const [movieResults, setMovieResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(Boolean(params.get('q')))
  const filteredSite = useMemo(() => {
    const needle = query.trim().toLowerCase()
    if (!needle) return SITE_ITEMS
    return SITE_ITEMS.filter(item => `${item.title} ${item.description} ${item.category}`.toLowerCase().includes(needle))
  }, [query])

  const runSearch = async event => {
    event?.preventDefault()
    const needle = query.trim()
    setSearched(Boolean(needle))
    if (!needle) { setMovieResults([]); return }
    setLoading(true)
    try {
      const response = await fetch(`/api/tools/movies?action=search&q=${encodeURIComponent(needle)}`)
      const payload = await response.json().catch(() => ({}))
      setMovieResults(payload?.data?.items || payload?.data?.subjectList || [])
    } catch {
      setMovieResults([])
    } finally { setLoading(false) }
  }

  useEffect(() => { if (params.get('q')) runSearch() }, [])

  return (
    <main className="global-search-page">
      <div className="global-search-inner">
        <p className="search-eyebrow">TOOSII DISCOVERY</p>
        <h1>Find anything on <span>Toosii Tech.</span></h1>
        <p className="search-intro">Search tools, developer resources, movies, series, anime, and Live TV from one place.</p>
        <form className="global-search-form" onSubmit={runSearch}>
          <label htmlFor="global-search-input" className="sr-only">Search Toosii Tech</label>
          <input id="global-search-input" value={query} onChange={event => setQuery(event.target.value)} placeholder="Search tools, anime, movies, or series…" autoFocus />
          <button type="submit">{loading ? 'Searching…' : 'Search'}</button>
        </form>
        <div className="search-results-head"><h2>{searched ? `Results for “${query}”` : 'Explore the platform'}</h2><span>{filteredSite.length + movieResults.length} matches</span></div>
        <div className="search-result-grid">
          {filteredSite.map(item => <Link href={item.href} className="search-result-card" key={item.href}><span>{item.category}</span><h3>{item.title}</h3><p>{item.description}</p><b>Open →</b></Link>)}
          {movieResults.map(item => <Link href={`/tools/movies/watch?id=${encodeURIComponent(item.subjectId)}&title=${encodeURIComponent(item.title || 'Shared title')}&type=${encodeURIComponent(item.subjectType || 1)}&kind=${encodeURIComponent(item.mediaKind || '')}`} className="search-result-card media" key={`media-${item.subjectId}`}><span>ToosiiFlix</span><h3>{item.title}</h3><p>{item.genre || 'Movie or series'}{item.releaseDate ? ` · ${String(item.releaseDate).slice(0, 4)}` : ''}</p><b>Open title →</b></Link>)}
        </div>
        {searched && !filteredSite.length && !movieResults.length && !loading && <div className="search-empty"><h3>No results found</h3><p>Try a shorter title or search for a tool such as anime, MP3, API, or movies.</p></div>}
      </div>
    </main>
  )
}
