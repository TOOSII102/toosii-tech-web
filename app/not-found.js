import Link from 'next/link'
import Layout from '../components/Layout'

export const metadata = { title: '404 — Page Not Found | Toosii Tech' }

export default function NotFound() {
  return (
    <Layout>
      <style>{`
        .nf-wrap {
          min-height: 72vh;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          padding: 4rem 1.5rem;
        }
        .nf-code {
          font-size: clamp(5rem, 15vw, 9rem);
          font-weight: 900;
          line-height: 1;
          background: linear-gradient(135deg, #25d366 0%, #3b82f6 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          margin-bottom: 0.5rem;
          letter-spacing: -0.04em;
        }
        .nf-title {
          font-size: clamp(1.2rem, 3vw, 1.75rem);
          font-weight: 800;
          color: white;
          margin-bottom: 0.75rem;
        }
        .nf-sub {
          font-size: 1rem;
          color: #64748b;
          max-width: 420px;
          line-height: 1.65;
          margin-bottom: 2.5rem;
        }
        .nf-links {
          display: flex;
          flex-wrap: wrap;
          gap: 0.75rem;
          justify-content: center;
        }
        .nf-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
          gap: 0.65rem;
          max-width: 560px;
          margin: 2.5rem auto 0;
          width: 100%;
          padding: 0 1rem;
        }
        .nf-chip {
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 10px;
          padding: 0.75rem 0.9rem;
          font-size: 0.82rem;
          font-weight: 600;
          color: #94a3b8;
          text-decoration: none;
          text-align: center;
          transition: border-color 0.2s, color 0.2s, background 0.2s;
        }
        .nf-chip:hover {
          border-color: rgba(37,211,102,0.3);
          color: #25d366;
          background: rgba(37,211,102,0.05);
        }
      `}</style>
      <div className="nf-wrap">
        <div className="nf-code">404</div>
        <h1 className="nf-title">This page doesn&apos;t exist</h1>
        <p className="nf-sub">The link you followed may be broken, or the page may have been removed. Head back and find what you need.</p>
        <div className="nf-links">
          <Link href="/" className="btn-primary">← Back to Home</Link>
          <Link href="/tools" className="btn-outline">Browse Tools</Link>
        </div>
        <div className="nf-grid">
          {[
            { href: '/downloader/video',   label: '🎬 Video Download' },
            { href: '/downloader/audio',   label: '🎵 MP3 Download' },
            { href: '/downloader/spotify', label: '🎧 Spotify' },
            { href: '/tools/ai',           label: '🤖 Toosii AI' },
            { href: '/tools/apk',          label: '📦 APK Search' },
            { href: '/tools/tempemail',    label: '📧 Temp Email' },
            { href: '/blog',               label: '📝 Blog' },
            { href: '/projects',           label: '🚀 Projects' },
          ].map(l => (
            <Link key={l.href} href={l.href} className="nf-chip">{l.label}</Link>
          ))}
        </div>
      </div>
    </Layout>
  )
}
