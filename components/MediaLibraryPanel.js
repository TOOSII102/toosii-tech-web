'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { clearLibrary, getDownloads, getMyList, getWatched, subscribeMediaLibrary } from '../lib/clientMediaState'

function cover(item) {
  return item.cover || 'https://placehold.co/160x240/0d0d1a/8b5cf6?text=Toosii'
}

function watchHref(item) {
  const params = new URLSearchParams({
    id: item.subjectId || '',
    title: item.title || 'Shared title',
    kind: item.mediaKind || '',
    type: String(item.subjectType || 1),
  })
  if (item.season) params.set('season', item.season)
  if (item.episode) params.set('episode', item.episode)
  return `/tools/movies/watch?${params.toString()}`
}

function MediaRow({ item, label }) {
  return (
    <article className="library-item">
      <img src={cover(item)} alt="" loading="lazy" />
      <div className="library-item-body">
        <span className="library-item-label">{label}</span>
        <h3>{item.title}</h3>
        {(item.season || item.episode) && <p>S{item.season || 1} · E{item.episode || 1}</p>}
        {item.status && <p className="library-muted">{item.status === 'started' ? 'Browser download started' : item.status}</p>}
        <Link href={watchHref(item)} className="library-open">Open in ToosiiFlix →</Link>
      </div>
    </article>
  )
}

export default function MediaLibraryPanel() {
  const [tab, setTab] = useState('watched')
  const [watched, setWatched] = useState([])
  const [myList, setMyList] = useState([])
  const [downloads, setDownloads] = useState([])

  const refresh = () => {
    setWatched(getWatched())
    setMyList(getMyList())
    setDownloads(getDownloads())
  }

  useEffect(() => {
    refresh()
    return subscribeMediaLibrary(refresh)
  }, [])

  const current = useMemo(() => tab === 'list' ? myList : tab === 'downloads' ? downloads : watched, [tab, watched, myList, downloads])
  const label = tab === 'list' ? 'My List' : tab === 'downloads' ? 'Downloads' : 'Recently watched'

  return (
    <section className="library-panel" aria-label="Your media library">
      <div className="library-tabs" role="tablist" aria-label="Media library sections">
        <button type="button" role="tab" aria-selected={tab === 'watched'} className={tab === 'watched' ? 'active' : ''} onClick={() => setTab('watched')}>Recently watched <b>{watched.length}</b></button>
        <button type="button" role="tab" aria-selected={tab === 'list'} className={tab === 'list' ? 'active' : ''} onClick={() => setTab('list')}>My List <b>{myList.length}</b></button>
        <button type="button" role="tab" aria-selected={tab === 'downloads'} className={tab === 'downloads' ? 'active' : ''} onClick={() => setTab('downloads')}>Downloads <b>{downloads.length}</b></button>
      </div>
      <div className="library-heading"><div><span className="library-eyebrow">PERSONAL SPACE</span><h2>{label}</h2></div>{current.length > 0 && <button type="button" className="library-clear" onClick={() => { clearLibrary(tab === 'list' ? 'toosii_my_list_v1' : tab === 'downloads' ? 'toosii_downloads_v1' : 'toosii_watched_v1'); refresh() }}>Clear</button>}</div>
      {current.length ? <div className="library-grid">{current.map(item => <MediaRow key={item.key} item={item} label={tab === 'list' ? 'Saved to your list' : tab === 'downloads' ? 'Download activity' : 'Resume watching'} />)}</div> : <div className="library-empty"><span aria-hidden="true">✦</span><h3>{tab === 'list' ? 'Build your watch list' : tab === 'downloads' ? 'No downloads started yet' : 'Nothing watched yet'}</h3><p>{tab === 'list' ? 'Save movies, series, anime, and Live TV events from ToosiiFlix.' : tab === 'downloads' ? 'When you start a browser download, it will appear here with its filename and time.' : 'Open a title in ToosiiFlix and play an episode to build your history.'}</p><Link href="/tools/movies" className="library-open">Browse ToosiiFlix →</Link></div>}
    </section>
  )
}
