import Link from 'next/link'

export default function Footer() {
  return (
    <footer className="relative z-10 border-t border-[rgba(255,255,255,0.06)] mt-20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl overflow-hidden border border-[rgba(37,211,102,0.3)]">
                <img src="https://files.catbox.moe/qbcebp.jpg" alt="Toosii Tech" className="w-full h-full object-cover" />
              </div>
              <div>
                <div className="font-bold gradient-text">Toosii Tech</div>
                <div className="text-[11px] text-gray-500">Self-Taught Developer</div>
              </div>
            </div>
            <p className="text-sm text-gray-500 leading-relaxed">
              Building powerful WhatsApp tools and bots. Everything from session generators to media downloaders — crafted with passion.
            </p>
            <div className="flex items-center gap-3 mt-5">
              <a href="https://github.com/TOOSII102" target="_blank" rel="noreferrer"
                className="w-9 h-9 rounded-xl bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.08)] flex items-center justify-center text-gray-400 hover:text-white hover:bg-[rgba(37,211,102,0.15)] hover:border-[rgba(37,211,102,0.3)] transition-all">
                <i className="fab fa-github text-sm" />
              </a>
              <a href="https://t.me/toosiitech" target="_blank" rel="noreferrer"
                className="w-9 h-9 rounded-xl bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.08)] flex items-center justify-center text-gray-400 hover:text-white hover:bg-[rgba(37,211,102,0.15)] hover:border-[rgba(37,211,102,0.3)] transition-all">
                <i className="fab fa-telegram text-sm" />
              </a>
              <a href="https://wa.me/254748340864" target="_blank" rel="noreferrer"
                className="w-9 h-9 rounded-xl bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.08)] flex items-center justify-center text-gray-400 hover:text-white hover:bg-[rgba(37,211,102,0.15)] hover:border-[rgba(37,211,102,0.3)] transition-all">
                <i className="fab fa-whatsapp text-sm" />
              </a>
            </div>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-white mb-4">Quick Links</h4>
            <ul className="space-y-2">
              {[
                { href: '/', label: 'Home' },
                { href: '/session', label: 'Session Generator' },
                { href: '/downloader/video', label: 'Video Downloader' },
                { href: '/downloader/audio', label: 'MP3 Downloader' },
                { href: '/about', label: 'About Me' },
              ].map(l => (
                <li key={l.href}>
                  <Link href={l.href} className="text-sm text-gray-500 hover:text-[#25d366] transition-colors flex items-center gap-2">
                    <i className="fas fa-chevron-right text-[10px] text-[rgba(37,211,102,0.5)]" />
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-white mb-4">Projects</h4>
            <ul className="space-y-2">
              {[
                { href: 'https://github.com/TOOSII102/TOOSII-XD-ULTRA', label: 'TOOSII XD ULTRA Bot', ext: true },
                { href: 'https://github.com/TOOSII102', label: 'GitHub Profile', ext: true },
                { href: 'https://wa.me/254748340864', label: 'WhatsApp Contact', ext: true },
                { href: 'https://t.me/toosiitech', label: 'Telegram', ext: true },
              ].map(l => (
                <li key={l.href}>
                  <a href={l.href} target="_blank" rel="noreferrer"
                    className="text-sm text-gray-500 hover:text-[#25d366] transition-colors flex items-center gap-2">
                    <i className="fas fa-external-link-alt text-[10px] text-[rgba(37,211,102,0.5)]" />
                    {l.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="divider my-8" />
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-gray-600">
            © {new Date().getFullYear()} <span className="text-[#25d366]">Toosii Tech</span>. All rights reserved.
          </p>
          <p className="text-xs text-gray-600 flex items-center gap-1.5">
            Built with <i className="fas fa-heart text-red-500 text-[10px]" /> by a self-taught developer
          </p>
        </div>
      </div>
    </footer>
  )
}
