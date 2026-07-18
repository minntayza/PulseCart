'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/components/AuthProvider';
import { Order, formatPrice } from '@/types';
import { getOrdersForUser } from '@/services/orderService';
import { OrderSkeleton } from '@/components/Skeleton';

export default function OrderHistoryPage() {
  const { user, accessToken, isLoading: authLoading } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadOrders = useCallback(async () => {
    if (!user || !accessToken) { setIsLoading(false); return; }
    try {
      setOrders(await getOrdersForUser(accessToken));
    } finally {
      setIsLoading(false);
    }
  }, [user, accessToken]);

  useEffect(() => {
    const initialLoad = window.setTimeout(() => void loadOrders(), 0);
    const refreshInterval = window.setInterval(() => void loadOrders(), 10_000);
    return () => {
      window.clearTimeout(initialLoad);
      window.clearInterval(refreshInterval);
    };
  }, [loadOrders]);

  if (authLoading || isLoading) return <main className="mx-auto max-w-5xl space-y-4 p-6" aria-label="Loading your orders">{Array.from({ length: 4 }, (_, index) => <OrderSkeleton key={index}/>)}</main>;
  if (!user) return <div className="p-10 text-center"><h1 className="text-2xl font-bold">Sign in to view your orders</h1><Link href="/login?returnTo=/account/orders" className="inline-block mt-5 px-4 py-2 bg-primary text-white rounded-lg">Sign in</Link></div>;

  return (
    <main className="max-w-5xl mx-auto p-6 max-sm:p-4">
      <h1 className="text-2xl font-bold">My Orders</h1>
      <p className="text-sm text-text-muted mt-1 mb-6">Track pending decisions and review your purchase history.</p>
      {!orders.length ? <div className="py-16 text-center bg-surface border border-border rounded-xl"><p className="text-text-muted mb-4">You have not placed an order yet.</p><Link href="/" className="text-primary">Browse products</Link></div> : (
        <div className="space-y-4">
          {orders.map((order) => (
            <article key={order.id} className="bg-surface border border-border rounded-xl p-4">
              <div className="flex flex-wrap justify-between gap-3 mb-3">
                <div><h2 className="font-mono font-semibold">{order.id}</h2><p className="text-xs text-text-muted">{new Date(order.createdAt).toLocaleString()}</p></div>
                <span className={`h-fit text-xs px-3 py-1 rounded-full ${order.status === 'pending' ? 'bg-accent/10 text-accent' : order.status === 'approved' ? 'bg-primary/10 text-primary' : order.status === 'delivered' ? 'bg-success/10 text-success' : 'bg-danger/10 text-danger'}`}>{order.status}</span>
              </div>
              {order.status === 'delivered' && <div role="status" className="mb-3 rounded-lg bg-success/10 p-3 text-sm font-medium text-success">Delivery process is done</div>}
              <div className="space-y-2 border-y border-border py-3">
                {Object.values(order.items.reduce<Record<string, { product: Order['items'][number]; quantity: number }>>((grouped, product) => {
                  grouped[product.id] = grouped[product.id] ? { product, quantity: grouped[product.id].quantity + 1 } : { product, quantity: 1 };
                  return grouped;
                }, {})).map(({ product, quantity }) => <div key={product.id} className="flex justify-between text-sm"><span>{product.image} {product.name} × {quantity}</span><span>{formatPrice(product.price * quantity)}</span></div>)}
              </div>
              <div className="flex justify-between mt-3"><span className="text-xs text-text-muted">Deliver to: {order.address}</span><strong className="text-primary">{formatPrice(order.total)}</strong></div>
            </article>
          ))}
        </div>
      )}
    </main>
  );
}
