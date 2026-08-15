'use client'

import Link from 'next/link'
import { useEffect, useMemo, useRef, useState } from 'react'
import Layout from '../../components/Layout'
import './api.css'

const endpoints = [
  {
    id: 'health',
    category: 'Core',
    method: 'GET',
    title: 'Service health',
    description: 'Confirm that Toosii API is reachable and check the active version.',
    path: '/api/v1/health',
    params: [],
  },
  {
    id: 'api-catalogue',
    category: 'Core',
    method: 'GET',
    title: 'API catalogue',
    description: 'List the public Toosii API routes and their categories from one machine-readable response.',
    path: '/api/v1',
    params: [],
  },
  {
    id: 'weather',
    category: 'Data',
    method: 'GET',
    title: 'Weather forecast',
    description: 'Get current conditions and a compact three-day forecast for any coordinates.',
    path: '/api/v1/weather?latitude=-1.2864&longitude=36.8172',
    params: [
      { name: 'latitude', type: 'number', required: false, description: 'Latitude from -90 to 90. Defaults to Nairobi.' },
      { name: 'longitude', type: 'number', required: false, description: 'Longitude from -180 to 180. Defaults to Nairobi.' },
    ],
  },
  {
    id: 'holidays',
    category: 'Data',
    method: 'GET',
    title: 'Public holidays',
    description: 'List country public holidays for a given year.',
    path: '/api/v1/holidays?country=KE&year=2026',
    params: [
      { name: 'country', type: 'string', required: false, description: 'ISO country code, such as KE, US, or GB. Defaults to KE.' },
      { name: 'year', type: 'integer', required: false, description: 'Calendar year from 1900 to 2100. Defaults to the current year.' },
    ],
  },
  {
    id: 'books-search',
    category: 'Data',
    method: 'GET',
    title: 'Book search',
    description: 'Discover books, authors, cover art, and first publication years.',
    path: '/api/v1/books/search?query=things%20fall%20apart&limit=5',
    params: [
      { name: 'query', type: 'string', required: true, description: 'Book title, author, or search phrase.' },
      { name: 'limit', type: 'integer', required: false, description: 'Number of results from 1 to 10. Defaults to 5.' },
    ],
  },
  {
    id: 'movie-catalogue',
    category: 'Media',
    method: 'GET',
    title: 'Movie and series catalogue',
    description: 'Browse the current movie and series catalogue with a normalized response.',
    path: '/api/tools/movies?action=trending',
    params: [{ name: 'action', type: 'string', required: false, description: 'trending, search, detail, play, or stream. Defaults to trending.' }],
  },
  {
    id: 'dramabox-catalogue',
    category: 'Media',
    method: 'GET',
    title: 'Short-drama catalogue',
    description: 'Browse or search the short-drama catalogue and its episode metadata.',
    path: '/api/tools/dramabox?action=trending&page=1',
    params: [
      { name: 'action', type: 'string', required: false, description: 'trending, search, detail, episodes, watch, or download.' },
      { name: 'q', type: 'string', required: false, description: 'Search phrase when action is search.' },
      { name: 'page', type: 'integer', required: false, description: 'Catalogue page number.' },
    ],
  },
  {
    id: 'youtube-search',
    category: 'Media Search',
    method: 'GET',
    title: 'YouTube video search',
    description: 'Search YouTube and receive normalized video titles, channels, durations, views, thumbnails, and watch URLs.',
    path: '/api/search/youtube?q=kenya%20music',
    params: [{ name: 'q', type: 'string', required: true, description: 'Video search phrase.' }],
  },
  {
    id: 'spotify-search',
    category: 'Media Search',
    method: 'GET',
    title: 'Spotify track search',
    description: 'Search music metadata and receive track, artist, album, cover, preview, and provider-link details.',
    path: '/api/search/spotify?q=afrobeats',
    params: [{ name: 'q', type: 'string', required: true, description: 'Track, artist, album, or music search phrase.' }],
  },
  {
    id: 'news',
    category: 'News',
    method: 'GET',
    title: 'Africa news feed',
    description: 'Read current Africa headlines through a Toosii-normalized RSS response with source attribution.',
    path: '/api/news?q=kenya&limit=10',
    params: [
      { name: 'q', type: 'string', required: false, description: 'Optional keyword filter applied to headline titles and descriptions.' },
      { name: 'limit', type: 'integer', required: false, description: 'Number of articles from 1 to 20. Defaults to 10.' },
    ],
  },
  {
    id: 'education-search',
    category: 'Education',
    method: 'GET',
    title: 'Scholarly works search',
    description: 'Search public scholarly works metadata with authors, publication years, citations, and open-access links.',
    path: '/api/education?q=climate%20technology&limit=5',
    params: [
      { name: 'q', type: 'string', required: false, description: 'Topic or phrase from 2 to 160 characters.' },
      { name: 'limit', type: 'integer', required: false, description: 'Number of results from 1 to 10. Defaults to 5.' },
    ],
  },
  {
    id: 'fun-joke',
    category: 'Fun',
    method: 'GET',
    title: 'Random joke',
    description: 'Return a normalized random joke response with clear source attribution.',
    path: '/api/fun',
    params: [],
  },
  {
    id: 'video-download',
    category: 'Downloaders',
    method: 'POST',
    title: 'Multi-platform video downloader',
    description: 'Resolve a public YouTube, TikTok, Instagram, Facebook, or X video URL into normalized download metadata.',
    path: '/api/download/video',
    params: [],
    body: { url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' },
  },
  {
    id: 'audio-download',
    category: 'Downloaders',
    method: 'POST',
    title: 'YouTube audio downloader',
    description: 'Convert a public YouTube URL to MP3 metadata or a binary audio download response.',
    path: '/api/download/audio',
    params: [],
    body: { url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' },
  },
  {
    id: 'spotify-download',
    category: 'Downloaders',
    method: 'POST',
    title: 'Spotify track downloader',
    description: 'Resolve a public Spotify track URL into normalized track metadata and a download link when available.',
    path: '/api/download/spotify',
    params: [],
    body: { url: 'https://open.spotify.com/track/4uLU6hMCjMI75M1A2tKUQC' },
  },
  {
    id: 'tiktok-download',
    category: 'Downloaders',
    method: 'POST',
    title: 'TikTok video downloader',
    description: 'Resolve a public TikTok video URL through the Toosii downloader service.',
    path: '/api/download/tiktok',
    params: [],
    body: { url: 'https://www.tiktok.com/@tiktok/video/7230000000000000000' },
  },
  {
    id: 'toosii-ai',
    category: 'AI',
    method: 'POST',
    title: 'Toosii AI chat',
    description: 'Send a general-purpose prompt to the Toosii AI route and receive a normalized reply.',
    path: '/api/tools/ai',
    params: [],
    body: { prompt: "Explain Kenya's technology ecosystem in three sentences." },
  },
  {
    id: 'story-generator',
    category: 'AI',
    method: 'POST',
    title: 'Story generator',
    description: 'Generate a creative story from a topic through the Toosii story tool.',
    path: '/api/tools/story',
    params: [],
    body: { topic: 'A startup building useful tools from Nairobi' },
  },
  {
    id: 'apk-search',
    category: 'Tools',
    method: 'POST',
    title: 'APK search',
    description: 'Search public Android package metadata through the Toosii APK tool.',
    path: '/api/tools/apk',
    params: [],
    body: { query: 'vlc media player' },
  },
  {
    id: 'fire-logo',
    category: 'Tools',
    method: 'POST',
    title: 'Fire logo generator',
    description: 'Generate a fire-style logo image from short text through the Toosii logo tool.',
    path: '/api/tools/firelogo',
    params: [],
    body: { text: 'Toosii' },
  },
  {
    id: 'vocal-remover',
    category: 'Audio Tools',
    method: 'POST',
    title: 'Vocal remover',
    description: 'Submit a public audio URL for vocal and instrumental separation.',
    path: '/api/tools/vocal-remover',
    params: [],
    body: { url: 'https://example.com/audio.mp3' },
  },
  {
    id: 'base64-encode',
    category: 'Utilities',
    method: 'GET',
    title: 'Base64 encode',
    description: 'Convert UTF-8 text into a Base64 string.',
    path: '/api/v1/utils/base64/encode?text=Toosii%20Tech',
    params: [{ name: 'text', type: 'string', required: true, description: 'Text to encode, up to 5,000 characters.' }],
  },
  {
    id: 'base64-decode',
    category: 'Utilities',
    method: 'GET',
    title: 'Base64 decode',
    description: 'Decode a valid Base64 value into readable UTF-8 text.',
    path: '/api/v1/utils/base64/decode?text=VG9vc2lpIFRlY2g%3D',
    params: [{ name: 'text', type: 'string', required: true, description: 'Base64 input, up to 7,000 characters.' }],
  },
  {
    id: 'qr',
    category: 'Utilities',
    method: 'GET',
    title: 'QR creation',
    description: 'Create a high-quality QR code and receive its PNG data URL.',
    path: '/api/v1/utils/qr?text=https%3A%2F%2Ftoosiitech.com&size=320',
    params: [
      { name: 'text', type: 'string', required: true, description: 'Text or URL to encode.' },
      { name: 'size', type: 'integer', required: false, description: 'QR width and height, from 120 to 1,000.' },
    ],
  },
  {
    id: 'uuid',
    category: 'Utilities',
    method: 'GET',
    title: 'UUID generator',
    description: 'Generate one or more unique RFC 4122 identifiers without an upstream dependency.',
    path: '/api/v1/utils/uuid?count=3',
    params: [{ name: 'count', type: 'integer', required: false, description: 'How many UUIDs to generate, from 1 to 25.' }],
  },
  {
    id: 'slugify',
    category: 'Utilities',
    method: 'GET',
    title: 'URL slug generator',
    description: 'Turn a title or phrase into a clean, URL-friendly slug.',
    path: '/api/v1/utils/slugify?text=Toosii%20API%20Release',
    params: [{ name: 'text', type: 'string', required: true, description: 'Text to convert into a URL slug.' }],
  },
  {
    id: 'hash',
    category: 'Utilities',
    method: 'GET',
    title: 'Text hash',
    description: 'Hash text with SHA-256, SHA-384, or SHA-512.',
    path: '/api/v1/utils/hash?text=Toosii%20Tech&algorithm=sha256',
    params: [
      { name: 'text', type: 'string', required: true, description: 'Text to hash, up to 10,000 characters.' },
      { name: 'algorithm', type: 'string', required: false, description: 'sha256, sha384, or sha512. Defaults to sha256.' },
    ],
  },
  {
    id: 'models',
    category: 'AI',
    method: 'GET',
    title: 'Available AI models',
    description: 'List the AI model identifiers currently available through Toosii tools.',
    path: '/api/models',
    params: [],
  },
  {
    id: 'temp-email',
    category: 'Tools',
    method: 'GET',
    title: 'Temporary email generator',
    description: 'Generate one or more temporary email addresses for testing and short-lived sign-ups.',
    path: '/api/tools/tempemail?count=1',
    params: [{ name: 'count', type: 'integer', required: false, description: 'Number of addresses from 1 to 5. Defaults to 1.' }],
  },
  {
    id: 'bot-qr',
    category: 'Bot',
    method: 'GET',
    title: 'WhatsApp session QR',
    description: 'Request the current Toosii WhatsApp session QR payload.',
    path: '/api/qr',
    params: [],
  },
  {
    id: 'bot-pair',
    category: 'Bot',
    method: 'GET',
    title: 'WhatsApp pairing code',
    description: 'Generate a Toosii WhatsApp session pairing code for a phone number with country code.',
    path: '/api/pair?number=254712345678',
    params: [{ name: 'number', type: 'string', required: true, description: 'Phone number with country code, for example 254712345678.' }],
  },
  {
    id: 'sports',
    category: 'Sports',
    method: 'GET',
    title: 'Live football scoreboard',
    description: 'Read a normalized live scoreboard for a supported league.',
    path: '/api/v1/sports?league=eng.1',
    params: [{ name: 'league', type: 'string', required: false, description: 'eng.1, esp.1, ita.1, ger.1, fra.1, or uefa.champions.' }],
  },
]

const categories = ['Core', 'Data', 'Media', 'Media Search', 'News', 'Education', 'Fun', 'Downloaders', 'AI', 'Audio Tools', 'Utilities', 'Tools', 'Bot', 'Sports']
const DEFAULT_API_ORIGIN = 'https://www.toosiitech.org'
const buildPublicEndpointUrl = (origin, path) => `${origin}${path}`

const starterResponse = {
  success: true,
  api: 'Toosii API',
  version: 'v1',
  timestamp: '2026-08-12T00:00:00.000Z',
  status: 'operational',
}

const responseBodyPreview = (endpoint, origin) => ({
  success: true,
  api: 'Toosii API',
  operation: endpoint.id.replaceAll('-', '.'),
  endpoint: `${endpoint.method} ${buildPublicEndpointUrl(origin, endpoint.path)}`,
  data: {
    note: 'Preview schema. Use Run request to retrieve a fresh live response.',
  },
})

export default function ApiPortal() {
  const [activeId, setActiveId] = useState('health')
  const [apiOrigin, setApiOrigin] = useState(DEFAULT_API_ORIGIN)
  const [response, setResponse] = useState(starterResponse)
  const [state, setState] = useState('idle')
  const [copied, setCopied] = useState('')
  const [copiedPath, setCopiedPath] = useState('')
  const [previewedId, setPreviewedId] = useState('')
  const [previewTab, setPreviewTab] = useState('request')
  const [filter, setFilter] = useState('')
  const consoleRef = useRef(null)
  const publicEndpointUrl = path => buildPublicEndpointUrl(apiOrigin, path)

  useEffect(() => {
    if (typeof window !== 'undefined' && window.location.origin) {
      setApiOrigin(window.location.origin)
    }
  }, [])

  const active = useMemo(
    () => endpoints.find(endpoint => endpoint.id === activeId) || endpoints[0],
    [activeId],
  )

  const visibleEndpoints = useMemo(() => {
    const query = filter.trim().toLowerCase()
    if (!query) return endpoints
    return endpoints.filter(endpoint =>
      [endpoint.title, endpoint.description, endpoint.category, endpoint.path]
        .join(' ')
        .toLowerCase()
        .includes(query),
    )
  }, [filter])

  const focusConsoleOnMobile = () => {
    if (typeof window !== 'undefined' && window.matchMedia('(max-width: 960px)').matches) {
      window.requestAnimationFrame(() => {
        consoleRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      })
    }
  }

  const selectEndpoint = (endpoint) => {
    setActiveId(endpoint.id)
    setState('idle')
    setResponse(starterResponse)
    focusConsoleOnMobile()
  }

  const copy = async (value, label) => {
    try {
      await navigator.clipboard.writeText(value)
      setCopied(label)
      setCopiedPath(value)
      setTimeout(() => {
        setCopied('')
        setCopiedPath('')
      }, 1800)
    } catch {
      setCopied('Copy failed')
    }
  }

  const togglePreview = (endpoint) => {
    const isOpening = previewedId !== endpoint.id
    setPreviewedId(isOpening ? endpoint.id : '')
    if (isOpening) setPreviewTab('request')
  }

  const runRequest = async (endpoint = active) => {
    setActiveId(endpoint.id)
    setState('loading')
    focusConsoleOnMobile()

    try {
      const request = {
        headers: { Accept: 'application/json' },
      }
      if (endpoint.method === 'POST') {
        request.method = 'POST'
        request.headers['Content-Type'] = 'application/json'
        request.body = JSON.stringify(endpoint.body || {})
      }

      const result = await fetch(endpoint.path, request)
      const contentType = result.headers.get('content-type') || ''
      let body
      if (contentType.includes('application/json')) {
        body = await result.json()
      } else {
        const binary = await result.arrayBuffer()
        body = {
          success: result.ok,
          responseType: contentType || 'application/octet-stream',
          bytes: binary.byteLength,
          contentDisposition: result.headers.get('content-disposition'),
          note: 'Binary response received. Use the dedicated downloader page for a browser download.',
        }
      }
      setResponse(body)
      setState(result.ok ? 'success' : 'error')
    } catch {
      setResponse({
        success: false,
        error: { code: 'NETWORK_ERROR', message: 'The API request could not be completed. Please try again.' },
      })
      setState('error')
    }
  }

  return (
    <Layout>
      <main className="api-page">
        <section className="api-hero">
          <div className="api-grid-glow" aria-hidden="true" />
          <div className="page-wrapper api-hero-inner">
            <div className="api-hero-copy">
              <p className="api-kicker"><span className="api-kicker-dot" /> TOOSII API · VERSION 1</p>
              <h1>Build faster with <span>Toosii API.</span></h1>
              <p>
                A growing collection of clean, no-login endpoints for utilities and live data. Browse the reference, run live requests, and bring reliable building blocks into your next project.
              </p>
              <div className="api-hero-actions">
                <a href="#reference" className="api-btn api-btn-primary">Explore endpoints <span aria-hidden="true">→</span></a>
                <button type="button" className="api-btn api-btn-secondary" onClick={() => copy(publicEndpointUrl('/api/v1'), 'Public base URL copied')}>Copy base path</button>
              </div>
              <p className="api-copy-note" role="status">{copied || 'No API key required for the starter collection.'}</p>
              <ul className="api-hero-facts" aria-label="Toosii API highlights">
                <li><strong>{endpoints.length}</strong><span>documented routes</span></li>
                <li><strong>{categories.length}</strong><span>developer categories</span></li>
                <li><strong>0</strong><span>login required</span></li>
              </ul>
            </div>

            <div className="api-hero-card">
              <div className="api-card-topline"><span>GET</span><code>/api/v1/health</code></div>
              <pre>{JSON.stringify(starterResponse, null, 2)}</pre>
              <div className="api-card-footer"><span className="api-live-indicator" /> Service operational <span>JSON REST</span></div>
            </div>
          </div>
        </section>

        <section id="reference" className="api-reference section">
          <div className="page-wrapper">
            <div className="api-section-heading">
              <div>
                <p className="section-eyebrow">Developer Reference</p>
                <h2 className="section-title">Test every endpoint live.</h2>
                <p>Choose an endpoint to see its parameters, copy the request path, or send a live request from this page.</p>
              </div>
              <div className="api-stats" aria-label="API statistics">
                <span><strong>{endpoints.length}</strong> public routes</span>
                <span><strong>{categories.length}</strong> categories</span>
                <span><strong>0</strong> API keys required</span>
              </div>
            </div>

            <div className="api-workspace">
              <aside className="api-sidebar" aria-label="Endpoint navigation">
                <div className="api-sidebar-top">
                  <div className="api-sidebar-title-row">
                    <div className="api-sidebar-title">Endpoint catalogue</div>
                    <span>{visibleEndpoints.length} routes</span>
                  </div>
                  <label className="api-endpoint-filter">
                    <span className="sr-only">Filter endpoints</span>
                    <input
                      type="search"
                      value={filter}
                      onChange={event => setFilter(event.target.value)}
                      placeholder="Filter endpoints"
                      aria-label="Filter endpoints by name, category, or path"
                    />
                    {filter && <button type="button" onClick={() => setFilter('')} aria-label="Clear endpoint filter">×</button>}
                  </label>
                  <div className="api-base-control">
                    <span>Base URL</span>
                    <code>{publicEndpointUrl('/api/v1')}</code>
                    <button type="button" onClick={() => copy(publicEndpointUrl('/api/v1'), 'Public base URL copied')}>Copy</button>
                  </div>
                  <p className="api-sidebar-status" role="status">{copied || 'No key required'}</p>
                </div>
                <div className="api-nav-groups">
                  {categories.map(category => {
                    const items = visibleEndpoints.filter(endpoint => endpoint.category === category)
                    if (!items.length) return null
                    return (
                      <div key={category} className="api-category">
                        <p><span>{category}</span><b>{items.length}</b></p>
                        <div className="api-category-items">
                          {items.map(endpoint => (
                            <div key={endpoint.id} className={`api-endpoint-card${active.id === endpoint.id ? ' active' : ''}`}>
                              <button
                                type="button"
                                onClick={() => selectEndpoint(endpoint)}
                                className="api-endpoint-nav"
                                aria-pressed={active.id === endpoint.id}
                              >
                                <span className="api-endpoint-card-top">
                                  <span className="api-method-badge">{endpoint.method}</span>
                                  <strong>{endpoint.title}</strong>
                                </span>
                                <code>{endpoint.path}</code>
                                <p>{endpoint.description}</p>
                                <span className="api-endpoint-card-action">Live endpoint <span aria-hidden="true">→</span></span>
                              </button>
                              <div className="api-card-controls" aria-label={`${endpoint.title} actions`}>
                                <button
                                  type="button"
                                  className="api-card-copy-btn"
                                  onClick={() => copy(publicEndpointUrl(endpoint.path), `${endpoint.title} endpoint copied`)}
                                  aria-label={`Copy full public URL for ${endpoint.title}`}
                                >
                                  {copiedPath === publicEndpointUrl(endpoint.path) ? 'Copied' : 'Copy URL'}
                                </button>
                                <button
                                  type="button"
                                  className="api-card-preview-btn"
                                  onClick={() => togglePreview(endpoint)}
                                  aria-expanded={previewedId === endpoint.id}
                                  aria-controls={`preview-${endpoint.id}`}
                                  aria-label={`${previewedId === endpoint.id ? 'Hide' : 'Show'} ${endpoint.title} request preview`}
                                >
                                  {previewedId === endpoint.id ? 'Hide preview' : 'Preview'}
                                </button>
                                <button
                                  type="button"
                                  className="api-card-run-btn"
                                  onClick={() => runRequest(endpoint)}
                                  disabled={state === 'loading' && active.id === endpoint.id}
                                >
                                  {state === 'loading' && active.id === endpoint.id ? 'Running…' : 'Run request'}
                                </button>
                              </div>
                              {previewedId === endpoint.id && (
                                <div id={`preview-${endpoint.id}`} className="api-inline-preview">
                                  <div className="api-inline-tabs" role="tablist" aria-label={`${endpoint.title} preview tabs`}>
                                    <button
                                      type="button"
                                      role="tab"
                                      id={`request-tab-${endpoint.id}`}
                                      aria-selected={previewTab === 'request'}
                                      aria-controls={`request-panel-${endpoint.id}`}
                                      className={previewTab === 'request' ? 'active' : ''}
                                      onClick={() => setPreviewTab('request')}
                                    >
                                      Request preview
                                    </button>
                                    <button
                                      type="button"
                                      role="tab"
                                      id={`response-tab-${endpoint.id}`}
                                      aria-selected={previewTab === 'response'}
                                      aria-controls={`response-panel-${endpoint.id}`}
                                      className={previewTab === 'response' ? 'active' : ''}
                                      onClick={() => setPreviewTab('response')}
                                    >
                                      Response body
                                    </button>
                                  </div>
                                  {previewTab === 'request' ? (
                                    <div id={`request-panel-${endpoint.id}`} role="tabpanel" aria-labelledby={`request-tab-${endpoint.id}`} className="api-inline-tab-panel">
                                      <div className="api-inline-preview-head"><span>Request preview</span><b>{endpoint.method}</b></div>
                                      <code>{publicEndpointUrl(endpoint.path)}</code>
                                      <p>{endpoint.params.length ? `Query: ${endpoint.params.map(param => `${param.name}${param.required ? '*' : ''}`).join(', ')}` : endpoint.body ? 'JSON request body included below.' : 'No query parameters required.'}</p>
                                      {endpoint.body && <pre className="api-inline-response">{JSON.stringify(endpoint.body, null, 2)}</pre>}
                                    </div>
                                  ) : (
                                    <div id={`response-panel-${endpoint.id}`} role="tabpanel" aria-labelledby={`response-tab-${endpoint.id}`} className="api-inline-tab-panel">
                                      <div className="api-inline-preview-head"><span>Response body preview</span><b>JSON</b></div>
                                      <pre className="api-inline-response">{JSON.stringify(responseBodyPreview(endpoint, apiOrigin), null, 2)}</pre>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )
                  })}
                  {!visibleEndpoints.length && <p className="api-no-results">No endpoints match “{filter}”.</p>}
                </div>
                <div className="api-sidebar-note">
                  <strong>Built to grow</strong>
                  <span>New vetted endpoints will appear here as the API expands.</span>
                </div>
              </aside>

              <section ref={consoleRef} className="api-console" aria-live="polite">
                <div className="api-console-heading">
                  <div>
                    <div className="api-method-label"><span>{active.method}</span> {active.category}</div>
                    <h3>{active.title}</h3>
                    <p>{active.description}</p>
                  </div>
                  {active.method === 'GET' ? <a href={active.path} target="_blank" rel="noreferrer" className="api-open-link">Open route <span aria-hidden="true">↗</span></a> : <span className="api-open-link api-open-link-muted">POST JSON route</span>}
                </div>

                <div className="api-console-grid">
                  <div className="api-console-details">
                    <div className="api-request-box">
                      <div className="api-request-label">Request path</div>
                      <code>{publicEndpointUrl(active.path)}</code>
                      <button type="button" onClick={() => copy(publicEndpointUrl(active.path), 'Public endpoint copied')}>Copy</button>
                    </div>

                    <div className="api-parameter-block">
                      <h4>Query parameters</h4>
                      {active.params.length ? (
                        <div className="api-param-list">
                          {active.params.map(param => (
                            <div key={param.name} className="api-param">
                              <div><code>{param.name}</code><span>{param.type}</span>{param.required && <b>required</b>}</div>
                              <p>{param.description}</p>
                            </div>
                          ))}
                        </div>
                      ) : !active.body && <p className="api-empty">This endpoint does not require parameters.</p>}
                      {active.body && (
                        <div id="request-body" className="api-request-body-block">
                          <h4>JSON request body</h4>
                          <pre className="api-inline-response">{JSON.stringify(active.body, null, 2)}</pre>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="api-response-block">
                    <div className="api-response-head">
                      <div><span className={`api-response-state ${state}`} /> Response {state === 'loading' ? 'loading' : state === 'error' ? 'error' : 'preview'}</div>
                    </div>
                    <pre>{JSON.stringify(response, null, 2)}</pre>
                  </div>
                </div>
              </section>
            </div>
          </div>
        </section>

        <section className="api-cta section">
          <div className="page-wrapper">
            <div className="api-cta-card">
              <div>
                <p className="section-eyebrow">Have an endpoint in mind?</p>
                <h2>Help shape the next Toosii API release.</h2>
                <p>Request a safe, useful endpoint or share feedback on the developer experience.</p>
              </div>
              <Link href="/contact" className="api-btn api-btn-primary">Request an endpoint <span aria-hidden="true">→</span></Link>
            </div>
          </div>
        </section>
      </main>
    </Layout>
  )
}
