import Layout from '../../components/Layout'
import './contact.css'

export const metadata = {
  title: 'Contact — Toosii Tech',
  description: 'Get in touch with Toosii Tech for bot support, collaborations, or custom work.',
}

export default function Contact() {
  return (
    <Layout>
      <section className="contact-hero">
        <div className="page-wrapper">
          <p className="section-label">Contact</p>
          <h1 className="section-title">Let's Talk</h1>
          <p className="section-sub">Have a question about the bot? Want to collaborate? Or just want to say hi? I'm reachable.</p>
        </div>
      </section>

      <section className="section" style={{ paddingTop: '1rem' }}>
        <div className="page-wrapper contact-grid">
          <div className="contact-info-cards">
            {[
              { icon: '📧', label: 'Email', value: 'toosiitechcompany@gmail.com', href: 'mailto:toosiitechcompany@gmail.com' },
              { icon: '📱', label: 'WhatsApp', value: '+254 748 340 864', href: 'https://wa.me/254748340864' },
              { icon: '📱', label: 'WhatsApp 2', value: '+254 746 677 793', href: 'https://wa.me/254746677793' },
              { icon: '📱', label: 'WhatsApp 3', value: '+254 788 781 373', href: 'https://wa.me/254788781373' },
              { icon: '✈️', label: 'Telegram', value: '@toosiitech', href: 'https://t.me/toosiitech' },
              { icon: '📍', label: 'Location', value: 'Nairobi, Kenya', href: null },
              { icon: '🐙', label: 'GitHub', value: 'github.com/TOOSII102', href: 'https://github.com/TOOSII102' },
            ].map(c => (
              <div key={c.label} className="contact-card glass-card">
                <div className="contact-icon">{c.icon}</div>
                <div>
                  <p className="contact-label">{c.label}</p>
                  {c.href ? (
                    <a href={c.href} target={c.href.startsWith('http') ? '_blank' : undefined} rel="noopener noreferrer" className="contact-value">{c.value}</a>
                  ) : (
                    <span className="contact-value">{c.value}</span>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="contact-note glass-card">
            <h2>What I Can Help With</h2>
            <ul>
              <li>🤖 Bot setup, session issues, and troubleshooting</li>
              <li>🛠️ Custom WhatsApp bot development</li>
              <li>🤝 Collaborations and open-source contributions</li>
              <li>💼 Freelance web development projects</li>
              <li>📦 Feature requests for TOOSII XD ULTRA</li>
            </ul>
            <p className="contact-response">I usually respond within 24 hours.</p>
          </div>
        </div>
      </section>
    </Layout>
  )
}
