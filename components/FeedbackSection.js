import Link from 'next/link'

const feedbackOptions = [
  {
    number: '01',
    title: 'Report an issue',
    description: 'Tell us when a page, tool, or feature does not work as expected.',
    subject: 'Toosii Tech feedback: issue report',
  },
  {
    number: '02',
    title: 'Request a feature',
    description: 'Share the tools, integrations, or improvements you would like to see.',
    subject: 'Toosii Tech feedback: feature request',
  },
  {
    number: '03',
    title: 'Share feedback',
    description: 'Let us know what is useful, what could improve, or how we can help.',
    subject: 'Toosii Tech feedback',
  },
]

function feedbackEmail(subject) {
  return `mailto:toosiitechcompany@gmail.com?subject=${encodeURIComponent(subject)}`
}

export default function FeedbackSection() {
  return (
    <section className="section feedback-section" aria-labelledby="feedback-title">
      <div className="page-wrapper">
        <div className="feedback-shell">
          <div className="feedback-intro">
            <p className="section-eyebrow">Contact &amp; Feedback</p>
            <h2 id="feedback-title" className="feedback-title">
              Help shape what <span className="feedback-gradient">comes next.</span>
            </h2>
            <p className="feedback-subtitle">
              Have a question, found an issue, or have an idea for Toosii Tech? Your message helps make the platform more useful for everyone.
            </p>
            <div className="feedback-actions">
              <Link href="/contact" className="feedback-primary-action">Contact Toosii Tech <span aria-hidden="true">→</span></Link>
              <a href={feedbackEmail('Toosii Tech feedback')} className="feedback-secondary-action">Send an email</a>
            </div>
            <p className="feedback-response">Most messages receive a response within 24 hours.</p>
          </div>

          <div className="feedback-options" aria-label="Feedback options">
            {feedbackOptions.map(option => (
              <a
                key={option.number}
                href={feedbackEmail(option.subject)}
                className="feedback-option"
                aria-label={`${option.title}: email Toosii Tech`}
              >
                <span className="feedback-option-number">{option.number}</span>
                <span className="feedback-option-content">
                  <strong>{option.title}</strong>
                  <span>{option.description}</span>
                </span>
                <span className="feedback-option-arrow" aria-hidden="true">→</span>
              </a>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
