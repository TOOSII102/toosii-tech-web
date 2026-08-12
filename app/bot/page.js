import Layout from '../../components/Layout'
import Link from 'next/link'
import './bot.css'

export const metadata = {
  title: 'TOOSII XD ULTRA — Full Command Suite',
  description: 'Explore 150+ commands spanning AI, media downloads, sports scores, group management, and developer tools — all in one WhatsApp bot.',
}

const categories = [
  {
    icon: '🤖',
    title: 'AI & Intelligence',
    color: '#3b82f6',
    commands: ['.gpt4o', '.gemini', '.ai', '.imagine', '.dalle', '.summarize', '.translate'],
    desc: 'Multiple AI models for chat, image generation, summarization, and translation.',
  },
  {
    icon: '🎵',
    title: 'Music & Audio',
    color: '#25d366',
    commands: ['.play', '.ytmp3', '.spotify', '.soundcloud', '.lyrics', '.shazam'],
    desc: 'Download songs from YouTube, Spotify and SoundCloud. Identify music with Shazam.',
  },
  {
    icon: '🎬',
    title: 'Video Downloads',
    color: '#8b5cf6',
    commands: ['.ytdl', '.tiktok', '.igvideo', '.facebook', '.twitter', '.ytdocvideo'],
    desc: 'Download videos in HD from 15+ platforms with automatic format selection.',
  },
  {
    icon: '🛡️',
    title: 'Group Tools',
    color: '#f59e0b',
    commands: ['.antilink', '.antispam', '.welcome', '.kick', '.promote', '.demote', '.poll', '.sticker'],
    desc: 'Full group administration — moderation, welcome messages, polls, and stickers.',
  },
  {
    icon: '🔒',
    title: 'Anti-Delete',
    color: '#ef4444',
    commands: ['.antidelete on', '.antidelete off', '.antidelete status'],
    desc: 'Recover deleted messages and media automatically. Protect your chat history.',
  },
  {
    icon: '⚽',
    title: 'Sports & Scores',
    color: '#10b981',
    commands: ['.livescores', '.fixtures', '.standings', '.prediction', '.transfer'],
    desc: 'Live football scores, league standings, upcoming fixtures and transfer news.',
  },
  {
    icon: '📌',
    title: 'Utilities',
    color: '#6366f1',
    commands: ['.weather', '.currency', '.qrcode', '.shorturl', '.whois', '.calc', '.time'],
    desc: 'Weather, currency conversion, QR codes, URL shortener, and handy calculators.',
  },
  {
    icon: '🔧',
    title: 'Bot Management',
    color: '#94a3b8',
    commands: ['.menu', '.ping', '.uptime', '.restart', '.ban', '.unban', '.setprefix'],
    desc: 'Configure the bot, manage permissions, check status, and customize behavior.',
  },
]

export default function BotPage() {
  return (
    <Layout>
      <section className="bot-hero">
        <div className="page-wrapper">
          <div className="badge" style={{ marginBottom: '1.5rem' }}>
            <span>🤖</span> TOOSII XD ULTRA — gifted-baileys Multi-Device
          </div>
          <h1 className="section-title" style={{ fontSize: 'clamp(2.5rem, 5vw, 4rem)' }}>
            150+ Commands.<br />
            <span className="gradient-text">One Bot. Zero Compromises.</span>
          </h1>
          <p className="section-sub">
            Engineered on gifted-baileys for rock-solid multi-device WhatsApp support.
            Built for self-hosted, always-on use and continuously improved with new features every week.
          </p>
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginTop: '2rem' }}>
            <Link href="/session" className="btn-primary">Get Session Key →</Link>
            <Link href="/contact" className="btn-outline">Get Bot Help →</Link>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="page-wrapper">
          <p className="section-label">Full Command Reference</p>
          <h2 className="section-title" style={{ fontSize: '2rem', marginBottom: '3rem' }}>Everything the bot can do</h2>
          <div className="commands-grid">
            {categories.map(cat => (
              <div key={cat.title} className="command-card glass-card">
                <div className="command-header">
                  <span className="command-icon">{cat.icon}</span>
                  <div>
                    <h3>{cat.title}</h3>
                    <p className="command-desc">{cat.desc}</p>
                  </div>
                </div>
                <div className="command-tags">
                  {cat.commands.map(cmd => (
                    <code key={cmd} className="cmd-tag">{cmd}</code>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="page-wrapper">
          <div className="deploy-box glass-card">
            <h2>Ready to run your own instance?</h2>
            <p>Generate a session key, then get in touch for help with access, deployment, and configuration. You will have a clear path to get your bot running.</p>
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginTop: '1.75rem' }}>
              <Link href="/session" className="btn-primary">Generate Session Key →</Link>
              <Link href="/contact" className="btn-outline">Ask About Setup</Link>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  )
}
