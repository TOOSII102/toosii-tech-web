import Layout from '../../components/Layout'
import Link from 'next/link'
import './projects.css'

export const metadata = { title: 'Projects — Toosii Tech', description: 'Explore the full portfolio of tools, bots, and platforms built by Toosii Tech.' }

const projects = [
  {
    id: 1,
    title: "TOOSII XD ULTRA — WhatsApp Multi-Device Bot",
    category: "WhatsApp Bot",
    status: "Active & Maintained",
    duration: "2022 – Present",
    results: [
      { metric: "150+", label: "Commands" },
      { metric: "6+", label: "AI Models" },
      { metric: "5K+", label: "Users" },
    ],
    challenge: "Building a single WhatsApp bot that covers AI, media downloads, sports scores, group management, and developer tools — all running reliably on gifted-baileys multi-device.",
    solution: "Plugin-based architecture where each category lives in its own file. Multi-fallback APIs for downloads. Smart anti-delete with 20-min TTL sweep. Real-time sports feeds and AI integration.",
    technologies: ["Node.js", "gifted-baileys", "GPT-4o", "Gemini", "GiftedTech API", "EliteProTech API", "cobalt.tools"],
    link: "https://github.com/TOOSII102/TOOSII-XD-ULTRA",
    featured: true,
    caption: "Started as a weekend experiment. Grew into a full-featured automation platform used by thousands. Every command is built around something real users asked for — nothing is filler.",
  },
  {
    id: 2,
    title: "Toosii Tech Web — Developer Tools Website",
    category: "Web App",
    status: "Live",
    duration: "2025 – Present",
    results: [
      { metric: "11+", label: "Tools" },
      { metric: "15+", label: "Pages" },
      { metric: "100%", label: "Free" },
    ],
    challenge: "Build a professional personal website with working tools — video downloader, vocal remover, fire logo generator, session generator, and more — deployable on Vercel with no sign-up required.",
    solution: "Next.js 14 App Router with server-side API routes proxying to multiple backends. Multi-method fallback chains for reliability. Particle canvas animated background. All plain JavaScript — no TypeScript complexity.",
    technologies: ["Next.js 14", "JavaScript", "GiftedTech API", "EliteProTech API", "cobalt.tools", "loader.to", "Vercel"],
    link: "#",
    featured: true,
    caption: "This site is the project. Every tool on it works — no demos, no screenshots. If it's listed, you can use it right now.",
  },
  {
    id: 3,
    title: "WhatsApp Session Generator API",
    category: "API / Tool",
    status: "Live",
    duration: "2024",
    results: [
      { metric: "<5s", label: "Pair Time" },
      { metric: "QR + Pair", label: "Methods" },
      { metric: "Zero", label: "Sign-up" },
    ],
    challenge: "Users deploying the bot needed a simple way to generate WhatsApp session IDs without running technical setup commands themselves.",
    solution: "REST API endpoints using gifted-baileys server-side to generate pair codes and QR codes. Exposed through a clean web UI with copy-to-clipboard and a step-by-step guide.",
    technologies: ["gifted-baileys", "Next.js API Routes", "Node.js"],
    link: "/session",
    featured: false,
    caption: "Cut bot setup time from 20 minutes to under a minute. No terminal required.",
  },
  {
    id: 4,
    title: "Multi-Platform Media Downloader",
    category: "Web Tool",
    status: "Live",
    duration: "2025",
    results: [
      { metric: "20+", label: "Platforms" },
      { metric: "3-method", label: "Fallback Chain" },
      { metric: "720p", label: "Default Quality" },
    ],
    challenge: "YouTube downloader APIs break constantly. Building a tool that stays working through API outages, rate limits, and format changes.",
    solution: "Three-method fallback chain: GiftedTech ytv → cobalt.tools → InnerTube ANDROID for video. GiftedTech ytmp3 → loader.to for audio. Returns the first successful result automatically.",
    technologies: ["Next.js", "GiftedTech API", "cobalt.tools", "loader.to"],
    link: "/downloader/video",
    featured: false,
    caption: "Reliability through redundancy. If one API fails, the next one kicks in — silently.",
  },
  {
    id: 5,
    title: "AI Vocal Remover",
    category: "Web Tool",
    status: "Live",
    duration: "2025",
    results: [
      { metric: "File + URL", label: "Input Modes" },
      { metric: "~30s", label: "Processing" },
      { metric: "Zero", label: "Sign-up" },
    ],
    challenge: "Vocal removal tools usually require accounts, paid plans, or complex setup. Building one that works instantly from any browser.",
    solution: "Upload an audio file from your device or paste a direct URL. Files are proxied through catbox.moe, then processed by the vocal removal API. Instrumental track is returned as a direct download.",
    technologies: ["Next.js", "EliteProTech API", "catbox.moe", "FormData"],
    link: "/tools/vocal-remover",
    featured: false,
    caption: "No account, no watermarks, no limits. Just upload your track and download the clean instrumental.",
  },
  {
    id: 6,
    title: "Toosii AI — Custom WhatsApp AI Assistant",
    category: "AI Integration",
    status: "Live",
    duration: "2025",
    results: [
      { metric: "GPT-4o", label: "Powered By" },
      { metric: "6+", label: "Models" },
      { metric: "Custom", label: "Personality" },
    ],
    challenge: "Standard ChatGPT integrations feel generic. Building an AI assistant with a distinct personality, memory of previous turns, and useful default behaviours for WhatsApp users.",
    solution: "Server-side system prompt that locks in the 'Toosii AI' identity. Supports multi-model switching (.gpt, .gemini, .claude) within the same bot. Web version available on this site.",
    technologies: ["GPT-4o", "Gemini", "Claude", "Node.js", "Next.js API Routes"],
    link: "/tools/ai",
    featured: false,
    caption: "Same AI, different face. The personality is consistent no matter which model is running underneath.",
  },
]

export default function Projects() {
  return (
    <Layout>
      <section className="projects-hero">
        <div className="page-wrapper">
          <p className="section-label">Portfolio</p>
          <h1 className="section-title">What I've <span className="gradient-text">Shipped</span></h1>
          <p className="section-sub">
            Real projects. Real users. Every one of these started as a personal need or a community request — not a tutorial clone. Here's what I've built, launched, and kept running.
          </p>
        </div>
      </section>

      <section className="section" style={{ paddingTop: '1rem' }}>
        <div className="page-wrapper">
          <div className="featured-projects">
            {projects.filter(p => p.featured).map(p => (
              <div key={p.id} className="project-card-featured glass-card">
                <div className="project-header">
                  <div>
                    <span className="project-cat">{p.category}</span>
                    <span className={`project-status ${p.status === 'Active & Maintained' ? 'active' : 'live'}`}>{p.status}</span>
                  </div>
                  <span className="project-duration">{p.duration}</span>
                </div>
                <h2 className="project-title">{p.title}</h2>
                {p.caption && (
                  <p style={{ color: '#94a3b8', fontStyle: 'italic', margin: '0 0 1.25rem', fontSize: '0.9rem', borderLeft: '3px solid #25d366', paddingLeft: '0.85rem' }}>
                    {p.caption}
                  </p>
                )}
                <div className="project-results">
                  {p.results.map(r => (
                    <div key={r.label} className="result-item">
                      <span className="result-num">{r.metric}</span>
                      <span className="result-label">{r.label}</span>
                    </div>
                  ))}
                </div>
                <div className="project-body">
                  <div>
                    <h4>Challenge</h4>
                    <p>{p.challenge}</p>
                  </div>
                  <div>
                    <h4>Solution</h4>
                    <p>{p.solution}</p>
                  </div>
                </div>
                <div className="project-footer">
                  <div className="tech-tags">
                    {p.technologies.map(t => <span key={t} className="tech-tag">{t}</span>)}
                  </div>
                  {p.link !== '#' && (
                    <a href={p.link} target={p.link.startsWith('http') ? '_blank' : undefined} rel="noopener noreferrer" className="btn-primary">
                      {p.link.startsWith('http') ? 'View on GitHub →' : 'Try it →'}
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>

          <h3 className="other-title">More Projects</h3>
          <div className="other-grid">
            {projects.filter(p => !p.featured).map(p => (
              <div key={p.id} className="project-card-sm glass-card">
                <div className="project-header">
                  <span className="project-cat">{p.category}</span>
                  <span className="project-duration">{p.duration}</span>
                </div>
                <h3>{p.title}</h3>
                {p.caption && (
                  <p style={{ color: '#25d366', fontSize: '0.8rem', fontStyle: 'italic', margin: '0.25rem 0 0.75rem', borderLeft: '2px solid #25d366', paddingLeft: '0.65rem' }}>
                    {p.caption}
                  </p>
                )}
                <p>{p.challenge}</p>
                <div className="project-results-sm">
                  {p.results.map(r => (
                    <div key={r.label} className="result-sm">
                      <span className="result-num-sm">{r.metric}</span>
                      <span className="result-label-sm">{r.label}</span>
                    </div>
                  ))}
                </div>
                <div className="tech-tags" style={{ marginTop: 'auto' }}>
                  {p.technologies.slice(0, 4).map(t => <span key={t} className="tech-tag">{t}</span>)}
                </div>
                {p.link !== '#' && (
                  <a href={p.link} target={p.link.startsWith('http') ? '_blank' : undefined} rel="noopener noreferrer" className="project-link">View project →</a>
                )}
              </div>
            ))}
          </div>

          <div className="glass-card" style={{ marginTop: '3rem', padding: '2rem', textAlign: 'center' }}>
            <h3 style={{ color: '#fff', marginBottom: '0.75rem', fontSize: '1.25rem' }}>How I Build</h3>
            <p style={{ color: '#94a3b8', maxWidth: 620, margin: '0 auto 1.5rem', lineHeight: 1.7 }}>
              Every project starts with a real problem. I pick the simplest stack that ships fast, add fallback layers for reliability, and keep everything free to use. No paywalls, no accounts — just tools that work.
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', justifyContent: 'center' }}>
              {['Node.js', 'Next.js 14', 'JavaScript', 'gifted-baileys', 'GPT-4o', 'Gemini', 'Vercel', 'EliteProTech API', 'GiftedTech API'].map(t => (
                <span key={t} className="tech-tag">{t}</span>
              ))}
            </div>
          </div>
        </div>
      </section>
    </Layout>
  )
}
