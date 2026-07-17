'use client';

import { FormEvent, useState } from 'react';
import { Product } from '@/types';
import { createOrder } from '@/services/orderService';
import { useRouter } from 'next/navigation';
import { useAuth } from './AuthProvider';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  cart: Product[];
  onRemoveFromCart: (id: string) => void;
  onOrderCompleted: () => void;
}

export default function CheckoutModal({ isOpen, onClose, cart, onRemoveFromCart, onOrderCompleted }: CheckoutModalProps) {
  const { user } = useAuth();
  const router = useRouter();
  const [step, setStep] = useState<'cart' | 'delivery' | 'confirm'>('cart');
  const [customerName, setCustomerName] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [orderId, setOrderId] = useState('');
  const [submittedTotal, setSubmittedTotal] = useState(0);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;
  const total = cart.reduce((sum, product) => sum + product.price, 0);
  const groupedCart = Object.values(cart.reduce<Record<string, { product: Product; quantity: number }>>((grouped, product) => {
    grouped[product.id] = grouped[product.id]
      ? { product, quantity: grouped[product.id].quantity + 1 }
      : { product, quantity: 1 };
    return grouped;
  }, {}));

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!customerName.trim() || !address.trim() || !phone.trim()) {
      setError('Name, delivery address, and phone are required.');
      return;
    }
    setError('');
    setIsSubmitting(true);
    try {
      if (!user) throw new Error('Authentication required');
      const order = await createOrder({ userId: user.id, customerName, address, phone, items: cart });
      setOrderId(order.id);
      setSubmittedTotal(order.total);
      onOrderCompleted();
      setStep('confirm');
    } catch {
      setError('The order could not be created. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const closeModal = () => {
    onClose();
    if (step === 'confirm') {
      setStep('cart');
      setCustomerName('');
      setAddress('');
      setPhone('');
      setOrderId('');
      setSubmittedTotal(0);
    }
  };

  const continueToDelivery = () => {
    if (!user) {
      onClose();
      router.push('/login?returnTo=/');
      return;
    }
    setStep('delivery');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" role="dialog" aria-modal="true" aria-label="Checkout">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={closeModal} />
      <div className="relative bg-surface rounded-2xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="text-lg font-bold text-text">
            {step === 'cart' ? 'Your Cart' : step === 'delivery' ? 'Delivery Details' : 'Order Submitted'}
          </h2>
          <button onClick={closeModal} className="text-muted hover:text-text text-xl" aria-label="Close">×</button>
        </div>

        <div className="flex gap-2 px-4 py-3 bg-white/5 border-b border-border text-xs">
          {['Cart', 'Delivery', 'Approval'].map((label, index) => (
            <div key={label} className="flex flex-1 items-center gap-2">
              <span className={`grid h-6 w-6 place-items-center rounded-full ${
                ['cart', 'delivery', 'confirm'].indexOf(step) >= index ? 'bg-primary text-white' : 'bg-white/10 text-muted'
              }`}>{index + 1}</span>
              <span className="text-muted">{label}</span>
            </div>
          ))}
        </div>

        <div className="p-4 max-h-[28rem] overflow-y-auto">
          {step === 'cart' && (
            <div className="space-y-3">
              {cart.length === 0 ? <p className="py-8 text-center text-sm text-muted">Your cart is empty.</p> : groupedCart.map(({ product, quantity }) => (
                <div key={product.id} className="flex items-center gap-3 p-3 bg-white/5 rounded-lg">
                  <span className="grid h-10 w-10 place-items-center rounded-xl bg-primary-light text-sm font-bold text-primary">{quantity}×</span>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-medium truncate">{product.name}</h3>
                    <p className="text-xs text-muted">${product.price.toFixed(2)} each · ${(product.price * quantity).toFixed(2)} total</p>
                  </div>
                  <button onClick={() => onRemoveFromCart(product.id)} className="text-muted hover:text-danger" aria-label={`Remove all ${product.name} from cart`}>×</button>
                </div>
              ))}
            </div>
          )}

          {step === 'delivery' && (
            <form id="checkout-form" onSubmit={handleSubmit} className="space-y-4">
              <label className="block text-xs text-muted">Customer name
                <input value={customerName} onChange={(event) => setCustomerName(event.target.value)} className="mt-1 w-full px-3 py-2 bg-white/5 border border-border rounded-lg text-sm text-text" autoComplete="name" />
              </label>
              <label className="block text-xs text-muted">Delivery address
                <textarea value={address} onChange={(event) => setAddress(event.target.value)} className="mt-1 w-full px-3 py-2 bg-white/5 border border-border rounded-lg text-sm text-text" rows={3} autoComplete="street-address" />
              </label>
              <label className="block text-xs text-muted">Phone number
                <input value={phone} onChange={(event) => setPhone(event.target.value)} className="mt-1 w-full px-3 py-2 bg-white/5 border border-border rounded-lg text-sm text-text" type="tel" autoComplete="tel" />
              </label>
              {error && <p className="text-xs text-danger" role="alert">{error}</p>}
              <div className="bg-agent/5 border border-agent/20 rounded-lg p-3 text-xs text-text/70">
                The Order Coordinator validates these details and queues the order. A manager must approve it before confirmation.
              </div>
            </form>
          )}

          {step === 'confirm' && (
            <div className="text-center py-6">
              <div className="text-4xl mb-3">✓</div>
              <h3 className="text-lg font-bold mb-2">Queued for manager approval</h3>
              <p className="text-sm text-muted mb-4">The order is pending. It is not confirmed until a manager approves it.</p>
              <div className="bg-white/5 rounded-lg p-3 flex justify-between text-sm">
                <span className="font-mono">#{orderId}</span><strong className="text-primary">${submittedTotal.toFixed(2)}</strong>
              </div>
            </div>
          )}
        </div>

        <div className="p-4 border-t border-border flex items-center justify-between">
          {step === 'cart' && <><strong>${total.toFixed(2)}</strong><button onClick={continueToDelivery} disabled={!cart.length} className="px-4 py-2 bg-primary text-white text-sm rounded-lg disabled:opacity-50">{user ? 'Continue' : 'Sign in to checkout'}</button></>}
          {step === 'delivery' && <><button onClick={() => setStep('cart')} className="text-sm text-muted">Back</button><button form="checkout-form" disabled={isSubmitting} className="px-4 py-2 bg-primary text-white text-sm rounded-lg disabled:opacity-50">{isSubmitting ? 'Submitting…' : 'Submit for approval'}</button></>}
          {step === 'confirm' && <button onClick={closeModal} className="w-full px-4 py-2 bg-primary text-white text-sm rounded-lg">Done</button>}
        </div>
      </div>
    </div>
  );
}
