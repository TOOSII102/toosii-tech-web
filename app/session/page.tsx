'use client'
import { useState } from 'react'
import type { Metadata } from 'next'

type Tab = 'pair' | 'qr'

export default function SessionPage() {
  const [tab, setTab] = useState<Tab>('pair')
  const [phone, setPhone] = useState('')
  const [loading, setLoading] = useState(false)
  const [pairCode, setPairCode] = useState('')
  const [sessionId, setSessionId] = useState('')
  const [status, setStatus] = useState<'idle' | 'waiting' | 'done' | 'error'>('idle')
  const [error, setError] = useState('')
  const [qrUrl, setQrUrl] = useState('')
  const [copied, setCopied] = useState(false)

  const reset = () => {
    setPairCode(''); setSessionId(''); setStatus('idle'); setError(''); setQrUrl(''); setCopied(false);
  }

  const pollStatus = async (sid: string) => {
    setStatus('waiting')
    for (let i = 0; i < 60; i++) {
      await new Promise(r => setTimeout(r, 3000))
      try {
        const r = await fetch(`/api/session-status?id=${sid}`)
        const d = await r.json()
        if (d.status === 'sent') { setStatus('done'); return }
        if (d.status === 'failed') { setStatus('error'); setError('Session delivery failed. Try again.'); return }
      } catch {}
    }
    setStatus('error'); setError('Timed out waiting for session. Check your DMs.')
  }

  const handlePair = async () => {
    const cleaned = phone.replace(/[^0-9]/g, '')
    if (cleaned.length < 9) { setError('Enter a valid phone number with country code.'); return }
    setLoading(true); setError(''); reset()
    try {
      const r = await fetch(`/api/pair?number=${cleaned}`)
      const d = await r.json()
      if (d.error) { setError(d.error); setStatus('error') }
      else {
        setPairCode(d.code)
        setSessionId(d.sessionId)
        await pollStatus(d.sessionId)
      }
    } catch (e: unknown) {
      setError('Request failed. Check your internet connection.')
      setStatus('error')
    } finally { setLoading(false) }
  }

  const handleQR = async () => {
    setLoading(true); setError(''); reset()
    try {
      const r = await fetch('/api/qr')
      const d = await r.json()
      if (d.error) { setError(d.error); setStatus('error') }
      else {
        setQrUrl(d.qr)
        setSessionId(d.sessionId)
        await pollStatus(d.sessionId)
      }
    } catch { setError('Failed to generate QR.'); setStatus('error') }
    finally { setLoading(false) }
  }

  const copySession = () => {
    navigator.clipboard.writeText(sessionId)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const steps = tab === 'pair'
    ? ['Enter your WhatsApp number with country code', 'Click "Get Pair Code"', 'Open WhatsApp → Linked Devices → Link with phone number', 'Enter the 8-character code shown', 'Session ID will be delivered to your DMs']
    : ['Click "Generate QR Code"', 'Open WhatsApp → Linked Devices → Link a Device', 'Scan the QR code shown below', 'Session ID will be delivered to your DMs automatically']

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10 relative z-10">
      <div className="blob w-[350px] h-[350px] bg-[rgba(37,211,102,0.05)] -top-10 -left-20" />

      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 stat-badge mb-4">
          <i className="fas fa-key text-xs" /> Session Generator
        </div>
        <h1 className="text-3xl font-extrabold mb-2">
          Get Your <span className="gradient-text">Session ID</span>
        </h1>
        <p className="text-gray-500 text-sm">Link your WhatsApp number to TOOSII XD ULTRA in seconds.</p>
      </div>

      <div className="glass-card p-6 mb-5">
        <div className="flex gap-2 p-1 bg-[rgba(255,255,255,0.03)] rounded-xl mb-6">
          {(['pair', 'qr'] as Tab[]).map(t => (
            <button key={t} onClick={() => { setTab(t); reset() }}
              className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all ${tab === t ? 'btn-primary' : 'text-gray-400 hover:text-white'}`}>
              <i className={`fas ${t === 'pair' ? 'fa-mobile-alt' : 'fa-qrcode'} mr-2`} />
              {t === 'pair' ? 'Pair Code' : 'QR Code'}
            </button>
          ))}
        </div>

        {tab === 'pair' && (
          <div className="space-y-4">
            <div className="relative">
              <i className="fas fa-phone absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500 text-sm" />
              <input
                type="tel"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                placeholder="e.g. 254748340864"
                className="input-field pl-10"
                disabled={loading}
              />
            </div>
            <button onClick={handlePair} disabled={loading || !phone.trim()}
              className="btn-primary w-full py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed">
              {loading ? <><i className="fas fa-spinner spinner" /> Generating...</> : <><i className="fas fa-key" /> Get Pair Code</>}
            </button>

            {pairCode && (
              <div className="mt-4 p-5 bg-[rgba(37,211,102,0.06)] border border-[rgba(37,211,102,0.2)] rounded-xl text-center">
                <p className="text-xs text-gray-400 mb-2 font-medium">Enter this code in WhatsApp</p>
                <div className="text-3xl font-black tracking-[0.3em] text-[#25d366]">{pairCode}</div>
                <p className="text-xs text-gray-500 mt-2">Code expires in 60 seconds</p>
              </div>
            )}
          </div>
        )}

        {tab === 'qr' && (
          <div className="space-y-4">
            <button onClick={handleQR} disabled={loading}
              className="btn-primary w-full py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-40">
              {loading ? <><i className="fas fa-spinner spinner" /> Generating...</> : <><i className="fas fa-qrcode" /> Generate QR Code</>}
            </button>
            {qrUrl && (
              <div className="flex flex-col items-center mt-4 p-6 bg-white rounded-2xl">
                <img src={qrUrl} alt="QR Code" className="w-52 h-52" />
                <p className="text-xs text-gray-600 mt-3 font-medium">Scan with WhatsApp within 60 seconds</p>
              </div>
            )}
          </div>
        )}

        {error && (
          <div className="mt-4 p-3.5 bg-red-500/10 border border-red-500/25 rounded-xl flex items-start gap-2.5">
            <i className="fas fa-exclamation-triangle text-red-400 text-xs mt-0.5" />
            <p className="text-xs text-red-400">{error}</p>
          </div>
        )}

        {status === 'waiting' && (
          <div className="mt-4 p-3.5 bg-[rgba(37,211,102,0.06)] border border-[rgba(37,211,102,0.15)] rounded-xl flex items-center gap-2.5">
            <i className="fas fa-spinner spinner text-[#25d366] text-xs" />
            <p className="text-xs text-gray-400">Waiting for WhatsApp connection... session will appear in your DMs.</p>
          </div>
        )}

        {status === 'done' && sessionId && (
          <div className="mt-5 p-5 bg-[rgba(37,211,102,0.06)] border border-[rgba(37,211,102,0.2)] rounded-xl">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-[#25d366]">✓ Session Delivered to DMs</span>
              <button onClick={copySession}
                className="text-xs px-3 py-1.5 rounded-lg btn-primary">
                <i className={`fas ${copied ? 'fa-check' : 'fa-copy'} mr-1.5`} />
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>
            <div className="bg-[rgba(0,0,0,0.3)] rounded-lg p-3 overflow-x-auto">
              <code className="text-[11px] text-green-400 font-mono break-all">{sessionId}</code>
            </div>
          </div>
        )}
      </div>

      <div className="glass-card p-5">
        <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
          <i className="fas fa-list-ol text-[#25d366] text-xs" /> How to use {tab === 'pair' ? 'Pair Code' : 'QR Code'}
        </h3>
        <ol className="space-y-3">
          {steps.map((step, i) => (
            <li key={i} className="flex items-start gap-3">
              <div className="w-5 h-5 rounded-full bg-[rgba(37,211,102,0.15)] border border-[rgba(37,211,102,0.3)] text-[#25d366] text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">{i+1}</div>
              <p className="text-xs text-gray-400 leading-relaxed">{step}</p>
            </li>
          ))}
        </ol>
      </div>
    </div>
  )
}
