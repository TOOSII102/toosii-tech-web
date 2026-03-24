'use client';
import { useState, useEffect, useRef } from 'react';
import './BuyCoffee.css';

const PK = 'pk_live_151add3eee89135c64ed91ee899f1e4ddba6e4dd';

const METHODS = [
  {
    id: 'mpesa',
    label: 'Pay with M-PESA',
    color: '#4CAF50',
    channels: ['mobile_money'],
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="22" height="22">
        <rect x="5" y="2" width="14" height="20" rx="2" ry="2"/>
        <line x1="12" y1="18" x2="12.01" y2="18"/>
      </svg>
    ),
  },
  {
    id: 'till',
    label: 'Pay with M-PESA Till',
    color: '#4CAF50',
    channels: ['mobile_money'],
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="22" height="22">
        <rect x="5" y="2" width="14" height="20" rx="2" ry="2"/>
        <line x1="12" y1="18" x2="12.01" y2="18"/>
        <line x1="9" y1="7" x2="15" y2="7"/>
      </svg>
    ),
  },
  {
    id: 'airtel',
    label: 'Pay with Airtel Money',
    color: '#E53935',
    channels: ['mobile_money'],
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="22" height="22">
        <path d="M1.5 8.5a13 13 0 0 1 21 0"/>
        <path d="M5 12a10 10 0 0 1 14 0"/>
        <path d="M8.5 15.5a6 6 0 0 1 7 0"/>
        <circle cx="12" cy="19" r="1" fill="currentColor"/>
      </svg>
    ),
  },
  {
    id: 'card',
    label: 'Pay with Card',
    color: '#5C6BC0',
    channels: ['card'],
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="22" height="22">
        <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/>
        <line x1="1" y1="10" x2="23" y2="10"/>
      </svg>
    ),
  },
];

function loadPaystack() {
  return new Promise((resolve, reject) => {
    if (window.PaystackPop) { resolve(); return; }
    const s = document.createElement('script');
    s.src = 'https://js.paystack.co/v1/inline.js';
    s.onload  = () => resolve();
    s.onerror = () => reject(new Error('Could not load payment SDK. Check your connection.'));
    document.head.appendChild(s);
    /* Safety timeout — reject after 12 s so the spinner doesn't hang forever */
    setTimeout(() => reject(new Error('Payment SDK timed out. Please try again.')), 12000);
  });
}

/* Force a 1280-wide viewport so Paystack always renders its desktop UI */
function forceDesktopViewport() {
  let vp = document.querySelector('meta[name="viewport"]');
  if (!vp) { vp = document.createElement('meta'); vp.name = 'viewport'; document.head.appendChild(vp); }
  vp.dataset.saved = vp.content;
  vp.content = 'width=1280, initial-scale=1';
}

/* Restore the original viewport after Paystack closes */
function restoreViewport() {
  const vp = document.querySelector('meta[name="viewport"]');
  if (vp && vp.dataset.saved) {
    vp.content = vp.dataset.saved;
    delete vp.dataset.saved;
  }
}

export default function BuyCoffee() {
  const [open, setOpen]       = useState(false);
  const [method, setMethod]   = useState(null);
  const [amount, setAmount]   = useState('');
  const [loading, setLoading] = useState(false);
  const [payErr, setPayErr]   = useState('');
  const [pulse, setPulse]     = useState(false);
  const overlayRef    = useRef(null);
  const inputRef      = useRef(null);
  const historyPushed = useRef(false);

  useEffect(() => {
    const t = setTimeout(() => setPulse(true), 4000);
    return () => clearTimeout(t);
  }, []);

  /* listen for nav trigger */
  useEffect(() => {
    const handler = () => { setOpen(true); setPulse(false); };
    window.addEventListener('open-coffee-modal', handler);
    return () => window.removeEventListener('open-coffee-modal', handler);
  }, []);

  /* close on backdrop click */
  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (overlayRef.current && e.target === overlayRef.current) handleClose();
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  /* lock scroll while open */
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  /* Push a history entry when modal opens so the device back button closes it */
  useEffect(() => {
    if (open) {
      history.pushState({ bcModal: true }, '');
      historyPushed.current = true;
    }
  }, [open]);

  /* Intercept back button — close modal instead of navigating away */
  useEffect(() => {
    const handler = () => {
      if (!historyPushed.current) return;
      historyPushed.current = false;
      setOpen(false);
      setMethod(null);
      setAmount('');
      setLoading(false);
      setPayErr('');
    };
    window.addEventListener('popstate', handler);
    return () => window.removeEventListener('popstate', handler);
  }, []);

  /* focus input when method selected */
  useEffect(() => {
    if (method && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 80);
    }
  }, [method]);

  /* close on Escape key */
  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (e.key === 'Escape') {
        if (method) { setMethod(null); setAmount(''); }
        else handleClose();
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, method]);

  const handleClose = () => {
    /* If we pushed a history entry, pop it so back-button stays clean */
    if (historyPushed.current) {
      historyPushed.current = false;
      history.back();
    }
    setOpen(false);
    setMethod(null);
    setAmount('');
    setLoading(false);
    setPayErr('');
  };

  const handleBack = () => {
    setMethod(null);
    setAmount('');
    setLoading(false);
    setPayErr('');
  };

  const MIN_AMOUNT = 10;
  const parsed = parseInt(amount, 10);
  const canPay = !isNaN(parsed) && parsed >= MIN_AMOUNT;

  const handlePay = async () => {
    if (!canPay || loading) return;
    setLoading(true);
    setPayErr('');
    try {
      await loadPaystack();

      if (!window.PaystackPop) throw new Error('Payment SDK not available.');

      const ref = 'toosii_' + Date.now();
      const handler = window.PaystackPop.setup({
        key: PK,
        email: 'support@toosiitech.com',
        amount: parsed * 100,
        currency: 'KES',
        ref,
        channels: method?.channels || ['card', 'mobile_money'],
        metadata: { custom_fields: [] },
        onClose: () => {
          /* Restore viewport then bring our modal back */
          restoreViewport();
          setLoading(false);
          setOpen(true);
        },
        callback: () => {
          /* Restore viewport then close everything */
          restoreViewport();
          setLoading(false);
          handleClose();
        },
      });
      /* Hide our modal, force desktop viewport, then open Paystack */
      setOpen(false);
      forceDesktopViewport();
      handler.openIframe();
    } catch (err) {
      console.error('[Paystack]', err);
      setLoading(false);
      setPayErr(err.message || 'Payment could not open. Please try again.');
    }
  };

  return (
    <>
      <button
        className={`bc-fab${pulse ? ' bc-fab--pulse' : ''}`}
        onClick={() => { setOpen(true); setPulse(false); }}
        aria-label="Support Toosii Tech"
        title="Support Toosii Tech"
      >
        <span className="bc-fab-icon">☕</span>
        <span className="bc-fab-label">Support</span>
      </button>

      {open && (
        <div className="bc-overlay" ref={overlayRef}>
          <div className="bc-modal" role="dialog" aria-modal="true">

            {/* Top bar */}
            <div className="bc-topbar">
              {method ? (
                <button className="bc-back-btn" onClick={handleBack} aria-label="Back">
                  ← Back
                </button>
              ) : (
                <span className="bc-topbar-title">☕ Buy Me a Coffee</span>
              )}
              <button className="bc-close" onClick={handleClose} aria-label="Close">✕</button>
            </div>

            {/* Step 1: choose payment method */}
            {!method && (
              <div className="bc-body">
                <div className="bc-coffee-icon-sm">☕</div>
                <p className="bc-subtitle">
                  If Toosii Tech has been useful, consider buying me a coffee. Choose how you'd like to pay:
                </p>

                <div className="bc-methods">
                  {METHODS.map(m => (
                    <button
                      key={m.id}
                      className="bc-method-btn"
                      style={{ '--m-color': m.color }}
                      onClick={() => setMethod(m)}
                    >
                      <span className="bc-method-icon" style={{ color: m.color }}>
                        {m.icon}
                      </span>
                      <span className="bc-method-label">{m.label}</span>
                      <span className="bc-method-arrow">›</span>
                    </button>
                  ))}
                </div>

                <p className="bc-secure" style={{ marginTop: '1rem' }}>🔒 Secure payments via Paystack</p>
              </div>
            )}

            {/* Step 2: enter amount and pay */}
            {method && (
              <div className="bc-body">
                <div className="bc-method-selected" style={{ '--m-color': method.color }}>
                  <span className="bc-method-selected-icon" style={{ color: method.color }}>
                    {method.icon}
                  </span>
                  <span className="bc-method-selected-label" style={{ color: method.color }}>
                    {method.label}
                  </span>
                </div>

                <p className="bc-subtitle" style={{ marginTop: '0.85rem' }}>
                  Enter the amount you'd like to send:
                </p>

                <div className="bc-custom-wrap">
                  <span className="bc-currency">KSh</span>
                  <input
                    ref={inputRef}
                    className="bc-custom-input"
                    type="number"
                    min="10"
                    placeholder="Min KSh 10"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handlePay()}
                    disabled={loading}
                  />
                </div>

                {!isNaN(parsed) && parsed > 0 && parsed < MIN_AMOUNT && (
                  <p className="bc-min-note">Minimum amount is KSh {MIN_AMOUNT}</p>
                )}
                {canPay && !loading && (
                  <p className="bc-summary">
                    Sending <strong>KSh {parsed.toLocaleString()}</strong> — thank you! 🎉
                  </p>
                )}

                <button
                  className={`bc-pay-btn${!canPay || loading ? ' bc-pay-btn--disabled' : ''}`}
                  onClick={handlePay}
                  disabled={!canPay || loading}
                >
                  {loading
                    ? <span className="bc-btn-spinner" />
                    : <>☕ {canPay ? `Send KSh ${parsed.toLocaleString()}` : 'Enter an Amount'}</>
                  }
                </button>

                {payErr && (
                  <p className="bc-pay-error">{payErr}</p>
                )}

                <p className="bc-secure">🔒 Secure &amp; encrypted payment via Paystack</p>
              </div>
            )}

          </div>
        </div>
      )}
    </>
  );
}
