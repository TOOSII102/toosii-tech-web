'use client'
  import { useState, useEffect, useCallback } from 'react'
  import { useRouter } from 'next/navigation'
  import './admin.css'

  /* ── Static site data ── */
  const API_ROUTES = [
    { path: '/api/download/video',    label: 'Video Downloader',   method: 'GET'  },
    { path: '/api/download/audio',    label: 'Audio Downloader',   method: 'GET'  },
    { path: '/api/download/tiktok',   label: 'TikTok Downloader',  method: 'GET'  },
    { path: '/api/download/spotify',  label: 'Spotify Download',   method: 'GET'  },
    { path: '/api/pair',              label: 'WhatsApp Pair',      method: 'GET'  },
    { path: '/api/qr',                label: 'QR Generator',       method: 'GET'  },
    { path: '/api/search/youtube',    label: 'YouTube Search',     method: 'GET'  },
    { path: '/api/search/spotify',    label: 'Spotify Search',     method: 'GET'  },
    { path: '/api/tools/ai',          label: 'Toosii AI',          method: 'POST' },
    { path: '/api/tools/apk',         label: 'APK Downloader',     method: 'GET'  },
    { path: '/api/tools/movies',      label: 'Movies',             method: 'GET'  },
    { path: '/api/tools/tempemail',   label: 'Temp Email',         method: 'GET'  },
    { path: '/api/tools/vocal-remover', label: 'Vocal Remover',   method: 'POST' },
    { path: '/api/tools/firelogo',    label: 'Fire Logo',          method: 'GET'  },
    { path: '/api/tools/story',       label: 'Story Generator',    method: 'GET'  },
    { path: '/api/tools/dramabox',    label: 'Dramabox',           method: 'GET'  },
    { path: '/api/tools/spotify',     label: 'Spotify Tools',      method: 'GET'  },
  ]

  const PAGES = [
    { path: '/',                    label: 'Home'              },
    { path: '/bot',                 label: 'Bot'               },
    { path: '/tools',               label: 'Tools'             },
    { path: '/downloader/video',    label: 'Video Downloader'  },
    { path: '/downloader/audio',    label: 'Audio Downloader'  },
    { path: '/downloader/spotify',  label: 'Spotify Downloader'},
    { path: '/session',             label: 'Session Generator' },
    { path: '/tools/ai',            label: 'AI Chat'           },
    { path: '/tools/movies',        label: 'Movies'            },
    { path: '/tools/apk',           label: 'APK Download'      },
    { path: '/tools/tempemail',     label: 'Temp Email'        },
    { path: '/tools/vocal-remover', label: 'Vocal Remover'     },
    { path: '/tools/firelogo',      label: 'Fire Logo'         },
    { path: '/tools/story',         label: 'Story Generator'   },
    { path: '/tools/spotify',       label: 'Spotify Lyrics'    },
    { path: '/blog',                label: 'Blog'              },
    { path: '/about',               label: 'About'             },
    { path: '/contact',             label: 'Contact'           },
    { path: '/team',                label: 'Team'              },
    { path: '/projects',            label: 'Projects'          },
  ]

  /* ── Helpers ── */
  function formatUptime(secs) {
    if (secs == null) return '—'
    const d = Math.floor(secs / 86400)
    const h = Math.floor((secs % 86400) / 3600)
    const m = Math.floor((secs % 3600) / 60)
    const s = secs % 60
    if (d > 0) return `${d}d ${h}h ${m}m`
    if (h > 0) return `${h}h ${m}m ${s}s`
    if (m > 0) return `${m}m ${s}s`
    return `${s}s`
  }

  function timeAgo(ts) {
    if (!ts) return '—'
    const diff = Date.now() - new Date(ts).getTime()
    const m = Math.floor(diff / 60000)
    const h = Math.floor(diff / 3600000)
    const d = Math.floor(diff / 86400000)
    if (m < 1)  return 'just now'
    if (m < 60) return `${m}m ago`
    if (h < 24) return `${h}h ago`
    return `${d}d ago`
  }

  function StatCard({ icon, label, value, accent }) {
    return (
      <div className="ad-stat" style={{ '--accent': accent }}>
        <span className="ad-stat-icon">{icon}</span>
        <span className="ad-stat-value">{value ?? '—'}</span>
        <span className="ad-stat-label">{label}</span>
      </div>
    )
  }

  function Dot({ status }) {
    return <span className={`ad-dot ad-dot--${status}`} />
  }

  /* ── Main component ── */
  export default function AdminDashboard() {
    const router = useRouter()
    const [stats,          setStats]         = useState(null)
    const [loading,        setLoading]       = useState(true)
    const [lastRefresh,    setLastRefresh]   = useState(null)
    const [health,         setHealth]        = useState({})
    const [checkingHealth, setCheckingHealth] = useState(false)
    const [activeTab,      setActiveTab]     = useState('overview')

    const [visitors, setVisitors] = useState(null)
      const [visLoad,   setVisLoad]   = useState(false)

      const fetchVisitors = useCallback(async () => {
        setVisLoad(true)
        try {
          const r = await fetch('/api/admin/visitors')
          if (r.ok) setVisitors(await r.json())
        } catch {}
        setVisLoad(false)
      }, [])

      const fetchStats = useCallback(async () => {
      try {
        const res = await fetch('/api/admin/stats')
        if (res.status === 401) { router.push('/admin/login'); return }
        const data = await res.json()
        setStats(data)
        setLastRefresh(new Date())
      } catch {}
      setLoading(false)
    }, [router])

    const checkHealth = useCallback(async () => {
      setCheckingHealth(true)
      const results = {}
      await Promise.allSettled(
        API_ROUTES.map(async (route) => {
          const start = Date.now()
          try {
            const res = await fetch(route.path + '?_ping=1', {
              method: route.method === 'POST' ? 'POST' : 'GET',
              signal: AbortSignal.timeout(8000),
              ...(route.method === 'POST'
                ? { headers: { 'Content-Type': 'application/json' }, body: '{}' }
                : {}),
            })
            const ms = Date.now() - start
            // 400/422 = route exists (bad input) — that's fine. 500 = broken.
            const ok = res.status !== 500 && ms < 8000
            results[route.path] = { ok, ms, code: res.status }
          } catch {
            results[route.path] = { ok: false, ms: Date.now() - start, code: 'ERR' }
          }
        })
      )
      setHealth(results)
      setCheckingHealth(false)
    }, [])

    const logout = useCallback(async () => {
      await fetch('/api/admin/logout', { method: 'POST' })
      router.push('/admin/login')
    }, [router])

    useEffect(() => {
        fetchStats()
        checkHealth()
        const id = setInterval(fetchStats, 30_000)
        return () => clearInterval(id)
      }, [fetchStats, checkHealth])

      useEffect(() => {
        if (activeTab === 'visitors') fetchVisitors()
      }, [activeTab, fetchVisitors])

    const healthOk  = Object.values(health).filter(h => h.ok).length
    const healthBad = Object.values(health).filter(h => !h.ok).length
    const gh = stats?.github
    const sv = stats?.server

    if (loading) return (
      <div className="ad-loading">
        <div className="ad-spinner" />
        <p>Loading dashboard…</p>
      </div>
    )

    return (
      <div className="ad-root">
        {/* HEADER */}
        <header className="ad-header">
          <div className="ad-header-left">
            <a href="/" className="ad-brand-link" title="View live site">
                <img src="/logo.png" alt="Toosii Tech" className="ad-brand-logo" />
                <span className="ad-brand">Toosii Tech</span>
              </a>
              <span className="ad-badge">ADMIN</span>
            </div>
          <div className="ad-header-right">
            {lastRefresh && (
              <span className="ad-refresh-label">Updated {timeAgo(lastRefresh)}</span>
            )}
            <button className="ad-btn-ghost" onClick={fetchStats}>↻</button>
            <button className="ad-btn-danger" onClick={logout}>Sign Out</button>
          </div>
        </header>

        {/* NAV TABS */}
        <nav className="ad-tabs">
          {['overview', 'visitors', 'health', 'pages', 'commits', 'server'].map(tab => (
            <button
              key={tab}
              className={`ad-tab ${activeTab === tab ? 'ad-tab--active' : ''}`}
              onClick={() => setActiveTab(tab)}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </nav>

        <main className="ad-main">

          {/* ── OVERVIEW TAB ── */}
          {activeTab === 'overview' && (
            <>
              <div className="ad-stat-grid">
                <StatCard icon="📄" label="Pages"        value={PAGES.length}                    accent="#3b82f6" />
                <StatCard icon="⚡" label="API Routes"   value={API_ROUTES.length}               accent="#25d366" />
                <StatCard icon="⭐" label="GitHub Stars" value={gh?.stargazers_count}            accent="#f59e0b" />
                <StatCard icon="🔀" label="Forks"        value={gh?.forks_count}                 accent="#8b5cf6" />
                <StatCard icon="🐛" label="Open Issues"  value={gh?.open_issues_count}           accent="#ef4444" />
                <StatCard icon="⏱" label="Uptime"       value={formatUptime(sv?.uptime)}        accent="#25d366" />
                <StatCard icon="🏥" label="Routes OK"    value={healthOk || '—'}                 accent="#25d366" />
                <StatCard icon="⚠" label="Routes Down"  value={healthBad || '—'}                accent="#ef4444" />
              </div>

              {gh && (
                <div className="ad-card">
                  <h2 className="ad-card-title">📦 Repository</h2>
                  <div className="ad-rows">
                    {[
                      ['Repository',   <a href={gh.html_url} target="_blank" rel="noopener" className="ad-link">{gh.full_name}</a>],
                      ['Description',  gh.description],
                      ['Language',     <span className="ad-chip ad-chip--blue">{gh.language}</span>],
                      ['Visibility',   <span className={`ad-chip ${gh.private ? 'ad-chip--red' : 'ad-chip--green'}`}>{gh.private ? '🔒 Private' : '🌐 Public'}</span>],
                      ['Last Push',    timeAgo(gh.pushed_at)],
                      ['Watchers',     gh.watchers_count],
                      ['Size',         `${gh.size} KB`],
                    ].map(([label, val]) => (
                      <div key={label} className="ad-row">
                        <span className="ad-row-label">{label}</span>
                        <span className="ad-row-value">{val}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          {/* ── VISITORS TAB ── */}
            {activeTab === 'visitors' && (
              <div className="ad-visitors">

                {/* ── Vercel Analytics summary ── */}
                {visitors?.vercel?.enabled ? (
                  <>
                    {/* Overview stats */}
                    {visitors.vercel.stats?.data && (
                      <div className="ad-card">
                        <div className="ad-card-title">Last 7 Days — Vercel Analytics</div>
                        <div className="ad-stat-grid">
                          <StatCard icon="👥" label="Visitors"       value={visitors.vercel.stats.data.visitors?.value   ?? '—'} accent="#25d366" />
                          <StatCard icon="👁" label="Page Views"     value={visitors.vercel.stats.data.pageViews?.value  ?? '—'} accent="#3b82f6" />
                          <StatCard icon="📊" label="Sessions"       value={visitors.vercel.stats.data.sessions?.value   ?? '—'} accent="#8b5cf6" />
                          <StatCard icon="⏱" label="Avg Duration"   value={visitors.vercel.stats.data.duration?.value   ? Math.round(visitors.vercel.stats.data.duration.value) + 's' : '—'} accent="#f59e0b" />
                        </div>
                      </div>
                    )}

                    {/* Top pages from Vercel */}
                    {visitors.vercel.topPages?.data?.length > 0 && (
                      <div className="ad-card">
                        <div className="ad-card-title">Top Pages</div>
                        <div className="ad-vis-table">
                          {visitors.vercel.topPages.data.map((p, i) => (
                            <div key={p.key} className="ad-vis-row">
                              <span className="ad-vis-rank">#{i + 1}</span>
                              <span className="ad-vis-path">{p.key}</span>
                              <span className="ad-vis-bar-wrap">
                                <span className="ad-vis-bar" style={{ width: `${Math.round((p.total / (visitors.vercel.topPages.data[0]?.total || 1)) * 100)}%` }} />
                              </span>
                              <span className="ad-vis-count">{p.total?.toLocaleString()} views</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Countries */}
                    {visitors.vercel.countries?.data?.length > 0 && (
                      <div className="ad-card">
                        <div className="ad-card-title">Visitors by Country</div>
                        <div className="ad-vis-table">
                          {visitors.vercel.countries.data.slice(0, 10).map((c, i) => (
                            <div key={c.key} className="ad-vis-row">
                              <span className="ad-vis-rank">#{i + 1}</span>
                              <span className="ad-vis-flag">{c.key ? String.fromCodePoint(...[...c.key.toUpperCase()].map(ch => 0x1F1E6 - 65 + ch.charCodeAt(0))) : '🌐'}</span>
                              <span className="ad-vis-path">{c.key || 'Unknown'}</span>
                              <span className="ad-vis-bar-wrap">
                                <span className="ad-vis-bar" style={{ width: `${Math.round((c.total / (visitors.vercel.countries.data[0]?.total || 1)) * 100)}%` }} />
                              </span>
                              <span className="ad-vis-count">{c.total?.toLocaleString()}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  /* Setup required card */
                  <div className="ad-card ad-va-setup">
                    <div className="ad-va-setup-icon">🔑</div>
                    <div className="ad-va-setup-title">One Step to Unlock Full Analytics</div>
                    <div className="ad-va-setup-body">
                      Add <code>VERCEL_TOKEN</code> to your Vercel environment variables and visitor data will appear here automatically — no external dashboard needed.
                    </div>
                    <ol className="ad-va-steps">
                      <li>Go to <strong>vercel.com → Account → Tokens</strong> → create a token</li>
                      <li>Go to your project → <strong>Settings → Environment Variables</strong></li>
                      <li>Add <code>VERCEL_TOKEN</code> = your token</li>
                      <li>Redeploy — data shows here instantly</li>
                    </ol>
                    {visitors?.vercel?.error && (
                      <div className="ad-va-setup-note">Status: {visitors.vercel.error}</div>
                    )}
                  </div>
                )}

                {/* ── Session live feed (always shown) ── */}
                <div className="ad-card">
                  <div className="ad-card-title">
                    Live Session Feed
                    <button className="ad-btn-ghost ad-vis-refresh" onClick={fetchVisitors}>
                      {visLoad ? '…' : '↻ Refresh'}
                    </button>
                  </div>
                  {!visitors ? (
                    <p className="ad-muted" style={{ padding: '1rem 0' }}>
                      {visLoad ? 'Loading…' : <button className="ad-btn-ghost" onClick={fetchVisitors}>Load now</button>}
                    </p>
                  ) : (
                    <>
                      <div className="ad-stat-grid" style={{ marginBottom: '1.5rem' }}>
                        <StatCard icon="📡" label="Requests (session)" value={visitors.totalRequests} accent="#25d366" />
                        <StatCard icon="⏱" label="Server Uptime"      value={visitors.uptime + 's'}  accent="#3b82f6" />
                      </div>

                      {visitors.topPages?.length > 0 && (
                        <>
                          <div className="ad-card-sub">Top Paths This Session</div>
                          <div className="ad-vis-table">
                            {visitors.topPages.map((p, i) => (
                              <div key={p.path} className="ad-vis-row">
                                <span className="ad-vis-rank">#{i + 1}</span>
                                <span className="ad-vis-path">{p.path}</span>
                                <span className="ad-vis-count">{p.count} hits</span>
                              </div>
                            ))}
                          </div>
                        </>
                      )}

                      {visitors.recent?.length > 0 && (
                        <>
                          <div className="ad-card-sub" style={{ marginTop: '1.5rem' }}>Recent Hits</div>
                          <div className="ad-vis-table">
                            {visitors.recent.map((v, i) => (
                              <div key={i} className="ad-vis-row">
                                <span className="ad-vis-flag" title={v.country}>{v.country || '🌐'}</span>
                                <span className="ad-vis-path">{v.path}</span>
                                <span className="ad-muted" style={{ fontSize: '0.72rem', whiteSpace: 'nowrap' }}>{new Date(v.ts).toLocaleTimeString()}</span>
                              </div>
                            ))}
                          </div>
                        </>
                      )}
                    </>
                  )}
                </div>

              </div>
            )}

            {/* ── HEALTH TAB ── */}
          {activeTab === 'health' && (
            <div className="ad-card">
              <div className="ad-card-header">
                <h2 className="ad-card-title">🏥 API Health Monitor</h2>
                <button
                  className="ad-btn-ghost"
                  onClick={checkHealth}
                  disabled={checkingHealth}
                >
                  {checkingHealth ? 'Checking…' : '↻ Check All'}
                </button>
              </div>

              {Object.keys(health).length === 0 && !checkingHealth && (
                <p className="ad-muted">Click "Check All" to run health checks.</p>
              )}

              {checkingHealth && (
                <div className="ad-health-checking">
                  <div className="ad-spinner" />
                  <span>Pinging all {API_ROUTES.length} routes…</span>
                </div>
              )}

              <div className="ad-health-grid">
                {API_ROUTES.map(route => {
                  const h = health[route.path]
                  const status = !h ? 'idle' : h.ok ? 'ok' : 'err'
                  return (
                    <div key={route.path} className={`ad-health-card ad-health-card--${status}`}>
                      <div className="ad-health-top">
                        <Dot status={status} />
                        <span className="ad-health-label">{route.label}</span>
                        {h && <span className="ad-health-ms">{h.ms}ms</span>}
                      </div>
                      <span className="ad-health-path">{route.path}</span>
                      <div className="ad-health-bottom">
                        <span className="ad-chip ad-chip--tiny">{route.method}</span>
                        {h && (
                          <span className={`ad-health-code ${status === 'ok' ? 'ad-text-green' : 'ad-text-red'}`}>
                            HTTP {h.code} {status === 'ok' ? '✓' : '✗'}
                          </span>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* ── PAGES TAB ── */}
          {activeTab === 'pages' && (
            <div className="ad-card">
              <h2 className="ad-card-title">📄 All Pages</h2>
              <div className="ad-pages-grid">
                {PAGES.map(p => (
                  <a key={p.path} href={p.path} target="_blank" rel="noopener" className="ad-page-card">
                    <span className="ad-page-label">{p.label}</span>
                    <span className="ad-page-path">{p.path}</span>
                    <span className="ad-page-arrow">↗</span>
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* ── COMMITS TAB ── */}
          {activeTab === 'commits' && (
            <div className="ad-card">
              <h2 className="ad-card-title">🔀 Recent Commits</h2>
              {!stats?.commits?.length && (
                <p className="ad-muted">No commits found or GitHub rate limit reached.</p>
              )}
              <div className="ad-commits">
                {(stats?.commits || []).map((c, i) => (
                  <div key={i} className="ad-commit">
                    <div className="ad-commit-line" />
                    <div className="ad-commit-dot-wrap">
                      <div className="ad-commit-dot" />
                    </div>
                    <div className="ad-commit-body">
                      <p className="ad-commit-msg">{c.commit.message.split('\n')[0]}</p>
                      <div className="ad-commit-meta">
                        <span className="ad-chip ad-chip--ghost">{c.commit.author.name}</span>
                        <span className="ad-muted">{timeAgo(c.commit.author.date)}</span>
                      </div>
                    </div>
                    <a href={c.html_url} target="_blank" rel="noopener" className="ad-commit-link">
                      ↗
                    </a>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── SERVER TAB ── */}
          {activeTab === 'server' && sv && (
            <div className="ad-card">
              <h2 className="ad-card-title">🖥 Server Info</h2>
              <div className="ad-rows">
                {[
                  ['Node.js Version', sv.nodeVersion],
                  ['Platform',        sv.platform],
                  ['Memory Used',     `${sv.memoryMB} MB`],
                  ['Uptime',          formatUptime(sv.uptime)],
                  ['Environment',     <span className={`ad-chip ${sv.env === 'production' ? 'ad-chip--green' : 'ad-chip--blue'}`}>{sv.env}</span>],
                  ['Total Requests',  sv.totalRequests],
                ].map(([label, val]) => (
                  <div key={label} className="ad-row">
                    <span className="ad-row-label">{label}</span>
                    <span className="ad-row-value">{val}</span>
                  </div>
                ))}
              </div>

              <div className="ad-memory-bar-wrap">
                <div className="ad-memory-bar-label">
                  <span>Heap Usage</span>
                  <span>{sv.memoryMB} MB</span>
                </div>
                <div className="ad-memory-track">
                  <div
                    className="ad-memory-fill"
                    style={{ width: `${Math.min(sv.memoryMB / 5, 100)}%` }}
                  />
                </div>
              </div>
            </div>
          )}

        </main>
      </div>
    )
  }
  