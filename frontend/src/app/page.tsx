'use client';

import { useState, useEffect } from 'react';
import { products } from '@/data/products';
import { Product } from '@/types';
import { searchProducts } from '@/services/searchService';
import { getProducts } from '@/services/productService';
import { clearCart, readCart, writeCart } from '@/services/storage';
import Sidebar from '@/components/Sidebar';
import ProductGrid from '@/components/ProductGrid';
import CheckoutModal from '@/components/CheckoutModal';
import AgentFeed from '@/components/AgentFeed';

export default function Home() {
  const [category, setCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [cart, setCart] = useState<Product[]>([]);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [rankedProducts, setRankedProducts] = useState(products);
  const [isSearching, setIsSearching] = useState(false);
  const [catalogError, setCatalogError] = useState('');

  // Listen for checkout open from nav
  useEffect(() => {
    let active = true;
    const timer = window.setTimeout(async () => {
      try {
        const liveProducts = await getProducts();
        if (active) { setRankedProducts(liveProducts); setCatalogError(''); }
      } catch {
        if (active) setCatalogError('Live products could not be loaded. Make sure FastAPI is running on port 8000.');
      }
    }, 0);
    return () => { active = false; window.clearTimeout(timer); };
  }, []);

  useEffect(() => {
    const handler = () => setIsCheckoutOpen(true);
    const shouldOpen = window.sessionStorage.getItem('pulsecart:open-cart');
    if (shouldOpen) {
      window.sessionStorage.removeItem('pulsecart:open-cart');
      window.setTimeout(() => setIsCheckoutOpen(true), 0);
    }
    window.addEventListener('pulsecart:open-checkout', handler);
    return () => window.removeEventListener('pulsecart:open-checkout', handler);
  }, []);

  // Listen for search from nav
  useEffect(() => {
    const handler = (e: Event) => {
      const ce = e as CustomEvent;
      setIsSearching(true);
      setSearchQuery(ce.detail ?? '');
    };
    window.addEventListener('pulsecart:search', handler);
    return () => window.removeEventListener('pulsecart:search', handler);
  }, []);

  // Sync cart count to nav
  useEffect(() => {
    window.dispatchEvent(new CustomEvent('pulsecart:cart-count', { detail: cart.length }));
  }, [cart]);

  useEffect(() => {
    const timer = window.setTimeout(() => setCart(readCart()), 0);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    let active = true;
    const timer = window.setTimeout(async () => {
      try {
        const result = await searchProducts(searchQuery);
        if (active) { setRankedProducts(result.products); setCatalogError(''); }
      } catch {
        if (active) setCatalogError('Search is temporarily unavailable.');
      } finally { if (active) setIsSearching(false); }
    }, searchQuery ? 250 : 0);
    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [searchQuery]);

  const filteredProducts = category === 'all'
    ? rankedProducts
    : rankedProducts.filter((p) => p.category === category);

  const handleAddToCart = (product: Product) => {
    const next = [...cart, product];
    setCart(next);
    writeCart(next);
  };

  const handleRemoveFromCart = (id: string) => {
    const next = cart.filter((product) => product.id !== id);
    setCart(next);
    writeCart(next);
  };

  const handleOrderCompleted = () => {
    clearCart();
    setCart([]);
  };

  return (
    <main className="min-h-[calc(100vh-64px)] bg-background relative overflow-hidden">
      {/* Subtle Background Pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,color-mix(in_srgb,var(--primary)_10%,transparent)_1px,transparent_1px),linear-gradient(to_bottom,color-mix(in_srgb,var(--primary)_10%,transparent)_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none" />
      
      <section className="relative pt-16 pb-12 sm:pt-24 sm:pb-16 lg:pt-32 lg:pb-24 border-b border-border/60 bg-surface/40 backdrop-blur-3xl">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center flex flex-col items-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary-light/50 px-4 py-1.5 text-xs font-semibold text-primary shadow-sm backdrop-blur-md transition-all hover:bg-primary-light cursor-default">
            <span className="flex h-2 w-2 rounded-full bg-primary animate-pulse"></span>
            AI-assisted commerce, with you in control
          </div>
          <h1 className="mt-8 max-w-4xl text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl lg:text-6xl lg:leading-tight">
            Find better products. <br className="hidden sm:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-agent">Understand every choice.</span>
          </h1>
          <p className="mt-6 max-w-2xl text-base leading-relaxed text-text-secondary sm:text-lg">
            Search a smarter storefront that adapts in real time, explains its recommendations, and keeps people in charge of important decisions.
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {catalogError && <div className="mb-5 rounded-2xl border border-danger/20 bg-danger-light px-4 py-3 text-sm text-danger" role="alert">{catalogError}</div>}
        <Sidebar selectedCategory={category} onCategoryChange={setCategory} />

      <ProductGrid
        products={filteredProducts}
        searchQuery={searchQuery}
        isLoading={isSearching}
        onAddToCart={handleAddToCart}
      />
      </div>

      {/* Floating Agent Feed - Sketch 004-C */}
      <AgentFeed />

      {/* Checkout Modal - Sketch 002-A */}
      <CheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        cart={cart}
        onRemoveFromCart={handleRemoveFromCart}
        onOrderCompleted={handleOrderCompleted}
      />
    </main>
  );
}
