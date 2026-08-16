import Layout from '../../components/Layout'
import './team.css'
import { createShareMetadata } from '../../lib/shareMetadata'

export const metadata = createShareMetadata({
  title: 'Team — Toosii Tech',
  description: 'The people behind Toosii Tech and TOOSII XD ULTRA.',
  path: '/team',
})


const team = [
  {
    name: "Toosii Tech",
    role: "Founder & Lead Developer",
    dept: "Development",
    bio: "Software developer & tool builder from Kenya. Started coding in 2021 out of pure curiosity — now running TOOSII XD ULTRA, a multi-device WhatsApp bot with 150+ commands serving thousands of users, alongside a growing platform of free web tools, AI features, and digital experiences. Leads all development, product direction, and innovation at Toosii Tech.",
    expertise: ["Node.js", "gifted-baileys", "Next.js", "API Integration", "WhatsApp Bot Development"],
    email: "toosiitechcompany@gmail.com",
    featured: true,
    initial: "T",
  },
  {
    name: "Jamal",
    role: "Security Consultant",
    dept: "Security",
    bio: "Cybersecurity specialist helping ensure the bot and web tools follow best practices for user data, session security, and API key management.",
    expertise: ["Threat Intelligence", "Security Architecture", "Network Security", "Risk Assessment"],
    email: "jamalikicom@gmail.com",
    featured: true,
    initial: "J",
  },
  {
    name: "Josh",
    role: "Frontend Collaborator",
    dept: "Engineering",
    bio: "Full stack developer specializing in React and Next.js. Contributor to the web tools interface and session generator design.",
    expertise: ["React", "Node.js", "Next.js", "MongoDB", "AWS"],
    email: "jeshi5005@gmail.com",
    featured: false,
    initial: "J",
  },
]

const stats = [
  { num: "4", label: "Core Collaborators" },
  { num: "5+", label: "Years Combined" },
  { num: "150+", label: "Bot Commands Built" },
  { num: "5K+", label: "Users Served" },
]

export default function Team() {
  return (
    <Layout>
      <section className="team-hero">
        <div className="page-wrapper">
          <p className="section-label">The Team</p>
          <h1 className="section-title">Built by real people,<br /><span className="gradient-text">for real users.</span></h1>
          <p className="section-sub">A small group of collaborators based in Kenya and beyond, united around building tools that actually work.</p>
          <div className="team-stats">
            {stats.map(s => (
              <div key={s.label} className="team-stat glass-card">
                <span className="team-stat-num">{s.num}</span>
                <span className="team-stat-label">{s.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section" style={{ paddingTop: '1rem' }}>
        <div className="page-wrapper">
          <p className="section-label" style={{ marginBottom: '1.5rem' }}>Core Team</p>
          <div className="team-grid">
            {team.filter(m => m.featured).map(m => (
              <div key={m.name} className="member-card-featured glass-card">
                <div className="member-avatar">{m.initial}</div>
                <div className="member-info">
                  <h3>{m.name}</h3>
                  <p className="member-role">{m.role}</p>
                  <span className="member-dept">{m.dept}</span>
                  <p className="member-bio">{m.bio}</p>
                  <div className="member-skills">
                    {m.expertise.map(e => <span key={e} className="skill-chip">{e}</span>)}
                  </div>
                  <a href={`mailto:${m.email}`} className="member-email">{m.email}</a>
                </div>
              </div>
            ))}
          </div>

          <p className="section-label" style={{ margin: '3rem 0 1.5rem' }}>Contributors</p>
          <div className="contrib-grid">
            {team.filter(m => !m.featured).map(m => (
              <div key={m.name} className="contrib-card glass-card">
                <div className="contrib-avatar">{m.initial}</div>
                <h4>{m.name}</h4>
                <p className="member-role">{m.role}</p>
                <p className="contrib-bio">{m.bio}</p>
                <div className="member-skills">
                  {m.expertise.slice(0, 4).map(e => <span key={e} className="skill-chip">{e}</span>)}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </Layout>
  )
}
