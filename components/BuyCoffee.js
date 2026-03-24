'use client';
import { useState, useEffect, useRef } from 'react';
import './BuyCoffee.css';

const PAYSTACK_LINK = 'https://paystack.shop/pay/4uqgih810w';

const PRESETS = [
  { label: '1 Coffee', emoji: '☕', amount: 200 },
  { label: '3 Coffees', emoji: '☕☕☕', amount: 500 },
  { label: 'Big Support', emoji: '🙏', amount: 1000 },
  { label: 'Legend', emoji: '🚀', amount: 2000 },
];

export default function BuyCoffee() {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState(null);
  const [custom, setCustom] = useState('');
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

  const handleOpen = () => {
    setOpen(true);
    setPulse(false);
  };

  const getAmount = () => {
    if (selected !== null) return PRESETS[selected].amount;
    const v = parseInt(custom, 10);
    return isNaN(v) ? 0 : v;
  };

  const handlePay = () => {
    const amt = getAmount();
    if (amt < 100) return;
    window.open(`${PAYSTACK_LINK}?amount=${amt}`, '_blank', 'noopener,noreferrer');
    setOpen(false);
  };

  const amount = getAmount();
  const canPay = amount >= 100;

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

            <div className="bc-presets">
              {PRESETS.map((p, i) => (
                <button
                  key={i}
                  className={`bc-preset${selected === i ? ' bc-preset--active' : ''}`}
                  onClick={() => { setSelected(i); setCustom(''); }}
                >
                  <span className="bc-preset-emoji">{p.emoji}</span>
                  <span className="bc-preset-label">{p.label}</span>
                  <span className="bc-preset-amt">₦{p.amount.toLocaleString()}</span>
                </button>
              ))}
            </div>

            <div className="bc-divider"><span>or enter amount</span></div>

            <div className="bc-custom-wrap">
              <span className="bc-currency">₦</span>
              <input
                className="bc-custom-input"
                type="number"
                min="100"
                placeholder="Custom amount (min ₦100)"
                value={custom}
                onChange={(e) => { setCustom(e.target.value); setSelected(null); }}
              />
            </div>

            {amount > 0 && (
              <p className="bc-summary">
                You're sending <strong>₦{amount.toLocaleString()}</strong> — thank you! 🎉
              </p>
            )}

            <button
              className={`bc-pay-btn${!canPay ? ' bc-pay-btn--disabled' : ''}`}
              onClick={handlePay}
              disabled={!canPay}
            >
              ☕ Send {amount >= 100 ? `₦${amount.toLocaleString()}` : 'a Coffee'}
            </button>

            {!canPay && amount > 0 && (
              <p className="bc-min-note">Minimum amount is ₦100</p>
            )}

            <p className="bc-secure">🔒 Secure &amp; encrypted payment</p>
          </div>
        </div>
      )}
    </>
  );
}
