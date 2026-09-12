'use client'
import Layout from '../../../components/Layout'
import { useState } from 'react'
import '../tools.css'

const CURRENCIES = [
  { code: 'KES', label: 'Kenyan Shilling (KES)' },
  { code: 'USD', label: 'US Dollar (USD)' },
  { code: 'EUR', label: 'Euro (EUR)' },
  { code: 'GBP', label: 'British Pound (GBP)' },
  { code: 'UGX', label: 'Ugandan Shilling (UGX)' },
  { code: 'TZS', label: 'Tanzanian Shilling (TZS)' },
  { code: 'RWF', label: 'Rwandan Franc (RWF)' },
  { code: 'NGN', label: 'Nigerian Naira (NGN)' },
  { code: 'ZAR', label: 'South African Rand (ZAR)' },
  { code: 'GHS', label: 'Ghanaian Cedi (GHS)' },
  { code: 'AED', label: 'UAE Dirham (AED)' },
  { code: 'SAR', label: 'Saudi Riyal (SAR)' },
  { code: 'JPY', label: 'Japanese Yen (JPY)' },
  { code: 'CNY', label: 'Chinese Yuan (CNY)' },
  { code: 'INR', label: 'Indian Rupee (INR)' },
  { code: 'CAD', label: 'Canadian Dollar (CAD)' },
  { code: 'AUD', label: 'Australian Dollar (AUD)' },
  { code: 'CHF', label: 'Swiss Franc (CHF)' },
]

function formatMoney(value) {
  if (!Number.isFinite(value)) return '—'
  return value.toLocaleString('en-KE', { maximumFractionDigits: 2 })
}

export default function CurrencyTool() {
  const [amount, setAmount] = useState('100')
  const [from, setFrom]     = useState('USD')
  const [to, setTo]         = useState('KES')
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')
  const [result, setResult]   = useState(null)

  const convert = async () => {
    const value = amount.trim()
    if (!value) return setError('Enter an amount first.')
    setLoading(true); setError(''); setResult(null)
    try {
      const res = await fetch(`/api/tools/currency?amount=${encodeURIComponent(value)}&from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`)
      const data = await res.json()
      if (!res.ok) {
        const message = data?.error?.message || 'Exchange rates are unavailable right now.'
        return setError(typeof message === 'string' ? message : 'Exchange rates are unavailable right now.')
      }
      setResult(data)
    } catch {
      setError('Network error — check your connection and try again.')
    } finally {
      setLoading(false)
    }
  }

  const swap = () => {
    setFrom(to)
    setTo(from)
    setError('')
  }

  return (
    <Layout>
      <section className="tool-hero">
        <div className="page-wrapper">
          <div style={{ marginBottom: '1.5rem' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '.5rem', padding: '.45rem 1rem', borderRadius: '999px', border: '1px solid rgba(245,158,11,.35)', background: 'rgba(245,158,11,.08)', color: '#fcd34d', fontSize: '.8rem', fontWeight: 700 }}>
              💱 Currency Converter
            </span>
          </div>
          <h1 className="section-title">Know your <span className="gradient-text">exact rate.</span></h1>
          <p className="section-sub">
            Convert KES to USD, UGX, TZS, EUR and 100+ more currencies with daily exchange rates. For remittances, pricing and travel — no account needed.
          </p>
        </div>
      </section>

      <section className="section" style={{ paddingTop: '1rem' }}>
        <div className="page-wrapper">
          <div className="tool-card glass-card">
            <div className="essentials-form-row">
              <div className="dl-search-wrapper">
                <span className="dl-search-icon">💵</span>
                <input
                  type="number"
                  min="0"
                  step="any"
                  placeholder="Amount"
                  value={amount}
                  onChange={e => { setAmount(e.target.value); setError('') }}
                  className="dl-search-input"
                  onKeyDown={e => e.key === 'Enter' && !loading && convert()}
                  disabled={loading}
                />
              </div>
              <select value={from} onChange={e => setFrom(e.target.value)} className="tool-select" disabled={loading} aria-label="From currency">
                {CURRENCIES.map(c => <option key={c.code} value={c.code}>{c.label}</option>)}
              </select>
              <button onClick={swap} disabled={loading} className="btn-outline" style={{ padding: '0 1rem', fontSize: '1rem' }} title="Swap currencies" aria-label="Swap currencies">
                ⇄
              </button>
              <select value={to} onChange={e => setTo(e.target.value)} className="tool-select" disabled={loading} aria-label="To currency">
                {CURRENCIES.map(c => <option key={c.code} value={c.code}>{c.label}</option>)}
              </select>
            </div>
            <button onClick={convert} disabled={loading} className="dl-search-btn" style={{ width: '100%', marginTop: '.75rem' }}>
              {loading ? 'Fetching rate…' : '💱 Convert'}
            </button>

            {error && <p className="tool-error">{error}</p>}

            {result && (
              <div className="essentials-result-box">
                <div style={{ fontSize: '.75rem', textTransform: 'uppercase', letterSpacing: '.08em', color: '#64748b', fontWeight: 700 }}>
                  {formatMoney(result.amount)} {result.from} =
                </div>
                <div style={{ fontSize: '1.9rem', fontWeight: 800, color: '#72f0ba', margin: '.4rem 0' }}>
                  {formatMoney(result.converted)} {result.to}
                </div>
                <p className="essentials-mut" style={{ marginTop: 0 }}>
                  1 {result.from} = {formatMoney(result.rate)} {result.to} · Rate date: {result.date}
                </p>
              </div>
            )}
          </div>

          <div className="tool-card glass-card">
            <h3 style={{ margin: '0 0 1rem', color: '#4ade80' }}>Good to know</h3>
            <ul style={{ margin: 0, paddingLeft: '1.2rem', color: '#ccc', lineHeight: 2 }}>
              <li>Rates are daily reference rates — banks and bureaux apply their own spread.</li>
              <li>Use it for M-Pesa remittance estimates, import pricing, and travel budgets.</li>
              <li>The ⇄ button swaps the pair instantly.</li>
            </ul>
            <p style={{ margin: '1rem 0 0', color: '#666', fontSize: '.8rem' }}>
              Made by Toosii Tech · Powered by the Partner API
            </p>
          </div>
        </div>
      </section>
    </Layout>
  )
}
