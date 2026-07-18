'use client';

export default function StatsRow() {
  const stats = [
    {
      label: 'Active Agents',
      value: '2/3',
      change: 'All systems nominal',
      dotColor: 'bg-success',
      positive: true,
    },
    {
      label: 'Feedback Signals',
      value: '12 total',
      change: '3 high severity',
      dotColor: 'bg-danger',
      positive: false,
    },
    {
      label: 'Pending Orders',
      value: '7',
      change: '3 need approval',
      dotColor: 'bg-accent',
      positive: false,
    },
    {
      label: 'Total Revenue',
      value: '$24,580',
      change: '+12.5% this week',
      dotColor: 'bg-primary',
      positive: true,
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 mb-6 lg:grid-cols-4 lg:gap-4">
      {stats.map((stat) => (
        <div key={stat.label} className="bg-surface rounded-xl border border-border p-4">
          <div className="flex items-center gap-3 mb-2">
            <span className={`block h-2 w-2 rounded-full ${stat.dotColor}`} />
            <span className="text-xs text-text-muted">{stat.label}</span>
          </div>
          <div className="text-2xl font-bold text-foreground">{stat.value}</div>
          <div className={`text-xs mt-1 ${stat.positive ? 'text-success' : 'text-accent'}`}>
            {stat.change}
          </div>
        </div>
      ))}
    </div>
  );
}
