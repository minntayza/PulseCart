'use client';

import { useState } from 'react';
import { Product } from '@/types';
import ProductCard from './ProductCard';
import { ProductCardSkeleton } from './Skeleton';

interface ProductGridProps { products: Product[]; searchQuery: string; isLoading?: boolean; onAddToCart: (product: Product) => void }
type SortOption = 'relevance' | 'price-low' | 'price-high' | 'rating';

export default function ProductGrid({ products, searchQuery, isLoading = false, onAddToCart }: ProductGridProps) {
  const [sortBy, setSortBy] = useState<SortOption>('relevance');
  const sortedProducts = [...products].sort((a, b) => {
    if (sortBy === 'price-low') return a.price - b.price;
    if (sortBy === 'price-high') return b.price - a.price;
    if (sortBy === 'rating') return b.rating - a.rating;
    return 0;
  });

  return (
    <section className="mt-8">
      <div className="mb-5 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-primary">Curated collection</p>
          <h2 className="mt-1 text-2xl font-extrabold tracking-tight text-foreground">{searchQuery ? `Top matches for “${searchQuery}”` : 'Products picked for you'}</h2>
          <p className="mt-1 text-sm text-text-secondary">{products.length} products · transparent, explainable ranking</p>
        </div>
        <label className="flex items-center gap-2 text-sm text-text-secondary">
          Sort
          <select value={sortBy} onChange={(event) => setSortBy(event.target.value as SortOption)} className="rounded-xl border border-border bg-surface px-3 py-2 text-sm font-medium text-foreground outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10">
            <option value="relevance">Relevance</option><option value="price-low">Price: low to high</option><option value="price-high">Price: high to low</option><option value="rating">Highest rated</option>
          </select>
        </label>
      </div>

      {searchQuery && <div className="mb-5 flex items-center gap-3 rounded-2xl border border-agent/15 bg-agent-light px-4 py-3 text-sm text-text-secondary"><span className="rounded-lg bg-agent px-2 py-1 text-[10px] font-bold text-white">AI</span><span><strong className="text-foreground">Feed updated.</strong> Relevant matches moved first; no sensitive traits were used.</span></div>}

      {isLoading ? <div aria-label="Loading products" className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">{Array.from({ length: 6 }, (_, index) => <ProductCardSkeleton key={index}/>)}</div>
      : !products.length ? <div className="grid min-h-64 place-items-center rounded-3xl border border-dashed border-border bg-surface"><div className="text-center"><p className="text-lg font-bold">No products found</p><p className="mt-1 text-sm text-text-secondary">Try another category or a broader search.</p></div></div>
      : <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">{sortedProducts.map((product) => <ProductCard key={product.id} product={product} onAddToCart={onAddToCart} />)}</div>}
    </section>
  );
}
