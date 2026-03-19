import Layout from '../components/Layout'
import Link from 'next/link'
import ToosiiAiWidget from '../components/ToosiiAiWidget'
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
            <Link href="/session" className="btn-outline">Generate Session Key</Link>
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

      {/* Toosii AI Featured */}
      <section className="section tai-feature-section">
        <div className="page-wrapper">
          <div className="tai-feature-inner">
            <div className="tai-feature-left">
              <p className="tai-feature-label">✦ New — Free AI Tool</p>
              <h2 className="tai-feature-title">Meet Toosii AI —<br />Your Smart Assistant</h2>
              <p className="tai-feature-sub">Ask anything and get instant, intelligent answers. No sign-up, no payment — powered by Toosii Tech and available right now on any device.</p>
              <div className="tai-feature-bullets">
                {[
                  'Powered by ChatGPT — fast, accurate answers',
                  'Ask questions, write stories, get advice',
                  'Works perfectly on phone and desktop',
                  'Completely free, no account needed',
                ].map(b => (
                  <div key={b} className="tai-bullet">
                    <div className="tai-bullet-dot" />
                    {b}
                  </div>
                ))}
              </div>
              <Link href="/tools/ai" className="btn-primary" style={{ width: 'fit-content' }}>
                Open Toosii AI →
              </Link>
            </div>
            <ToosiiAiWidget />
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
