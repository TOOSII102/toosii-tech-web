'use client'
import Layout from '../../../components/Layout'
import { useState, useRef } from 'react'
import '../tools.css'

const STEPS = {
  uploading:  'Uploading your audio to processing server…',
  removing:   'Removing vocals — this takes 30–60 seconds…',
  url_send:   'Sending audio URL for processing…',
}

function baseName(str) {
  // Extract filename without extension from a path or URL
  try {
    const p = new URL(str).pathname
    return decodeURIComponent(p.split('/').pop()).replace(/\.[^.]+$/, '') || 'audio'
  } catch {
    return str.split('/').pop().replace(/\.[^.]+$/, '') || 'audio'
  }
}

function sanitize(str) {
  return str.replace(/[^a-z0-9_\- .]/gi, '').trim().slice(0, 60) || 'audio'
}

export default function VocalRemover() {
  const [mode, setMode]       = useState('file')
  const [audioUrl, setAudioUrl] = useState('')
  const [file, setFile]       = useState(null)
  const [origName, setOrigName] = useState('audio')
  const [drag, setDrag]       = useState(false)
  const [result, setResult]   = useState(null)
  const [loading, setLoading] = useState(false)
  const [step, setStep]       = useState('')
  const [error, setError]     = useState('')
  const fileRef = useRef()

  const handleFile = (f) => {
    if (!f) return
    if (!/^audio\//i.test(f.type) && !/\.(mp3|wav|m4a|ogg|flac|aac)$/i.test(f.name)) {
      setError('Please upload an audio file — MP3, WAV, M4A, OGG, FLAC, or AAC.')
      return
    }
    if (f.size > 4 * 1024 * 1024) {
      setError(`File is too large (${(f.size/1024/1024).toFixed(1)} MB). Maximum is 4 MB. For larger files, use the 🔗 URL mode — upload your audio to Dropbox, Google Drive, or any file host and paste the direct link.`)
      return
    }
    setFile(f); setOrigName(sanitize(f.name.replace(/\.[^.]+$/, ''))); setError(''); setResult(null)
  }

  const process = async () => {
    setLoading(true); setError(''); setResult(null); setStep('')
    try {
      let res

      if (mode === 'url') {
        const trimmed = audioUrl.trim()
        if (!trimmed || !/^https?:\/\//i.test(trimmed)) {
          setError('Please enter a valid audio URL starting with https://')
          setLoading(false); return
        }
        setOrigName(sanitize(baseName(trimmed)))
        setStep(STEPS.url_send)
        res = await fetch('/api/tools/vocal-remover', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: trimmed }),
        })
      } else {
        if (!file) {
          setError('Please select an audio file first.')
          setLoading(false); return
        }
        setStep(STEPS.uploading)
        const fd = new FormData()
        fd.append('file', file)
        res = await fetch('/api/tools/vocal-remover', { method: 'POST', body: fd })
        setStep(STEPS.removing)
      }

      const text = await res.text()
      let data
      try {
        data = JSON.parse(text)
      } catch {
        setError('The server returned an unexpected response. Please try again in a moment.')
        setLoading(false); setStep(''); return
      }

      if (!res.ok || data.error) {
        setError(data.error || 'Processing failed. Please try again.')
        setLoading(false); setStep(''); return
      }

      setResult(data)
    } catch (e) {
      if (e?.name === 'AbortError' || e?.message?.includes('timeout')) {
        setError('Request timed out — the file may be too large or the service is busy. Try again.')
      } else {
        setError('Connection failed. Please check your internet and try again.')
      }
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
          <p className="section-sub">
            Upload an audio file from your device or paste a direct audio URL — get back the clean instrumental track and isolated vocals, ready to download.
          </p>
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
              <div>
                <div
                  className={`file-upload-area ${drag ? 'drag' : ''}`}
                  onClick={() => fileRef.current?.click()}
                  onDragOver={e => { e.preventDefault(); setDrag(true) }}
                  onDragLeave={() => setDrag(false)}
                  onDrop={e => { e.preventDefault(); setDrag(false); handleFile(e.dataTransfer.files[0]) }}
                >
                  <input
                    ref={fileRef}
                    type="file"
                    accept="audio/*,.mp3,.wav,.m4a,.ogg,.flac,.aac"
                    style={{ display: 'none' }}
                    onChange={e => handleFile(e.target.files[0])}
                  />
                  <span style={{ fontSize: '2.5rem' }}>🎵</span>
                  {file
                    ? <p style={{ color: '#25d366', fontWeight: 600 }}>✓ {file.name} ({(file.size / 1024 / 1024).toFixed(1)} MB)</p>
                    : <p>Drag & drop your audio file here<br /><span style={{ fontSize: '0.75rem' }}>MP3, WAV, M4A, OGG, FLAC, AAC — max 50 MB</span></p>
                  }
                </div>

                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  disabled={loading}
                  className="btn-secondary"
                  style={{ width: '100%', marginTop: '0.75rem' }}
                >
                  📂 Browse Files from Device
                </button>

                {file && (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '0.5rem', padding: '0.6rem 0.9rem', background: 'rgba(37,211,102,0.07)', borderRadius: 8, border: '1px solid rgba(37,211,102,0.2)' }}>
                    <span style={{ color: '#25d366', fontSize: '0.875rem', fontWeight: 600 }}>✓ {file.name}</span>
                    <button onClick={() => { setFile(null); setResult(null) }} style={{ background: 'none', border: 'none', color: '#666', cursor: 'pointer', fontSize: '1.1rem' }}>✕</button>
                  </div>
                )}
              </div>
            ) : (
              <div>
                <p style={{ margin: '0 0 0.6rem', color: '#94a3b8', fontSize: '0.85rem' }}>
                  Paste a <strong>direct audio file link</strong> — must end in <code style={{ color: '#25d366', background: 'rgba(37,211,102,0.08)', padding: '0 4px', borderRadius: 4 }}>.mp3</code>, <code style={{ color: '#25d366', background: 'rgba(37,211,102,0.08)', padding: '0 4px', borderRadius: 4 }}>.wav</code>, <code style={{ color: '#25d366', background: 'rgba(37,211,102,0.08)', padding: '0 4px', borderRadius: 4 }}>.m4a</code> etc. YouTube/SoundCloud links won't work.
                </p>
                <input
                  type="url"
                  placeholder="https://example.com/song.mp3"
                  value={audioUrl}
                  onChange={e => { setAudioUrl(e.target.value); setError('') }}
                  className="text-input"
                  style={{ marginBottom: '0.75rem' }}
                  onKeyDown={e => e.key === 'Enter' && !loading && process()}
                  disabled={loading}
                />
                <p style={{ margin: '0', color: '#555', fontSize: '0.78rem' }}>
                  💡 Tip: upload your file to <a href="https://catbox.moe" target="_blank" rel="noopener noreferrer" style={{ color: '#25d366' }}>catbox.moe</a> or <a href="https://tmpfiles.org" target="_blank" rel="noopener noreferrer" style={{ color: '#25d366' }}>tmpfiles.org</a> and paste the link here.
                </p>
              </div>
            )}

            <button
              onClick={process}
              disabled={loading || (mode === 'file' && !file)}
              className="btn-primary"
              style={{ width: '100%', marginTop: '0.75rem' }}
            >
              {loading ? (step || 'Processing…') : '🎙️ Remove Vocals'}
            </button>

            {loading && (
              <div className="progress-box" style={{ marginTop: '1rem' }}>
                <div className="spinner" />
                <span style={{ fontSize: '0.85rem' }}>{step || 'Processing audio…'}</span>
                <span style={{ marginLeft: 'auto', fontSize: '0.75rem', color: '#64748b' }}>up to 60s</span>
              </div>
            )}

            {error && <div className="error-box" style={{ marginTop: '1rem' }}>{error}</div>}

            {result && (
              <div className="tool-output" style={{ marginTop: '1.5rem' }}>
                <div className="tool-output-header">
                  <span style={{ fontWeight: 700, color: '#25d366' }}>✅ Processing Complete</span>
                </div>
                <p style={{ color: '#94a3b8', fontSize: '0.85rem', margin: '0.5rem 0 1rem' }}>
                  Both tracks are ready — download the instrumental, the isolated vocals, or both.
                </p>
                <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                  <a
                    href={`/api/download/proxy?url=${encodeURIComponent(result.instrumental)}&name=${encodeURIComponent(origName + '_instrumental.mp3')}`}
                    download
                    className="btn-primary"
                    style={{ textDecoration: 'none' }}
                  >
                    🎸 Download Instrumental
                  </a>
                  {result.vocal && (
                    <a
                      href={`/api/download/proxy?url=${encodeURIComponent(result.vocal)}&name=${encodeURIComponent(origName + '_vocals.mp3')}`}
                      download
                      className="btn-secondary"
                      style={{ textDecoration: 'none' }}
                    >
                      🎤 Download Vocals Only
                    </a>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="tips-grid">
            {[
              { icon: '🎙️', title: 'AI Vocal Removal', desc: 'AI-powered stem separation cleanly removes vocals from most songs.' },
              { icon: '📁', title: 'File or URL',       desc: 'Upload from your device or paste a direct link to any audio file online.' },
              { icon: '🎸', title: 'Two Tracks',        desc: 'Get both the clean instrumental AND the isolated vocal track separately.' },
              { icon: '🔒', title: 'No Sign-up',        desc: 'No account needed. Upload, process, and download — that\'s it.' },
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
