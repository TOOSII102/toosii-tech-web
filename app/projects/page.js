import Layout from '../../components/Layout'
import Link from 'next/link'
import './projects.css'

export const metadata = {
  title: 'Portfolio — Toosii Tech',
  description: 'Real projects, real users. Explore the portfolio of tools, bots, and platforms built by Toosii Tech from Nairobi, Kenya.',
}

const projects = [
  {
    id: 1,
    num: '01',
    icon: '🤖',
    title: "TOOSII XD ULTRA",
    sub: "WhatsApp Multi-Device Bot",
    category: "WhatsApp Bot",
    status: "Active",
    duration: "2022 – Present",
    accent: '#25d366',
    accentRgb: '37,211,102',
    results: [
      { metric: "150+", label: "Commands" },
      { metric: "6+",   label: "AI Models" },
      { metric: "5K+",  label: "Users" },
    ],
    challenge: "Building a single WhatsApp bot that covers AI, media downloads, sports scores, group management, and developer tools — all running reliably on gifted-baileys multi-device.",
    solution: "Plugin-based architecture where each category lives in its own file. Multi-fallback APIs for downloads. Smart anti-delete with 20-min TTL sweep. Real-time sports feeds and AI integration.",
    technologies: ["Node.js", "gifted-baileys", "GPT-4o", "Gemini", "GiftedTech API", "EliteProTech API", "cobalt.tools"],
    link: "https://github.com/TOOSII102/TOOSII-XD-ULTRA",
    linkLabel: "View on GitHub",
    featured: true,
    caption: "Started as a weekend experiment. Grew into a full-featured automation platform used by thousands. Every command is built around something real users asked for — nothing is filler.",
  },
  {
    id: 2,
    num: '02',
    icon: '🌐',
    title: "Toosii Tech Web",
    sub: "Developer Tools Platform",
    category: "Web App",
    status: "Live",
    duration: "2025 – Present",
    accent: '#3b82f6',
    accentRgb: '59,130,246',
    results: [
      { metric: "11+",  label: "Live Tools" },
      { metric: "15+",  label: "Pages" },
      { metric: "100%", label: "Free" },
    ],
    challenge: "Build a professional personal website with working tools — video downloader, vocal remover, fire logo generator, session generator, and more — deployable on Vercel with no sign-up required.",
    solution: "Next.js 14 App Router with server-side API routes proxying to multiple backends. Multi-method fallback chains for reliability. Particle canvas animated background. All JavaScript — no complexity.",
    technologies: ["Next.js 14", "JavaScript", "GiftedTech API", "EliteProTech API", "cobalt.tools", "loader.to", "Vercel"],
    link: "/",
    linkLabel: "You're here",
    featured: true,
    caption: "This site is the project. Every tool on it works — no demos, no screenshots. If it's listed, you can use it right now.",
  },
  {
    id: 3,
    num: '03',
    icon: '🔑',
    title: "WhatsApp Session Generator",
    sub: "API & Web Interface",
    category: "API / Tool",
    status: "Live",
    duration: "2024",
    accent: '#8b5cf6',
    accentRgb: '139,92,246',
    results: [
      { metric: "<5s",      label: "Pair Time" },
      { metric: "QR+Pair",  label: "Methods" },
      { metric: "Zero",     label: "Sign-up" },
    ],
    challenge: "Users deploying the bot needed a simple way to generate WhatsApp session IDs without running technical setup commands themselves.",
    solution: "REST API endpoints using gifted-baileys server-side to generate pair codes and QR codes. Exposed through a clean web UI with copy-to-clipboard and a step-by-step guide.",
    technologies: ["gifted-baileys", "Next.js API Routes", "Node.js"],
    link: "/session",
    linkLabel: "Try it live",
    featured: false,
    caption: "Cut bot setup time from 20 minutes to under a minute. No terminal required.",
  },
  {
    id: 4,
    num: '04',
    icon: '⬇',
    title: "Multi-Platform Media Downloader",
    sub: "Video & Audio Downloads",
    category: "Web Tool",
    status: "Live",
    duration: "2025",
    accent: '#f59e0b',
    accentRgb: '245,158,11',
    results: [
      { metric: "20+",    label: "Platforms" },
      { metric: "3-API",  label: "Fallback Chain" },
      { metric: "720p",   label: "Default Quality" },
    ],
    challenge: "YouTube downloader APIs break constantly. Building a tool that stays working through API outages, rate limits, and format changes.",
    solution: "Three-method fallback chain: GiftedTech ytv → cobalt.tools → InnerTube ANDROID for video. GiftedTech ytmp3 → loader.to for audio. Returns the first successful result automatically.",
    technologies: ["Next.js", "GiftedTech API", "cobalt.tools", "loader.to"],
    link: "/downloader/video",
    linkLabel: "Try it live",
    featured: false,
    caption: "Reliability through redundancy. If one API fails, the next one kicks in — silently.",
  },
  {
    id: 5,
    num: '05',
    icon: '🎤',
    title: "AI Vocal Remover",
    sub: "Stems Separator",
    category: "Web Tool",
    status: "Live",
    duration: "2025",
    accent: '#ec4899',
    accentRgb: '236,72,153',
    results: [
      { metric: "File+URL", label: "Input Modes" },
      { metric: "~30s",     label: "Processing" },
      { metric: "Zero",     label: "Sign-up" },
    ],
    challenge: "Vocal removal tools usually require accounts, paid plans, or complex setup. Building one that works instantly from any browser.",
    solution: "Upload an audio file or paste a URL. Files are proxied through catbox.moe, then processed by the vocal removal API. Instrumental track is returned as a direct download.",
    technologies: ["Next.js", "EliteProTech API", "catbox.moe", "FormData"],
    link: "/tools/vocal-remover",
    linkLabel: "Try it live",
    featured: false,
    caption: "No account, no watermarks, no limits. Just upload your track and download the clean instrumental.",
  },
  {
    id: 6,
    num: '06',
    icon: '✨',
    title: "Toosii AI Assistant",
    sub: "Custom Personality AI Chat",
    category: "AI Integration",
    status: "Live",
    duration: "2025",
    accent: '#06b6d4',
    accentRgb: '6,182,212',
    results: [
      { metric: "GPT-4o", label: "Powered By" },
      { metric: "6+",     label: "AI Models" },
      { metric: "Custom", label: "Personality" },
    ],
    challenge: "Standard AI integrations feel generic. Building an AI assistant with a distinct personality, memory of previous turns, and useful default behaviours for both WhatsApp and web users.",
    solution: "Server-side system prompt that locks in the 'Toosii AI' identity. Supports multi-model switching (.gpt, .gemini, .claude) within the same bot. Web version available on this site.",
    technologies: ["GPT-4o", "Gemini", "Claude", "Node.js", "Next.js API Routes"],
    link: "/tools/ai",
    linkLabel: "Chat now",
    featured: false,
    caption: "Same AI, different face. The personality is consistent no matter which model is running underneath.",
  },
]

const stats = [
  { num: '6+',   label: 'Shipped Projects' },
  { num: '5K+',  label: 'Active Users' },
  { num: '150+', label: 'Bot Commands' },
  { num: '100%', label: 'Free to Use' },
]

const principles = [
  {
    icon: '🔁',
    title: 'Reliability First',
    desc: 'Multi-fallback API chains so tools keep working even when one backend goes down.',
  },
  {
    icon: '⚡',
    title: 'Ship Fast',
    desc: 'Pick the simplest stack that works. No over-engineering. Real users get it sooner.',
  },
  {
    icon: '🔓',
    title: 'Always Free',
    desc: 'No paywalls, no sign-ups, no limits. Tools should be accessible to everyone.',
  },
]

export default function Projects() {
  const featured = projects.filter(p => p.featured)
  const others   = projects.filter(p => !p.featured)

  return (
    <Layout>

      {/* ══ HERO ══ */}
      <section className="pf-hero">
        <div className="page-wrapper">
          <div className="pf-hero-inner">
            <div className="pf-hero-text">
              <span className="pf-eyebrow">Portfolio · Nairobi, Kenya</span>
              <h1 className="pf-hero-title">
                Things I've<br />
                <span className="gradient-text">Actually Built</span>
              </h1>
              <p className="pf-hero-sub">
                Real projects. Real users. Every one started as a personal need or a community request — not a tutorial clone. Here's what I've built, launched, and kept running.
              </p>
              <div className="pf-hero-btns">
                <a href="#featured" className="pf-btn-primary">Browse Projects ↓</a>
                <a href="https://github.com/TOOSII102" target="_blank" rel="noopener noreferrer" className="pf-btn-ghost">GitHub ↗</a>
              </div>
            </div>
            <div className="pf-stats-grid">
              {stats.map(s => (
                <div key={s.label} className="pf-stat-card">
                  <span className="pf-stat-num">{s.num}</span>
                  <span className="pf-stat-label">{s.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ══ FEATURED PROJECTS ══ */}
      <section className="pf-section" id="featured">
        <div className="page-wrapper">
          <div className="pf-section-header">
            <span className="pf-section-bar" />
            <h2 className="pf-section-title">Featured Work</h2>
          </div>

          <div className="pf-featured-list">
            {featured.map(p => (
              <article
                key={p.id}
                className="pf-featured-card"
                style={{ '--accent': p.accent, '--accent-rgb': p.accentRgb }}
              >
                {/* Top accent bar */}
                <div className="pf-card-accent-bar" />

                <div className="pf-featured-inner">
                  {/* Left: number + icon */}
                  <div className="pf-featured-aside">
                    <div className="pf-project-num">{p.num}</div>
                    <div className="pf-project-icon" style={{ background: `rgba(${p.accentRgb},0.12)`, border: `1px solid rgba(${p.accentRgb},0.25)` }}>
                      {p.icon}
                    </div>
                  </div>

                  {/* Right: content */}
                  <div className="pf-featured-content">
                    {/* Header */}
                    <div className="pf-card-meta-row">
                      <div className="pf-meta-left">
                        <span className="pf-cat-badge" style={{ color: p.accent, background: `rgba(${p.accentRgb},0.1)`, border: `1px solid rgba(${p.accentRgb},0.22)` }}>
                          {p.category}
                        </span>
                        <span className="pf-status-badge pf-status-active">
                          <span className="pf-status-dot" style={{ background: p.accent }} />
                          {p.status}
                        </span>
                      </div>
                      <span className="pf-duration">{p.duration}</span>
                    </div>

                    {/* Title */}
                    <h2 className="pf-featured-title">{p.title}</h2>
                    <p className="pf-featured-sub">{p.sub}</p>

                    {/* Caption */}
                    <blockquote className="pf-caption" style={{ borderLeftColor: p.accent }}>
                      {p.caption}
                    </blockquote>

                    {/* Metrics */}
                    <div className="pf-metrics-row">
                      {p.results.map(r => (
                        <div key={r.label} className="pf-metric" style={{ '--accent': p.accent }}>
                          <span className="pf-metric-num">{r.metric}</span>
                          <span className="pf-metric-label">{r.label}</span>
                        </div>
                      ))}
                    </div>

                    {/* Challenge / Solution */}
                    <div className="pf-body-grid">
                      <div className="pf-body-block">
                        <h4 className="pf-body-heading">Challenge</h4>
                        <p className="pf-body-text">{p.challenge}</p>
                      </div>
                      <div className="pf-body-block">
                        <h4 className="pf-body-heading">Solution</h4>
                        <p className="pf-body-text">{p.solution}</p>
                      </div>
                    </div>

                    {/* Footer */}
                    <div className="pf-card-footer">
                      <div className="pf-tech-tags">
                        {p.technologies.map(t => (
                          <span key={t} className="pf-tech-tag">{t}</span>
                        ))}
                      </div>
                      <a
                        href={p.link}
                        target={p.link.startsWith('http') ? '_blank' : undefined}
                        rel="noopener noreferrer"
                        className="pf-cta-btn"
                        style={{ background: `rgba(${p.accentRgb},0.12)`, border: `1.5px solid rgba(${p.accentRgb},0.35)`, color: p.accent }}
                      >
                        {p.linkLabel} →
                      </a>
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ══ OTHER PROJECTS ══ */}
      <section className="pf-section">
        <div className="page-wrapper">
          <div className="pf-section-header">
            <span className="pf-section-bar" />
            <h2 className="pf-section-title">More Work</h2>
          </div>

          <div className="pf-other-grid">
            {others.map(p => (
              <article
                key={p.id}
                className="pf-other-card"
                style={{ '--accent': p.accent, '--accent-rgb': p.accentRgb }}
              >
                {/* Card top */}
                <div className="pf-other-top">
                  <div className="pf-other-icon" style={{ background: `rgba(${p.accentRgb},0.12)`, border: `1px solid rgba(${p.accentRgb},0.25)` }}>
                    {p.icon}
                  </div>
                  <div className="pf-other-meta">
                    <span className="pf-cat-badge" style={{ color: p.accent, background: `rgba(${p.accentRgb},0.1)`, border: `1px solid rgba(${p.accentRgb},0.22)` }}>
                      {p.category}
                    </span>
                    <span className="pf-duration">{p.duration}</span>
                  </div>
                </div>

                <h3 className="pf-other-title">{p.title}</h3>
                <p className="pf-other-sub">{p.sub}</p>

                <blockquote className="pf-caption pf-caption-sm" style={{ borderLeftColor: p.accent }}>
                  {p.caption}
                </blockquote>

                {/* Metrics */}
                <div className="pf-metrics-sm">
                  {p.results.map(r => (
                    <div key={r.label} className="pf-metric-sm">
                      <span className="pf-metric-num-sm" style={{ color: p.accent }}>{r.metric}</span>
                      <span className="pf-metric-label-sm">{r.label}</span>
                    </div>
                  ))}
                </div>

                <div className="pf-tech-tags pf-tech-tags-sm">
                  {p.technologies.slice(0, 4).map(t => (
                    <span key={t} className="pf-tech-tag">{t}</span>
                  ))}
                </div>

                <a
                  href={p.link}
                  target={p.link.startsWith('http') ? '_blank' : undefined}
                  rel="noopener noreferrer"
                  className="pf-other-link"
                  style={{ color: p.accent }}
                >
                  {p.linkLabel} →
                </a>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ══ PRINCIPLES ══ */}
      <section className="pf-section pf-principles-section">
        <div className="page-wrapper">
          <div className="pf-section-header" style={{ justifyContent: 'center', marginBottom: '2.5rem' }}>
            <h2 className="pf-section-title" style={{ textAlign: 'center' }}>How I Build</h2>
          </div>
          <div className="pf-principles-grid">
            {principles.map(pr => (
              <div key={pr.title} className="pf-principle-card glass-card">
                <div className="pf-principle-icon">{pr.icon}</div>
                <h3 className="pf-principle-title">{pr.title}</h3>
                <p className="pf-principle-desc">{pr.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ STACK ══ */}
      <section className="pf-section">
        <div className="page-wrapper">
          <div className="pf-stack-card glass-card">
            <h3 className="pf-stack-title">Full Stack</h3>
            <p className="pf-stack-sub">Technologies I reach for on every project</p>
            <div className="pf-tech-tags pf-stack-tags">
              {['Node.js', 'Next.js 14', 'JavaScript', 'gifted-baileys', 'GPT-4o', 'Gemini', 'Claude', 'Vercel', 'EliteProTech API', 'GiftedTech API', 'cobalt.tools', 'catbox.moe'].map(t => (
                <span key={t} className="pf-tech-tag pf-tech-tag-lg">{t}</span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ══ CTA ══ */}
      <section className="pf-cta-section">
        <div className="page-wrapper">
          <div className="pf-cta-inner">
            <h2 className="pf-cta-title">Built something you want to talk about?</h2>
            <p className="pf-cta-sub">I'm always open to interesting projects, collabs, and conversations about what can be built next.</p>
            <div className="pf-cta-btns">
              <Link href="/contact" className="pf-btn-primary">Get in Touch →</Link>
              <a href="https://github.com/TOOSII102" target="_blank" rel="noopener noreferrer" className="pf-btn-ghost">GitHub ↗</a>
            </div>
          </div>
        </div>
      </section>

    </Layout>
  )
}
