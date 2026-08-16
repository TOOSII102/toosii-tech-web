'use client'

import { shareOrCopy } from '../lib/clientShare'

function clean(value, fallback = '') {
  return String(value || fallback).trim()
}

export default function MediaSharePage({ kind = 'live-tv', item = {} }) {
  const isBook = kind === 'book'
  const title = clean(item.title, isBook ? 'Shared book' : 'Shared live channel')
  const subtitle = clean(item.subtitle, isBook ? 'Book' : 'Live TV')
  const thumbnail = clean(item.thumbnail)
  const author = clean(item.author)
  const detail = isBook
    ? [author && `by ${author}`, item.year && String(item.year)].filter(Boolean).join(' · ')
    : [item.country, item.language, item.category].filter(Boolean).join(' · ')
  const path = isBook ? '/books/share' : '/live-tv/share'

  const share = async () => {
    const link = new URL(path, window.location.origin)
    link.searchParams.set('title', title)
    if (subtitle) link.searchParams.set('subtitle', subtitle)
    if (thumbnail) link.searchParams.set('thumbnail', thumbnail)
    if (author) link.searchParams.set('author', author)
    if (item.id) link.searchParams.set('id', item.id)
    if (item.url) link.searchParams.set('url', item.url)
    if (item.country) link.searchParams.set('country', item.country)
    if (item.language) link.searchParams.set('language', item.language)
    if (item.category) link.searchParams.set('category', item.category)
    if (item.year) link.searchParams.set('year', item.year)
    await shareOrCopy({
      title: `${title} — Toosii Tech`,
      text: isBook ? `Discover ${title} on Toosii Tech.` : `Watch ${title} on Toosii Tech Live TV.`,
      url: link.toString(),
    })
  }

  return (
    <main style={{ minHeight: '100vh', background: '#090b0f', color: '#f8fafc', padding: 'clamp(1.5rem, 5vw, 5rem) 1rem' }}>
      <div style={{ maxWidth: 980, margin: '0 auto' }}>
        <div style={{ color: isBook ? '#c084fc' : '#72f0ba', fontSize: '0.75rem', fontWeight: 800, letterSpacing: '0.16em', textTransform: 'uppercase' }}>
          {isBook ? 'Toosii Books · Shared item' : 'Toosii Live TV · Shared channel'}
        </div>
        <h1 style={{ maxWidth: 760, margin: '0.75rem 0 0', fontSize: 'clamp(2rem, 6vw, 4.2rem)', lineHeight: 1.05, letterSpacing: '-0.04em' }}>{title}</h1>
        <p style={{ maxWidth: 680, color: '#94a3b8', lineHeight: 1.7, fontSize: '1rem' }}>{subtitle}{detail ? ` · ${detail}` : ''}</p>
        <section style={{ display: 'flex', flexWrap: 'wrap', gap: 'clamp(1.25rem, 4vw, 3rem)', alignItems: 'center', marginTop: '2rem', padding: 'clamp(1rem, 3vw, 2rem)', border: '1px solid rgba(255,255,255,.1)', borderRadius: 24, background: 'rgba(255,255,255,.045)' }}>
          <div style={{ flex: '1 1 240px', maxWidth: 300, aspectRatio: '1 / 1.35', borderRadius: 16, overflow: 'hidden', background: isBook ? 'linear-gradient(145deg,#4c1d95,#111827)' : 'linear-gradient(145deg,#065f46,#111827)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {thumbnail ? <img src={thumbnail} alt={title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{ color: isBook ? '#e9d5ff' : '#a7f3d0', fontWeight: 900, fontSize: '1.1rem' }}>{isBook ? 'BOOK' : 'LIVE TV'}</span>}
          </div>
          <div style={{ flex: '1 1 280px', minWidth: 0 }}>
            <p style={{ color: '#cbd5e1', lineHeight: 1.7 }}>This link preserves the exact {isBook ? 'book' : 'channel'} shared from Toosii Tech. Your recipient can use this page to identify the same item without repeating the search.</p>
            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginTop: '1.5rem' }}>
              <button type="button" onClick={share} style={{ border: 0, borderRadius: 10, padding: '0.8rem 1.1rem', background: isBook ? '#c084fc' : '#72f0ba', color: '#090b0f', fontWeight: 800, cursor: 'pointer' }}>↗ Share Again</button>
              <a href={isBook ? '/tools' : '/tools'} style={{ border: '1px solid rgba(255,255,255,.2)', borderRadius: 10, padding: '0.8rem 1.1rem', color: '#e2e8f0', textDecoration: 'none', fontWeight: 700 }}>← Browse Toosii Tools</a>
            </div>
          </div>
        </section>
      </div>
    </main>
  )
}
