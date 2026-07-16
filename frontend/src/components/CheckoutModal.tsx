'use client';

import { useState } from 'react';
import { Product } from '@/types';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  cart: Product[];
  onRemoveFromCart: (id: string) => void;
}

export default function CheckoutModal({ isOpen, onClose, cart, onRemoveFromCart }: CheckoutModalProps) {
  const [step, setStep] = useState<'cart' | 'payment' | 'confirm'>('cart');
  const [submitted, setSubmitted] = useState(false);

  if (!isOpen) return null;

  const total = cart.reduce((sum, p) => sum + p.price, 0);

  const handleSubmit = () => {
    setSubmitted(true);
    setStep('confirm');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-surface rounded-2xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden animate-in">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center gap-2">
            <span className="text-lg">🛒</span>
            <h2 className="text-lg font-bold text-text">
              {step === 'cart' ? 'Your Cart' : step === 'payment' ? 'Payment' : 'Order Submitted'}
            </h2>
          </div>
          <button onClick={onClose} className="text-muted hover:text-text text-xl">×</button>
        </div>

        {/* Agent step indicators */}
        <div className="flex items-center gap-2 px-4 py-3 bg-white/5 border-b border-border">
          {[
            { key: 'cart', icon: '🛒', label: 'Cart' },
            { key: 'payment', icon: '💳', label: 'Payment' },
            { key: 'confirm', icon: '✅', label: 'Confirm' },
          ].map((s, i) => (
            <div key={s.key} className="flex items-center gap-2">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
                step === s.key ? 'bg-primary text-white' :
                ['cart', 'payment', 'confirm'].indexOf(step) > i ? 'bg-success text-white' :
                'bg-white/10 text-muted'
              }`}>
                {['cart', 'payment', 'confirm'].indexOf(step) > i ? '✓' : s.icon}
              </div>
              <span className={`text-xs ${step === s.key ? 'text-primary font-medium' : 'text-muted'}`}>{s.label}</span>
              {i < 2 && <div className="w-8 h-px bg-border" />}
            </div>
          ))}
        </div>

        {/* Content */}
        <div className="p-4 max-h-96 overflow-y-auto">
          {step === 'cart' && (
            <div className="space-y-3">
              {cart.length === 0 ? (
                <div className="text-center py-8">
                  <span className="text-3xl block mb-2">🛒</span>
                  <p className="text-sm text-muted">Your cart is empty</p>
                </div>
              ) : (
                cart.map((item) => (
                  <div key={item.id} className="flex items-center gap-3 p-3 bg-white/5 rounded-lg">
                    <span className="text-2xl">{item.image}</span>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-medium text-text truncate">{item.name}</h4>
                      <p className="text-xs text-muted">{item.description}</p>
                    </div>
                    <span className="text-sm font-bold text-primary shrink-0">${item.price.toFixed(2)}</span>
                    <button
                      onClick={() => onRemoveFromCart(item.id)}
                      className="text-muted hover:text-danger text-sm shrink-0"
                    >
                      ×
                    </button>
                  </div>
                ))
              )}

              {/* Agent insight */}
              {cart.length > 0 && (
                <div className="bg-agent/5 border border-agent/20 rounded-lg p-3 mt-4">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs">🤖</span>
                    <span className="text-xs font-medium text-agent">Order Coordinator Agent</span>
                  </div>
                  <p className="text-xs text-text/70">
                    Cart total looks good! No price anomalies detected. Estimated delivery: 3-5 business days.
                  </p>
                </div>
              )}
            </div>
          )}

          {step === 'payment' && (
            <div className="space-y-4">
              <div>
                <label className="text-xs text-muted block mb-1">Card Number</label>
                <input
                  type="text"
                  placeholder="4242 4242 4242 4242"
                  className="w-full px-3 py-2 bg-white/5 border border-border rounded-lg text-sm text-text placeholder:text-muted/50 focus:outline-none focus:border-primary"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-muted block mb-1">Expiry</label>
                  <input
                    type="text"
                    placeholder="MM/YY"
                    className="w-full px-3 py-2 bg-white/5 border border-border rounded-lg text-sm text-text placeholder:text-muted/50 focus:outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="text-xs text-muted block mb-1">CVC</label>
                  <input
                    type="text"
                    placeholder="123"
                    className="w-full px-3 py-2 bg-white/5 border border-border rounded-lg text-sm text-text placeholder:text-muted/50 focus:outline-none focus:border-primary"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs text-muted block mb-1">Name on Card</label>
                <input
                  type="text"
                  placeholder="Jane Smith"
                  className="w-full px-3 py-2 bg-white/5 border border-border rounded-lg text-sm text-text placeholder:text-muted/50 focus:outline-none focus:border-primary"
                />
              </div>
            </div>
          )}

          {step === 'confirm' && (
            <div className="text-center py-6">
              <div className="w-16 h-16 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">✓</span>
              </div>
              <h3 className="text-lg font-bold text-text mb-2">Order Queued for Approval</h3>
              <p className="text-sm text-muted mb-4">
                Your order has been submitted and is pending manager approval.
                You&apos;ll receive a notification once it&apos;s processed.
              </p>
              <div className="bg-white/5 rounded-lg p-3 text-left">
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-muted">Order ID</span>
                  <span className="text-text font-mono">#ORD-{Math.floor(Math.random() * 9000 + 1000)}</span>
                </div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-muted">Items</span>
                  <span className="text-text">{cart.length}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-muted">Total</span>
                  <span className="text-primary font-bold">${total.toFixed(2)}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border flex items-center justify-between">
          {step === 'cart' && (
            <>
              <span className="text-sm text-muted">
                Total: <span className="text-text font-bold">${total.toFixed(2)}</span>
              </span>
              <button
                onClick={() => setStep('payment')}
                disabled={cart.length === 0}
                className="px-4 py-2 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Proceed to Payment
              </button>
            </>
          )}
          {step === 'payment' && (
            <>
              <button
                onClick={() => setStep('cart')}
                className="px-4 py-2 text-sm text-muted hover:text-text transition-colors"
              >
                Back
              </button>
              <button
                onClick={handleSubmit}
                className="px-4 py-2 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary/90 transition-colors"
              >
                Submit Order
              </button>
            </>
          )}
          {step === 'confirm' && (
            <button
              onClick={onClose}
              className="w-full px-4 py-2 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary/90 transition-colors"
            >
              Done
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
