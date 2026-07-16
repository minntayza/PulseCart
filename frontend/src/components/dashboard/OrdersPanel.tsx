'use client';

import { useState } from 'react';
import { Order } from '@/types';

const mockOrders: Order[] = [
  { id: 'ORD-1001', customerName: 'Alex Chen', productName: 'ROG Strix G16', productImage: '💻', total: 1299.99, status: 'pending', createdAt: '5m ago' },
  { id: 'ORD-1002', customerName: 'Sarah Kim', productName: 'Secretlab TITAN Evo', productImage: '🪑', total: 499.0, status: 'pending', createdAt: '12m ago' },
  { id: 'ORD-1003', customerName: 'Mike Johnson', productName: 'Sony WH-1000XM5', productImage: '🎧', total: 349.99, status: 'approved', createdAt: '1h ago' },
  { id: 'ORD-1004', customerName: 'Emily Davis', productName: 'Herman Miller Aeron', productImage: '🪑', total: 1395.0, status: 'pending', createdAt: '2h ago' },
  { id: 'ORD-1005', customerName: 'James Wilson', productName: 'MSI Raider GE78', productImage: '💻', total: 2499.99, status: 'rejected', createdAt: '3h ago' },
];

export default function OrdersPanel() {
  const [orderList, setOrderList] = useState(mockOrders);

  const handleApprove = (id: string) => {
    setOrderList((prev) =>
      prev.map((o) => (o.id === id ? { ...o, status: 'approved' as const } : o))
    );
  };

  const handleReject = (id: string) => {
    setOrderList((prev) =>
      prev.map((o) => (o.id === id ? { ...o, status: 'rejected' as const } : o))
    );
  };

  const statusColors = {
    pending: 'bg-accent/10 text-accent',
    approved: 'bg-success/10 text-success',
    rejected: 'bg-danger/10 text-danger',
  };

  return (
    <div className="space-y-3">
      {orderList.map((order) => (
        <div key={order.id} className="flex items-center gap-4 p-3 bg-white/5 rounded-lg">
          <span className="text-2xl">{order.productImage}</span>
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-medium text-text">{order.productName}</h4>
            <p className="text-xs text-muted">{order.customerName} · {order.createdAt}</p>
          </div>
          <span className="text-sm font-bold text-primary">${order.total.toFixed(2)}</span>
          <span className={`text-[10px] font-medium px-2 py-1 rounded-full ${statusColors[order.status]}`}>
            {order.status}
          </span>
          {order.status === 'pending' && (
            <div className="flex gap-1">
              <button
                onClick={() => handleApprove(order.id)}
                className="px-2 py-1 bg-success/10 text-success text-xs rounded hover:bg-success/20 transition-colors"
              >
                ✓
              </button>
              <button
                onClick={() => handleReject(order.id)}
                className="px-2 py-1 bg-danger/10 text-danger text-xs rounded hover:bg-danger/20 transition-colors"
              >
                ×
              </button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
