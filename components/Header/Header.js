'use client'
import Link from 'next/link'
import { useState, useRef, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import './header.css'

const mainNav = [
  { href: '/',        label: 'Home' },
  { href: '/about',   label: 'About' },
  { href: '/bot',     label: 'XD Bot' },
  { href: '/blog',    label: 'Blog' },
  { href: '/contact', label: 'Contact' },
]

const toolsNav = [
  { href: '/tools/ai',            icon: '🤖', label: 'Toosii AI',         desc: 'GPT-4o & Gemini chat' },
  { href: '/tools/dramabox',      icon: '🎭', label: 'DramaBox',           desc: 'Stream short dramas free' },
  { href: '/downloader/video',    icon: '🎬', label: 'Video Downloader',   desc: 'YouTube, TikTok & more' },
  { href: '/downloader/audio',    icon: '🎧', label: 'MP3 Downloader',     desc: 'YouTube to MP3 fast' },
  { href: '/downloader/spotify',  icon: '🎵', label: 'Spotify',            desc: 'Spotify tracks as MP3' },
  { href: '/tools/vocal-remover', icon: '🎤', label: 'Vocal Remover',      desc: 'Separate vocals & beat' },
  { href: '/session',             icon: '🔑', label: 'Session Generator',  desc: 'WhatsApp session ID' },
  { href: '/tools/firelogo',      icon: '🔥', label: 'Fire Logo Maker',    desc: 'Striking fire logos' },
  { href: '/tools/story',         icon: '📖', label: 'Story Generator',    desc: 'Full story from prompt' },
  { href: '/tools/tempemail',     icon: '📧', label: 'Temp Email',         desc: 'Disposable email' },
  { href: '/tools/apk',           icon: '📦', label: 'APK Search',         desc: 'Direct APK downloads' },
  { href: '/projects',            icon: '🗂️', label: 'Portfolio',          desc: 'Projects & work' },
]

export default function Header() {
  const [mobileOpen, setMobileOpen]   = useState(false)
  const [toolsOpen, setToolsOpen]     = useState(false)
  const [mobileTools, setMobileTools] = useState(false)
  const pathname = usePathname()
  const dropRef  = useRef()

  const isActive      = (href) => href === '/' ? pathname === '/' : pathname.startsWith(href)
  const isToolsActive = toolsNav.some(t => isActive(t.href))

  /* close dropdown on outside click */
  useEffect(() => {
    const handler = (e) => {
      if (dropRef.current && !dropRef.current.contains(e.target)) setToolsOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  /* close everything on route change */
  useEffect(() => {
    setMobileOpen(false)
    setToolsOpen(false)
    setMobileTools(false)
  }, [pathname])

  /* lock body scroll when mobile menu open */
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [mobileOpen])

  return (
    <header className="site-header">
      <div className="header-inner">

        {/* Brand */}
        <Link href="/" className="brand-link">
          <div className="brand-icon">T</div>
          <span className="brand-name">Toosii Tech</span>
        </Link>

        {/* Desktop nav */}
        <nav className="nav-menu" aria-label="Main navigation">
          {mainNav.map(item => (
            <Link
              key={item.href}
              href={item.href}
              className={`nav-link${isActive(item.href) ? ' active' : ''}`}
            >
              {item.label}
            </Link>
          ))}

          {/* Tools dropdown */}
          <div className={`nav-dropdown${toolsOpen ? ' open' : ''}`} ref={dropRef}>
            <button
              className={`nav-link nav-dropdown-btn${isToolsActive ? ' active' : ''}`}
              onClick={() => setToolsOpen(o => !o)}
              aria-expanded={toolsOpen}
              aria-haspopup="true"
            >
              Tools
              <svg className="dropdown-chevron" width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>

            <div className={`nav-dropdown-panel${toolsOpen ? ' panel-open' : ''}`} role="menu">
              <div className="dropdown-grid">
                {toolsNav.map(t => (
                  <Link
                    key={t.href}
                    href={t.href}
                    className={`dropdown-link${isActive(t.href) ? ' active' : ''}`}
                    role="menuitem"
                  >
                    <span className="dropdown-icon">{t.icon}</span>
                    <span className="dropdown-text">
                      <span className="dropdown-label">{t.label}</span>
                      <span className="dropdown-desc">{t.desc}</span>
                    </span>
                  </Link>
                ))}
              </div>
              <div className="dropdown-footer">
                <Link href="/tools" className="dropdown-all-link">Browse all tools →</Link>
              </div>
            </div>
          </div>
        </nav>

        {/* Hamburger */}
        <button
          className={`hamburger${mobileOpen ? ' open' : ''}`}
          onClick={() => setMobileOpen(o => !o)}
          aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={mobileOpen}
        >
          <span /><span /><span />
        </button>
      </div>

      {/* Mobile drawer */}
      <div className={`mobile-menu${mobileOpen ? ' mobile-menu--open' : ''}`} aria-hidden={!mobileOpen}>
        <div className="mobile-menu-inner">
          {mainNav.map(item => (
            <Link
              key={item.href}
              href={item.href}
              className={`mobile-link${isActive(item.href) ? ' active' : ''}`}
            >
              {item.label}
            </Link>
          ))}

          {/* Tools accordion */}
          <button
            className={`mobile-link mobile-tools-toggle${isToolsActive ? ' active' : ''}`}
            onClick={() => setMobileTools(o => !o)}
            aria-expanded={mobileTools}
          >
            <span>Tools</span>
            <svg className={`dropdown-chevron${mobileTools ? ' rotated' : ''}`} width="14" height="14" viewBox="0 0 12 12" fill="none" aria-hidden="true">
              <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>

          <div className={`mobile-tools-list${mobileTools ? ' mobile-tools-list--open' : ''}`}>
            {toolsNav.map(t => (
              <Link
                key={t.href}
                href={t.href}
                className={`mobile-link mobile-tool-link${isActive(t.href) ? ' active' : ''}`}
              >
                <span className="mobile-tool-icon">{t.icon}</span>
                <span className="mobile-tool-name">{t.label}</span>
              </Link>
            ))}
          </div>

          <div className="mobile-menu-footer">
            <Link href="/team" className="mobile-link">Team</Link>
            <Link href="/projects" className="mobile-link">Portfolio</Link>
          </div>
        </div>
      </div>
    </header>
  )
}
