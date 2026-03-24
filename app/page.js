import Layout from '../components/Layout'
import Link from 'next/link'
import SupportSection from '../components/SupportSection'
import './home.css'

export default function Home() {

  const stats = [
    { num: '150+', label: 'Bot Commands' },
    { num: '10+', label: 'Free Web Tools' },
    { num: '6+', label: 'AI Models' },
    { num: '5K+', label: 'Users Served' },
  ]

  const pillars = [
    {
      icon: '🤖',
      title: 'WhatsApp Bot Suite',
      desc: 'TOOSII XD ULTRA — 150+ commands covering AI, media downloads, sports scores, anti-delete, and full group management. Self-hosted and always-on.',
      cta: 'Explore Bot →',
      href: '/bot',
      color: '#25d366',
    },
    {
      icon: '🛠️',
      title: 'Free Web Tools',
      desc: 'Video & MP3 downloaders, session generator, fire logo maker, vocal remover, temp email, AI story generator — all free, no account needed.',
      cta: 'Browse Tools →',
      href: '/tools/dramabox',
      color: '#3b82f6',
    },
    {
      icon: '✨',
      title: 'AI Features',
      desc: 'Toosii AI powered by GPT-4o and Gemini. Ask anything, generate images, remove vocals from songs, write stories — AI built into every corner of the platform.',
      cta: 'Try Toosii AI →',
      href: '/tools/ai',
      color: '#8b5cf6',
    },
  ]

  const tools = [
    { icon: '🤖', title: 'Toosii AI', desc: 'GPT-4o & Gemini powered chat. Ask anything, get instant answers.', href: '/tools/ai', label: 'Chat Now', color: '#8b5cf6' },
    { icon: '🎬', title: 'Video Downloader', desc: 'YouTube, TikTok, Instagram — download in HD, no ads, no sign-up.', href: '/downloader/video', label: 'Download Video', color: '#ef4444' },
    { icon: '🎧', title: 'MP3 Downloader', desc: 'Extract high-quality audio from any YouTube video, free and fast.', href: '/downloader/audio', label: 'Download MP3', color: '#f59e0b' },
    { icon: '🎵', title: 'Spotify Downloader', desc: 'Paste a Spotify link and get the MP3 — no premium needed.', href: '/downloader/spotify', label: 'Download Track', color: '#25d366' },
    { icon: '🎭', title: 'DramaBox', desc: 'Stream trending short dramas free — all episodes, no subscription.', href: '/tools/dramabox', label: 'Watch Now', color: '#ec4899' },
    { icon: '🎤', title: 'Vocal Remover', desc: 'Separate vocals from any song and get the instrumental instantly.', href: '/tools/vocal-remover', label: 'Remove Vocals', color: '#06b6d4' },
    { icon: '🔑', title: 'Session Generator', desc: 'Get your WhatsApp session ID in seconds — pair code or QR scan.', href: '/session', label: 'Generate Now', color: '#25d366' },
    { icon: '🔥', title: 'Fire Logo Maker', desc: 'Turn any name or brand into a striking fire-style logo instantly.', href: '/tools/firelogo', label: 'Make Logo', color: '#f97316' },
    { icon: '📖', title: 'AI Story Generator', desc: 'Describe an idea, get a full creative story in under 20 seconds.', href: '/tools/story', label: 'Write Story', color: '#a855f7' },
    { icon: '📧', title: 'Temp Email', desc: 'Instant disposable email address — no sign-up, no spam, no trace.', href: '/tools/tempemail', label: 'Get Email', color: '#64748b' },
    { icon: '📱', title: 'APK Search', desc: 'Find and download APKs for any Android app — safe and fast.', href: '/tools/apk', label: 'Search APK', color: '#10b981' },
  ]

  const botFeatures = [
    { icon: '🤖', title: 'AI Commands', desc: 'GPT-4o, Gemini, DALL·E image gen, and more — directly in WhatsApp.' },
    { icon: '🎵', title: 'Music & Media', desc: 'Songs, videos, Spotify tracks — download from one chat message.' },
    { icon: '🔒', title: 'Anti-Delete', desc: 'Automatically recover deleted messages and media — never miss a thing.' },
    { icon: '⚽', title: 'Sports Updates', desc: 'Live scores, standings, and match stats delivered to your group.' },
    { icon: '🛡️', title: 'Group Management', desc: 'Anti-link, anti-spam, welcome messages, polls, and full admin tools.' },
    { icon: '📥', title: '20+ Platforms', desc: 'YouTube, TikTok, Instagram, SoundCloud and many more supported.' },
  ]

  return (
    <Layout>

      {/* ── Hero ── */}
      <section className="hero">
        <div className="page-wrapper">
          <div className="hero-badge badge">
            <span>🟢</span> Platform Active — Tools, Bots & AI
          </div>
          <h1 className="hero-title">
            One Platform.<br />
            <span className="gradient-text">Infinite Possibilities.</span>
          </h1>
          <p className="hero-sub">
            Toosii Tech is a growing developer platform from Nairobi, Kenya — featuring powerful web tools,
            AI features, a full WhatsApp bot suite, streaming, and more. All free. No sign-up.
          </p>
          <div className="hero-cta">
            <Link href="/tools/ai" className="btn-primary">Try Toosii AI ✨</Link>
            <Link href="/tools/dramabox" className="btn-primary" style={{ background: 'linear-gradient(135deg,#ec4899,#8b5cf6)' }}>
              🎭 Watch DramaBox
            </Link>
            <a
              href="https://github.com/TOOSII102/TOOSII-XD-ULTRA/archive/refs/heads/main.zip"
              className="btn-primary"
              style={{ background: 'linear-gradient(135deg,#128c7e,#25d366)', textDecoration: 'none' }}
            >
              ⬇️ Download Bot
            </a>
            <Link href="/downloader/video" className="btn-outline">Video Downloader</Link>
          </div>
          <div className="hero-stats">
            {stats.map(s => (
              <div key={s.label} className="stat-card">
                <span className="stat-num">{s.num}</span>
                <span className="stat-label">{s.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── What We Offer (3 Pillars) ── */}
      <section className="section" style={{ paddingTop: '0.5rem' }}>
        <div className="page-wrapper">
          <div className="section-header">
            <p className="section-label">What Toosii Tech Offers</p>
            <h2 className="section-title">Everything in one place</h2>
            <p className="section-sub">Three core areas — one platform. Pick what you need, use it right now.</p>
          </div>
          <div className="features-grid" style={{ gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))' }}>
            {pillars.map(p => (
              <div key={p.title} className="feature-card glass-card" style={{ borderTop: `3px solid ${p.color}` }}>
                <div className="feature-icon" style={{ fontSize: '2.2rem' }}>{p.icon}</div>
                <h3 style={{ color: '#fff', fontSize: '1.15rem', fontWeight: 700, marginBottom: '0.6rem' }}>{p.title}</h3>
                <p style={{ color: '#94a3b8', lineHeight: 1.65, marginBottom: '1.25rem', fontSize: '0.9rem' }}>{p.desc}</p>
                <Link href={p.href} className="btn-primary" style={{ background: p.color, color: p.color === '#25d366' ? '#000' : '#fff', fontSize: '0.85rem', padding: '0.6rem 1.2rem' }}>
                  {p.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── All Tools ── */}
      <section className="section tools-section">
        <div className="page-wrapper">
          <div className="section-header">
            <p className="section-label">Web Tools</p>
            <h2 className="section-title">Professional tools. Always free.</h2>
            <p className="section-sub">Every tool is live and working right now — no demos, no sign-up, no paywalls.</p>
          </div>
          <div className="tools-grid" style={{ gridTemplateColumns: 'repeat(auto-fill,minmax(230px,1fr))' }}>
            {tools.map(t => (
              <div key={t.title} className="tool-card glass-card" style={{ borderLeft: `3px solid ${t.color}` }}>
                <div className="tool-icon">{t.icon}</div>
                <h3>{t.title}</h3>
                <p>{t.desc}</p>
                <Link href={t.href} className="btn-primary" style={{ fontSize: '0.82rem', padding: '0.55rem 1rem' }}>{t.label}</Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Bot Spotlight ── */}
      <section className="section">
        <div className="page-wrapper">
          <div className="glass-card" style={{ padding: '2.5rem', display: 'flex', gap: '2.5rem', alignItems: 'flex-start', flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: 280 }}>
              <p style={{ margin: '0 0 0.4rem', color: '#25d366', fontWeight: 700, fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>🤖 WhatsApp Bot Suite</p>
              <h2 style={{ margin: '0 0 0.6rem', fontSize: '1.7rem', color: '#fff', fontWeight: 800 }}>TOOSII XD ULTRA</h2>
              <p style={{ margin: '0 0 0.5rem', color: '#94a3b8', lineHeight: 1.65, fontSize: '0.95rem' }}>
                150+ commands. 6+ AI models. 20+ download platforms. Anti-delete, group tools, live sports — all in one
                always-on, self-hosted, open-source WhatsApp bot.
              </p>
              <p style={{ margin: '0 0 1.5rem', color: '#94a3b8', lineHeight: 1.65, fontSize: '0.95rem' }}>
                Free to download. No subscription. No cloud fees. Deploy it on any host in minutes.
              </p>
              <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                <a
                  href="https://github.com/TOOSII102/TOOSII-XD-ULTRA/archive/refs/heads/main.zip"
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
                    background: 'linear-gradient(135deg,#128c7e,#25d366)',
                    color: '#000', padding: '0.85rem 1.75rem', borderRadius: 10,
                    fontWeight: 700, textDecoration: 'none', fontSize: '0.95rem',
                  }}
                >
                  ⬇️ Download ZIP
                </a>
                <Link href="/bot" className="btn-outline">View All Commands</Link>
                <a
                  href="https://github.com/TOOSII102/TOOSII-XD-ULTRA"
                  target="_blank" rel="noopener noreferrer"
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
                    background: 'rgba(255,255,255,0.06)', color: '#ccc',
                    padding: '0.85rem 1.25rem', borderRadius: 10, fontWeight: 600,
                    textDecoration: 'none', fontSize: '0.95rem',
                    border: '1px solid rgba(255,255,255,0.1)',
                  }}
                >
                  ⭐ GitHub
                </a>
              </div>
            </div>
            <div style={{ flex: 1, minWidth: 220 }}>
              <p style={{ margin: '0 0 1rem', color: '#64748b', fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Bot Highlights</p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.65rem' }}>
                {botFeatures.map(f => (
                  <div key={f.title} style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 10, padding: '0.85rem' }}>
                    <div style={{ fontSize: '1.3rem', marginBottom: '0.3rem' }}>{f.icon}</div>
                    <div style={{ color: '#fff', fontWeight: 700, fontSize: '0.82rem', marginBottom: '0.25rem' }}>{f.title}</div>
                    <div style={{ color: '#64748b', fontSize: '0.75rem', lineHeight: 1.5 }}>{f.desc}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Support / Buy Me a Coffee ── */}
      <SupportSection />

      {/* ── About CTA ── */}
      <section className="section about-cta">
        <div className="page-wrapper">
          <div className="cta-box glass-card">
            <div className="cta-content">
              <p className="section-label">The Developer</p>
              <h2>Built by Toosii Tech</h2>
              <p>Software developer & tool builder from Nairobi, Kenya. Started with zero experience in 2021 — now shipping a full multi-device bot, a growing web platform, and AI tools used by thousands. Built from passion, not a classroom.</p>
              <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginTop: '1.5rem' }}>
                <Link href="/about" className="btn-primary">My Story →</Link>
                <Link href="/contact" className="btn-outline">Work With Me</Link>
              </div>
            </div>
            <div className="cta-visual">
              <div className="dev-card">
                <div className="dev-avatar">T</div>
                <div>
                  <div className="dev-name">Toosii Tech</div>
                  <div className="dev-title">Software Developer & Tool Builder</div>
                  <div className="dev-location">📍 Nairobi, Kenya</div>
                </div>
              </div>
              <div className="skills-list">
                {['JavaScript', 'Node.js', 'Next.js', 'AI Integration', 'WhatsApp API'].map(s => (
                  <span key={s} className="skill-tag">{s}</span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

    </Layout>
  )
}
