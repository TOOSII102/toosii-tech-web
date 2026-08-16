import Link from 'next/link'

export default function FeedbackSection() {
  return (
    <section className="section feedback-section">
      <div className="page-wrapper">
        <div className="glass-card" style={{ padding: 'clamp(2rem, 5vw, 3.5rem)', textAlign: 'center', maxWidth: 760, margin: '0 auto', border: '1px solid rgba(114, 240, 186, 0.22)', background: 'linear-gradient(135deg, rgba(114,240,186,.08), rgba(117,214,255,.05))' }}>
          <p className="section-eyebrow" style={{ color: '#72f0ba' }}>Feedback</p>
          <h2 className="section-title" style={{ marginBottom: '0.75rem' }}>Help improve Toosii Tech.</h2>
          <p className="section-sub" style={{ margin: '0 auto 1.5rem', maxWidth: 560 }}>
            Tell us what works, report a broken tool, or suggest the next API endpoint and feature you want to see.
          </p>
          <Link href="/contact" className="hero-btn-primary" style={{ display: 'inline-flex', fontSize: '0.95rem', padding: '0.8rem 1.4rem' }}>
            Send Feedback <span aria-hidden="true">→</span>
          </Link>
        </div>
      </div>
    </section>
  )
}
