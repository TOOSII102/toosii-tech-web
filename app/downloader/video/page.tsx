'use client'
import { useState } from 'react'

type Result = {
  title: string
  thumbnail: string
  quality: string
  duration: string
  download_url: string
}

export default function VideoDownloaderPage() {
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<Result | null>(null)
  const [error, setError] = useState('')

  const handleDownload = async () => {
    if (!query.trim()) return
    setLoading(true); setError(''); setResult(null)
    try {
      const r = await fetch(`/api/download/video?q=${encodeURIComponent(query.trim())}`)
      const d = await r.json()
      if (d.error) setError(d.error)
      else setResult(d)
    } catch { setError('Request failed. Please try again.') }
    finally { setLoading(false) }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10 relative z-10">
      <div className="blob w-[300px] h-[300px] bg-[rgba(59,130,246,0.05)] -top-10 -right-20" />

      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 mb-4" style={{ background:'rgba(59,130,246,0.1)', border:'1px solid rgba(59,130,246,0.2)', color:'#3b82f6', padding:'6px 14px', borderRadius:'100px', fontSize:'0.8rem', fontWeight:600 }}>
          <i className="fas fa-video text-xs" /> Video Downloader
        </div>
        <h1 className="text-3xl font-extrabold mb-2">
          YouTube <span style={{ background:'linear-gradient(135deg,#3b82f6,#06b6d4)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text' }}>Video Downloader</span>
        </h1>
        <p className="text-gray-500 text-sm">Search for any YouTube video and download it as a 720p MP4. Powered by GiftedTech API.</p>
      </div>

      <div className="glass-card p-6 mb-5">
        <label className="block text-xs font-semibold text-gray-400 mb-2">Search YouTube or paste URL</label>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <i className="fas fa-search absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500 text-sm" />
            <input
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleDownload()}
              placeholder="e.g. Alan Walker Faded, or paste YouTube URL"
              className="input-field pl-10"
              disabled={loading}
            />
          </div>
          <button onClick={handleDownload} disabled={loading || !query.trim()}
            style={{ background:'linear-gradient(135deg,#3b82f6,#06b6d4)' }}
            className="px-5 py-3 rounded-xl text-sm font-semibold text-white flex items-center gap-2 transition-all hover:-translate-y-0.5 disabled:opacity-40 disabled:cursor-not-allowed shrink-0">
            {loading ? <i className="fas fa-spinner spinner" /> : <i className="fas fa-search" />}
          </button>
        </div>
      </div>

      {loading && (
        <div className="glass-card p-8 text-center">
          <i className="fas fa-spinner spinner text-[#3b82f6] text-2xl mb-3" />
          <p className="text-sm text-gray-400">Searching and preparing download...</p>
        </div>
      )}

      {error && (
        <div className="glass-card p-4 flex items-start gap-3 border-red-500/20">
          <i className="fas fa-exclamation-triangle text-red-400 text-sm mt-0.5" />
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}

      {result && (
        <div className="glass-card overflow-hidden">
          <div className="relative">
            <img src={result.thumbnail} alt={result.title} className="w-full h-44 object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0f0f1a] via-transparent to-transparent" />
            <div className="absolute bottom-3 left-4 right-4">
              <span className="text-xs px-2.5 py-1 rounded-lg font-semibold text-white" style={{ background:'rgba(59,130,246,0.8)' }}>
                <i className="fas fa-film mr-1.5" />{result.quality} • {result.duration}
              </span>
            </div>
          </div>
          <div className="p-5">
            <h3 className="font-bold text-sm text-white mb-1 line-clamp-2">{result.title}</h3>
            <p className="text-xs text-gray-500 mb-4">
              <i className="fas fa-info-circle mr-1.5" />Download link expires in 10 minutes
            </p>
            <a href={result.download_url} target="_blank" rel="noreferrer"
              style={{ background:'linear-gradient(135deg,#3b82f6,#06b6d4)' }}
              className="flex items-center justify-center gap-2 w-full py-3 rounded-xl text-sm font-semibold text-white transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-blue-500/25">
              <i className="fas fa-download" />
              Download MP4 ({result.quality})
            </a>
          </div>
        </div>
      )}

      <div className="glass-card p-5 mt-5">
        <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
          <i className="fas fa-lightbulb text-yellow-400 text-xs" /> Tips
        </h3>
        <ul className="space-y-2">
          {[
            'You can paste a full YouTube URL or just search by song/video name',
            'Videos are downloaded in 720p MP4 format',
            'Download links expire in 10 minutes — save quickly',
            'For audio-only, use the MP3 Downloader page',
          ].map((tip, i) => (
            <li key={i} className="flex items-start gap-2 text-xs text-gray-500">
              <i className="fas fa-check-circle text-[rgba(37,211,102,0.6)] mt-0.5 text-[10px]" />
              {tip}
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
