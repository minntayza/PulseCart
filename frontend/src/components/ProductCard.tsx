'use client';

import { Product } from '@/types';

interface ProductCardProps {
  product: Product;
  onAddToCart: (product: Product) => void;
}

export default function ProductCard({ product, onAddToCart }: ProductCardProps) {
  const badgeConfig = {
    agent: { label: '🤖 Agent Pick', className: 'bg-agent/10 text-agent border-agent/30' },
    trending: { label: '🔥 Trending', className: 'bg-accent/10 text-accent border-accent/30' },
    match: { label: '🎯 Match', className: 'bg-success/10 text-success border-success/30' },
  };

  const badge = product.badge ? badgeConfig[product.badge] : null;

  return (
    <div className="bg-surface rounded-xl border border-border overflow-hidden hover:border-primary/30 hover:shadow-lg transition-all group">
      {/* Image area */}
      <div className="relative h-40 bg-white/5 flex items-center justify-center text-6xl group-hover:scale-105 transition-transform">
        {product.image}
        {badge && (
          <span className={`absolute top-2 left-2 text-[10px] font-medium px-2 py-1 rounded-full border ${badge.className}`}>
            {badge.label}
          </span>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="font-semibold text-sm text-text mb-1 line-clamp-1">{product.name}</h3>
        <p className="text-xs text-muted mb-3 line-clamp-1">{product.description}</p>

        {/* Rating */}
        <div className="flex items-center gap-1 mb-3">
          <span className="text-accent text-xs">{'★'.repeat(Math.floor(product.rating))}</span>
          <span className="text-xs text-muted">{product.rating} ({product.reviews})</span>
        </div>

        {/* Price + CTA */}
        <div className="flex items-center justify-between">
          <span className="text-lg font-bold text-primary">${product.price.toFixed(2)}</span>
          <button
            onClick={() => onAddToCart(product)}
            className="px-3 py-1.5 bg-primary text-white text-xs font-medium rounded-lg hover:bg-primary/90 transition-colors"
          >
            Add to Cart
          </button>
        </div>
      </div>
    </div>
  );
}
