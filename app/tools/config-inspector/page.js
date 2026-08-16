'use client'

import { useRef, useState } from 'react'
import Layout from '../../../components/Layout'
import '../tools.css'
import './config-inspector.css'

const MAX_BYTES = 256 * 1024
const ACCEPTED = '.ovpn,.ss,.json,.v2,.v2ray,.sing,.singbox,.sb,.hc,.hcc,.ehi,.dark'
const ENCRYPTED_EXTENSIONS = new Set(['hc', 'hcc', 'ehi', 'dark'])

function extensionOf(name = '') {
  return String(name).split('.').pop()?.toLowerCase() || ''
}

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`
  return `${(bytes / 1024).toFixed(1)} KB`
}

export default function ConfigInspectorPage() {
  const inputRef = useRef(null)
  const [file, setFile] = useState(null)
  const [dragging, setDragging] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState(null)
  const [copied, setCopied] = useState(false)

  const chooseFile = (nextFile) => {
    setError('')
    setResult(null)
    setCopied(false)
    if (!nextFile) return
    if (nextFile.size > MAX_BYTES) {
      setFile(null)
      setError('This file is larger than the 256 KB safety limit.')
      return
    }
    setFile(nextFile)
  }

  const inspect = async () => {
    if (!file) {
      setError('Choose a configuration file first.')
      return
    }

    setLoading(true)
    setError('')
    setResult(null)
    setCopied(false)

    try {
      const form = new FormData()
      form.append('file', file)
      const type = extensionOf(file.name)
      if (type) form.append('type', type)

      const response = await fetch('/api/v1/config/inspect', {
        method: 'POST',
        body: form,
      })
      const payload = await response.json().catch(() => ({}))
      if (!response.ok || !payload.success) {
        throw new Error(payload?.error?.message || payload?.error || 'Configuration inspection failed.')
      }
      setResult(payload)
    } catch (inspectionError) {
      setError(inspectionError.message || 'The configuration could not be inspected. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const copyResult = async () => {
    if (!result) return
    try {
      await navigator.clipboard.writeText(JSON.stringify(result, null, 2))
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1800)
    } catch {
      setError('Copy was blocked by the browser. Select the result text and copy it manually.')
    }
  }

  const extension = extensionOf(file?.name)
  const encryptedNotice = extension && ENCRYPTED_EXTENSIONS.has(extension)

  return (
    <Layout>
      <main className="config-inspector-page">
        <section className="tool-hero config-inspector-hero">
          <div className="page-wrapper">
            <div className="badge config-inspector-badge"><span>🛡️</span> Configuration Inspector</div>
            <h1 className="section-title">Upload a config. <span className="gradient-text">Get a safe result.</span></h1>
            <p className="section-sub">
              Inspect supported VPN and proxy configuration files through Toosii API. The result is normalized for copying, while passwords, private keys, tokens, and payload secrets stay redacted.
            </p>
          </div>
        </section>

        <section className="section config-inspector-section">
          <div className="page-wrapper">
            <div className="config-inspector-layout">
              <div className="tool-card glass-card config-upload-card">
                <div className="config-card-heading">
                  <div>
                    <p className="config-eyebrow">Step 01</p>
                    <h2>Load your file</h2>
                  </div>
                  <span className="config-limit">256 KB max</span>
                </div>

                <input
                  ref={inputRef}
                  type="file"
                  accept={ACCEPTED}
                  className="config-file-input"
                  onChange={event => chooseFile(event.target.files?.[0])}
                />
                <button
                  type="button"
                  className={`config-dropzone${dragging ? ' is-dragging' : ''}`}
                  onClick={() => inputRef.current?.click()}
                  onKeyDown={event => { if (event.key === 'Enter' || event.key === ' ') inputRef.current?.click() }}
                  onDragOver={event => { event.preventDefault(); setDragging(true) }}
                  onDragLeave={() => setDragging(false)}
                  onDrop={event => { event.preventDefault(); setDragging(false); chooseFile(event.dataTransfer.files?.[0]) }}
                >
                  <span className="config-drop-icon">↑</span>
                  <strong>{file ? file.name : 'Drop a configuration file here'}</strong>
                  <span>{file ? `${formatBytes(file.size)} · ${extension || 'text'} format` : 'or tap to browse from your device'}</span>
                </button>

                <div className="config-format-row" aria-label="Supported formats">
                  {['.ovpn', '.ss', '.json', '.v2ray', '.singbox'].map(format => <span key={format}>{format}</span>)}
                </div>

                {encryptedNotice && (
                  <div className="config-warning" role="status">
                    <strong>Encrypted format detected.</strong> HC, HCC, EHI, and DARK files are not decrypted by this public inspector. They will be rejected without exposing keys or credentials.
                  </div>
                )}

                <button type="button" className="btn-primary config-inspect-btn" onClick={inspect} disabled={!file || loading}>
                  {loading ? <><span className="config-spinner" /> Inspecting securely…</> : 'Inspect configuration →'}
                </button>

                {error && <div className="error-box" role="alert">{error}</div>}
              </div>

              <div className="config-safe-card glass-card">
                <p className="config-eyebrow">Built for safer sharing</p>
                <h2>What Toosii returns</h2>
                <div className="config-safe-list">
                  <div><span>✓</span><p><strong>Connection metadata</strong><small>Hosts, ports, formats, protocols, and transport details.</small></p></div>
                  <div><span>✓</span><p><strong>Redacted output</strong><small>Passwords, tokens, private keys, and payload values are omitted.</small></p></div>
                  <div><span>✓</span><p><strong>Copy-ready JSON</strong><small>Copy the normalized result for your own notes or debugging.</small></p></div>
                </div>
                <div className="config-privacy-note">Files are processed for the request and are not saved as a user library.</div>
              </div>
            </div>

            {result && (
              <div className="tool-output config-result" role="region" aria-label="Configuration inspection result">
                <div className="tool-output-header">
                  <div>
                    <p className="config-eyebrow">Step 02</p>
                    <h2>{result.format || result.data?.format || 'Inspection result'}</h2>
                    <span className="config-result-meta">Sensitive values redacted · Toosii API</span>
                  </div>
                  <button type="button" className="copy-btn" onClick={copyResult}>{copied ? 'Copied' : 'Copy result'}</button>
                </div>
                <pre className="config-result-code">{JSON.stringify(result, null, 2)}</pre>
              </div>
            )}

            <div className="tips-grid config-tips">
              <div className="tip-card glass-card"><span className="tip-icon">📄</span><h3>Plaintext first</h3><p>Works with readable OpenVPN, Shadowsocks, V2Ray, sing-box, and JSON files.</p></div>
              <div className="tip-card glass-card"><span className="tip-icon">🔒</span><h3>Secrets stay hidden</h3><p>Returned data is redacted so you can share diagnostics more safely.</p></div>
              <div className="tip-card glass-card"><span className="tip-icon">📋</span><h3>Copy in one tap</h3><p>Copy the normalized JSON result directly on your phone or computer.</p></div>
            </div>
          </div>
        </section>
      </main>
    </Layout>
  )
}
