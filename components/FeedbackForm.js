'use client'

import { useState } from 'react'

const categories = ['General feedback', 'Bug report', 'Feature request', 'Copyright concern', 'Security concern', 'Collaboration']

export default function FeedbackForm() {
  const [form, setForm] = useState({ category: categories[0], name: '', email: '', message: '', website: '' })
  const [state, setState] = useState('idle')
  const [notice, setNotice] = useState('')
  const update = event => setForm(current => ({ ...current, [event.target.name]: event.target.value }))

  const submit = async event => {
    event.preventDefault()
    setState('loading'); setNotice('')
    try {
      const response = await fetch('/api/feedback', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
      const payload = await response.json().catch(() => ({}))
      if (payload.fallbackUrl) {
        setState('fallback')
        setNotice(payload.error || 'Your email app is ready to send this feedback.')
        window.location.href = payload.fallbackUrl
        return
      }
      if (!response.ok) throw new Error(payload.error || 'Feedback could not be sent.')
      setState('success'); setNotice(payload.message || 'Feedback sent successfully.')
      setForm({ category: categories[0], name: '', email: '', message: '', website: '' })
    } catch (error) {
      setState('error'); setNotice(error.message || 'Feedback could not be sent. Please try again.')
    }
  }

  return (
    <form className="feedback-form" onSubmit={submit} noValidate>
      <div className="feedback-form-head"><div><span className="section-eyebrow">STRUCTURED FEEDBACK</span><h2>Tell us what would make Toosii better.</h2></div><span className="feedback-form-badge">No account required</span></div>
      <div className="feedback-form-grid">
        <label>Category<select name="category" value={form.category} onChange={update}>{categories.map(category => <option key={category}>{category}</option>)}</select></label>
        <label>Your name<input name="name" value={form.name} onChange={update} maxLength={120} placeholder="Optional" /></label>
        <label>Email for reply<input name="email" type="email" value={form.email} onChange={update} maxLength={200} placeholder="Optional" /></label>
      </div>
      <label>Message<textarea name="message" value={form.message} onChange={update} minLength={10} maxLength={4000} required placeholder="Describe the issue, idea, or request…" /></label>
      <input className="feedback-honeypot" name="website" value={form.website} onChange={update} tabIndex={-1} autoComplete="off" aria-hidden="true" />
      <div className="feedback-form-foot"><p className={`feedback-notice ${state}`} role="status">{notice || 'Please do not include passwords, private keys, or API tokens.'}</p><button type="submit" disabled={state === 'loading'}>{state === 'loading' ? 'Sending…' : 'Send feedback →'}</button></div>
    </form>
  )
}
