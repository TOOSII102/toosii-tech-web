import Layout from '../../components/Layout'
import './contact.css'

export const metadata = {
  title: 'Contact — Toosii Tech',
  description: 'Reach out to Toosii Tech for collaborations, custom projects, bot support, or any enquiries.',
}

const whatsappNumbers = [
  { label: 'WhatsApp', number: '+254 748 340 864', raw: '254748340864' },
  { label: 'WhatsApp 2', number: '+254 746 677 793', raw: '254746677793' },
  { label: 'WhatsApp 3', number: '+254 788 781 373', raw: '254788781373' },
]

const otherContacts = [
  { icon: '📧', label: 'Email', value: 'toosiitechcompany@gmail.com', href: 'mailto:toosiitechcompany@gmail.com' },
  { icon: '✈️', label: 'Telegram', value: '@toosiitech', href: 'https://t.me/toosiitech' },
  { icon: '📍', label: 'Location', value: 'Nairobi, Kenya', href: null },
  { icon: '🐙', label: 'GitHub', value: 'github.com/TOOSII102', href: 'https://github.com/TOOSII102' },
]

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
          <div className="contact-left">

            {/* WhatsApp Cards */}
            <div className="wa-section">
              <p className="wa-section-label">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="#25d366" style={{ flexShrink: 0 }}>
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
                WhatsApp — Message Me Directly
              </p>
              <div className="wa-cards">
                {whatsappNumbers.map(w => (
                  <a
                    key={w.raw}
                    href={`https://wa.me/${w.raw}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="wa-card"
                  >
                    <div className="wa-card-inner">
                      <div className="wa-icon">
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="white">
                          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                        </svg>
                      </div>
                      <div className="wa-info">
                        <span className="wa-label">{w.label}</span>
                        <span className="wa-number">{w.number}</span>
                      </div>
                      <span className="wa-cta">Chat →</span>
                    </div>
                  </a>
                ))}
              </div>
            </div>

            {/* Other contacts */}
            <div className="contact-info-cards">
              {otherContacts.map(c => (
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
