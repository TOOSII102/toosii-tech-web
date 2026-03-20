import Layout from '../components/Layout'
import Link from 'next/link'
import './home.css'

export default function Home() {
  const features = [
    { icon: '🤖', title: 'AI Commands', desc: 'GPT-4o, Gemini, DALL·E image gen, and more built directly into WhatsApp.' },
    { icon: '🎵', title: 'Music & Media', desc: 'Download songs, videos, Spotify tracks, and audio — all from one chat.' },
    { icon: '🔒', title: 'Anti-Delete', desc: 'Recover deleted messages and media automatically — never miss a thing.' },
    { icon: '⚽', title: 'Sports Updates', desc: 'Live football scores, standings, match stats delivered to your group.' },
    { icon: '🛡️', title: 'Group Tools', desc: 'Anti-link, anti-spam, welcome messages, poll creation and group management.' },
    { icon: '📥', title: 'Downloaders', desc: 'YouTube, TikTok, Instagram, SoundCloud — download from 20+ platforms.' },
  ]

  const tools = [
    { icon: '🔑', title: 'Session Generator', desc: 'Get your WhatsApp session ID instantly via pair code or QR scan.', href: '/session', label: 'Generate Now' },
    { icon: '🎬', title: 'Video Downloader', desc: 'Download YouTube, TikTok & Instagram videos in 720p HD, no ads.', href: '/downloader/video', label: 'Download Video' },
    { icon: '🎧', title: 'MP3 Downloader', desc: 'Extract high-quality audio from any YouTube video — free, fast.', href: '/downloader/audio', label: 'Download MP3' },
    { icon: '🎵', title: 'Spotify Downloader', desc: 'Paste any Spotify track link and download the MP3 — no account needed.', href: '/tools/spotify', label: 'Download Track' },
    { icon: '🔥', title: 'Fire Logo Maker', desc: 'Turn your name or brand into a stunning fire-style logo in seconds.', href: '/tools/firelogo', label: 'Make Logo' },
    { icon: '📧', title: 'Temp Email', desc: 'Generate a disposable email address instantly — no sign-up, no spam.', href: '/tools/tempemail', label: 'Get Email' },
  ]

  const stats = [
    { num: '150+', label: 'Bot Commands' },
    { num: '6+', label: 'AI Models' },
    { num: '20+', label: 'Platforms Supported' },
    { num: '5K+', label: 'Users Served' },
  ]

  return (
    <Layout>
      {/* Hero */}
      <section className="hero">
        <div className="page-wrapper">
          <div className="hero-badge badge">
            <span>🟢</span> TOOSII XD ULTRA — Active & Updated
          </div>
          <h1 className="hero-title">
            The Most Advanced<br />
            <span className="gradient-text">WhatsApp Bot</span><br />
            You'll Ever Use
          </h1>
          <p className="hero-sub">
            Built by a self-taught developer from Nairobi, Kenya. 150+ commands spanning AI, media,
            sports, group management, and developer tools — all in one multi-device bot.
          </p>
          <div className="hero-cta">
            <Link href="/bot" className="btn-primary">Explore Features →</Link>
            <Link href="/tools/ai" className="btn-primary">Toosii AI 🤖</Link>
            <a
              href="https://github.com/TOOSII102/TOOSII-XD-ULTRA/archive/refs/heads/main.zip"
              className="btn-primary"
              style={{ background: 'linear-gradient(135deg,#128c7e,#25d366)', textDecoration: 'none' }}
            >
              ⬇️ Download Bot
            </a>
            <Link href="/session" className="btn-outline">Generate Session Key</Link>
          </div>
          <p style={{ fontSize: '0.78rem', color: '#475569', marginTop: '-1.5rem', marginBottom: '2rem' }}>
            ✦ Toosii AI — Powered by Toosii Tech · Fast & accurate answers, always free
          </p>
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

      {/* Download Bot */}
      <section className="section" style={{ paddingTop: '0.5rem' }}>
        <div className="page-wrapper">
          <div className="glass-card" style={{ padding: '2rem', display: 'flex', gap: '2.5rem', alignItems: 'flex-start', flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: 260 }}>
              <p style={{ margin: '0 0 0.4rem', color: '#25d366', fontWeight: 700, fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>📦 Free & Open Source</p>
              <h2 style={{ margin: '0 0 0.75rem', fontSize: '1.5rem', color: '#fff', fontWeight: 800 }}>Download TOOSII XD ULTRA</h2>
              <p style={{ margin: '0 0 1.5rem', color: '#94a3b8', lineHeight: 1.65, fontSize: '0.95rem' }}>
                Get the full bot source code as a ZIP file — all files included, ready to deploy on any host in minutes. No account needed to download.
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
                <a
                  href="https://github.com/TOOSII102/TOOSII-XD-ULTRA"
                  target="_blank" rel="noopener noreferrer"
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
                    background: 'rgba(255,255,255,0.07)', color: '#ccc',
                    padding: '0.85rem 1.75rem', borderRadius: 10, fontWeight: 600,
                    textDecoration: 'none', fontSize: '0.95rem',
                    border: '1px solid rgba(255,255,255,0.1)',
                  }}
                >
                  ⭐ View on GitHub
                </a>
              </div>
            </div>
            <div style={{ flex: 1, minWidth: 220 }}>
              <p style={{ margin: '0 0 1rem', color: '#64748b', fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Quick Setup</p>
              {[
                { n: '1', text: 'Click Download ZIP above — file saves instantly' },
                { n: '2', text: 'Extract the folder and open it in your terminal' },
                { n: '3', text: <>Run <code style={{ color: '#25d366', background: 'rgba(37,211,102,0.08)', padding: '0 5px', borderRadius: 4 }}>npm install</code> to set up dependencies</> },
                { n: '4', text: <>Visit <Link href="/session" style={{ color: '#25d366' }}>Session Generator</Link> to connect your WhatsApp</> },
                { n: '5', text: <>Run <code style={{ color: '#25d366', background: 'rgba(37,211,102,0.08)', padding: '0 5px', borderRadius: 4 }}>node index.js</code> — bot goes live</> },
              ].map(s => (
                <div key={s.n} style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start', marginBottom: '0.7rem' }}>
                  <span style={{ width: 24, height: 24, borderRadius: '50%', background: '#25d366', color: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.75rem', flexShrink: 0, marginTop: 1 }}>{s.n}</span>
                  <span style={{ color: '#94a3b8', fontSize: '0.875rem', lineHeight: 1.6 }}>{s.text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="section">
        <div className="page-wrapper">
          <div className="section-header">
            <p className="section-label">Bot Features</p>
            <h2 className="section-title">Everything in one place</h2>
            <p className="section-sub">No need for multiple bots. TOOSII XD ULTRA covers AI, media, sports, and group tools seamlessly.</p>
          </div>
          <div className="features-grid">
            {features.map(f => (
              <div key={f.title} className="feature-card glass-card">
                <div className="feature-icon">{f.icon}</div>
                <h3>{f.title}</h3>
                <p>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Tools */}
      <section className="section tools-section">
        <div className="page-wrapper">
          <div className="section-header">
            <p className="section-label">Web Tools</p>
            <h2 className="section-title">Useful tools, for free</h2>
            <p className="section-sub">Built for the community. No sign-up, no payment, no nonsense.</p>
          </div>
          <div className="tools-grid">
            {tools.map(t => (
              <div key={t.title} className="tool-card glass-card">
                <div className="tool-icon">{t.icon}</div>
                <h3>{t.title}</h3>
                <p>{t.desc}</p>
                <Link href={t.href} className="btn-primary">{t.label}</Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* About CTA */}
      <section className="section about-cta">
        <div className="page-wrapper">
          <div className="cta-box glass-card">
            <div className="cta-content">
              <p className="section-label">About Me</p>
              <h2>Built by Toosii Tech</h2>
              <p>Self-taught developer since 2021. Started with basic scripts, now running a full multi-device WhatsApp bot used by thousands. Coding out of passion, not a classroom.</p>
              <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginTop: '1.5rem' }}>
                <Link href="/about" className="btn-primary">My Story →</Link>
                <Link href="/contact" className="btn-outline">Get in Touch</Link>
              </div>
            </div>
            <div className="cta-visual">
              <div className="dev-card">
                <div className="dev-avatar">T</div>
                <div>
                  <div className="dev-name">Toosii Tech</div>
                  <div className="dev-title">Self-Taught Developer</div>
                  <div className="dev-location">📍 Nairobi, Kenya</div>
                </div>
              </div>
              <div className="skills-list">
                {['JavaScript', 'Node.js', 'Next.js', 'WhatsApp API', 'gifted-baileys'].map(s => (
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
