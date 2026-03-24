'use client';
import { useState, useEffect, useRef } from 'react';
import './BuyCoffee.css';

const PAYSTACK_LINK = 'https://paystack.shop/pay/4uqgih810w';

export default function BuyCoffee() {
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState('');
  const [pulse, setPulse] = useState(false);
  const overlayRef = useRef(null);

  useEffect(() => {
    const t = setTimeout(() => setPulse(true), 4000);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (overlayRef.current && e.target === overlayRef.current) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  const handleOpen = () => { setOpen(true); setPulse(false); };

  const parsed = parseInt(amount, 10);
  const canPay = !isNaN(parsed) && parsed > 0;

  const handlePay = () => {
    if (!canPay) return;
    window.open(`${PAYSTACK_LINK}?amount=${parsed * 100}`, '_blank', 'noopener,noreferrer');
    setOpen(false);
    setAmount('');
  };

  return (
    <>
      <button
        className={`bc-fab${pulse ? ' bc-fab--pulse' : ''}`}
        onClick={handleOpen}
        aria-label="Buy me a coffee"
        title="Support Toosii Tech"
      >
        <span className="bc-fab-icon">☕</span>
        <span className="bc-fab-label">Support</span>
      </button>

      {open && (
        <div className="bc-overlay" ref={overlayRef}>
          <div className="bc-modal" role="dialog" aria-modal="true" aria-label="Support Toosii Tech">
            <button className="bc-close" onClick={() => setOpen(false)} aria-label="Close">✕</button>

            <div className="bc-header">
              <div className="bc-coffee-icon">☕</div>
              <h2 className="bc-title">Buy Me a Coffee</h2>
              <p className="bc-subtitle">
                Hey! If Toosii Tech has been useful, consider buying me a coffee.
                Every cup keeps the servers running ☕
              </p>
            </div>

            <div className="bc-custom-wrap">
              <span className="bc-currency">KSh</span>
              <input
                className="bc-custom-input"
                type="number"
                min="1"
                placeholder="Enter any amount"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                autoFocus
              />
            </div>

            {canPay && (
              <p className="bc-summary">
                You're sending <strong>KSh {parsed.toLocaleString()}</strong> — thank you! 🎉
              </p>
            )}

            <button
              className={`bc-pay-btn${!canPay ? ' bc-pay-btn--disabled' : ''}`}
              onClick={handlePay}
              disabled={!canPay}
            >
              ☕ Send {canPay ? `KSh ${parsed.toLocaleString()}` : 'a Coffee'}
            </button>

            <p className="bc-secure">🔒 Secure &amp; encrypted payment</p>
          </div>
        </div>
      )}
    </>
  );
}
