'use client';

import { useState } from 'react';
import StatsRow from '@/components/dashboard/StatsRow';
import OrdersPanel from '@/components/dashboard/OrdersPanel';
import MarketPanel from '@/components/dashboard/MarketPanel';
import FeedbackPanel from '@/components/dashboard/FeedbackPanel';
import AgentPanel from '@/components/dashboard/AgentPanel';
import Link from 'next/link';
import { useAuth } from '@/components/AuthProvider';
import ProductAdminPanel from '@/components/dashboard/ProductAdminPanel';

const tabs = [
  { id: 'orders', label: '📋 Orders', icon: '📋' },
  { id: 'market', label: '📊 Market Insights', icon: '📊' },
  { id: 'feedback', label: '💬 Feedback', icon: '💬' },
  { id: 'agents', label: '🤖 Agent Activity', icon: '🤖' },
  { id: 'products', label: 'Products', icon: '📦' },
];

export default function ManagerDashboard() {
  const { user, isLoading } = useAuth();
  const [activeTab, setActiveTab] = useState('orders');

  if (isLoading) return <p className="p-10 text-center text-text-muted">Checking manager access…</p>;
  if (!user) return <div className="p-10 text-center"><h1 className="text-2xl font-bold">Manager sign-in required</h1><p className="text-text-muted mt-2 mb-5">This dashboard is not public.</p><Link href="/login?returnTo=/manager" className="px-4 py-2 bg-primary text-white rounded-lg">Sign in as manager</Link></div>;
  if (user.role !== 'manager') return <div className="p-10 text-center"><h1 className="text-2xl font-bold">Access denied</h1><p className="text-text-muted mt-2 mb-5">Your account does not have manager permission.</p><Link href="/" className="text-primary">Return to shop</Link></div>;

  return (
    <div className="p-6 h-[calc(100vh-56px)] overflow-y-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Manager Dashboard</h1>
        <p className="text-sm text-text-muted mt-1">Monitor agents, approve orders, and track performance</p>
      </div>

      {/* Stats Row */}
      <StatsRow />

      {/* Tabbed Panels - Sketch 003-A */}
      <div className="bg-surface rounded-xl border border-border overflow-hidden">
        {/* Tab bar */}
        <div className="flex border-b border-border">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-3 text-sm font-medium transition-colors relative ${
                activeTab === tab.id
                  ? 'text-primary'
                  : 'text-text-muted hover:text-text'
              }`}
            >
              {tab.label}
              {activeTab === tab.id && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
              )}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="p-4">
          {activeTab === 'orders' && <OrdersPanel />}
          {activeTab === 'market' && <MarketPanel />}
          {activeTab === 'feedback' && <FeedbackPanel />}
          {activeTab === 'agents' && <AgentPanel />}
          {activeTab === 'products' && <ProductAdminPanel />}
        </div>
      </div>
    </div>
  );
}
