'use client'
import Layout from '../../../components/Layout'
import { useState, useRef, useCallback } from 'react'
import '../tools.css'

export default function RemoveBg() {
  const [original, setOriginal] = useState(null)   // { dataUrl }
  const [result, setResult]     = useState(null)   // object URL
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')
  const [dragging, setDragging] = useState(false)
  const [dlDone, setDlDone]     = useState(false)
  const fileRef = useRef(null)

  const process = useCallback(async (file) => {
    if (!file) return
    if (!file.type.startsWith('image/')) return setError('Please choose an image file (photo or screenshot).')
    setLoading(true); setError(''); setResult(null); setDlDone(false)
    try {
      // Read + downscale to keep uploads fast (server cap is 8 MB).
      const dataUrl = await new Promise((res, rej) => {
        const r = new FileReader()
        r.onload = () => res(r.result)
        r.onerror = rej
        r.readAsDataURL(file)
      })
      const { blob, previewUrl } = await new Promise((resolve, reject) => {
        const img = new Image()
        img.onload = () => {
          const MAX = 1280
          if (img.width <= MAX && img.height <= MAX) return resolve({ blob: file, previewUrl: dataUrl })
          const s = MAX / Math.max(img.width, img.height)
          const c = document.createElement('canvas')
          c.width = Math.round(img.width * s); c.height = Math.round(img.height * s)
          c.getContext('2d').drawImage(img, 0, 0, c.width, c.height)
          c.toBlob(b => b ? resolve({ blob: b, previewUrl: c.toDataURL('image/jpeg', .85) }) : reject(new Error('prep failed')), 'image/jpeg', .85)
        }
        img.onerror = () => reject(new Error('Could not read that image.'))
        img.src = dataUrl
      })
      setOriginal({ dataUrl: previewUrl })

      const fd = new FormData()
      fd.append('file', blob, file.name || 'image.jpg')
      const res = await fetch('/api/tools/remove-bg', { method: 'POST', body: fd })
      if (!res.ok) {
        const j = await res.json().catch(() => ({}))
        throw new Error(j.error || 'Background removal failed. Try again.')
      }
      const outBlob = await res.blob()
      setResult(URL.createObjectURL(outBlob))
    } catch (e) {
      setError(e.message || 'Network error — check your connection and try again.')
    } finally {
      setLoading(false)
    }
  }, [])

  const reset = () => {
    setOriginal(null); setResult(null); setError(''); setDlDone(false)
    if (fileRef.current) fileRef.current.value = ''
  }

  const download = () => {
    if (!result) return
    const a = document.createElement('a')
    a.href = result
    a.download = `toosii-no-bg-${Date.now()}.png`
    document.body.appendChild(a); a.click(); document.body.removeChild(a)
    setDlDone(true); setTimeout(() => setDlDone(false), 1500)
  }

  return (
    <Layout>
      <section className="tool-hero">
        <div className="page-wrapper">
          <div className="badge" style={{ marginBottom: '1.5rem' }}><span>✂️</span> Background Remover</div>
          <h1 className="section-title">Clean cutouts, <span className="gradient-text">one tap.</span></h1>
          <p className="section-sub">
            Upload any photo and get a crisp transparent PNG in seconds — perfect for profile pictures, product shots, stickers and thumbnails. Free, no sign-up, no watermark.
          </p>
        </div>
      </section>

      <section className="section" style={{ paddingTop: '1rem' }}>
        <div className="page-wrapper">

          <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }}
            onChange={e => { process(e.target.files?.[0]); e.target.value = '' }} />

          {!original && (
            <div
              className="tool-card glass-card"
              onClick={() => !loading && fileRef.current?.click()}
              onDragOver={e => { e.preventDefault(); setDragging(true) }}
              onDragLeave={e => { if (!e.currentTarget.contains(e.relatedTarget)) setDragging(false) }}
              onDrop={e => { e.preventDefault(); setDragging(false); process(e.dataTransfer.files?.[0]) }}
              style={{
                textAlign: 'center', padding: '3rem 1.5rem', cursor: loading ? 'wait' : 'pointer',
                borderStyle: 'dashed', borderWidth: 2,
                borderColor: dragging ? '#22d3ee' : 'rgba(255,255,255,.14)',
                transition: 'border-color .2s',
              }}
            >
              <div style={{ fontSize: '2.6rem', marginBottom: '.8rem' }}>{loading ? '⏳' : '📸'}</div>
              <p style={{ color: '#e5e7eb', fontWeight: 600, margin: '0 0 .35rem' }}>
                {loading ? 'Removing background…' : 'Tap to choose a photo'}
              </p>
              <p style={{ color: '#7c8698', margin: 0, fontSize: '.85rem' }}>
                {loading ? 'Usually 3–10 seconds' : 'or drag & drop it here — JPG, PNG, WEBP up to 8 MB'}
              </p>
            </div>
          )}

          {error && <div className="tool-card glass-card" style={{ marginTop: '1.5rem' }}><p className="tool-error" style={{ margin: 0 }}>{error}</p></div>}

          {original && (
            <>
              <div className="tool-card glass-card" style={{ marginTop: '1.5rem' }}>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: result ? '1fr 1fr' : '1fr',
                  gap: '1.25rem',
                }}>
                  <div style={{ textAlign: 'center' }}>
                    <p style={{ color: '#7c8698', fontSize: '.8rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em', margin: '0 0 .6rem' }}>Original</p>
                    <img src={original.dataUrl} alt="original upload" style={{ maxWidth: '100%', maxHeight: 320, borderRadius: 12, border: '1px solid #26262e' }} />
                  </div>
                  {result && (
                    <div style={{ textAlign: 'center' }}>
                      <p style={{ color: '#22d3ee', fontSize: '.8rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em', margin: '0 0 .6rem' }}>Background removed</p>
                      <div style={{
                        borderRadius: 12, border: '1px solid #26262e', display: 'inline-block', maxWidth: '100%',
                        backgroundImage: 'linear-gradient(45deg,#1b1b21 25%,transparent 25%),linear-gradient(-45deg,#1b1b21 25%,transparent 25%),linear-gradient(45deg,transparent 75%,#1b1b21 75%),linear-gradient(-45deg,transparent 75%,#1b1b21 75%)',
                        backgroundSize: '18px 18px',
                        backgroundPosition: '0 0,0 9px,9px -9px,-9px 0',
                      }}>
                        <img src={result} alt="background removed" style={{ maxWidth: '100%', maxHeight: 320, borderRadius: 12, display: 'block' }} />
                      </div>
                    </div>
                  )}
                </div>
                {loading && (
                  <p style={{ textAlign: 'center', color: '#94a3b8', margin: '1rem 0 0', fontSize: '.9rem' }}>
                    ⏳ Removing background — usually 3–10 seconds…
                  </p>
                )}
              </div>

              <div style={{ display: 'flex', gap: '.75rem', justifyContent: 'center', marginTop: '1.5rem', flexWrap: 'wrap' }}>
                {result && (
                  <button onClick={download} className="btn-primary" style={{ background: '#0891b2' }}>
                    {dlDone ? '✅ Saved' : '⬇️ Download PNG'}
                  </button>
                )}
                <button onClick={reset} disabled={loading} className="btn-outline">↺ New Photo</button>
              </div>
            </>
          )}

          <div className="tool-card glass-card" style={{ marginTop: '2rem' }}>
            <h3 style={{ margin: '0 0 1rem', color: '#22d3ee' }}>Best results</h3>
            <ul style={{ margin: 0, paddingLeft: '1.2rem', color: '#ccc', lineHeight: 2 }}>
              <li>Clear subject with some contrast against the background works best.</li>
              <li>Great for WhatsApp stickers, product photos, and profile pictures.</li>
              <li>The transparent PNG drops straight into Canva, Photoshop, or any editor.</li>
              <li>Large photos are resized automatically for speed — quality is preserved.</li>
            </ul>
            <p style={{ margin: '1rem 0 0', color: '#666', fontSize: '.8rem' }}>
              _Made by Toosii Tech · Your photos are auto-deleted after processing_
            </p>
          </div>

        </div>
      </section>
    </Layout>
  )
}
