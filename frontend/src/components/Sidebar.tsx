'use client';

interface CategoryNavProps {
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
}

const categories = [
  { id: 'all', label: 'All', count: 12 },
  { id: 'laptops', label: 'Laptops', count: 2 },
  { id: 'chairs', label: 'Chairs', count: 3 },
  { id: 'mobile phone', label: 'Mobile Phones', count: 2 },
  { id: 'accessories', label: 'Accessories', count: 5 },
];

export default function Sidebar({ selectedCategory, onCategoryChange }: CategoryNavProps) {
  return (
    <div className="flex flex-col gap-6 mb-10 relative z-10">
      {/* Categories */}
      <nav className="flex gap-3 overflow-x-auto pb-2 scrollbar-none" aria-label="Product categories">
        {categories.map((category) => {
          const isSelected = selectedCategory === category.id;
          return (
            <button
              key={category.id}
              onClick={() => onCategoryChange(category.id)}
              className={`shrink-0 rounded-full px-5 py-2.5 text-sm font-semibold transition-all duration-300 flex items-center gap-2 ${
                isSelected
                  ? 'bg-foreground text-background shadow-md shadow-foreground/20 scale-105'
                  : 'bg-surface text-text-secondary border border-border hover:border-primary/30 hover:bg-surface-alt hover:text-foreground hover:shadow-sm'
              }`}
            >
              {category.label}
            </button>
          );
        })}
      </nav>
      
      {/* Premium AI Banner */}
      <div className="relative overflow-hidden flex items-center gap-4 rounded-3xl border border-primary/15 bg-gradient-to-r from-primary-light/50 to-agent-light/50 px-6 py-5 max-sm:px-4 max-sm:py-4 max-sm:gap-3 shadow-sm backdrop-blur-md">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-agent opacity-20" />
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-agent shadow-lg shadow-primary/30">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 text-white"><path d="M11.644 1.59a.75.75 0 01.712 0l9.75 5.25a.75.75 0 010 1.32l-9.75 5.25a.75.75 0 01-.712 0l-9.75-5.25a.75.75 0 010-1.32l9.75-5.25z" /><path d="M3.265 10.602l7.668 4.129a2.25 2.25 0 002.134 0l7.668-4.13-7.51 4.044a.75.75 0 01-.712 0l-7.51-4.043zM3.265 15.852l7.668 4.129a2.25 2.25 0 002.134 0l7.668-4.13-7.51 4.044a.75.75 0 01-.712 0l-7.51-4.043z" /></svg>
        </div>
        <div>
          <p className="text-base font-bold text-foreground tracking-tight">Your feed learns as you search</p>
          <p className="mt-1 text-sm text-text-secondary">PulseCart ranks useful matches first and keeps every recommendation transparent.</p>
        </div>
      </div>
    </div>
  );
}
