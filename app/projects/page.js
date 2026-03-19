import Layout from '../../components/Layout'
import Link from 'next/link'
import './projects.css'

export const metadata = { title: 'Projects — Toosii Tech', description: 'Real projects built by Toosii Tech — WhatsApp bots, web tools, and developer utilities.' }

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
    technologies: ["Node.js", "gifted-baileys", "GPT-4o", "Gemini", "GiftedTech API", "cobalt.tools"],
    link: "https://github.com/TOOSII102/TOOSII-XD-ULTRA",
    featured: true,
  },
  {
    id: 2,
    title: "Toosii Tech Web — Developer Tools Website",
    category: "Web App",
    status: "Live",
    duration: "2025 – Present",
    results: [
      { metric: "5", label: "Tools" },
      { metric: "7", label: "Pages" },
      { metric: "100%", label: "Free" },
    ],
    challenge: "Build a professional personal website with working session generator, video downloader, and MP3 downloader — deployable on Vercel with no sign-up required.",
    solution: "Next.js 14 App Router with server-side API routes proxying to GiftedTech and cobalt.tools. Multi-method fallback chains. Particle canvas animated background. All plain JavaScript — no TypeScript complexity.",
    technologies: ["Next.js 14", "JavaScript", "GiftedTech API", "cobalt.tools", "loader.to", "Vercel"],
    link: "#",
    featured: true,
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
  },
]

export default function Projects() {
  return (
    <Layout>
      <section className="projects-hero">
        <div className="page-wrapper">
          <p className="section-label">Projects</p>
          <h1 className="section-title">Things I've Built</h1>
          <p className="section-sub">Real projects with real users. Every one of these started as a personal need or a community request. Here's what I've shipped.</p>
        </div>
      </section>

      <section className="section" style={{ paddingTop: '1rem' }}>
        <div className="page-wrapper">
          {/* Featured Projects */}
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

          {/* Other Projects */}
          <h3 className="other-title">More Projects</h3>
          <div className="other-grid">
            {projects.filter(p => !p.featured).map(p => (
              <div key={p.id} className="project-card-sm glass-card">
                <div className="project-header">
                  <span className="project-cat">{p.category}</span>
                  <span className="project-duration">{p.duration}</span>
                </div>
                <h3>{p.title}</h3>
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
        </div>
      </section>
    </Layout>
  )
}
