'use client'
import Layout from '../../../components/Layout'
import { useCallback, useEffect, useState } from 'react'
import '../tools.css'

const LEAGUES = [
  { code: 'epl', label: 'Premier League' },
  { code: 'laliga', label: 'La Liga' },
  { code: 'seriea', label: 'Serie A' },
  { code: 'bundesliga', label: 'Bundesliga' },
  { code: 'ligue1', label: 'Ligue 1' },
  { code: 'ucl', label: 'Champions League' },
]

const REFRESH_MS = 60_000

function statusChip(status) {
  const detail = status?.detail || '—'
  if (status?.state === 'in') return <span className="score-chip live">● {detail}</span>
  if (status?.state === 'finished') return <span className="score-chip ft">{detail}</span>
  return <span className="score-chip">{detail}</span>
}

function MatchRow({ match }) {
  const home = match.teams?.find(t => t.homeAway === 'home') || match.teams?.[0]
  const away = match.teams?.find(t => t.homeAway === 'away') || match.teams?.[1]
  const hasScore = home?.score != null || away?.score != null
  return (
    <div className="score-row">
      <span className="home">{home?.name || '—'}</span>
      {statusChip(match.status)}
      <span className="away">{away?.name || '—'}</span>
      <div className="score-meta">
        {hasScore && `${home?.score ?? 0} – ${away?.score ?? 0}`}
        {match.kickoff && !hasScore ? <> · KO {match.kickoff}</> : null}
        {match.date ? ` · ${match.date}` : ''}
      </div>
    </div>
  )
}

export default function ScoresTool() {
  const [live, setLive]         = useState(null)
  const [liveError, setLiveError] = useState('')
  const [loading, setLoading]   = useState(true)

  const [league, setLeague]     = useState('epl')
  const [tableType, setTableType] = useState('standings')
  const [table, setTable]       = useState(null)
  const [tableError, setTableError] = useState('')
  const [loadingTable, setLoadingTable] = useState(false)
  const [lastUpdated, setLastUpdated] = useState(null)

  const loadLive = useCallback(async (silent = false) => {
    if (!silent) setLoading(true)
    setLiveError('')
    try {
      const res = await fetch('/api/tools/livescore')
      const data = await res.json()
      if (!res.ok) {
        const message = data?.error?.message || 'Live scores are unavailable right now.'
        setLiveError(typeof message === 'string' ? message : 'Live scores are unavailable right now.')
        setLive(null)
      } else {
        setLive(data)
        setLastUpdated(new Date())
      }
    } catch {
      setLiveError('Network error — check your connection and try again.')
    } finally {
      if (!silent) setLoading(false)
    }
  }, [])

  const loadTable = useCallback(async () => {
    setLoadingTable(true)
    setTableError('')
    setTable(null)
    try {
      const res = await fetch(`/api/tools/league?league=${encodeURIComponent(league)}&type=${encodeURIComponent(tableType)}`)
      const data = await res.json()
      if (!res.ok) {
        const message = data?.error?.message || 'League data is unavailable right now.'
        setTableError(typeof message === 'string' ? message : 'League data is unavailable right now.')
      } else {
        setTable(data)
      }
    } catch {
      setTableError('Network error — check your connection and try again.')
    } finally {
      setLoadingTable(false)
    }
  }, [league, tableType])

  useEffect(() => {
    loadLive()
    const timer = setInterval(() => loadLive(true), REFRESH_MS)
    return () => clearInterval(timer)
  }, [loadLive])

  useEffect(() => {
    loadTable()
  }, [loadTable])

  const leagueLabel = LEAGUES.find(l => l.code === league)?.label || league

  return (
    <Layout>
      <section className="tool-hero">
        <div className="page-wrapper">
          <div style={{ marginBottom: '1.5rem' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '.5rem', padding: '.45rem 1rem', borderRadius: '999px', border: '1px solid rgba(34,197,94,.35)', background: 'rgba(34,197,94,.08)', color: '#86efac', fontSize: '.8rem', fontWeight: 700 }}>
              ⚽ Live Football Scores
            </span>
          </div>
          <h1 className="section-title">Every match, <span className="gradient-text">as it happens.</span></h1>
          <p className="section-sub">
            Live scores from the Premier League, La Liga, Serie A, Bundesliga, Ligue 1 and more — plus league tables and top scorers. Refreshes automatically every minute.
          </p>
        </div>
      </section>

      <section className="section" style={{ paddingTop: '1rem' }}>
        <div className="page-wrapper">
          <div className="tool-card glass-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
              <h3 style={{ margin: 0, color: '#86efac' }}>Live & Upcoming Matches</h3>
              <button onClick={() => loadLive()} disabled={loading} className="btn-outline" style={{ fontSize: '.8rem', padding: '.4rem .9rem' }}>
                {loading ? 'Refreshing…' : '↻ Refresh Now'}
              </button>
            </div>
            {lastUpdated && (
              <p style={{ margin: '.5rem 0 0', color: '#64748b', fontSize: '.75rem' }}>
                Updated {lastUpdated.toLocaleTimeString()} · auto-refreshes every 60s
              </p>
            )}

            {liveError && <p className="tool-error">{liveError}</p>}

            {loading && !live && (
              <div style={{ textAlign: 'center', padding: '2rem 0' }}>
                <div className="spinner" style={{ margin: '0 auto' }} />
                <p style={{ margin: '.75rem 0 0', color: '#94a3b8', fontSize: '.9rem' }}>Loading today’s fixtures…</p>
              </div>
            )}

            {live && (
              <div className="score-group">
                {live.leagues.map((group, index) => (
                  <details key={group.league} open={index < 2} style={{ marginBottom: '.8rem' }}>
                    <summary>
                      <span>{group.league}</span>
                      <span style={{ color: '#64748b', fontWeight: 500, fontSize: '.8rem' }}>{group.matchCount} matches</span>
                    </summary>
                    <div>
                      {group.matches.map(match => <MatchRow key={match.id} match={match} />)}
                    </div>
                  </details>
                ))}
              </div>
            )}
          </div>

          <div className="tool-card glass-card">
            <div className="essentials-form-row">
              <select value={league} onChange={e => setLeague(e.target.value)} className="tool-select" aria-label="League">
                {LEAGUES.map(l => <option key={l.code} value={l.code}>{l.label}</option>)}
              </select>
              <select value={tableType} onChange={e => setTableType(e.target.value)} className="tool-select" aria-label="Table type">
                <option value="standings">Standings</option>
                <option value="scorers">Top Scorers</option>
                <option value="upcoming">Upcoming Matches</option>
              </select>
            </div>

            {tableError && <p className="tool-error">{tableError}</p>}

            {loadingTable && <p style={{ margin: '1.25rem 0 0', color: '#94a3b8', fontSize: '.9rem' }}>Loading {leagueLabel} {tableType}…</p>}

            {table && tableType === 'standings' && table.table?.length > 0 && (
              <div style={{ overflowX: 'auto' }}>
                <table className="stand-table">
                  <thead>
                    <tr>
                      <th className="num">#</th><th>Team</th>
                      <th className="num">P</th><th className="num">W</th><th className="num">D</th><th className="num">L</th>
                      <th className="num">GD</th><th className="num">Pts</th>
                    </tr>
                  </thead>
                  <tbody>
                    {table.table.map((row, i) => (
                      <tr key={`${row.team}-${i}`} className={i < 2 ? (i === 0 ? 'pos-1' : 'pos-2') : ''}>
                        <td className="num">{row.position}</td>
                        <td>{row.team}</td>
                        <td className="num">{row.played ?? '—'}</td>
                        <td className="num">{row.wins ?? '—'}</td>
                        <td className="num">{row.draws ?? '—'}</td>
                        <td className="num">{row.losses ?? '—'}</td>
                        <td className="num">{row.goalDifference ?? '—'}</td>
                        <td className="num" style={{ fontWeight: 800, color: '#72f0ba' }}>{row.points ?? '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {table && tableType === 'scorers' && table.scorers?.length > 0 && (
              <div style={{ overflowX: 'auto' }}>
                <table className="stand-table">
                  <thead>
                    <tr><th>#</th><th>Player</th><th>Team</th><th className="num">Goals</th></tr>
                  </thead>
                  <tbody>
                    {table.scorers.slice(0, 20).map((row, i) => (
                      <tr key={`${row.player}-${i}`}>
                        <td className="num">{i + 1}</td>
                        <td>{row.player}</td>
                        <td>{row.team || '—'}</td>
                        <td className="num" style={{ fontWeight: 800, color: '#72f0ba' }}>{row.goals ?? '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {table && (tableType === 'matches' || tableType === 'upcoming') && table.matches?.length > 0 && (
              <div style={{ marginTop: '1rem' }}>
                {table.matches.slice(0, 30).map((match, i) => (
                  <div className="score-row" key={`${match.homeTeam}-${i}`} style={{ marginBottom: '.5rem', border: '1px solid rgba(255,255,255,.08)', borderRadius: 10, padding: '0.65rem 1rem' }}>
                    <span className="home">{match.homeTeam || '—'}</span>
                    <span className="score-chip">{match.score || match.status}</span>
                    <span className="away">{match.awayTeam || '—'}</span>
                  </div>
                ))}
              </div>
            )}

            {table && tableType === 'standings' && !table.table?.length && (
              <p style={{ margin: '1.25rem 0 0', color: '#94a3b8', fontSize: '.9rem' }}>No standings available for {leagueLabel} right now.</p>
            )}
            {table && tableType === 'scorers' && !table.scorers?.length && (
              <p style={{ margin: '1.25rem 0 0', color: '#94a3b8', fontSize: '.9rem' }}>No scorer data for {leagueLabel} right now.</p>
            )}

            <p style={{ margin: '1.5rem 0 0', color: '#666', fontSize: '.8rem' }}>
              Made by Toosii Tech · Powered by the Partner API · Scores are informational — check official sources for final results.
            </p>
          </div>
        </div>
      </section>
    </Layout>
  )
}
