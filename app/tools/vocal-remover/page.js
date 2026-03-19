'use client'
import Layout from '../../../components/Layout'
import { useState, useRef } from 'react'
import '../tools.css'

export default function VocalRemover() {
  const [mode, setMode]         = useState('file') // 'file' | 'url'
  const [audioUrl, setAudioUrl] = useState('')
  const [file, setFile]         = useState(null)
  const [drag, setDrag]         = useState(false)
  const [result, setResult]     = useState(null)
  const [loading, setLoading]   = useState(false)
  const [step, setStep]         = useState('')
  const [error, setError]       = useState('')
  const fileRef = useRef()

  const handleFile = (f) => {
    if (!f) return
    if (!/^audio\//i.test(f.type)) return setError('Please upload an audio file (MP3, WAV, M4A, etc.)')
    setFile(f); setError('')
  }

  const process = async () => {
    setLoading(true); setError(''); setResult(null)
    try {
      let res, data

      if (mode === 'url') {
        const trimmed = audioUrl.trim()
        if (!trimmed || !/^https?:\/\//i.test(trimmed)) {
          setError('Please enter a valid audio URL starting with http://'); setLoading(false); return
        }
        setStep('Sending to vocal remover…')
        res = await fetch('/api/tools/vocal-remover', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: trimmed }),
        })
      } else {
        if (!file) { setError('Please select an audio file first.'); setLoading(false); return }
        setStep('Uploading audio…')
        const fd = new FormData()
        fd.append('file', file)
        res = await fetch('/api/tools/vocal-remover', { method: 'POST', body: fd })
        setStep('Removing vocals…')
      }

      data = await res.json()
      if (!res.ok || data.error) return setError(data.error || 'Processing failed.')
      setResult(data)
    } catch {
      setError('Network error — please check your connection and try again.')
    } finally {
      setLoading(false); setStep('')
    }
  }

  return (
    <Layout>
      <section className="tool-hero">
        <div className="page-wrapper">
          <div className="badge" style={{ marginBottom: '1.5rem' }}><span>🎙️</span> Vocal Remover</div>
          <h1 className="section-title">Remove Vocals from Any Song</h1>
          <p className="section-sub">Upload an audio file or paste a URL — get back the instrumental track instantly.</p>
        </div>
      </section>

      <section className="section" style={{ paddingTop: '1rem' }}>
        <div className="page-wrapper">
          <div className="tool-card glass-card">
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem' }}>
              {['file', 'url'].map(m => (
                <button
                  key={m}
                  onClick={() => { setMode(m); setError(''); setResult(null) }}
                  className={mode === m ? 'btn-primary' : 'btn-outline'}
                  style={{ flex: 1 }}
                  disabled={loading}
                >
                  {m === 'file' ? '📁 Upload File' : '🔗 Paste URL'}
                </button>
              ))}
            </div>

            {mode === 'file' ? (
              <div
                className={`file-upload-area ${drag ? 'drag' : ''}`}
                onClick={() => fileRef.current?.click()}
                onDragOver={e => { e.preventDefault(); setDrag(true) }}
                onDragLeave={() => setDrag(false)}
                onDrop={e => { e.preventDefault(); setDrag(false); handleFile(e.dataTransfer.files[0]) }}
              >
                <input
                  ref={fileRef} type="file" accept="audio/*" style={{ display: 'none' }}
                  onChange={e => handleFile(e.target.files[0])}
                />
                <span style={{ fontSize: '2.5rem' }}>🎵</span>
                {file
                  ? <p style={{ color: '#25d366', fontWeight: 600 }}>✓ {file.name}</p>
                  : <p>Drag & drop an audio file here, or click to browse<br /><span style={{ fontSize: '0.75rem' }}>MP3, WAV, M4A, OGG — max 50MB</span></p>
                }
              </div>
            ) : (
              <input
                type="url"
                placeholder="https://example.com/song.mp3"
                value={audioUrl}
                onChange={e => { setAudioUrl(e.target.value); setError('') }}
                className="text-input"
                style={{ marginBottom: '1rem' }}
                onKeyDown={e => e.key === 'Enter' && !loading && process()}
                disabled={loading}
              />
            )}

            <button onClick={process} disabled={loading} className="btn-primary" style={{ width: '100%' }}>
              {loading ? (step || 'Processing…') : '🎙️ Remove Vocals'}
            </button>

            {loading && (
              <div className="progress-box" style={{ marginTop: '1rem' }}>
                <div className="spinner" />
                <span>{step || 'Processing audio…'}</span>
                <span style={{ marginLeft: 'auto', fontSize: '0.75rem', color: '#64748b' }}>may take 30–60s</span>
              </div>
            )}

            {error && <div className="error-box">{error}</div>}

            {result && (
              <div className="tool-output" style={{ marginTop: '1.5rem' }}>
                <div className="tool-output-header">
                  <span style={{ fontWeight: 700, color: '#25d366' }}>✅ Instrumental Ready</span>
                </div>
                <p style={{ color: '#94a3b8', fontSize: '0.85rem', marginBottom: '1rem' }}>
                  Your instrumental track has been extracted. Download it below.
                </p>
                <a
                  href={`/api/download/proxy?url=${encodeURIComponent(result.instrumental)}&name=instrumental.mp3`}
                  download
                  className="btn-primary"
                  style={{ width: 'fit-content' }}
                >
                  ⬇ Download Instrumental
                </a>
              </div>
            )}
          </div>

          <div className="tips-grid">
            {[
              { icon: '🎙️', title: 'AI Vocal Removal', desc: 'AI-powered separation removes vocals cleanly from most songs.' },
              { icon: '📁', title: 'Upload or URL',     desc: 'Upload an audio file or just paste a direct audio link.' },
              { icon: '🔒', title: 'No Sign-up',        desc: 'No account needed. Process and download instantly.' },
              { icon: '⚡', title: 'Fast Processing',   desc: 'Results ready in under a minute for most tracks.' },
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
