'use client'
import Layout from '../../../components/Layout'
import { useState } from 'react'
import '../tools.css'

export default function ApkSearch() {
  const [query, setQuery]   = useState('')
  const [results, setResults] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError]   = useState('')

  const search = async () => {
    const q = query.trim()
    if (!q) return setError('Please enter an app name to search')

    setLoading(true); setError(''); setResults(null)
    try {
      const res = await fetch('/api/tools/apk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: q }),
      })
      const data = await res.json()
      if (!res.ok || data.error) return setError(data.error || 'Search failed.')
      setResults(data.apps)
    } catch {
      setError('Network error — please check your connection and try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Layout>
      <section className="tool-hero">
        <div className="page-wrapper">
          <div className="badge" style={{ marginBottom: '1.5rem' }}><span>📦</span> APK Downloader</div>
          <h1 className="section-title">Search & Download APK Files</h1>
          <p className="section-sub">Find any Android app and download the APK directly. No Play Store needed.</p>
        </div>
      </section>

      <section className="section" style={{ paddingTop: '1rem' }}>
        <div className="page-wrapper">
          <div className="tool-card glass-card">
            <div className="tool-input-row">
              <input
                type="text"
                placeholder="Search for an app (e.g. WhatsApp, TikTok…)"
                value={query}
                onChange={e => { setQuery(e.target.value); setError('') }}
                className="text-input"
                onKeyDown={e => e.key === 'Enter' && !loading && search()}
                disabled={loading}
              />
              <button onClick={search} disabled={loading} className="btn-primary">
                {loading ? 'Searching…' : 'Search'}
              </button>
            </div>

            {loading && (
              <div className="progress-box">
                <div className="spinner" />
                <span>Searching APK database…</span>
              </div>
            )}

            {error && <div className="error-box">{error}</div>}

            {results && (
              <div className="apk-list">
                {results.map((app, i) => (
                  <div key={i} className="apk-item">
                    {app.icon
                      ? <img src={app.icon} alt={app.name} className="apk-icon" onError={e => e.target.style.display='none'} />
                      : <div className="apk-icon-placeholder">📱</div>
                    }
                    <div className="apk-info">
                      <div className="apk-name">{app.name}</div>
                      <div className="apk-meta">
                        {app.version && <span className="badge" style={{ marginRight: '0.4rem' }}>v{app.version}</span>}
                        {app.size    && <span className="badge">{app.size}</span>}
                        {app.package && <span style={{ display: 'block', marginTop: '0.3rem', fontSize: '0.72rem', color: '#475569' }}>{app.package}</span>}
                      </div>
                    </div>
                    {app.download && (
                      <a
                        href={`/api/download/proxy?url=${encodeURIComponent(app.download)}&name=${encodeURIComponent(app.name.replace(/[^\w\s-]/g,'').trim()+'.apk')}`}
                        download
                        className="btn-primary"
                        style={{ whiteSpace: 'nowrap', flexShrink: 0 }}
                      >
                        ⬇ APK
                      </a>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="tips-grid">
            {[
              { icon: '📦', title: 'Any Android App',  desc: 'Search millions of APKs from the database.' },
              { icon: '📋', title: 'Version Info',      desc: 'See version number and file size before downloading.' },
              { icon: '🔒', title: 'No Sign-up',        desc: 'No account needed. Search and download freely.' },
              { icon: '⚡', title: 'Direct Download',   desc: 'Get the APK file straight to your device.' },
            ].map(t => (
              <div key={t.title} className="tip-card glass-card">
                <span className="tip-icon">{t.icon}</span>
                <h3>{t.title}</h3>
                <p>{t.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </Layout>
  )
}
