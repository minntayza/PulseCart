'use client';

import { Product } from '@/types';
import ProductCard from './ProductCard';

interface ProductGridProps {
  products: Product[];
  searchQuery: string;
  onAddToCart: (product: Product) => void;
}

export default function ProductGrid({ products, searchQuery, onAddToCart }: ProductGridProps) {
  const filtered = products.filter((p) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      p.name.toLowerCase().includes(q) ||
      p.description.toLowerCase().includes(q) ||
      p.category.toLowerCase().includes(q)
    );
  });

  return (
    <div className="flex-1 p-6 overflow-y-auto h-[calc(100vh-56px)]">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-text">
            {searchQuery ? `Results for "${searchQuery}"` : 'All Products'}
          </h1>
          <p className="text-sm text-muted mt-1">
            {filtered.length} product{filtered.length !== 1 ? 's' : ''} found
            {searchQuery && ' · Sorted by relevance'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted">Sort by:</span>
          <select className="text-xs bg-white/5 border border-border rounded-lg px-2 py-1.5 text-text">
            <option>Relevance</option>
            <option>Price: Low to High</option>
            <option>Price: High to Low</option>
            <option>Rating</option>
          </select>
        </div>
      </div>

      {/* Agent insight banner when searching */}
      {searchQuery && (
        <div className="bg-agent/5 border border-agent/20 rounded-lg p-3 mb-6 flex items-center gap-3">
          <span className="text-agent animate-pulse">🤖</span>
          <p className="text-xs text-text/80">
            <span className="font-semibold text-agent">Recommender Agent:</span>{' '}
            Re-ranked results based on your profile. Items marked with 🎯 are personalized matches.
          </p>
        </div>
      )}

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-16">
          <span className="text-4xl mb-4 block">🔍</span>
          <h3 className="text-lg font-semibold text-text mb-2">No products found</h3>
          <p className="text-sm text-muted">Try adjusting your search or category filter</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((product) => (
            <ProductCard key={product.id} product={product} onAddToCart={onAddToCart} />
          ))}
        </div>
      )}
    </div>
  );
}
