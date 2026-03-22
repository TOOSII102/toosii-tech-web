'use client'
import Link from 'next/link'
import { useState, useRef, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import './header.css'

const mainNav = [
  { href: '/', label: 'Home' },
  { href: '/about', label: 'About' },
  { href: '/bot', label: 'XD Ultra Bot' },
  { href: '/blog', label: 'Blog' },
  { href: '/projects', label: 'Portfolio' },
  { href: '/team', label: 'Team' },
  { href: '/contact', label: 'Contact' },
]

const toolsNav = [
  { href: '/tools/ai',            icon: '🤖', label: 'Toosii AI',         desc: 'GPT-4o & Gemini powered chat' },
  { href: '/tools/dramabox',      icon: '🎭', label: 'DramaBox',           desc: 'Stream short dramas free' },
  { href: '/downloader/video',    icon: '🎬', label: 'Video Downloader',   desc: 'YouTube, TikTok & more in HD' },
  { href: '/downloader/audio',    icon: '🎧', label: 'MP3 Downloader',     desc: 'YouTube to MP3 in seconds' },
  { href: '/downloader/spotify',  icon: '🎵', label: 'Spotify Downloader', desc: 'Spotify tracks as MP3, free' },
  { href: '/tools/vocal-remover', icon: '🎤', label: 'Vocal Remover',      desc: 'Separate vocals & instrumentals' },
  { href: '/session',             icon: '🔑', label: 'Session Generator',  desc: 'WhatsApp session ID instantly' },
  { href: '/tools/firelogo',      icon: '🔥', label: 'Fire Logo Maker',    desc: 'Generate striking fire logos' },
  { href: '/tools/story',         icon: '📖', label: 'AI Story Generator', desc: 'Full story from any prompt' },
  { href: '/tools/tempemail',     icon: '📧', label: 'Temp Email',         desc: 'Disposable email, zero trace' },
  { href: '/tools/apk',           icon: '📦', label: 'APK Search',         desc: 'Direct Android APK downloads' },
]

export default function Header() {
  const [mobileOpen, setMobileOpen]   = useState(false)
  const [toolsOpen, setToolsOpen]     = useState(false)
  const [mobileTools, setMobileTools] = useState(false)
  const pathname  = usePathname()
  const dropRef   = useRef()

  const isActive      = (href) => href === '/' ? pathname === '/' : pathname.startsWith(href)
  const isToolsActive = toolsNav.some(t => pathname.startsWith(t.href))

  useEffect(() => {
    function handleClick(e) {
      if (dropRef.current && !dropRef.current.contains(e.target)) setToolsOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  useEffect(() => {
    setMobileOpen(false)
    setToolsOpen(false)
    setMobileTools(false)
  }, [pathname])

  return (
    <header className="site-header">
      <div className="header-inner">

        {/* Brand */}
        <Link href="/" className="brand-link">
          <div className="brand-icon">T</div>
          <span className="brand-name">Toosii Tech</span>
        </Link>

        {/* Desktop nav */}
        <nav className="nav-menu">
          {mainNav.map(item => (
            <Link
              key={item.href}
              href={item.href}
              className={`nav-link ${isActive(item.href) ? 'active' : ''}`}
            >
              {item.label}
            </Link>
          ))}

          {/* Tools dropdown */}
          <div className={`nav-dropdown ${toolsOpen ? 'open' : ''}`} ref={dropRef}>
            <button
              className={`nav-link nav-dropdown-btn ${isToolsActive ? 'active' : ''}`}
              onClick={() => setToolsOpen(o => !o)}
              aria-expanded={toolsOpen}
            >
              Tools
              <svg className="dropdown-chevron" width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>

            {toolsOpen && (
              <div className="nav-dropdown-panel">
                <div className="dropdown-grid">
                  {toolsNav.map(t => (
                    <Link
                      key={t.href}
                      href={t.href}
                      className={`dropdown-link ${isActive(t.href) ? 'active' : ''}`}
                    >
                      <span className="dropdown-icon">{t.icon}</span>
                      <span className="dropdown-text">
                        <span className="dropdown-label">{t.label}</span>
                        <span className="dropdown-desc">{t.desc}</span>
                      </span>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        </nav>

        {/* Hamburger */}
        <button
          className={`hamburger ${mobileOpen ? 'open' : ''}`}
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle menu"
        >
          <span /><span /><span />
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="mobile-menu">
          {mainNav.map(item => (
            <Link
              key={item.href}
              href={item.href}
              className={`mobile-link ${isActive(item.href) ? 'active' : ''}`}
            >
              {item.label}
            </Link>
          ))}

          {/* Tools accordion */}
          <button
            className={`mobile-link mobile-tools-toggle ${isToolsActive ? 'active' : ''}`}
            onClick={() => setMobileTools(o => !o)}
          >
            <span>Tools</span>
            <svg className={`dropdown-chevron ${mobileTools ? 'rotated' : ''}`} width="14" height="14" viewBox="0 0 12 12" fill="none">
              <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>

          {mobileTools && (
            <div className="mobile-tools-list">
              {toolsNav.map(t => (
                <Link
                  key={t.href}
                  href={t.href}
                  className={`mobile-link mobile-tool-link ${isActive(t.href) ? 'active' : ''}`}
                >
                  <span className="mobile-tool-icon">{t.icon}</span>
                  {t.label}
                </Link>
              ))}
            </div>
          )}
        </div>
      )}
    </header>
  )
}
