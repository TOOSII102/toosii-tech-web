import Link from 'next/link'

const features = [
  { icon: 'fas fa-key', label: 'Session Generator', desc: 'Instantly generate your WhatsApp bot session using pair code or QR — secure and fast.', href: '/session', color: '#25d366' },
  { icon: 'fas fa-video', label: 'Video Downloader', desc: 'Download YouTube videos in 720p as MP4 files. Powered by the GiftedTech API.', href: '/downloader/video', color: '#3b82f6' },
  { icon: 'fas fa-music', label: 'MP3 Downloader', desc: 'Convert any YouTube video to high-quality MP3 audio. No ads, no redirects.', href: '/downloader/audio', color: '#a855f7' },
  { icon: 'fab fa-github', label: 'Open Source', desc: 'TOOSII XD ULTRA is fully open-source. Fork it, deploy it, make it yours.', href: 'https://github.com/TOOSII102/TOOSII-XD-ULTRA', color: '#f59e0b' },
]

const botFeatures = [
  { icon: 'fas fa-robot', label: 'AI Commands', desc: 'GPT-4o, Gemini, Llama and more AI models built in with custom personas.' },
  { icon: 'fas fa-futbol', label: 'Football Stats', desc: 'Live EPL, La Liga, Serie A standings, fixtures, and top scorers.' },
  { icon: 'fas fa-image', label: 'AI Image Gen', desc: 'Generate images with DALL·E, Stable Diffusion, and Flux via simple commands.' },
  { icon: 'fas fa-shield-alt', label: 'Group Tools', desc: 'Antidelete, antilink, welcome/bye, admin controls and more.' },
  { icon: 'fas fa-download', label: 'Downloaders', desc: 'Download from YouTube, TikTok, Instagram, Facebook and Spotify.' },
  { icon: 'fas fa-clock', label: 'Timezone Tools', desc: 'World timezone converter with 50+ country and city aliases.' },
]

const stats = [
  { value: '150+', label: 'Commands' },
  { value: '50+', label: 'Countries' },
  { value: '6+', label: 'AI Models' },
  { value: '100%', label: 'Open Source' },
]

export default function Home() {
  return (
    <div className="relative">
      <div className="blob w-[500px] h-[500px] bg-[rgba(37,211,102,0.06)] -top-40 -left-40" />
      <div className="blob w-[400px] h-[400px] bg-[rgba(18,140,126,0.05)] top-[40%] -right-32" style={{ animationDelay: '3s' }} />

      <section className="max-w-6xl mx-auto px-4 sm:px-6 pt-16 pb-20 text-center relative z-10">
        <div className="inline-flex items-center gap-2 stat-badge mb-6 animate-fade-up">
          <span className="w-2 h-2 rounded-full bg-[#25d366] animate-pulse" />
          WhatsApp Multi-Device Bot
        </div>

        <div className="animate-fade-up delay-100 mb-6 flex justify-center">
          <div className="relative">
            <div className="w-28 h-28 rounded-3xl overflow-hidden border-2 border-[rgba(37,211,102,0.4)] shadow-2xl shadow-[rgba(37,211,102,0.2)] animate-[float_6s_ease-in-out_infinite]">
              <img src="https://files.catbox.moe/qbcebp.jpg" alt="TOOSII XD ULTRA" className="w-full h-full object-cover" />
            </div>
            <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-[#25d366] border-2 border-[#07070e] animate-[pulseGreen_2s_ease-in-out_infinite]" />
          </div>
        </div>

        <h1 className="section-title mb-4 animate-fade-up delay-200">
          <span className="gradient-text">TOOSII XD ULTRA</span>
          <br />
          <span className="text-white">WhatsApp Bot</span>
        </h1>

        <p className="text-gray-400 max-w-xl mx-auto text-base leading-relaxed mb-8 animate-fade-up delay-300">
          A powerful, feature-rich WhatsApp Multi-Device bot by <span className="text-[#25d366] font-semibold">Toosii Tech</span> — a self-taught developer from Kenya. Built on gifted-baileys with 150+ commands.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-3 animate-fade-up delay-400">
          <Link href="/session"
            className="btn-primary px-6 py-3 rounded-2xl text-sm font-semibold flex items-center gap-2">
            <i className="fas fa-key text-xs" />
            Get Session ID
          </Link>
          <a href="https://github.com/TOOSII102/TOOSII-XD-ULTRA" target="_blank" rel="noreferrer"
            className="btn-ghost px-6 py-3 rounded-2xl text-sm flex items-center gap-2">
            <i className="fab fa-github text-xs" />
            View Source
          </a>
          <a href="https://wa.me/254748340864" target="_blank" rel="noreferrer"
            className="btn-ghost px-6 py-3 rounded-2xl text-sm flex items-center gap-2 border-[rgba(37,211,102,0.2)] hover:border-[rgba(37,211,102,0.4)]">
            <i className="fab fa-whatsapp text-[#25d366] text-xs" />
            Contact Dev
          </a>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-16 max-w-2xl mx-auto">
          {stats.map(s => (
            <div key={s.label} className="glass-card p-4 text-center">
              <div className="text-2xl font-black gradient-text">{s.value}</div>
              <div className="text-xs text-gray-500 mt-1 font-medium">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-16 relative z-10">
        <div className="text-center mb-10">
          <h2 className="section-title mb-3">Tools & Features</h2>
          <p className="text-gray-500 max-w-lg mx-auto text-sm">Everything you need — session generation, media downloads, and direct access to the bot&apos;s source code.</p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {features.map(f => (
            <a key={f.href} href={f.href} target={f.href.startsWith('http') ? '_blank' : '_self'} rel="noreferrer"
              className="feature-card group block">
              <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-4" style={{ background: `${f.color}18`, border: `1px solid ${f.color}30` }}>
                <i className={`${f.icon} text-lg`} style={{ color: f.color }} />
              </div>
              <h3 className="font-bold text-sm text-white mb-2 group-hover:text-[#25d366] transition-colors">{f.label}</h3>
              <p className="text-xs text-gray-500 leading-relaxed">{f.desc}</p>
              <div className="flex items-center gap-1 mt-4 text-xs font-semibold" style={{ color: f.color }}>
                {f.href.startsWith('http') ? 'Visit' : 'Open'} <i className="fas fa-arrow-right text-[10px] group-hover:translate-x-1 transition-transform" />
              </div>
            </a>
          ))}
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-16 relative z-10">
        <div className="divider mb-16" />
        <div className="text-center mb-10">
          <h2 className="section-title mb-3">Bot Capabilities</h2>
          <p className="text-gray-500 max-w-lg mx-auto text-sm">TOOSII XD ULTRA packs 150+ commands covering AI, entertainment, utilities, group management and more.</p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {botFeatures.map(f => (
            <div key={f.label} className="feature-card flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-[rgba(37,211,102,0.1)] border border-[rgba(37,211,102,0.2)] flex items-center justify-center shrink-0">
                <i className={`${f.icon} text-[#25d366] text-sm`} />
              </div>
              <div>
                <h3 className="font-bold text-sm text-white mb-1">{f.label}</h3>
                <p className="text-xs text-gray-500 leading-relaxed">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-16 relative z-10">
        <div className="glass-card p-8 sm:p-12 text-center border-[rgba(37,211,102,0.15)]">
          <div className="w-16 h-16 mx-auto rounded-2xl overflow-hidden border-2 border-[rgba(37,211,102,0.3)] mb-6">
            <img src="https://files.catbox.moe/qbcebp.jpg" alt="Toosii Tech" className="w-full h-full object-cover" />
          </div>
          <h2 className="text-2xl font-bold mb-2">Ready to set up your bot?</h2>
          <p className="text-gray-500 text-sm max-w-md mx-auto mb-7">Generate your WhatsApp session ID in seconds and get TOOSII XD ULTRA running on your own number.</p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link href="/session" className="btn-primary px-7 py-3 rounded-2xl text-sm font-semibold flex items-center gap-2">
              <i className="fas fa-key text-xs" />
              Generate Session
            </Link>
            <a href="https://github.com/TOOSII102/TOOSII-XD-ULTRA" target="_blank" rel="noreferrer"
              className="btn-ghost px-7 py-3 rounded-2xl text-sm flex items-center gap-2">
              <i className="fab fa-github text-xs" />
              Fork on GitHub
            </a>
          </div>
        </div>
      </section>
    </div>
  )
}
