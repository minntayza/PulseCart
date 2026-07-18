import Link from 'next/link';
import { notFound } from 'next/navigation';
import { products } from '@/data/products';
import { getProductDetails } from '@/data/productDetails';
import ProductDetailActions from '@/components/ProductDetailActions';
import { getProduct } from '@/services/productService';
import { formatPrice, displayCategory } from '@/types';

export const dynamic = 'force-dynamic';

export default async function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  let product = null;
  try { product = await getProduct(id); }
  catch { product = products.find((candidate) => candidate.id === id) ?? null; }
  if (!product) notFound();
  const details = getProductDetails(product);
  const related = products.filter((candidate) => candidate.category === product.category && candidate.id !== product.id).slice(0, 3);
  const symbols = { laptops: '▰', chairs: '⌑', headphones: '🎧', accessories: '✦' };

  return <main className="min-h-screen bg-background"><div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
    <nav className="mb-8 flex items-center gap-2 text-sm text-text-secondary font-medium"><Link href="/" className="hover:text-primary transition-colors">Shop</Link><span className="text-border">•</span><span className="capitalize">{displayCategory(product.category)}</span><span className="text-border">•</span><span className="truncate text-foreground">{product.name}</span></nav>
    <section className="grid gap-12 lg:grid-cols-[1.15fr_.85fr]">
      <div className="relative flex min-h-[32rem] items-center justify-center overflow-hidden rounded-[2.5rem] border border-border/80 bg-surface shadow-sm bg-cover bg-center group" style={product.imageUrl ? { backgroundImage: `url(${product.imageUrl})` } : undefined}>
        <div className="absolute inset-0 bg-gradient-to-tr from-border-light/50 to-transparent pointer-events-none" />
        {!product.imageUrl && <span className="text-[10rem] font-black text-foreground/10 transition-transform duration-700 group-hover:scale-110">{symbols[product.category]}</span>}
      </div>
      <div className="lg:py-8 flex flex-col justify-center">
        <span className="text-xs font-bold uppercase tracking-[.2em] text-primary">{displayCategory(product.category)}</span>
        <h1 className="mt-3 text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl leading-tight">{product.name}</h1>
        <p className="mt-6 text-base leading-relaxed text-text-secondary">{details.overview}</p>
        <div className="mt-8 flex items-end justify-between border-y border-border py-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-text-muted mb-1">Current price</p>
            <p className="text-4xl font-black tracking-tight text-foreground">{formatPrice(product.price)}</p>
          </div>
          <div className="text-right">
            {(product.stock ?? 0) > 0 ? (
              <p className="text-sm font-semibold text-success flex items-center gap-1.5 justify-end">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-success"></span>
                </span>
                In stock · {product.stock} available
              </p>
            ) : (
              <p className="text-sm font-semibold text-danger flex items-center gap-1.5 justify-end">
                <span className="relative flex h-2 w-2">
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-danger"></span>
                </span>
                Out of stock
              </p>
            )}
          </div>
        </div>
        <div className="mt-8"><ProductDetailActions product={product} stock={product.stock ?? 0}/></div>
        <div className="mt-8 relative overflow-hidden rounded-2xl border border-primary/15 bg-gradient-to-br from-primary-light/50 to-agent-light/50 p-5 shadow-sm backdrop-blur-md">
          <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-primary to-agent" />
          <div className="flex gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-agent shadow-md shadow-primary/30">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-white"><path d="M11.644 1.59a.75.75 0 01.712 0l9.75 5.25a.75.75 0 010 1.32l-9.75 5.25a.75.75 0 01-.712 0l-9.75-5.25a.75.75 0 010-1.32l9.75-5.25z" /><path d="M3.265 10.602l7.668 4.129a2.25 2.25 0 002.134 0l7.668-4.13-7.51 4.044a.75.75 0 01-.712 0l-7.51-4.043z" /></svg>
            </div>
            <div>
              <h2 className="text-sm font-bold text-foreground tracking-tight">Why PulseCart recommends it</h2>
              <p className="mt-1 text-sm leading-relaxed text-text-secondary">It matches interest in <span className="font-semibold text-foreground">{displayCategory(product.category)}</span>, and its key configuration aligns with common high-value uses.</p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section className="mt-20 grid gap-8 lg:grid-cols-2">
      <article className="rounded-3xl border border-border bg-surface p-8 sm:p-10 shadow-[0_4px_20px_rgb(0,0,0,0.03)]"><p className="text-xs font-bold uppercase tracking-[.2em] text-primary">Made simple</p><h2 className="mt-3 text-2xl font-extrabold tracking-tight text-foreground">How it works</h2><p className="mt-4 leading-relaxed text-text-secondary">{details.howItWorks}</p></article>
      <article className="rounded-3xl border border-border bg-surface p-8 sm:p-10 shadow-[0_4px_20px_rgb(0,0,0,0.03)]"><h2 className="text-2xl font-extrabold tracking-tight text-foreground">Is this right for you?</h2><div className="mt-6 grid gap-8 sm:grid-cols-2"><div><h3 className="text-sm font-bold text-success flex items-center gap-2"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" /></svg>A strong choice for</h3><ul className="mt-4 space-y-3">{details.bestFor.map((item) => <li key={item} className="flex items-start gap-2 text-sm text-text-secondary leading-snug"><span className="text-success shrink-0 mt-0.5">•</span><span>{item}</span></li>)}</ul></div><div><h3 className="text-sm font-bold text-accent flex items-center gap-2"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-5a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5A.75.75 0 0110 5zm0 10a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" /></svg>Consider before buying</h3><ul className="mt-4 space-y-3">{details.limitations.map((item) => <li key={item} className="flex items-start gap-2 text-sm text-text-secondary leading-snug"><span className="text-accent shrink-0 mt-0.5">—</span><span>{item}</span></li>)}</ul></div></div></article>
    </section>

    <section className="mt-8 rounded-3xl border border-border bg-surface p-8 sm:p-10 shadow-[0_4px_20px_rgb(0,0,0,0.03)]"><h2 className="text-2xl font-extrabold tracking-tight text-foreground">Specifications, explained</h2><div className="mt-8 divide-y divide-border-light border-t border-border-light">{details.specifications.map((specification) => <div key={specification.label} className="grid gap-2 py-5 sm:grid-cols-[14rem_1fr]"><dt className="text-sm font-semibold text-text-secondary">{specification.label}</dt><dd><p className="text-sm font-medium text-foreground">{specification.value}</p>{specification.explanation && <p className="mt-1.5 text-sm leading-relaxed text-text-muted">{specification.explanation}</p>}</dd></div>)}</div></section>

    {related.length > 0 && <section className="mt-20"><h2 className="text-2xl font-extrabold tracking-tight text-foreground">Similar products</h2><div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">{related.map((item) => <Link key={item.id} href={`/products/${item.id}`} className="group rounded-3xl border border-border bg-surface p-6 transition-all duration-300 hover:-translate-y-1 hover:border-primary/50 hover:shadow-lg hover:shadow-border/50 flex flex-col h-full"><p className="text-xs font-bold uppercase tracking-wider text-primary">{item.category}</p><h3 className="mt-3 font-bold text-lg tracking-tight text-foreground group-hover:text-primary transition-colors">{item.name}</h3><p className="mt-2 text-sm text-text-muted line-clamp-2 leading-relaxed flex-1">{item.description}</p><p className="mt-6 font-black text-xl text-foreground">{formatPrice(item.price)}</p></Link>)}</div></section>}
  </div></main>;
}
