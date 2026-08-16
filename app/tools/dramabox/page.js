'use client'

import { useCallback, useEffect, useState } from 'react'
import './dramabox.css'

function uniqueItems(data) {
  const buckets = [data?.results, data?.featured, data?.latest, data?.trending, data?.for_you, data?.forYou]
  const seen = new Set()
  return buckets
    .flatMap(bucket => Array.isArray(bucket) ? bucket : [])
    .filter(item => {
      const key = item?.id || item?.url || item?.title
      if (!key || seen.has(key)) return false
      seen.add(key)
      return true
    })
}

export default function DramaBoxPage() {
  const [query, setQuery] = useState('')
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [searched, setSearched] = useState(false)
  const [error, setError] = useState('')

  const load = useCallback(async (term = '') => {
    setLoading(true)
    setError('')
    try {
      const params = new URLSearchParams({ action: term ? 'search' : 'trending', page: '1' })
      if (term) params.set('q', term)
      const response = await fetch(`/api/tools/dramabox?${params}`)
      const data = await response.json()
      if (!response.ok || data.error) throw new Error(data.error || 'DramaBox service unavailable')
      setItems(uniqueItems(data))
    } catch (err) {
      setItems([])
      setError(err?.message || 'DramaBox service unavailable. Try again shortly.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const submit = event => {
    event.preventDefault()
    const term = query.trim()
    setSearched(Boolean(term))
    load(term)
  }

  return (
    <main className="dramabox-page">
      <section className="dramabox-hero">
        <div className="dramabox-eyebrow">DramaBox Streaming</div>
        <h1>Short dramas. <span>Big stories.</span></h1>
        <p>Search the latest DramaBox catalogue, explore short-form series, and open the selected title on its official playback page.</p>
        <form className="dramabox-search" onSubmit={submit}>
          <span aria-hidden="true">⌕</span>
          <input
            value={query}
            onChange={event => setQuery(event.target.value)}
            placeholder="Search dramas, actors, or story themes…"
            aria-label="Search DramaBox"
          />
          <button type="submit" disabled={loading}>{loading ? 'Loading…' : 'Search'}</button>
        </form>
      </section>

      <section className="dramabox-catalogue" aria-live="polite">
        <div className="dramabox-section-head">
          <div>
            <p className="dramabox-kicker">{searched ? 'Search results' : 'Trending now'}</p>
            <h2>{searched ? `Results for “${query.trim()}”` : 'Popular DramaBox stories'}</h2>
          </div>
          <span className="dramabox-count">{loading ? 'Loading…' : `${items.length} titles`}</span>
        </div>

        {error && <div className="dramabox-state dramabox-error">{error}</div>}
        {!loading && !error && !items.length && <div className="dramabox-state">No matching dramas were found. Try another search.</div>}
        {loading && <div className="dramabox-grid dramabox-skeletons">{Array.from({ length: 8 }).map((_, index) => <div className="dramabox-skeleton" key={index} />)}</div>}
        {!loading && !error && items.length > 0 && (
          <div className="dramabox-grid">
            {items.map(item => (
              <article className="dramabox-card" key={item.id || item.url || item.title}>
                <div className="dramabox-cover-wrap">
                  {item.cover ? <img className="dramabox-cover" src={item.cover} alt="" loading="lazy" /> : <div className="dramabox-cover-placeholder">DB</div>}
                  {item.episodes ? <span className="dramabox-episodes">{item.episodes} eps</span> : null}
                </div>
                <div className="dramabox-card-body">
                  <h3>{item.title || 'Untitled drama'}</h3>
                  <p>{item.introduction || 'A short-form story from the DramaBox catalogue.'}</p>
                  <div className="dramabox-meta">
                    <span>{item.author || 'DramaBox'}</span>
                    {item.views ? <span>{Number(item.views).toLocaleString()} views</span> : null}
                  </div>
                  {Array.isArray(item.tags) && item.tags.length > 0 && <div className="dramabox-tags">{item.tags.slice(0, 2).map(tag => <span key={tag}>{tag}</span>)}</div>}
                  {item.url ? <a className="dramabox-open" href={item.url} target="_blank" rel="noreferrer">Open drama <span>↗</span></a> : <span className="dramabox-open is-disabled">Playback unavailable</span>}
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  )
}
