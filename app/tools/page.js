import Layout from '../../components/Layout'
import Link from 'next/link'
import '../home.css'
import { createShareMetadata } from '../../lib/shareMetadata'

export const metadata = createShareMetadata({
  title: 'Free Tools — Toosii Tech',
  description: 'Browse all free tools by Toosii Tech — AI chat, movie streaming & downloads, video & MP3 downloaders, Spotify downloader, vocal remover, fire logo maker, story AI, temp email, and more.',
  path: '/tools',
})


const categories = [
  {
    label: 'AI & Intelligence',
    color: '#8b5cf6',
    tools: [
      {
        icon: '🤖',
        title: 'Toosii AI',
        desc: 'Conversational AI powered by GPT-4o & Gemini. Ask anything — questions, code, stories, advice.',
        href: '/tools/ai',
        label: 'Open Chat',
        badge: 'Most Popular',
      },
      {
        icon: '📖',
        title: 'AI Story Generator',
        desc: 'Enter any prompt and get a complete, polished creative story in under 20 seconds.',
        href: '/tools/story',
        label: 'Write a Story',
      },
    ],
  },
  {
    label: 'Streaming & Entertainment',
    color: '#8b5cf6',
    tools: [
      {
        icon: '🎬',
        title: 'Movies & Streams',
        desc: 'Stream and download full Hollywood & international movies and TV series in HD — completely free, no sign-up.',
        href: '/tools/movies',
        label: 'Watch Now',
        badge: 'HD Streaming',
      },
    ],
  },
  {
    label: 'Downloads & Media',
    color: '#ef4444',
    tools: [
      {
        icon: '🎬',
        title: 'Video Downloader',
        desc: 'Download from YouTube, TikTok, Instagram, Facebook & Twitter / X in HD quality.',
        href: '/downloader/video',
        label: 'Download Video',
      },
      {
        icon: '🎧',
        title: 'MP3 Downloader',
        desc: 'Convert any YouTube video to a high-quality 192kbps MP3 file instantly.',
        href: '/downloader/audio',
        label: 'Download MP3',
      },
      {
        icon: '🎵',
        title: 'Spotify Downloader',
        desc: 'Paste any Spotify track link and download it as MP3 — no premium needed.',
        href: '/downloader/spotify',
        label: 'Download Track',
      },
    ],
  },
  {
    label: 'Audio Tools',
    color: '#06b6d4',
    tools: [
      {
        icon: '🎤',
        title: 'Vocal Remover',
        desc: 'Separate the vocals and instrumental from any song — studio quality, completely free.',
        href: '/tools/vocal-remover',
        label: 'Remove Vocals',
      },
      {
        icon: '🛡️',
        title: 'Configuration Inspector',
        desc: 'Inspect OpenVPN, Shadowsocks, V2Ray, sing-box, and JSON metadata with secrets redacted.',
        href: '/tools/config-inspector',
        label: 'Inspect Config',
      },
    ],
  },
  {
    label: 'Creative Tools',
    color: '#f97316',
    tools: [
      {
        icon: '🔥',
        title: 'Fire Logo Maker',
        desc: 'Type any name or brand and generate a striking fire-style logo in seconds.',
        href: '/tools/firelogo',
        label: 'Make Logo',
      },
    ],
  },
  {
    label: 'Developer & Utility Tools',
    color: '#25d366',
    tools: [
      {
        icon: '🔑',
        title: 'Session Generator',
        desc: 'Generate your WhatsApp session ID instantly via pair code — no command line needed.',
        href: '/session',
        label: 'Generate Session',
      },
      {
        icon: '📦',
        title: 'APK Search',
        desc: 'Find any Android app and download the APK directly — no Play Store, no region locks.',
        href: '/tools/apk',
        label: 'Search APK',
      },
      {
        icon: '📧',
        title: 'Temp Email',
        desc: 'Get a disposable email address instantly — sign up anywhere without exposing your real inbox.',
        href: '/tools/tempemail',
        label: 'Get Email',
      },
    ],
  },
]

const stats = [
  { num: '12+', label: 'Free Tools' },
  { num: '100%', label: 'No Sign-Up' },
  { num: '0', label: 'Ads or Paywalls' },
  { num: '24/7', label: 'Always Available' },
]

export default function ToolsHub() {
  return (
    <Layout>

      {/* Hero */}
      <section className="hero" style={{ paddingBottom: '2rem' }}>
        <div className="page-wrapper">
              <div className="hero-badge badge">
            <span>🛠️</span> 12 Free Tools — No Account Required
          </div>
          <h1 className="hero-title">
            Every Tool You Need.<br />
            <span className="gradient-text">All Free. Always.</span>
          </h1>
          <p className="hero-sub">
            AI chat, video & audio downloads, streaming, vocal removal, logo generation and more —
            built by Toosii Tech and available to everyone at no cost, forever.
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

      {/* Tool categories */}
      {categories.map(cat => (
        <section key={cat.label} className="section" style={{ paddingTop: '1rem' }}>
          <div className="page-wrapper">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
              <div style={{
                width: 4, height: 24, borderRadius: 4,
                background: cat.color, flexShrink: 0,
              }} />
              <h2 style={{ color: '#fff', fontSize: '1.05rem', fontWeight: 700, margin: 0, letterSpacing: '-0.01em' }}>
                {cat.label}
              </h2>
            </div>

            <div className="features-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}>
              {cat.tools.map(t => (
                <div
                  key={t.href}
                  className="glass-card"
                  style={{
                    padding: '1.6rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.65rem',
                    borderLeft: `3px solid ${cat.color}`,
                    position: 'relative',
                  }}
                >
                  {t.badge && (
                    <span style={{
                      position: 'absolute', top: '1rem', right: '1rem',
                      background: `${cat.color}22`, color: cat.color,
                      border: `1px solid ${cat.color}44`,
                      fontSize: '0.7rem', fontWeight: 700,
                      padding: '0.2rem 0.6rem', borderRadius: 999,
                      letterSpacing: '0.04em',
                    }}>
                      {t.badge}
                    </span>
                  )}
                  <div style={{ fontSize: '2rem', lineHeight: 1 }}>{t.icon}</div>
                  <h3 style={{ color: '#fff', fontSize: '1.05rem', fontWeight: 700, margin: 0 }}>{t.title}</h3>
                  <p style={{ color: '#94a3b8', fontSize: '0.875rem', lineHeight: 1.65, margin: 0, flex: 1 }}>{t.desc}</p>
                  <Link
                    href={t.href}
                    className="btn-primary"
                    style={{
                      background: cat.color,
                      color: cat.color === '#25d366' ? '#000' : '#fff',
                      fontSize: '0.85rem',
                      padding: '0.6rem 1.1rem',
                      alignSelf: 'flex-start',
                      marginTop: '0.25rem',
                    }}
                  >
                    {t.label} →
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </section>
      ))}

      {/* Bottom CTA */}
      <section className="section" style={{ paddingBottom: '6rem' }}>
        <div className="page-wrapper">
          <div className="glass-card" style={{ padding: '2.5rem', textAlign: 'center', maxWidth: 640, margin: '0 auto' }}>
            <p className="section-label">Also Available</p>
            <h2 style={{ color: '#fff', fontSize: '1.6rem', fontWeight: 800, marginBottom: '0.75rem' }}>
              Need a WhatsApp Bot?
            </h2>
            <p style={{ color: '#94a3b8', lineHeight: 1.7, marginBottom: '2rem', fontSize: '0.95rem' }}>
              TOOSII XD ULTRA is a free, open-source WhatsApp bot with 150+ commands — AI, media downloads,
              sports scores, group tools, and more. Download it and deploy in minutes.
            </p>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
              <Link href="/bot" className="btn-primary">Explore the Bot →</Link>
              <Link href="/contact" className="btn-outline">Work With Me</Link>
            </div>
          </div>
        </div>
      </section>

    </Layout>
  )
}
