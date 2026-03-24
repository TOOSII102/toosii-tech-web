'use client';
import { useState, useEffect, useRef } from 'react';
import './BuyCoffee.css';

const PAYSTACK_LINK = 'https://paystack.shop/pay/4uqgih810w';

export default function BuyCoffee() {
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState('');
  const [paying, setPaying] = useState(false);
  const [loading, setLoading] = useState(true);
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
    if (open && !paying && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 80);
    }
  }, [open, paying]);

  const handleClose = () => {
    setOpen(false);
    setPaying(false);
    setAmount('');
    setLoading(true);
  };

  const parsed = parseInt(amount, 10);
  const canPay = !isNaN(parsed) && parsed > 0;

  const handlePay = () => {
    if (!canPay) return;
    setLoading(true);
    setPaying(true);
  };

  const iframeSrc = `${PAYSTACK_LINK}?amount=${parsed}`;

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
          <div className={`bc-modal${paying ? ' bc-modal--wide' : ''}`} role="dialog" aria-modal="true">

            {/* ── Top bar ── */}
            <div className="bc-topbar">
              {paying && (
                <button className="bc-back" onClick={() => { setPaying(false); setLoading(true); }} aria-label="Back">
                  ← Back
                </button>
              )}
              <span className="bc-topbar-title">
                {paying ? `☕ Sending KSh ${parsed.toLocaleString()}` : '☕ Buy Me a Coffee'}
              </span>
              <button className="bc-close" onClick={handleClose} aria-label="Close">✕</button>
            </div>

            {/* ── Step 1: Amount ── */}
            {!paying && (
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
                  />
                </div>

                {canPay && (
                  <p className="bc-summary">
                    Sending <strong>KSh {parsed.toLocaleString()}</strong> — thank you! 🎉
                  </p>
                )}

                <button
                  className={`bc-pay-btn${!canPay ? ' bc-pay-btn--disabled' : ''}`}
                  onClick={handlePay}
                  disabled={!canPay}
                >
                  ☕ {canPay ? `Send KSh ${parsed.toLocaleString()}` : 'Enter an Amount'}
                </button>

                <p className="bc-secure">🔒 Secure &amp; encrypted payment</p>
              </div>
            )}

            {/* ── Step 2: Embedded payment ── */}
            {paying && (
              <div className="bc-iframe-wrap">
                {loading && (
                  <div className="bc-iframe-loader">
                    <div className="bc-spinner" />
                    <p>Loading secure payment…</p>
                  </div>
                )}
                <iframe
                  src={iframeSrc}
                  title="Secure Payment"
                  className={`bc-iframe${loading ? ' bc-iframe--hidden' : ''}`}
                  onLoad={() => setLoading(false)}
                  allow="payment"
                  sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-top-navigation"
                />
              </div>
            )}

          </div>
        </div>
      )}
    </>
  );
}
