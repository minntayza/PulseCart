'use client';

import { Product, formatPrice, displayCategory } from '@/types';
import Link from 'next/link';

interface ProductCardProps { product: Product; onAddToCart: (product: Product) => void }

const visuals: Record<string, { symbol: string; gradient: string }> = {
  laptops: { symbol: '▰', gradient: 'from-indigo-100 via-violet-50 to-slate-100' },
  chairs: { symbol: '⌑', gradient: 'from-amber-100 via-orange-50 to-stone-100' },
  headphones: { symbol: '🎧', gradient: 'from-emerald-100 via-teal-50 to-slate-100' },
  accessories: { symbol: '✦', gradient: 'from-sky-100 via-cyan-50 to-slate-100' },
};

export default function ProductCard({ product, onAddToCart }: ProductCardProps) {
  const visual = visuals[product.category];
  const badge = product.badge === 'agent' ? 'AI pick' : product.badge === 'trending' ? 'Trending' : product.badge === 'match' ? 'Best match' : null;
  const isOutOfStock = (product.stock ?? 0) === 0;

  return (
    <article className={`group relative flex flex-col overflow-hidden rounded-3xl border border-border bg-surface shadow-[0_2px_10px_rgb(0,0,0,0.02)] transition-all duration-500 hover:-translate-y-1.5 hover:shadow-[0_20px_40px_rgb(0,0,0,0.06)] hover:border-primary/30 ${isOutOfStock ? 'opacity-75 hover:opacity-90' : ''}`}>
      <Link href={`/products/${product.id}`} aria-label={`View details for ${product.name}`} className={`relative block h-56 max-sm:h-44 overflow-hidden bg-gradient-to-br ${visual.gradient}`} style={product.imageUrl ? { backgroundImage: `url(${product.imageUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' } : { display: 'grid', placeItems: 'center' }}>
        <div className="absolute inset-0 bg-gradient-to-t from-foreground/10 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
        <div className="absolute -right-12 -top-12 h-40 w-40 rounded-full bg-surface/50 blur-3xl transition-transform duration-700 group-hover:scale-150" />

        {!product.imageUrl && <span className={`relative z-10 select-none text-8xl font-black text-foreground/10 transition-transform duration-500 ${isOutOfStock ? '' : 'group-hover:scale-110'}`}>{visual.symbol}</span>}

        {isOutOfStock && (
          <span className="absolute right-4 top-4 z-20 rounded bg-danger/10 px-2 py-1 border border-danger/20 text-[10px] font-bold uppercase tracking-wider text-danger shadow-sm backdrop-blur-md">
            Out of stock
          </span>
        )}

        {badge && !isOutOfStock && (
          <span className="absolute left-4 top-4 z-20 rounded-full border border-border/60 bg-surface/80 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-foreground shadow-sm backdrop-blur-md">
            {badge}
          </span>
        )}
        <span className="absolute bottom-4 right-4 z-20 rounded-full bg-surface/90 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-text-secondary shadow-sm backdrop-blur-md transition-all duration-300 group-hover:translate-x-4 group-hover:opacity-0">
          {displayCategory(product.category)}
        </span>
      </Link>

      <div className="flex flex-1 flex-col p-6 max-sm:p-4">
        <h3 className="line-clamp-1 text-lg font-bold tracking-tight text-foreground">
          <Link href={`/products/${product.id}`} className="hover:text-primary transition-colors after:absolute after:inset-0">
            {product.name}
          </Link>
        </h3>
        <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-text-muted">{product.description}</p>

        <div className="mt-auto pt-6">
          <div className="flex items-end justify-between gap-3">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-text-muted">From</span>
              <p className="text-2xl font-black tracking-tight text-foreground">{formatPrice(product.price)}</p>
            </div>
            {isOutOfStock ? (
              <span className="flex h-12 items-center rounded-2xl border border-border bg-surface-alt px-4 text-sm font-semibold text-text-muted cursor-not-allowed">
                Sold out
              </span>
            ) : (
              <button
                onClick={(e) => { e.preventDefault(); onAddToCart(product); }}
                className="relative z-20 flex h-12 w-12 items-center justify-center rounded-2xl bg-surface-alt text-text-secondary transition-all duration-300 hover:bg-primary hover:text-white hover:shadow-lg hover:shadow-primary/30 active:scale-95"
                aria-label="Add to cart"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
              </button>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}
