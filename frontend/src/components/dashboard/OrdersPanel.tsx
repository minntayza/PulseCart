'use client';

import { useCallback, useEffect, useState } from 'react';
import { Order, formatPrice, displayCategory } from '@/types';
import { getOrders, markOrderDelivered, updateOrderStatus } from '@/services/orderService';
import { OrderSkeleton } from '@/components/Skeleton';
import { useAuth } from '@/components/AuthProvider';

export default function OrdersPanel() {
  const { accessToken } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState('');
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<'pending' | 'approved' | 'rejected' | 'delivered' | 'all'>('pending');

  const loadOrders = useCallback(async () => {
    if (!accessToken) {
      setIsLoading(false);
      return;
    }
    try {
      setOrders(await getOrders(accessToken));
      setError('');
    } catch {
      setError('Orders could not be loaded.');
    } finally {
      setIsLoading(false);
    }
  }, [accessToken]);

  useEffect(() => {
    const initialLoad = window.setTimeout(() => void loadOrders(), 0);
    const refreshInterval = window.setInterval(() => void loadOrders(), 10_000);
    return () => {
      window.clearTimeout(initialLoad);
      window.clearInterval(refreshInterval);
    };
  }, [loadOrders]);

  const changeStatus = async (id: string, status: 'approved' | 'rejected') => {
    setUpdatingId(id);
    setError('');
    try {
      if (!accessToken) throw new Error('Authentication required');
      await updateOrderStatus(id, status, accessToken);
      await loadOrders();
    } catch {
      setError('The order status could not be updated.');
    } finally {
      setUpdatingId('');
    }
  };

  const completeDelivery = async (id: string) => {
    setUpdatingId(id);
    setError('');
    try {
      if (!accessToken) throw new Error('Authentication required');
      await markOrderDelivered(id, accessToken);
      await loadOrders();
    } catch (deliveryError) {
      setError(deliveryError instanceof Error ? deliveryError.message : 'Delivery could not be completed.');
    } finally {
      setUpdatingId('');
    }
  };

  if (isLoading) return <div aria-label="Loading approval queue" className="space-y-3">{Array.from({ length: 4 }, (_, index) => <OrderSkeleton key={index}/>)}</div>;
  const visibleOrders = filter === 'all' ? orders : orders.filter((order) => order.status === filter);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2 pb-2">
        {(['pending', 'approved', 'delivered', 'rejected', 'all'] as const).map((status) => (
          <button key={status} onClick={() => setFilter(status)} className={`px-4 py-2 text-sm font-semibold rounded-full capitalize transition-all duration-300 ${filter === status ? 'bg-primary text-white shadow-md shadow-primary/20' : 'bg-surface-alt text-text-secondary hover:bg-border-light'}`}>
            {status} <span className={`ml-1 px-1.5 py-0.5 rounded-full text-[10px] ${filter === status ? 'bg-white/20' : 'bg-border/50'}`}>{status === 'all' ? orders.length : orders.filter((order) => order.status === status).length}</span>
          </button>
        ))}
      </div>
      
      {error && (
        <div className="rounded-xl bg-danger-light p-4 border border-danger/20 flex items-start gap-3">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 text-danger mt-0.5"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-5a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5A.75.75 0 0110 5zm0 10a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" /></svg>
          <p className="text-sm text-danger" role="alert">{error}</p>
        </div>
      )}
      
      {!visibleOrders.length && (
        <div className="py-16 text-center border-2 border-dashed border-border rounded-3xl bg-surface-alt/50">
          <div className="text-4xl mb-4 opacity-50">📋</div>
          <h3 className="font-bold text-foreground text-lg">No {filter === 'all' ? '' : filter} orders</h3>
          <p className="text-sm text-text-muted mt-1">Orders matching this filter will appear here.</p>
        </div>
      )}
      
      <div className="space-y-4">
        {visibleOrders.map((order) => (
          <div key={order.id} className="flex flex-col sm:flex-row sm:items-center gap-5 p-5 bg-surface border border-border rounded-2xl shadow-sm hover:shadow-md transition-shadow duration-300">
            <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-surface-alt text-3xl shrink-0 overflow-hidden">
              {order.items[0]?.imageUrl ? (
                <img src={order.items[0].imageUrl} alt={order.items[0].name} className="w-full h-full object-cover" />
              ) : (
                <span className="text-3xl text-foreground/70 select-none">
                  {displayCategory(order.items[0]?.category ?? '') === 'laptops' ? '▰' :
                   displayCategory(order.items[0]?.category ?? '') === 'chairs' ? '⌑' :
                   displayCategory(order.items[0]?.category ?? '') === 'headphones' ? '🎧' :
                   displayCategory(order.items[0]?.category ?? '') === 'accessories' ? '✦' : '📦'}
                </span>
              )}
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 mb-1">
                <h4 className="text-base font-bold text-foreground truncate">{order.items.map((item) => item.name).join(', ')}</h4>
                <span className={`shrink-0 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                  order.status === 'pending' ? 'bg-accent-light text-accent' : order.status === 'approved' ? 'bg-primary-light text-primary' : order.status === 'delivered' ? 'bg-success-light text-success' : 'bg-danger-light text-danger'
                }`}>{order.status}</span>
              </div>
              <p className="text-sm text-text-secondary font-medium">{order.customerName} <span className="text-border mx-1">•</span> <span className="font-mono text-xs">{order.id}</span> <span className="text-border mx-1">•</span> {new Date(order.createdAt).toLocaleString()}</p>
              <p className="text-sm text-text-secondary truncate mt-1">{order.address} <span className="text-border mx-1">•</span> {order.phone}</p>
            </div>
            
            <div className="flex items-center justify-between sm:flex-col sm:items-end sm:justify-center gap-4 shrink-0 sm:pl-4 sm:border-l sm:border-border-light">
              <strong className="text-lg font-black text-foreground">{formatPrice(order.total)}</strong>
              
              <div className="flex gap-2">
                {order.status === 'pending' && (
                  <>
                    <button disabled={updatingId === order.id} onClick={() => changeStatus(order.id, 'approved')} className="px-4 py-2 bg-primary-light text-primary hover:bg-primary-light/80 hover:text-primary-hover text-sm font-semibold rounded-xl transition-colors disabled:opacity-50">Approve</button>
                    <button disabled={updatingId === order.id} onClick={() => changeStatus(order.id, 'rejected')} className="px-4 py-2 bg-danger-light text-danger hover:bg-danger-light/80 hover:text-danger text-sm font-semibold rounded-xl transition-colors disabled:opacity-50">Reject</button>
                  </>
                )}
                {order.status === 'approved' && (
                  <button disabled={updatingId === order.id} onClick={() => completeDelivery(order.id)} className="px-4 py-2 bg-success-light text-success hover:bg-success-light/80 hover:text-success text-sm font-semibold rounded-xl transition-colors disabled:opacity-50">
                    {updatingId === order.id ? 'Completing…' : 'Mark delivered'}
                  </button>
                )}
                {order.status === 'delivered' && (
                  <button disabled={updatingId === order.id} onClick={() => completeDelivery(order.id)} className="px-4 py-2 bg-surface-alt text-foreground hover:bg-border-light text-sm font-semibold rounded-xl transition-colors disabled:opacity-50">
                    {updatingId === order.id ? 'Checking…' : 'Verify email'}
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
