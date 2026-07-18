import Link from 'next/link';
import { notFound } from 'next/navigation';
import { products } from '@/data/products';
import { getProductDetails } from '@/data/productDetails';
import ProductDetailActions from '@/components/ProductDetailActions';
import { getProduct } from '@/services/productService';
import { formatPrice } from '@/types';

export function generateStaticParams() { return products.map((product) => ({ id: product.id })); }

export default async function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  let product = null;
  try { product = await getProduct(id); }
  catch { product = products.find((candidate) => candidate.id === id) ?? null; }
  if (!product) notFound();
  const details = getProductDetails(product);
  const related = products.filter((candidate) => candidate.category === product.category && candidate.id !== product.id).slice(0, 3);
  const symbols = { laptops: '▰', chairs: '⌑', headphones: 'Ω', accessories: '✦' };

  return <main className="min-h-screen bg-background"><div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
    <nav className="mb-7 flex items-center gap-2 text-sm text-text-muted"><Link href="/" className="hover:text-primary">Shop</Link><span>/</span><span className="capitalize">{product.category}</span><span>/</span><span className="truncate text-foreground">{product.name}</span></nav>
    <section className="grid gap-10 lg:grid-cols-[1.15fr_.85fr]">
      <div className="grid min-h-[28rem] place-items-center overflow-hidden rounded-[2rem] border border-border bg-gradient-to-br from-primary-light via-white to-agent-light bg-cover bg-center" style={product.imageUrl ? { backgroundImage: `url(${product.imageUrl})` } : undefined}>{!product.imageUrl && <span className="text-[9rem] font-black text-foreground/70">{symbols[product.category]}</span>}</div>
      <div className="lg:py-4">
        <span className="text-xs font-bold uppercase tracking-[.18em] text-primary">{product.category}</span>
        <h1 className="mt-3 text-4xl font-black tracking-[-.04em] text-foreground">{product.name}</h1>
        <div className="mt-4 flex items-center gap-3 text-sm"><span className="font-bold text-accent">★ {product.rating}</span><span className="text-text-muted">{product.reviews} verified reviews</span></div>
        <p className="mt-6 text-base leading-7 text-text-secondary">{details.overview}</p>
        <div className="mt-7 flex items-end justify-between border-y border-border py-5"><div><p className="text-xs text-text-muted">Current price</p><p className="text-3xl font-black tracking-tight">{formatPrice(product.price)}</p></div><div className="text-right"><p className="text-sm font-semibold text-success">In stock · {details.stock} available</p></div></div>
        <div className="mt-6"><ProductDetailActions product={product} stock={details.stock}/></div>
        <div className="mt-5 rounded-2xl border border-agent/15 bg-agent-light p-4"><div className="flex gap-3"><span className="h-fit rounded-lg bg-agent px-2 py-1 text-[10px] font-black text-white">AI</span><div><h2 className="text-sm font-bold">Why PulseCart recommends it</h2><p className="mt-1 text-xs leading-5 text-text-secondary">It matches interest in {product.category}, has a {product.rating}/5 rating, and its key configuration aligns with common high-value uses. Recommendations never use sensitive traits.</p></div></div></div>
      </div>
    </section>

    <section className="mt-16 grid gap-6 lg:grid-cols-2">
      <article className="rounded-3xl border border-border bg-surface p-7 shadow-card"><p className="text-xs font-bold uppercase tracking-[.16em] text-primary">Made simple</p><h2 className="mt-2 text-2xl font-extrabold">How it works</h2><p className="mt-4 leading-7 text-text-secondary">{details.howItWorks}</p></article>
      <article className="rounded-3xl border border-border bg-surface p-7 shadow-card"><h2 className="text-2xl font-extrabold">Is this right for you?</h2><div className="mt-5 grid gap-6 sm:grid-cols-2"><div><h3 className="text-sm font-bold text-success">A strong choice for</h3><ul className="mt-3 space-y-2">{details.bestFor.map((item) => <li key={item} className="flex gap-2 text-sm text-text-secondary"><span className="text-success">✓</span>{item}</li>)}</ul></div><div><h3 className="text-sm font-bold text-accent">Consider before buying</h3><ul className="mt-3 space-y-2">{details.limitations.map((item) => <li key={item} className="flex gap-2 text-sm text-text-secondary"><span className="text-accent">—</span>{item}</li>)}</ul></div></div></article>
    </section>

    <section className="mt-8 rounded-3xl border border-border bg-surface p-7 shadow-card"><h2 className="text-2xl font-extrabold">Specifications, explained</h2><div className="mt-5 divide-y divide-border">{details.specifications.map((specification) => <div key={specification.label} className="grid gap-1 py-4 sm:grid-cols-[12rem_1fr]"><dt className="text-sm font-semibold text-text-secondary">{specification.label}</dt><dd><p className="text-sm font-semibold text-foreground">{specification.value}</p>{specification.explanation && <p className="mt-1 text-xs leading-5 text-text-muted">{specification.explanation}</p>}</dd></div>)}</div></section>

    {related.length > 0 && <section className="mt-12"><h2 className="text-2xl font-extrabold">Similar products</h2><div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{related.map((item) => <Link key={item.id} href={`/products/${item.id}`} className="rounded-2xl border border-border bg-surface p-5 transition hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-card"><p className="text-xs font-bold uppercase tracking-wider text-primary">{item.category}</p><h3 className="mt-2 font-bold">{item.name}</h3><p className="mt-2 text-sm text-text-secondary">{item.description}</p><p className="mt-4 font-extrabold">{formatPrice(item.price)}</p></Link>)}</div></section>}
  </div></main>;
}
