'use client';

interface CategoryNavProps {
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
}

const categories = [
  { id: 'all', label: 'All', count: 12 },
  { id: 'laptops', label: 'Laptops', count: 2 },
  { id: 'chairs', label: 'Chairs', count: 3 },
  { id: 'headphones', label: 'Headphones', count: 2 },
  { id: 'accessories', label: 'Accessories', count: 5 },
];

export default function Sidebar({ selectedCategory, onCategoryChange }: CategoryNavProps) {
  return (
    <div className="flex flex-col gap-4">
      <nav className="flex gap-2 overflow-x-auto pb-1" aria-label="Product categories">
        {categories.map((category) => (
          <button
            key={category.id}
            onClick={() => onCategoryChange(category.id)}
            className={`shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-all ${
              selectedCategory === category.id
                ? 'bg-primary text-white shadow-sm'
                : 'border border-border bg-surface text-text-secondary hover:border-primary/40 hover:text-primary'
            }`}
          >
            {category.label} <span className="ml-1 opacity-60">{category.count}</span>
          </button>
        ))}
      </nav>
      <div className="flex items-start gap-3 rounded-2xl border border-agent/15 bg-agent-light px-4 py-3">
        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-agent text-sm font-bold text-white">AI</span>
        <div>
          <p className="text-sm font-semibold text-foreground">Your feed learns as you search</p>
          <p className="mt-0.5 text-xs leading-5 text-text-secondary">PulseCart ranks useful matches first and keeps every recommendation explainable.</p>
        </div>
      </div>
    </div>
  );
}
