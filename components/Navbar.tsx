'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const links = [
  { href: '/', label: 'Home', icon: 'fas fa-home' },
  { href: '/session', label: 'Session', icon: 'fas fa-key' },
  { href: '/downloader/video', label: 'Video', icon: 'fas fa-video' },
  { href: '/downloader/audio', label: 'MP3', icon: 'fas fa-music' },
  { href: '/about', label: 'About', icon: 'fas fa-user' },
]

export default function Navbar() {
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const pathname = usePathname()

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => { setOpen(false) }, [pathname])

  return (
    <>
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 glass-nav ${scrolled ? 'shadow-lg shadow-black/30' : ''}`}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-9 h-9 rounded-xl overflow-hidden border border-[rgba(37,211,102,0.3)] shadow-lg">
              <img src="https://files.catbox.moe/qbcebp.jpg" alt="Toosii Tech" className="w-full h-full object-cover" />
            </div>
            <div>
              <span className="font-bold text-sm gradient-text">Toosii Tech</span>
              <div className="text-[10px] text-gray-500 -mt-0.5 font-medium">Self-Taught Developer</div>
            </div>
          </Link>

          <div className="hidden md:flex items-center gap-1">
            {links.map(l => (
              <Link key={l.href} href={l.href}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                  pathname === l.href
                    ? 'text-[#25d366] bg-[rgba(37,211,102,0.1)]'
                    : 'text-gray-400 hover:text-[#25d366] hover:bg-[rgba(37,211,102,0.07)]'
                }`}>
                {l.label}
              </Link>
            ))}
            <a href="https://github.com/TOOSII102/TOOSII-XD-ULTRA" target="_blank" rel="noreferrer"
              className="ml-2 px-4 py-2 rounded-xl text-sm font-semibold btn-primary flex items-center gap-2">
              <i className="fab fa-github text-xs" />
              GitHub
            </a>
          </div>

          <button onClick={() => setOpen(v => !v)} className="md:hidden w-10 h-10 flex items-center justify-center rounded-xl bg-[rgba(255,255,255,0.05)] text-gray-400 hover:text-white transition-colors">
            <i className={`fas ${open ? 'fa-times' : 'fa-bars'} text-sm`} />
          </button>
        </div>
      </nav>

      {open && (
        <div className="fixed inset-0 z-40 md:hidden" onClick={() => setOpen(false)}>
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <div className="absolute top-16 left-0 right-0 glass-nav border-t border-[rgba(255,255,255,0.06)] p-4 space-y-1" onClick={e => e.stopPropagation()}>
            {links.map(l => (
              <Link key={l.href} href={l.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                  pathname === l.href
                    ? 'text-[#25d366] bg-[rgba(37,211,102,0.12)]'
                    : 'text-gray-400 hover:text-[#25d366] hover:bg-[rgba(37,211,102,0.07)]'
                }`}>
                <i className={`${l.icon} w-4 text-center`} />
                {l.label}
              </Link>
            ))}
            <a href="https://github.com/TOOSII102/TOOSII-XD-ULTRA" target="_blank" rel="noreferrer"
              className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold btn-primary mt-2">
              <i className="fab fa-github" />
              View on GitHub
            </a>
          </div>
        </div>
      )}

      <div className="h-16" />
    </>
  )
}
