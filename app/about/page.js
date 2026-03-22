import Layout from '../../components/Layout'
import Link from 'next/link'
import './about.css'

export const metadata = {
  title: 'About — Toosii Tech',
  description: 'The story behind Toosii Tech — a self-taught developer from Nairobi, Kenya building tools, bots, and digital experiences.',
}

const skills = [
  { name: 'JavaScript / Node.js', pct: 90 },
  { name: 'WhatsApp Bot Development', pct: 95 },
  { name: 'Next.js / React', pct: 78 },
  { name: 'API Integration', pct: 88 },
  { name: 'gifted-baileys / Baileys', pct: 92 },
  { name: 'Python (scripting)', pct: 60 },
]

const timeline = [
  { year: '2021', title: 'Started Coding', desc: 'Picked up JavaScript out of curiosity. First project: a simple calculator in the browser.' },
  { year: '2022', title: 'WhatsApp Bots', desc: 'Discovered whatsapp-web.js and built my first bot. Got hooked immediately and never looked back.' },
  { year: '2023', title: 'Multi-Device Era', desc: 'Migrated to Baileys (gifted-baileys) for multi-device support. Built 50+ commands across media, AI, and groups.' },
  { year: '2024', title: 'TOOSII XD ULTRA', desc: 'Released the full bot publicly. Added AI integration (GPT-4o, Gemini), downloaders, anti-delete, and sports feeds.' },
  { year: '2025', title: 'Web Tools', desc: 'Built this website with session generator, video & MP3 downloader tools so the community can self-serve.' },
  { year: '2026', title: 'Still Building', desc: 'Continuously improving. Every week brings new features, fixes and experiments.' },
]

export default function About() {
  return (
    <Layout>
      {/* Hero */}
      <section className="about-hero">
        <div className="page-wrapper">
          <p className="section-label">About Me</p>
          <h1 className="section-title">Self-taught. Self-driven. <span className="gradient-text">Nairobi-built.</span></h1>
          <p className="section-sub">
            I'm Toosii Tech — a self-taught developer from Nairobi, Kenya who started coding out of curiosity and ended up
            building one of the most feature-rich WhatsApp bots in the community.
          </p>
        </div>
      </section>

      {/* Story */}
      <section className="section">
        <div className="page-wrapper story-grid">
          <div className="story-content">
            <p className="section-label">My Story</p>
            <h2 className="section-title" style={{ fontSize: '2rem' }}>No degree. No bootcamp. Just code.</h2>
            <div className="story-text">
              <p>
                I started teaching myself JavaScript in 2021 — no formal classes, no university, just YouTube videos,
                documentation, and a lot of trial and error. The moment I built my first WhatsApp bot and watched it
                respond to messages in real time, I was completely hooked.
              </p>
              <p>
                Over the years I've gone from basic command handlers to full multi-device bots with AI integration,
                media downloading from 20+ platforms, real-time sports scores, and sophisticated group management tools.
                TOOSII XD ULTRA is the result of hundreds of hours of work and thousands of test messages.
              </p>
              <p>
                I'm based in Nairobi, Kenya and I build because I love it — not because someone told me to. Every
                feature you see in the bot exists because someone in the community asked for it, or because I thought
                it would be cool.
              </p>
            </div>
            <Link href="/contact" className="btn-primary" style={{ marginTop: '1.5rem' }}>Get in Touch →</Link>
          </div>

          <div className="story-side">
            <div className="profile-card glass-card">
              <div className="profile-avatar">T</div>
              <h3>Toosii Tech</h3>
              <p>Self-Taught Developer</p>
              <div className="profile-meta">
                <span>📍 Nairobi, Kenya</span>
                <span>🗓️ Coding since 2021</span>
                <span>🤖 150+ bot commands</span>
                <span>📧 toosiitechcompany@gmail.com</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Skills */}
      <section className="section skills-section">
        <div className="page-wrapper">
          <p className="section-label">Skills</p>
          <h2 className="section-title" style={{ fontSize: '2rem', marginBottom: '2.5rem' }}>What I work with</h2>
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
          <h2 className="section-title" style={{ fontSize: '2rem', marginBottom: '3rem' }}>From zero to 150+ commands</h2>
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
    </Layout>
  )
}
