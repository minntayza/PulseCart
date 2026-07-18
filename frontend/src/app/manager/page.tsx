'use client';

import { useState } from 'react';
import StatsRow from '@/components/dashboard/StatsRow';
import OrdersPanel from '@/components/dashboard/OrdersPanel';
import MarketPanel from '@/components/dashboard/MarketPanel';
import FeedbackPanel from '@/components/dashboard/FeedbackPanel';
import AgentPanel from '@/components/dashboard/AgentPanel';
import WantedPanel from '@/components/dashboard/WantedPanel';
import Link from 'next/link';
import { useAuth } from '@/components/AuthProvider';
import ProductAdminPanel from '@/components/dashboard/ProductAdminPanel';

const tabs = [
  { id: 'orders', label: '📋 Orders', icon: '📋' },
  { id: 'market', label: '📊 Market Insights', icon: '📊' },
  { id: 'feedback', label: '💬 Feedback', icon: '💬' },
  { id: 'agents', label: '🤖 Agent Activity', icon: '🤖' },
  { id: 'products', label: 'Products', icon: '📦' },
  { id: 'wanted', label: '🎯 Wanted', icon: '🎯' },
];

export default function ManagerDashboard() {
  const { user, isLoading } = useAuth();
  const [activeTab, setActiveTab] = useState('orders');

  if (isLoading) return <p className="p-10 text-center text-text-muted">Checking manager access…</p>;
  if (!user) return <div className="p-10 text-center"><h1 className="text-2xl font-bold">Manager sign-in required</h1><p className="text-text-muted mt-2 mb-5">This dashboard is not public.</p><Link href="/login?returnTo=/manager" className="px-4 py-2 bg-primary text-white rounded-lg">Sign in as manager</Link></div>;
  if (user.role !== 'manager') return <div className="p-10 text-center"><h1 className="text-2xl font-bold">Access denied</h1><p className="text-text-muted mt-2 mb-5">Your account does not have manager permission.</p><Link href="/" className="text-primary">Return to shop</Link></div>;

  return (
    <div className="min-h-[calc(100vh-56px)] bg-background p-4 md:p-8 overflow-y-auto">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-foreground">Manager Dashboard</h1>
            <p className="text-text-muted mt-1">Monitor agents, approve orders, and track performance.</p>
          </div>
          <div className="flex items-center gap-3">
            {/* Action buttons could go here */}
            <div className="h-10 px-4 flex items-center justify-center rounded-lg bg-primary-light text-primary font-medium text-sm border border-primary/20 shadow-sm">
              <span className="w-2 h-2 rounded-full bg-primary mr-2 animate-pulse" />
              Live Mode
            </div>
          </div>
        </div>

        {/* Stats Row */}
        <StatsRow />

        {/* Main Content Area */}
        <div className="bg-surface rounded-2xl shadow-sm border border-border overflow-hidden">
          {/* Modern Segmented Tabs */}
          <div className="p-4 border-b border-border-light bg-surface-alt/50">
            <div className="inline-flex items-center bg-surface-alt p-1 rounded-xl w-full sm:w-auto overflow-x-auto no-scrollbar">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg transition-all duration-200 whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'bg-surface text-primary shadow-sm ring-1 ring-border/50'
                      : 'text-text-secondary hover:text-foreground hover:bg-border-light/50'
                  }`}
                >
                  <span className={activeTab === tab.id ? 'opacity-100' : 'opacity-70 grayscale'}>
                    {tab.icon}
                  </span>
                  {tab.label.replace(tab.icon + ' ', '')}
                </button>
              ))}
            </div>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {activeTab === 'orders' && <OrdersPanel />}
            {activeTab === 'market' && <MarketPanel />}
            {activeTab === 'feedback' && <FeedbackPanel />}
            {activeTab === 'agents' && <AgentPanel />}
            {activeTab === 'products' && <ProductAdminPanel />}
            {activeTab === 'wanted' && <WantedPanel />}
          </div>
        </div>
      </div>
    </div>
  );
}
