'use client'

const AMOUNTS = ['KSh 20', 'KSh 50', 'KSh 100', 'KSh 500']

const REASONS = [
  { icon: '⚡', text: 'Keeps the servers running 24/7' },
  { icon: '🔧', text: 'Funds new tool development' },
  { icon: '🤖', text: 'Powers the AI model subscriptions' },
  { icon: '❤️', text: 'Supports a solo dev from Nairobi' },
]

export default function SupportSection() {
  const openModal = () =>
    window.dispatchEvent(new Event('open-coffee-modal'))

  return (
    <section className="section support-section">
      <div className="page-wrapper">

        {/* Top glow line */}
        <div className="support-glow-line" />

        <div className="support-inner">

          {/* Left: copy */}
          <div className="support-copy">
            <p className="section-label">Support the Project</p>
            <h2 className="support-title">
              Buy Me a <span className="support-gradient">Coffee ☕</span>
            </h2>
            <p className="support-sub">
              Toosii Tech is built and maintained solo — no team, no VC funding,
              just passion and late nights in Nairobi. Every tool on this platform
              is free to use. If anything here has saved you time or made your day,
              a small contribution keeps it all alive.
            </p>

            <ul className="support-reasons">
              {REASONS.map(r => (
                <li key={r.text} className="support-reason">
                  <span className="support-reason-icon">{r.icon}</span>
                  <span>{r.text}</span>
                </li>
              ))}
            </ul>

            <button className="support-cta-btn" onClick={openModal}>
              ☕ Buy Me a Coffee
            </button>
            <p className="support-note">
              🔒 Secure via Paystack &nbsp;·&nbsp; M-PESA, Airtel Money & Card accepted
            </p>
          </div>

          {/* Right: visual card */}
          <div className="support-card">
            <div className="support-card-icon">☕</div>
            <p className="support-card-heading">Choose your contribution</p>
            <p className="support-card-sub">Any amount makes a difference</p>

            <div className="support-amounts">
              {AMOUNTS.map(a => (
                <button
                  key={a}
                  className="support-amount-chip"
                  onClick={openModal}
                >
                  {a}
                </button>
              ))}
            </div>

            <button className="support-card-btn" onClick={openModal}>
              Support Now →
            </button>

            <div className="support-payment-icons">
              <span className="support-payment-badge">M-PESA</span>
              <span className="support-payment-badge">Airtel</span>
              <span className="support-payment-badge">Card</span>
            </div>
          </div>

        </div>
      </div>
    </section>
  )
}
