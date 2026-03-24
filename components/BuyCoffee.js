'use client';
import { useState, useEffect, useRef } from 'react';
import './BuyCoffee.css';

const PK = 'pk_live_151add3eee89135c64ed91ee899f1e4ddba6e4dd';

function loadPaystack() {
  return new Promise((resolve) => {
    if (window.PaystackPop) { resolve(); return; }
    const s = document.createElement('script');
    s.src = 'https://js.paystack.co/v1/inline.js';
    s.onload = () => resolve();
    document.head.appendChild(s);
  });
}

export default function BuyCoffee() {
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [pulse, setPulse] = useState(false);
  const overlayRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    const t = setTimeout(() => setPulse(true), 4000);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (overlayRef.current && e.target === overlayRef.current) handleClose();
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  useEffect(() => {
    if (open && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 80);
    }
  }, [open]);

  const handleClose = () => { setOpen(false); setAmount(''); setLoading(false); };

  const parsed = parseInt(amount, 10);
  const canPay = !isNaN(parsed) && parsed > 0;

  const handlePay = async () => {
    if (!canPay || loading) return;
    setLoading(true);
    await loadPaystack();

    const ref = 'toosii_' + Date.now();
    const handler = window.PaystackPop.setup({
      key: PK,
      email: 'support@toosiitech.com',
      amount: parsed * 100,
      currency: 'KES',
      ref,
      metadata: { custom_fields: [] },
      onClose: () => { setLoading(false); },
      callback: () => {
        setLoading(false);
        handleClose();
      },
    });
    handler.openIframe();
  };

  return (
    <>
      <button
        className={`bc-fab${pulse ? ' bc-fab--pulse' : ''}`}
        onClick={() => { setOpen(true); setPulse(false); }}
        aria-label="Buy me a coffee"
        title="Support Toosii Tech"
      >
        <span className="bc-fab-icon">☕</span>
        <span className="bc-fab-label">Support</span>
      </button>

      {open && (
        <div className="bc-overlay" ref={overlayRef}>
          <div className="bc-modal" role="dialog" aria-modal="true">

            <div className="bc-topbar">
              <span className="bc-topbar-title">☕ Buy Me a Coffee</span>
              <button className="bc-close" onClick={handleClose} aria-label="Close">✕</button>
            </div>

            <div className="bc-body">
              <div className="bc-coffee-icon-sm">☕</div>
              <p className="bc-subtitle">
                If Toosii Tech has been useful, consider buying me a coffee.
                Every cup keeps the servers running!
              </p>

              <div className="bc-custom-wrap">
                <span className="bc-currency">KSh</span>
                <input
                  ref={inputRef}
                  className="bc-custom-input"
                  type="number"
                  min="1"
                  placeholder="Enter any amount"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handlePay()}
                  disabled={loading}
                />
              </div>

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

              <p className="bc-secure">🔒 Secure &amp; encrypted payment</p>
            </div>

          </div>
        </div>
      )}
    </>
  );
}
