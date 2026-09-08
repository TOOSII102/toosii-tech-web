'use client'

import { useEffect, useRef, useState } from 'react'
import Hls from 'hls.js'

function safeHttpUrl(value) {
  try {
    const url = new URL(String(value || '').trim())
    return url.protocol === 'https:' || url.protocol === 'http:' ? url.toString() : ''
  } catch {
    return ''
  }
}

export default function LivePlayer({ src, title = 'Live TV', onError }) {
  const videoRef = useRef(null)
  // Kept in a ref so the effect doesn't re-run (and tear down playback) just
  // because the parent re-rendered with a new inline callback.
  const onErrorRef = useRef(onError)
  onErrorRef.current = onError
  const [status, setStatus] = useState('loading')
  const streamUrl = safeHttpUrl(src)
  const isHls = /\.m3u8(?:$|\?)/i.test(streamUrl)

  useEffect(() => {
    const video = videoRef.current
    if (!video || !streamUrl) {
      setStatus('missing')
      return undefined
    }

    let hls
    const markReady = () => setStatus('ready')
    const markError = () => { setStatus('error'); onErrorRef.current?.() }
    video.addEventListener('loadedmetadata', markReady)
    video.addEventListener('error', markError)

    if (isHls && video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = streamUrl
      setStatus('ready')
    } else if (isHls && Hls.isSupported()) {
      hls = new Hls({ enableWorker: true, lowLatencyMode: true })
      hls.loadSource(streamUrl)
      hls.attachMedia(video)
      hls.on(Hls.Events.MANIFEST_PARSED, markReady)
      hls.on(Hls.Events.ERROR, (_event, data) => {
        if (data?.fatal) markError()
      })
    } else if (!isHls) {
      video.src = streamUrl
      setStatus('ready')
    } else {
      setStatus('unsupported')
    }

    return () => {
      video.removeEventListener('loadedmetadata', markReady)
      video.removeEventListener('error', markError)
      if (hls) hls.destroy()
      video.removeAttribute('src')
      video.load()
    }
  }, [isHls, streamUrl])

  return (
    <div style={{ marginTop: '1.5rem' }}>
      <div style={{ position: 'relative', aspectRatio: '16 / 9', overflow: 'hidden', borderRadius: 16, background: '#020617', border: '1px solid rgba(114,240,186,.25)' }}>
        <video ref={videoRef} controls playsInline preload="metadata" title={title} style={{ width: '100%', height: '100%', display: 'block', background: '#020617' }} />
        {(status === 'loading' || status === 'missing' || status === 'unsupported' || status === 'error') && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', textAlign: 'center', color: '#94a3b8', background: 'rgba(2,6,23,.74)', fontSize: '0.9rem' }}>
            {status === 'loading' && 'Preparing live stream…'}
            {status === 'missing' && 'No stream URL was supplied for this share link.'}
            {status === 'unsupported' && 'This browser cannot play HLS streams.'}
            {status === 'error' && 'The stream could not be loaded. It may be offline or block browser playback.'}
          </div>
        )}
      </div>
      <p style={{ color: '#64748b', fontSize: '0.75rem', margin: '0.6rem 0 0' }}>Playback starts after pressing play. The source must allow browser playback and cross-origin requests.</p>
    </div>
  )
}
