import Layout from '../../components/Layout'
import Link from 'next/link'
import './about.css'

export const metadata = {
  title: 'About — Toosii Tech',
  description: 'The story behind Toosii Tech — a self-taught developer from Kenya building tools, bots, and digital experiences that reach thousands.',
}

const skills = [
  { name: 'JavaScript / Node.js', pct: 90 },
  { name: 'WhatsApp Bot Development', pct: 95 },
  { name: 'Next.js / React', pct: 78 },
  { name: 'REST API Integration', pct: 88 },
  { name: 'gifted-baileys / Baileys', pct: 92 },
  { name: 'AI & LLM Integration', pct: 82 },
  { name: 'Python (scripting)', pct: 60 },
]

const timeline = [
  { year: '2021', title: 'The First Line', desc: 'Picked up JavaScript out of pure curiosity — no class, no tutor. Built a browser calculator and realised this was exactly what I was meant to do.' },
  { year: '2022', title: 'Bot Era Begins', desc: 'Discovered whatsapp-web.js and shipped my first bot. Watching it respond to real messages in real time was the moment everything clicked.' },
  { year: '2023', title: 'Going Multi-Device', desc: 'Migrated to gifted-baileys for full multi-device support. Scaled from a handful of commands to 50+ features spanning media, AI, and group management.' },
  { year: '2024', title: 'TOOSII XD ULTRA', desc: 'Launched the full bot publicly — 150+ commands, GPT-4o & Gemini AI, anti-delete, live sports scores, and downloads from 20+ platforms.' },
  { year: '2025', title: 'Toosii Tech Platform', desc: 'Built this website to give the community self-serve access to tools: session generator, video & MP3 downloader, AI chat, DramaBox, and more.' },
  { year: '2026', title: 'Still Shipping', desc: 'New features every week. Bigger ambitions. The platform keeps growing — and so does the community around it.' },
]

const highlights = [
  { num: '150+', label: 'Bot Commands Built' },
  { num: '20+', label: 'Platforms Supported' },
  { num: '6+', label: 'AI Models Integrated' },
  { num: '5K+', label: 'Users Reached' },
]

export default function About() {
  return (
    <Layout>

      {/* Hero */}
      <section className="about-hero">
        <div className="page-wrapper">
          <p className="section-label">About Me</p>
          <h1 className="section-title">
            Built from scratch.<br />
            <span className="gradient-text">Driven by purpose.</span>
          </h1>
          <p className="section-sub" style={{ maxWidth: '640px', margin: '0 auto' }}>
            I'm Toosii Tech — a self-taught software developer from Kenya who turned
            curiosity into a platform that serves thousands of users across Africa and beyond.
          </p>
          <div className="hero-cta" style={{ marginTop: '2rem' }}>
            <Link href="/projects" className="btn-primary">View My Work →</Link>
            <Link href="/contact" className="btn-outline">Work With Me</Link>
          </div>
        </div>
      </section>

      {/* Highlight Stats */}
      <section className="section" style={{ paddingTop: '1rem' }}>
        <div className="page-wrapper">
          <div className="stats-grid">
            {highlights.map(h => (
              <div key={h.num} className="stat-card glass-card" style={{ textAlign: 'center', padding: '1.6rem 1rem' }}>
                <div className="stat-num gradient-text" style={{ fontSize: '2.2rem', fontWeight: 800, lineHeight: 1 }}>{h.num}</div>
                <div style={{ color: '#94a3b8', fontSize: '0.85rem', marginTop: '0.4rem', fontWeight: 500 }}>{h.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Story */}
      <section className="section">
        <div className="page-wrapper story-grid">
          <div className="story-content">
            <p className="section-label">My Story</p>
            <h2 className="section-title" style={{ fontSize: '2rem' }}>
              No degree. No bootcamp.<br />Just relentless curiosity.
            </h2>
            <div className="story-text">
              <p>
                In 2021 I opened a code editor for the first time with no roadmap, no mentor, and no
                guarantee it would go anywhere. I taught myself JavaScript through documentation,
                YouTube deep-dives, and pure trial-and-error. That first working script felt like
                unlocking a superpower.
              </p>
              <p>
                What started as a side experiment evolved into <strong style={{ color: '#fff' }}>TOOSII XD ULTRA</strong> — one
                of the most feature-complete WhatsApp bots in the community, with AI conversation,
                media downloads from 20+ platforms, live sports scores, group administration tools,
                and anti-delete recovery all running in a single multi-device instance.
              </p>
              <p>
                Today, Toosii Tech is more than a bot. It's a growing platform of free tools — built
                for real people, designed to work without accounts or paywalls, and shipped by a
                single developer who still believes the best products come from genuine passion.
              </p>
            </div>
            <Link href="/contact" className="btn-primary" style={{ marginTop: '1.5rem' }}>Get in Touch →</Link>
          </div>

          <div className="story-side">
            <div className="profile-card glass-card">
              <div className="profile-avatar">T</div>
              <h3>Toosii Tech</h3>
              <p style={{ color: '#25d366', fontWeight: 600, fontSize: '0.9rem' }}>Software Developer & Tool Builder</p>
              <div className="profile-meta">
                <span>📍 Kenya</span>
                <span>🗓️ Building since 2021</span>
                <span>🤖 150+ bot commands shipped</span>
                <span>🌍 Serving users across Africa & beyond</span>
                <span>📧 toosiitechcompany@gmail.com</span>
              </div>
              <Link href="/contact" className="btn-primary" style={{ marginTop: '1.2rem', width: '100%', textAlign: 'center' }}>
                Hire Me →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Skills */}
      <section className="section skills-section">
        <div className="page-wrapper">
          <p className="section-label">Expertise</p>
          <h2 className="section-title" style={{ fontSize: '2rem', marginBottom: '2.5rem' }}>
            Technologies I build with
          </h2>
          <div className="skills-bars">
            {skills.map(s => (
              <div key={s.name} className="skill-row">
                <div className="skill-meta">
                  <span>{s.name}</span>
                  <span>{s.pct}%</span>
                </div>
                <div className="skill-bar">
                  <div className="skill-fill" style={{ width: `${s.pct}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Timeline */}
      <section className="section">
        <div className="page-wrapper">
          <p className="section-label">Journey</p>
          <h2 className="section-title" style={{ fontSize: '2rem', marginBottom: '3rem' }}>
            Five years of shipping
          </h2>
          <div className="timeline">
            {timeline.map((t, i) => (
              <div key={t.year} className={`timeline-item ${i % 2 === 0 ? 'left' : 'right'}`}>
                <div className="timeline-year">{t.year}</div>
                <div className="timeline-content glass-card">
                  <h3>{t.title}</h3>
                  <p>{t.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="section" style={{ paddingBottom: '6rem' }}>
        <div className="page-wrapper" style={{ textAlign: 'center' }}>
          <p className="section-label">Let's Build Together</p>
          <h2 className="section-title" style={{ fontSize: '2rem', marginBottom: '1rem' }}>
            Have an idea? I'd love to hear it.
          </h2>
          <p style={{ color: '#94a3b8', maxWidth: '500px', margin: '0 auto 2rem', lineHeight: 1.7 }}>
            Whether it's a custom bot, a web tool, an API integration, or something entirely new —
            I'm open to collaborations, commissions, and conversations.
          </p>
          <div className="hero-cta" style={{ justifyContent: 'center' }}>
            <Link href="/contact" className="btn-primary">Start a Conversation →</Link>
            <Link href="/projects" className="btn-outline">See My Projects</Link>
          </div>
        </div>
      </section>

    </Layout>
  )
}
