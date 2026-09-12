import Layout from '../components/Layout'
import Link from 'next/link'
import FeedbackSection from '../components/FeedbackSection'
import './home.css'

import { createShareMetadata } from '../lib/shareMetadata'

export const metadata = createShareMetadata({
  title: 'Toosii Tech — Live TV, Free Tools, WhatsApp Bot & Movie Streaming',
  description: '8,400+ live TV channels from 177 countries, HD movies, video and MP3 downloaders, AI tools, a WhatsApp bot with 150+ commands, and a free public API. Built in Kenya — no account, no cost.',
  keywords: 'Toosii Tech, live TV free, free IPTV, free web tools, WhatsApp bot Kenya, movie streaming free, video downloader, MP3 downloader, vocal remover, free public API, temp email, AI chat free, Kenya developer',
  path: '/',
})

export default function Home() {

  // Every figure here is checkable on the site itself. "Users served" was
  // removed — it was a claim no visitor could verify, which undercuts the
  // numbers that are real.
  const stats = [
    { num: '8,400+', label: 'Live TV Channels', accent: '#72f0ba' },
    { num: '150+',   label: 'Bot Commands',     accent: '#25d366' },
    { num: '23',     label: 'Free Tools',       accent: '#3b82f6' },
    { num: '40+',    label: 'API Endpoints',    accent: '#8b5cf6' },
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
      desc: 'Stream movies, download videos & MP3s, generate WhatsApp sessions, remove vocals, create fire logos, write AI stories — all free, no sign-up.',
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
    {
      num: '04',
      icon: '⚡',
      title: 'Developer API',
      desc: 'A free, key-free REST API for downloads, AI, configuration inspection and live TV listings. Documented endpoints with live examples you can call from the browser.',
      cta: 'Read the Docs',
      href: '/api',
      accent: '#75d6ff',
    },
  ]

  const tools = [
    { icon: '🤖', title: 'Toosii AI',          desc: 'GPT-4o & Gemini powered chat.', href: '/tools/ai',           color: '#8b5cf6' },
    { icon: '📺', title: 'Live TV',             desc: '8,400+ channels, checked live.', href: '/live-tv',            color: '#72f0ba' },
    { icon: '🎬', title: 'Movies & Series',     desc: 'HD films and TV, free to stream.', href: '/tools/movies',      color: '#a78bfa' },
    { icon: '🎬', title: 'Video Downloader',    desc: 'YouTube, TikTok, Instagram — HD.', href: '/downloader/video',  color: '#ef4444' },
    { icon: '🎧', title: 'MP3 Downloader',      desc: 'Extract audio from any YouTube video.', href: '/downloader/audio',  color: '#f59e0b' },
    { icon: '🎵', title: 'Spotify Downloader',  desc: 'Spotify link → MP3, no premium needed.', href: '/downloader/spotify', color: '#25d366' },
    { icon: '🎤', title: 'Vocal Remover',        desc: 'Isolate vocals or get instrumentals.', href: '/tools/vocal-remover', color: '#06b6d4' },
    { icon: '🛡️', title: 'Config Inspector',    desc: 'Read VPN configs with secrets hidden.', href: '/tools/config-inspector', color: '#22d3ee' },
    { icon: '🔑', title: 'Session Generator',   desc: 'WhatsApp session ID in seconds.', href: '/session',           color: '#25d366' },
    { icon: '🔥', title: 'Fire Logo Maker',      desc: 'Striking fire-style logo, instant.', href: '/tools/firelogo', color: '#f97316' },
    { icon: '📖', title: 'AI Story Generator',  desc: 'Idea → full creative story in 20s.', href: '/tools/story',    color: '#a855f7' },
    { icon: '📧', title: 'Temp Email',           desc: 'Instant disposable email, no trace.', href: '/tools/tempemail', color: '#ec4899' },
    { icon: '🎨', title: 'AI Image Generator',   desc: 'Type anything, get stunning AI art.', href: '/tools/imagine', color: '#a78bfa' },
    { icon: '✂️', title: 'Background Remover',   desc: 'Transparent PNG cutouts in seconds.', href: '/tools/remove-bg', color: '#22d3ee' },
    { icon: '🎶', title: 'Lyrics Finder',        desc: 'Full lyrics for any song, instantly.', href: '/tools/lyrics', color: '#4ade80' },
    { icon: '⚽', title: 'Live Football Scores', desc: 'EPL, La Liga, Serie A — live.', href: '/tools/scores', color: '#22c55e' },
    { icon: '💱', title: 'Currency Converter',   desc: 'KES, USD, UGX & 100+ live rates.', href: '/tools/currency', color: '#f59e0b' },
    { icon: '🌍', title: 'Translator',           desc: 'English ↔ Swahili & 100+ languages.', href: '/tools/translate', color: '#38bdf8' },
    { icon: '🔗', title: 'URL Shortener',        desc: 'Tiny short links with custom aliases.', href: '/tools/shortener', color: '#f472b6' },
    { icon: '📖', title: 'Bible Search',         desc: 'Any verse in seconds, share in a tap.', href: '/tools/bible', color: '#fbbf24' },
    { icon: '🎓', title: 'KCSE Results',         desc: 'Check your KNEC result free.', href: '/tools/kcse', color: '#ef4444' },
    { icon: '📚', title: 'Dictionary',           desc: 'Definitions, audio, synonyms.', href: '/tools/dictionary', color: '#22d3ee' },
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
            Platform Active — Serving Thousands from Kenya
          </div>

          <h1 className="hero-title">
            One Platform.<br />
            <span className="gradient-text">Everything Free.</span>
          </h1>

          <p className="hero-sub">
            Live TV from 177 countries, HD movies, media downloaders, AI tools, a
            150-command WhatsApp bot and a free public API — built in Kenya, and
            free to use without an account.
          </p>

          <div className="hero-cta">
            <Link href="/tools/ai" className="hero-btn-primary">
              <span>✨</span> Try Toosii AI
            </Link>
            <Link href="/tools/movies" className="hero-btn-secondary">
              <span>🎬</span> Watch Movies
            </Link>
            <a
              href="https://github.com/TOOSII102/TOOSII-XD-ULTRA/archive/refs/heads/main.zip"
              target="_blank"
              rel="noopener noreferrer"
              className="hero-btn-ghost"
            >
              <span>⬇️</span> Download Bot
            </a>
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
            <p className="section-sub">Four areas, one platform — and every one of them is free to use right now, without an account.</p>
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


      {/* ══════════════ LIVE TV + API ══════════════ */}
      <section className="section platform-section">
        <div className="page-wrapper">
          <div className="section-header centered">
            <p className="section-eyebrow">Newest on the platform</p>
            <h2 className="section-title">Built this year</h2>
            <p className="section-sub">Two additions that changed what the platform can do.</p>
          </div>

          <div className="platform-grid">

            <article className="platform-card platform-card--tv">
              <header className="platform-card-head">
                <span className="platform-icon">📺</span>
                <div>
                  <h3 className="platform-title">Live TV</h3>
                  <p className="platform-kicker">Free-to-air television, in the browser</p>
                </div>
              </header>
              <p className="platform-desc">
                Thousands of channels from 177 countries — news, sport, music, kids and
                local stations. Every stream is checked before it appears, so the
                channels you see are the channels that actually play.
              </p>
              <ul className="platform-facts">
                <li><strong>8,400+</strong><span>channels verified live</span></li>
                <li><strong>177</strong><span>countries covered</span></li>
                <li><strong>0</strong><span>sign-ups required</span></li>
              </ul>
              <Link href="/live-tv" className="platform-cta">Watch now →</Link>
            </article>

            <article className="platform-card platform-card--api">
              <header className="platform-card-head">
                <span className="platform-icon">⚡</span>
                <div>
                  <h3 className="platform-title">Toosii API</h3>
                  <p className="platform-kicker">A public API with no key required</p>
                </div>
              </header>
              <p className="platform-desc">
                The same engines behind the tools, exposed as documented REST endpoints —
                media downloads, AI, configuration inspection and live TV listings. Call
                them straight from the browser or your own project.
              </p>
              <pre className="platform-code" aria-label="Example API request"><code>{`curl https://www.toosiitech.org/api/v1/live-tv?country=KE`}</code></pre>
              <Link href="/api" className="platform-cta">Read the docs →</Link>
            </article>

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
                150+ commands. 6+ AI models. 20+ download platforms. Anti-delete, group tools, live
                sports — all in one always-on, self-hosted, open-source WhatsApp bot.
              </p>
              <p className="bot-desc" style={{ marginBottom: '2rem' }}>
                Free to download. No subscription. No cloud fees. Deploy it on any host in minutes.
              </p>
              <div className="bot-actions">
                <a
                  href="https://github.com/TOOSII102/TOOSII-XD-ULTRA/archive/refs/heads/main.zip"
                  className="bot-btn-primary"
                >
                  ⬇️ Download ZIP
                </a>
                <Link href="/bot" className="bot-btn-outline">All Commands →</Link>
                <a href="https://github.com/TOOSII102/TOOSII-XD-ULTRA" target="_blank" rel="noopener noreferrer" className="bot-btn-ghost">
                  ⭐ GitHub
                </a>
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
                <span className="movies-gradient-text">Full Movies Free</span>
              </h2>
              <p className="movies-copy-sub">
                Hollywood blockbusters, international films, and hit TV series — all in HD.
                Multiple quality options from 360p to 1080p. One-click downloads. No subscription, no sign-up, no ads.
              </p>

              <ul className="movies-features">
                {[
                  ['🎞️', 'Full Movies & TV Series', 'Hollywood, African & international titles'],
                  ['📺', 'Multiple Qualities',       '360p · 480p · 720p · 1080p — your choice'],
                  ['⬇️', 'Direct Downloads',         'Download any movie to your device instantly'],
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
              <h3 className="movies-card-title">Toosii Movies</h3>
              <p className="movies-card-sub">Free HD streaming by TOOSII</p>
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

      {/* ══════════════ FEEDBACK ══════════════ */}
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
