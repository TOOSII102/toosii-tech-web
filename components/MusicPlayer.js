'use client'
import { useState, useRef, useEffect } from 'react'
import './music-player.css'

export default function MusicPlayer({ audioUrl, trackName = 'Now Playing' }) {
  const audioRef = useRef(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [progress, setProgress] = useState(0)
  const [currentTime, setCurrentTime] = useState('0:00')
  const [duration, setDuration] = useState('0:00')

  const fmt = (s) => {
    if (!isFinite(s)) return '0:00'
    const m = Math.floor(s / 60)
    const sec = Math.floor(s % 60).toString().padStart(2, '0')
    return `${m}:${sec}`
  }

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return
    const onMeta = () => setDuration(fmt(audio.duration))
    const onTime = () => {
      setCurrentTime(fmt(audio.currentTime))
      setProgress(audio.duration ? (audio.currentTime / audio.duration) * 100 : 0)
    }
    const onEnd = () => setIsPlaying(false)
    audio.addEventListener('loadedmetadata', onMeta)
    audio.addEventListener('timeupdate', onTime)
    audio.addEventListener('ended', onEnd)
    return () => {
      audio.removeEventListener('loadedmetadata', onMeta)
      audio.removeEventListener('timeupdate', onTime)
      audio.removeEventListener('ended', onEnd)
    }
  }, [])

  const toggle = () => {
    const audio = audioRef.current
    if (isPlaying) { audio.pause(); setIsPlaying(false) }
    else { audio.play(); setIsPlaying(true) }
  }

  const seek = (e) => {
    const audio = audioRef.current
    const rect = e.currentTarget.getBoundingClientRect()
    const pct = (e.clientX - rect.left) / rect.width
    audio.currentTime = pct * audio.duration
  }

  return (
    <div className="music-player glass-card">
      <audio ref={audioRef} src={audioUrl} preload="metadata" />
      <div className="mp-track">
        <div className="mp-icon">♪</div>
        <span className="mp-name">{trackName}</span>
      </div>
      <div className="mp-controls">
        <button className="mp-play-btn" onClick={toggle} aria-label={isPlaying ? 'Pause' : 'Play'}>
          {isPlaying ? '⏸' : '▶'}
        </button>
        <div className="mp-progress-row">
          <span className="mp-time">{currentTime}</span>
          <div className="mp-bar" onClick={seek} role="progressbar" aria-valuenow={progress}>
            <div className="mp-fill" style={{ width: `${progress}%` }} />
          </div>
          <span className="mp-time">{duration}</span>
        </div>
      </div>
    </div>
  )
}
