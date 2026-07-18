'use client';

export default function StatsRow() {
  const stats = [
    {
      label: 'Active Agents',
      value: '2/3',
      change: 'All systems nominal',
      color: 'success',
      bgColor: 'bg-success-light',
      textColor: 'text-success',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 14.25h7.5M8.25 9.75h7.5m-11.25 6.75h15a2.25 2.25 0 002.25-2.25V5.25A2.25 2.25 0 0019.5 3h-15a2.25 2.25 0 00-2.25 2.25v9A2.25 2.25 0 004.5 16.5h1.5v3.75l3.75-3.75h6.75z" />
        </svg>
      ),
      positive: true,
    },
    {
      label: 'Feedback Signals',
      value: '12',
      change: '3 high severity',
      color: 'danger',
      bgColor: 'bg-danger-light',
      textColor: 'text-danger',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      ),
      positive: false,
    },
    {
      label: 'Pending Orders',
      value: '7',
      change: '3 need approval',
      color: 'accent',
      bgColor: 'bg-accent-light',
      textColor: 'text-accent',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
        </svg>
      ),
      positive: false,
    },
    {
      label: 'Total Revenue',
      value: '$24,580',
      change: '+12.5% this week',
      color: 'primary',
      bgColor: 'bg-primary-light',
      textColor: 'text-primary',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      positive: true,
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      {stats.map((stat) => (
        <div 
          key={stat.label} 
          className="group relative bg-surface rounded-2xl p-5 border border-border shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-1 overflow-hidden"
        >
          {/* Subtle gradient top border */}
          <div className={`absolute top-0 left-0 right-0 h-1 bg-${stat.color} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
          
          <div className="flex items-start justify-between mb-4">
            <div className={`p-2.5 rounded-xl ${stat.bgColor} ${stat.textColor}`}>
              {stat.icon}
            </div>
          </div>
          
          <div>
            <h3 className="text-sm font-medium text-text-muted">{stat.label}</h3>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-foreground tracking-tight">{stat.value}</span>
            </div>
          </div>

          <div className={`mt-3 flex items-center text-sm font-medium ${stat.positive ? 'text-success' : 'text-text-secondary'}`}>
            {stat.positive && (
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 mr-1">
                <path fillRule="evenodd" d="M10 17a.75.75 0 01-.75-.75V5.612L5.29 9.77a.75.75 0 01-1.08-1.04l5.25-5.5a.75.75 0 011.08 0l5.25 5.5a.75.75 0 11-1.08 1.04l-3.96-4.158V16.25A.75.75 0 0110 17z" clipRule="evenodd" />
              </svg>
            )}
            {!stat.positive && stat.color === 'danger' && (
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 mr-1 text-danger">
                <path fillRule="evenodd" d="M10 3a.75.75 0 01.75.75v8.69l3.22-3.22a.75.75 0 111.06 1.06l-4.5 4.5a.75.75 0 01-1.06 0l-4.5-4.5a.75.75 0 111.06-1.06l3.22 3.22V3.75A.75.75 0 0110 3z" clipRule="evenodd" />
              </svg>
            )}
            <span className={!stat.positive && stat.color === 'danger' ? 'text-danger' : ''}>{stat.change}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
