import Layout from '../components/Layout'
import Link from 'next/link'
import FeedbackSection from '../components/FeedbackSection'
import './home.css'

export const metadata = {
  title: 'Toosii Tech — Free Tools, WhatsApp Bot & Movie Streaming',
  description: 'A developer platform from Kenya. 11+ free web tools, a WhatsApp bot with 150+ commands, HD movie streaming, video & MP3 downloads, vocal removal, temp email, and more — no account, always free.',
  keywords: 'Toosii Tech, free web tools, WhatsApp bot Kenya, movie streaming free, video downloader, MP3 downloader, vocal remover, temp email, APK download, AI chat free, Kenya developer',
}

export default function Home() {

  const stats = [
    { num: '150+', label: 'Bot Commands',  accent: '#25d366' },
    { num: '11+',  label: 'Free Tools',    accent: '#3b82f6' },
    { num: '6+',   label: 'AI Models',     accent: '#8b5cf6' },
    { num: '5K+',  label: 'Users Served',  accent: '#f59e0b' },
  ]

  const pillars = [
    {
      num: '01',
      icon: '🤖',
      title: 'WhatsApp Bot Suite',
      desc: 'TOOSII XD ULTRA — 150+ commands covering AI, media downloads, sports scores, anti-delete, and full group management. Self-hosted and always-on.',
      cta: 'Explore Bot',
      href: '/bot',
      accent: '#25d366',
    },
    {
      num: '02',
      icon: '🛠️',
      title: 'Free Web Tools',
      desc: 'Discover focused utilities for media, sessions, vocals, branding, creative writing, and everyday digital work.',
      cta: 'Browse Tools',
      href: '/tools',
      accent: '#3b82f6',
    },
    {
      num: '03',
      icon: '✨',
      title: 'AI Features',
      desc: 'Toosii AI powered by GPT-4o and Gemini. Ask anything, generate images, remove vocals, write stories — AI built into every corner of the platform.',
      cta: 'Try Toosii AI',
      href: '/tools/ai',
      accent: '#8b5cf6',
    },
  ]

  const tools = [
    { icon: '🤖', title: 'Toosii AI',          desc: 'GPT-4o & Gemini powered chat.', href: '/tools/ai',           color: '#8b5cf6' },
    { icon: '🎬', title: 'Video Downloader',    desc: 'YouTube, TikTok, Instagram — HD.', href: '/downloader/video',  color: '#ef4444' },
    { icon: '🎧', title: 'MP3 Downloader',      desc: 'Extract audio from any YouTube video.', href: '/downloader/audio',  color: '#f59e0b' },
    { icon: '🎵', title: 'Spotify Downloader',  desc: 'Spotify link → MP3, no premium needed.', href: '/downloader/spotify', color: '#25d366' },
    { icon: '🎬', title: 'ToosiiFlix',           desc: 'Discover movies and series in a dedicated experience.', href: '/tools/movies', color: '#a78bfa' },
    { icon: '🎤', title: 'Vocal Remover',        desc: 'Isolate vocals or get instrumentals.', href: '/tools/vocal-remover', color: '#06b6d4' },
    { icon: '🔑', title: 'Session Generator',   desc: 'WhatsApp session ID in seconds.', href: '/session',           color: '#25d366' },
    { icon: '🔥', title: 'Fire Logo Maker',      desc: 'Striking fire-style logo, instant.', href: '/tools/firelogo', color: '#f97316' },
    { icon: '📖', title: 'AI Story Generator',  desc: 'Idea → full creative story in 20s.', href: '/tools/story',    color: '#a855f7' },
    { icon: '📧', title: 'Temp Email',           desc: 'Instant disposable email, no trace.', href: '/tools/tempemail', color: '#ec4899' },
    { icon: '📱', title: 'APK Search',           desc: 'Find and download any Android APK.', href: '/tools/apk',     color: '#10b981' },
  ]

  const botFeatures = [
    { icon: '🤖', title: 'AI Commands',       desc: 'GPT-4o, Gemini, image gen inside WhatsApp.' },
    { icon: '🎵', title: 'Music & Media',      desc: 'Songs, videos, Spotify — one message away.' },
    { icon: '🔒', title: 'Anti-Delete',        desc: 'Recover deleted messages & media automatically.' },
    { icon: '⚽', title: 'Sports Updates',     desc: 'Live scores, standings, match stats in your group.' },
    { icon: '🛡️', title: 'Group Management',  desc: 'Anti-link, anti-spam, polls, full admin tools.' },
    { icon: '📥', title: '20+ Platforms',      desc: 'YouTube, TikTok, Instagram, SoundCloud & more.' },
  ]

  return (
    <Layout>

      {/* ══════════════ HERO ══════════════ */}
      <section className="hero">
        <div className="hero-glow-left"  />
        <div className="hero-glow-right" />
        <div className="page-wrapper hero-inner">

          <div className="hero-eyebrow">
            <span className="hero-dot" />
            Built in Kenya · Available everywhere
          </div>

          <h1 className="hero-title">
            Practical tools for<br />
            <span className="gradient-text">digital momentum.</span>
          </h1>

          <p className="hero-sub">
            A focused workspace for useful web tools, AI-assisted creation, and a capable WhatsApp bot suite. Built in Kenya for people who want to get more done.
          </p>

          <div className="hero-cta">
            <Link href="/tools/ai" className="hero-btn-primary">
              <span>✨</span> Explore Toosii AI
            </Link>
            <Link href="/tools/movies" className="hero-btn-secondary">
              <span>🧰</span> Browse tools
            </Link>
            <Link href="/bot" className="hero-btn-ghost">
              <span>🤖</span> Meet XD Bot
            </Link>
          </div>

          <div className="hero-stats">
            {stats.map(s => (
              <div key={s.label} className="stat-card">
                <div className="stat-num" style={{ color: s.accent }}>{s.num}</div>
                <div className="stat-label">{s.label}</div>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* ══════════════ PILLARS ══════════════ */}
      <section className="section pillars-section">
        <div className="page-wrapper">
          <div className="section-header centered">
            <p className="section-eyebrow">What We Offer</p>
            <h2 className="section-title">Everything in one place</h2>
            <p className="section-sub">Three core areas. One platform. Start using anything right now.</p>
          </div>
          <div className="pillars-grid">
            {pillars.map(p => (
              <div key={p.num} className="pillar-card" style={{ '--accent': p.accent }}>
                <div className="pillar-top">
                  <span className="pillar-num">{p.num}</span>
                  <span className="pillar-icon">{p.icon}</span>
                </div>
                <h3 className="pillar-title">{p.title}</h3>
                <p className="pillar-desc">{p.desc}</p>
                <Link href={p.href} className="pillar-cta">
                  {p.cta} <span className="pillar-arrow">→</span>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════ TOOLS GRID ══════════════ */}
      <section className="section tools-section">
        <div className="page-wrapper">
          <div className="tools-header">
            <div>
              <p className="section-eyebrow">Free Web Tools</p>
              <h2 className="section-title" style={{ marginBottom: 0 }}>Professional tools. Always free.</h2>
            </div>
            <Link href="/tools" className="tools-view-all">View all →</Link>
          </div>
          <div className="tools-grid">
            {tools.map(t => (
              <Link href={t.href} key={t.title} className="tool-card" style={{ '--tc': t.color }}>
                <div className="tool-icon-wrap">
                  <span className="tool-icon">{t.icon}</span>
                </div>
                <div className="tool-body">
                  <h3 className="tool-title">{t.title}</h3>
                  <p className="tool-desc">{t.desc}</p>
                </div>
                <span className="tool-arrow">↗</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════ BOT SPOTLIGHT ══════════════ */}
      <section className="section bot-section">
        <div className="page-wrapper">
          <div className="bot-inner">

            <div className="bot-copy">
              <p className="section-eyebrow" style={{ color: '#25d366' }}>🤖 WhatsApp Bot Suite</p>
              <h2 className="bot-title">TOOSII XD ULTRA</h2>
              <p className="bot-desc">
                150+ commands. 6+ AI models. 20+ download platforms. Anti-delete, group tools, and live
                sports — all in one always-on WhatsApp bot built for multi-device use.
              </p>
              <p className="bot-desc" style={{ marginBottom: '2rem' }}>
                Need help with bot access, setup, or configuration? Get in touch and we will help you get started.
              </p>
              <div className="bot-actions">
                <Link href="/contact" className="bot-btn-primary">💬 Ask About Bot Access</Link>
                <Link href="/bot" className="bot-btn-outline">All Commands →</Link>
              </div>
            </div>

            <div className="bot-features-grid">
              <p className="bot-features-label">Bot Highlights</p>
              <div className="bot-features-cards">
                {botFeatures.map(f => (
                  <div key={f.title} className="bot-feature-card">
                    <span className="bot-feature-icon">{f.icon}</span>
                    <div>
                      <div className="bot-feature-title">{f.title}</div>
                      <div className="bot-feature-desc">{f.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ══════════════ MOVIES SPOTLIGHT ══════════════ */}
      <section className="section movies-spotlight">
        <div className="page-wrapper">
          <div className="movies-spotlight-inner">

            <div className="movies-spotlight-copy">
              <p className="section-eyebrow" style={{ color: '#8b5cf6' }}>🎬 Now on Toosii Tech</p>
              <h2 className="section-title" style={{ textAlign: 'left', marginBottom: '0.75rem' }}>
                Stream &amp; Download<br />
                <span className="movies-gradient-text">ToosiiFlix</span>
              </h2>
              <p className="movies-copy-sub">
                A dedicated discovery experience for films and television, with personalised profiles, watch lists, and a clean, focused viewing interface.
              </p>

              <ul className="movies-features">
                {[
                  ['🎞️', 'Full Movies & TV Series', 'Hollywood, African & international titles'],
                  ['📺', 'Multiple Qualities',       '360p · 480p · 720p · 1080p — your choice'],
                  ['👤', 'Personal Profiles',      'Keep your list and watch history organised'],
                  ['🔍', 'Smart Search',              'Find anything by title, actor, or genre'],
                ].map(([icon, title, sub]) => (
                  <li key={title} className="movies-feature-item">
                    <span className="movies-feature-icon">{icon}</span>
                    <span>
                      <strong className="movies-feature-title">{title}</strong>
                      <span className="movies-feature-sub">{sub}</span>
                    </span>
                  </li>
                ))}
              </ul>

              <div className="movies-copy-cta">
                <Link href="/tools/movies" className="movies-watch-btn">▶ Start Watching</Link>
                <Link href="/tools" className="movies-all-btn">All Tools →</Link>
              </div>
            </div>

            <div className="movies-spotlight-card">
              <div className="movies-spotlight-card-top" />
              <div className="movies-card-icon">🎬</div>
              <h3 className="movies-card-title">ToosiiFlix</h3>
              <p className="movies-card-sub">A dedicated discovery experience</p>
              <div className="movies-quality-row">
                {['360p', '480p', '720p', '1080p'].map(q => (
                  <span key={q} className="movies-q-chip">{q}</span>
                ))}
              </div>
              <Link href="/tools/movies" className="movies-card-btn">Browse Now →</Link>
              <div className="movies-card-badges">
                <span className="movies-badge">✅ Free</span>
                <span className="movies-badge">✅ No Sign-up</span>
                <span className="movies-badge">✅ HD</span>
              </div>
            </div>

          </div>
        </div>
      </section>


      {/* ══════════════ CONTACT & FEEDBACK ══════════════ */}
      <FeedbackSection />

      {/* ══════════════ ABOUT CTA ══════════════ */}
      <section className="section about-section">
        <div className="page-wrapper">
          <div className="about-inner glass-card">
            <div className="about-copy">
              <p className="section-eyebrow">The Developer</p>
              <h2 className="about-title">Built by Toosii Tech</h2>
              <p className="about-desc">
                Software developer &amp; tool builder from Kenya. Started with zero experience
                in 2021 — now shipping a full multi-device bot, a growing web platform, and AI tools
                used by thousands. Built from passion, not a classroom.
              </p>
              <div className="about-actions">
                <Link href="/about" className="hero-btn-primary" style={{ fontSize: '0.9rem', padding: '0.8rem 1.5rem' }}>My Story →</Link>
                <Link href="/contact" className="hero-btn-ghost"  style={{ fontSize: '0.9rem', padding: '0.8rem 1.5rem' }}>Work With Me</Link>
              </div>
            </div>
            <div className="about-card-wrap">
              <div className="dev-card">
                <div className="dev-avatar">T</div>
                <div>
                  <div className="dev-name">Toosii Tech</div>
                  <div className="dev-role">Software Developer &amp; Tool Builder</div>
                  <div className="dev-location">📍 Kenya</div>
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
