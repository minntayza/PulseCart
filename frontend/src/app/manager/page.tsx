'use client';

import { useState } from 'react';
import StatsRow from '@/components/dashboard/StatsRow';
import OrdersPanel from '@/components/dashboard/OrdersPanel';
import MarketPanel from '@/components/dashboard/MarketPanel';
import FeedbackPanel from '@/components/dashboard/FeedbackPanel';
import AgentPanel from '@/components/dashboard/AgentPanel';

const tabs = [
  { id: 'orders', label: '📋 Orders', icon: '📋' },
  { id: 'market', label: '📊 Market Insights', icon: '📊' },
  { id: 'feedback', label: '💬 Feedback', icon: '💬' },
  { id: 'agents', label: '🤖 Agent Activity', icon: '🤖' },
];

export default function ManagerDashboard() {
  const [activeTab, setActiveTab] = useState('orders');

  return (
    <div className="p-6 h-[calc(100vh-56px)] overflow-y-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-text">Manager Dashboard</h1>
        <p className="text-sm text-muted mt-1">Monitor agents, approve orders, and track performance</p>
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
                  : 'text-muted hover:text-text'
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
        </div>
      </div>
    </div>
  );
}
