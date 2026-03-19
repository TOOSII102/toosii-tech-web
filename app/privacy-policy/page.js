import Layout from '../../components/Layout'

export const metadata = {
  title: 'Privacy Policy — Toosii Tech',
}

export default function PrivacyPolicy() {
  return (
    <Layout>
      <section style={{ padding: '5rem 0' }}>
        <div className="page-wrapper" style={{ maxWidth: 760 }}>
          <p className="section-label">Legal</p>
          <h1 className="section-title" style={{ fontSize: '2.5rem', marginBottom: '2.5rem' }}>Privacy Policy</h1>

          {[
            { title: 'Overview', text: 'Toosii Tech takes your privacy seriously. This policy explains what data our web tools collect and how it is used.' },
            { title: 'Data Collected', text: 'The Session Generator, Video Downloader and MP3 Downloader do not store any personal data, WhatsApp numbers, or URLs on our servers beyond the duration of your request. No user accounts exist on this site.' },
            { title: 'Third-Party APIs', text: 'Downloads are processed via third-party APIs (GiftedTech API, cobalt.tools). URLs are forwarded to these services solely to retrieve download links. We do not log, store, or share your URLs.' },
            { title: 'Cookies', text: 'This website does not use cookies or local tracking of any kind.' },
            { title: 'Contact', text: 'For any privacy concerns, contact toosiitechcompany@gmail.com.' },
          ].map(s => (
            <div key={s.title} style={{ marginBottom: '2rem' }}>
              <h2 style={{ color: 'white', fontSize: '1.2rem', fontWeight: 700, marginBottom: '0.6rem' }}>{s.title}</h2>
              <p style={{ color: '#94a3b8', lineHeight: 1.7, fontSize: '0.95rem' }}>{s.text}</p>
            </div>
          ))}
          <p style={{ color: '#64748b', fontSize: '0.85rem' }}>Last updated: March 2026</p>
        </div>
      </section>
    </Layout>
  )
}
