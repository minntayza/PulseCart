'use client';

import { useState } from 'react';
import { products } from '@/data/products';

interface SidebarProps {
  selectedCategory: string;
  onCategoryChange: (cat: string) => void;
  searchQuery: string;
}

const categories = [
  { id: 'all', label: 'All Products', icon: '📦', count: 12 },
  { id: 'laptops', label: 'Laptops', icon: '💻', count: 2 },
  { id: 'chairs', label: 'Chairs', icon: '🪑', count: 3 },
  { id: 'headphones', label: 'Headphones', icon: '🎧', count: 2 },
  { id: 'accessories', label: 'Accessories', icon: '⌨️', count: 5 },
];

export default function Sidebar({ selectedCategory, onCategoryChange, searchQuery }: SidebarProps) {
  const [isAgentExpanded, setIsAgentExpanded] = useState(true);

  // Simulate agent recommendations based on category
  const recommendations = {
    all: 'Gaming laptops are trending +23% this week. Consider stocking more MSI and ROG models.',
    laptops: 'ROG Strix G16 has the best price-to-performance ratio. MSI Raider is overpriced vs competitors.',
    chairs: 'Secretlab TITAN has 94% satisfaction. Herman Miller complaints increasing about delivery times.',
    headphones: 'Sony XM5 dominates reviews. SteelSeries Bundle with mouse could increase AOV by 18%.',
    accessories: 'Keyboard market is saturated. Bundle deals with monitors show 31% higher conversion.',
  };

  return (
    <aside className="w-64 shrink-0 border-r border-border bg-surface h-[calc(100vh-56px)] overflow-y-auto sticky top-[56px]">
      {/* Categories */}
      <div className="p-4">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted mb-3">Categories</h3>
        <nav className="space-y-1">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => onCategoryChange(cat.id)}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                selectedCategory === cat.id
                  ? 'bg-primary/10 text-primary font-medium'
                  : 'text-text hover:bg-white/5'
              }`}
            >
              <span>{cat.icon}</span>
              <span className="flex-1 text-left">{cat.label}</span>
              <span className="text-xs text-muted bg-white/5 px-2 py-0.5 rounded-full">{cat.count}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Agent Recommendations Panel */}
      <div className="border-t border-border p-4">
        <button
          onClick={() => setIsAgentExpanded(!isAgentExpanded)}
          className="flex items-center gap-2 w-full mb-3"
        >
          <span className="text-agent">🤖</span>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-agent">Agent Insights</h3>
          <span className={`ml-auto text-muted text-xs transition-transform ${isAgentExpanded ? 'rotate-180' : ''}`}>
            ▼
          </span>
        </button>

        {isAgentExpanded && (
          <div className="space-y-3">
            {/* Recommendation card */}
            <div className="bg-agent/5 border border-agent/20 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-2">
                <span className="w-2 h-2 rounded-full bg-agent animate-pulse" />
                <span className="text-xs font-medium text-agent">Recommender Agent</span>
              </div>
              <p className="text-xs text-text/80 leading-relaxed">
                {recommendations[selectedCategory as keyof typeof recommendations]}
              </p>
            </div>

            {/* Quick stats */}
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-white/5 rounded-lg p-2 text-center">
                <div className="text-lg font-bold text-success">94%</div>
                <div className="text-[10px] text-muted">Match Rate</div>
              </div>
              <div className="bg-white/5 rounded-lg p-2 text-center">
                <div className="text-lg font-bold text-accent">+23%</div>
                <div className="text-[10px] text-muted">Trending</div>
              </div>
            </div>

            {/* Recent actions */}
            <div>
              <h4 className="text-[10px] uppercase tracking-wider text-muted mb-2">Recent Agent Actions</h4>
              <div className="space-y-2">
                {[
                  { icon: '🎯', text: 'Re-ranked feed for gaming segment', time: '2m ago' },
                  { icon: '📊', text: 'Price alert: ASUS monitor dip', time: '5m ago' },
                  { icon: '🔄', text: 'Synced competitor prices', time: '8m ago' },
                ].map((action, i) => (
                  <div key={i} className="flex items-start gap-2 text-xs">
                    <span>{action.icon}</span>
                    <span className="text-text/70 flex-1">{action.text}</span>
                    <span className="text-muted shrink-0">{action.time}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
