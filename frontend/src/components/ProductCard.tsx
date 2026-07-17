'use client';

import { Product } from '@/types';
import Link from 'next/link';

interface ProductCardProps { product: Product; onAddToCart: (product: Product) => void }

const visuals = {
  laptops: { symbol: '▰', gradient: 'from-indigo-100 via-violet-50 to-slate-100' },
  chairs: { symbol: '⌑', gradient: 'from-amber-100 via-orange-50 to-stone-100' },
  headphones: { symbol: 'Ω', gradient: 'from-emerald-100 via-teal-50 to-slate-100' },
  accessories: { symbol: '✦', gradient: 'from-sky-100 via-cyan-50 to-slate-100' },
};

export default function ProductCard({ product, onAddToCart }: ProductCardProps) {
  const visual = visuals[product.category];
  const badge = product.badge === 'agent' ? 'AI pick' : product.badge === 'trending' ? 'Trending' : product.badge === 'match' ? 'Best match' : null;

  return (
    <article className="group overflow-hidden rounded-3xl border border-border/80 bg-surface shadow-card transition-all duration-300 hover:-translate-y-1 hover:border-primary/25 hover:shadow-card-hover">
      <Link href={`/products/${product.id}`} aria-label={`View details for ${product.name}`} className={`relative grid h-52 place-items-center overflow-hidden bg-gradient-to-br ${visual.gradient}`} style={product.imageUrl ? { backgroundImage: `url(${product.imageUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' } : undefined}>
        <div className="absolute -right-8 -top-8 h-28 w-28 rounded-full bg-white/50 blur-2xl" />
        {!product.imageUrl && <span className="select-none text-7xl font-black text-foreground/70 transition-transform duration-300 group-hover:scale-110">{visual.symbol}</span>}
        {badge && <span className="absolute left-4 top-4 rounded-full border border-white/70 bg-white/85 px-3 py-1 text-[11px] font-semibold text-foreground shadow-sm backdrop-blur">{badge}</span>}
        <span className="absolute bottom-4 right-4 rounded-full bg-white/80 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-text-secondary">{product.category}</span>
      </Link>
      <div className="p-5">
        <h3 className="line-clamp-1 text-base font-bold tracking-tight text-foreground"><Link href={`/products/${product.id}`} className="hover:text-primary">{product.name}</Link></h3>
        <p className="mt-1.5 line-clamp-2 min-h-10 text-sm leading-5 text-text-secondary">{product.description}</p>
        <div className="mt-4 flex items-center gap-2 text-xs">
          <span className="font-semibold text-accent">★ {product.rating}</span>
          <span className="text-text-muted">{product.reviews} reviews</span>
        </div>
        <div className="mt-5 flex items-center justify-between gap-3">
          <div><span className="text-xs text-text-muted">From</span><p className="text-xl font-extrabold tracking-tight text-foreground">${product.price.toFixed(2)}</p></div>
          <button onClick={() => onAddToCart(product)} className="rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-primary-hover focus:outline-none focus:ring-4 focus:ring-primary/15">Add to cart</button>
        </div>
        <Link href={`/products/${product.id}`} className="mt-4 inline-flex text-xs font-bold text-primary hover:text-primary-hover">View details and how it works →</Link>
      </div>
    </article>
  );
}
