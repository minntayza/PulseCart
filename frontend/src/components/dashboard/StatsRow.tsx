'use client';

export default function StatsRow() {
  const stats = [
    { label: 'Total Revenue', value: '$24,580', change: '+12.5%', icon: '💰', positive: true },
    { label: 'Pending Orders', value: '7', change: '3 need approval', icon: '📋', positive: false },
    { label: 'Agent Uptime', value: '99.8%', change: 'All systems nominal', icon: '🤖', positive: true },
    { label: 'Customer Satisfaction', value: '4.7/5', change: '+0.2 this week', icon: '⭐', positive: true },
  ];

  return (
    <div className="grid grid-cols-4 gap-4 mb-6">
      {stats.map((stat) => (
        <div key={stat.label} className="bg-surface rounded-xl border border-border p-4">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-xl">{stat.icon}</span>
            <span className="text-xs text-muted">{stat.label}</span>
          </div>
          <div className="text-2xl font-bold text-text">{stat.value}</div>
          <div className={`text-xs mt-1 ${stat.positive ? 'text-success' : 'text-accent'}`}>
            {stat.change}
          </div>
        </div>
      ))}
    </div>
  );
}
