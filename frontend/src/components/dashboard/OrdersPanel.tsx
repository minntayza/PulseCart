'use client';

import { useCallback, useEffect, useState } from 'react';
import { Order } from '@/types';
import { getOrders, updateOrderStatus } from '@/services/orderService';
import { pulseCartEvents } from '@/services/storage';
import { OrderSkeleton } from '@/components/Skeleton';

export default function OrdersPanel() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState('');
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<'pending' | 'approved' | 'rejected' | 'all'>('pending');

  const loadOrders = useCallback(async () => {
    try {
      setOrders(await getOrders());
      setError('');
    } catch {
      setError('Orders could not be loaded.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const initialLoad = window.setTimeout(() => void loadOrders(), 0);
    window.addEventListener(pulseCartEvents.ordersChanged, loadOrders);
    window.addEventListener('storage', loadOrders);
    return () => {
      window.clearTimeout(initialLoad);
      window.removeEventListener(pulseCartEvents.ordersChanged, loadOrders);
      window.removeEventListener('storage', loadOrders);
    };
  }, [loadOrders]);

  const changeStatus = async (id: string, status: 'approved' | 'rejected') => {
    setUpdatingId(id);
    setError('');
    try {
      await updateOrderStatus(id, status);
      await loadOrders();
    } catch {
      setError('The order status could not be updated.');
    } finally {
      setUpdatingId('');
    }
  };

  if (isLoading) return <div aria-label="Loading approval queue" className="space-y-3">{Array.from({ length: 4 }, (_, index) => <OrderSkeleton key={index}/>)}</div>;
  const visibleOrders = filter === 'all' ? orders : orders.filter((order) => order.status === filter);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2 pb-2">
        {(['pending', 'approved', 'rejected', 'all'] as const).map((status) => (
          <button key={status} onClick={() => setFilter(status)} className={`px-3 py-1.5 text-xs rounded-lg capitalize ${filter === status ? 'bg-primary text-white' : 'bg-white/5 text-muted'}`}>
            {status} ({status === 'all' ? orders.length : orders.filter((order) => order.status === status).length})
          </button>
        ))}
      </div>
      {error && <p className="text-xs text-danger" role="alert">{error}</p>}
      {!visibleOrders.length && (
        <div className="py-12 text-center">
          <div className="text-3xl mb-2">📋</div>
          <h3 className="font-medium">No {filter === 'all' ? '' : filter} orders</h3>
          <p className="text-sm text-muted">Orders matching this filter will appear here.</p>
        </div>
      )}
      {visibleOrders.map((order) => (
        <div key={order.id} className="flex flex-wrap items-center gap-4 p-3 bg-white/5 rounded-lg">
          <span className="text-2xl">{order.items[0]?.image ?? '📦'}</span>
          <div className="flex-1 min-w-48">
            <h4 className="text-sm font-medium">{order.items.map((item) => item.name).join(', ')}</h4>
            <p className="text-xs text-muted">{order.customerName} · {order.id} · {new Date(order.createdAt).toLocaleString()}</p>
            <p className="text-xs text-muted truncate">{order.address} · {order.phone}</p>
          </div>
          <strong className="text-sm text-primary">${order.total.toFixed(2)}</strong>
          <span className={`text-[10px] px-2 py-1 rounded-full ${
            order.status === 'pending' ? 'bg-accent/10 text-accent' : order.status === 'approved' ? 'bg-success/10 text-success' : 'bg-danger/10 text-danger'
          }`}>{order.status}</span>
          {order.status === 'pending' && (
            <div className="flex gap-2">
              <button disabled={updatingId === order.id} onClick={() => changeStatus(order.id, 'approved')} className="px-3 py-1 bg-success/10 text-success text-xs rounded disabled:opacity-50">Approve</button>
              <button disabled={updatingId === order.id} onClick={() => changeStatus(order.id, 'rejected')} className="px-3 py-1 bg-danger/10 text-danger text-xs rounded disabled:opacity-50">Reject</button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
