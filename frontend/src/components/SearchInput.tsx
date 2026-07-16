'use client';

export default function SearchInput() {
  return (
    <div className="relative">
      <input
        type="text"
        placeholder="Search products..."
        className="w-full px-4 py-1.5 bg-white/5 border border-border rounded-lg text-sm text-text placeholder:text-muted/50 focus:outline-none focus:border-primary/50"
        onChange={(e) => {
          window.dispatchEvent(new CustomEvent('pulsecart:search', { detail: e.target.value }));
        }}
      />
      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted text-xs">🔍</span>
    </div>
  );
}
