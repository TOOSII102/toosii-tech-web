'use client'

import Link from 'next/link'
import { useMemo, useRef, useState } from 'react'
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
    id: 'sports',
    category: 'Sports',
    method: 'GET',
    title: 'Live football scoreboard',
    description: 'Read a normalized live scoreboard for a supported league.',
    path: '/api/v1/sports?league=eng.1',
    params: [{ name: 'league', type: 'string', required: false, description: 'eng.1, esp.1, ita.1, ger.1, fra.1, or uefa.champions.' }],
  },
]

const categories = ['Core', 'Data', 'Media Search', 'Utilities', 'Sports']
const API_ORIGIN = 'https://www.toosiitech.org'
const publicEndpointUrl = path => `${API_ORIGIN}${path}`

const starterResponse = {
  success: true,
  api: 'Toosii API',
  version: 'v1',
  timestamp: '2026-08-12T00:00:00.000Z',
  status: 'operational',
}

const responseBodyPreview = endpoint => ({
  success: true,
  api: 'Toosii API',
  operation: endpoint.id.replaceAll('-', '.'),
  endpoint: `${endpoint.method} ${publicEndpointUrl(endpoint.path)}`,
  data: {
    note: 'Preview schema. Use Run request to retrieve a fresh live response.',
  },
})

export default function ApiPortal() {
  const [activeId, setActiveId] = useState('health')
  const [response, setResponse] = useState(starterResponse)
  const [state, setState] = useState('idle')
  const [copied, setCopied] = useState('')
  const [copiedPath, setCopiedPath] = useState('')
  const [previewedId, setPreviewedId] = useState('')
  const [previewTab, setPreviewTab] = useState('request')
  const [filter, setFilter] = useState('')
  const consoleRef = useRef(null)

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
      const result = await fetch(endpoint.path, { headers: { Accept: 'application/json' } })
      const body = await result.json()
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
                    <code>https://www.toosiitech.org/api/v1</code>
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
                                  <span className="api-method-badge">GET</span>
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
                                      <p>{endpoint.params.length ? `Query: ${endpoint.params.map(param => `${param.name}${param.required ? '*' : ''}`).join(', ')}` : 'No query parameters required.'}</p>
                                    </div>
                                  ) : (
                                    <div id={`response-panel-${endpoint.id}`} role="tabpanel" aria-labelledby={`response-tab-${endpoint.id}`} className="api-inline-tab-panel">
                                      <div className="api-inline-preview-head"><span>Response body preview</span><b>JSON</b></div>
                                      <pre className="api-inline-response">{JSON.stringify(responseBodyPreview(endpoint), null, 2)}</pre>
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
                    <div className="api-method-label"><span>GET</span> {active.category}</div>
                    <h3>{active.title}</h3>
                    <p>{active.description}</p>
                  </div>
                  <a href={active.path} target="_blank" rel="noreferrer" className="api-open-link">Open route <span aria-hidden="true">↗</span></a>
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
                      ) : <p className="api-empty">This endpoint does not require parameters.</p>}
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
