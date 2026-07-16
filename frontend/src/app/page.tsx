'use client';

import { useState, useEffect } from 'react';
import { products } from '@/data/products';
import { Product } from '@/types';
import Sidebar from '@/components/Sidebar';
import ProductGrid from '@/components/ProductGrid';
import CheckoutModal from '@/components/CheckoutModal';
import AgentFeed from '@/components/AgentFeed';

export default function Home() {
  const [category, setCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [cart, setCart] = useState<Product[]>([]);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);

  // Listen for checkout open from nav
  useEffect(() => {
    const handler = () => setIsCheckoutOpen(true);
    window.addEventListener('pulsecart:open-checkout', handler);
    return () => window.removeEventListener('pulsecart:open-checkout', handler);
  }, []);

  // Listen for search from nav
  useEffect(() => {
    const handler = (e: Event) => {
      const ce = e as CustomEvent;
      setSearchQuery(ce.detail ?? '');
    };
    window.addEventListener('pulsecart:search', handler);
    return () => window.removeEventListener('pulsecart:search', handler);
  }, []);

  // Sync cart count to nav
  useEffect(() => {
    window.dispatchEvent(new CustomEvent('pulsecart:cart-count', { detail: cart.length }));
  }, [cart]);

  const filteredProducts = category === 'all'
    ? products
    : products.filter((p) => p.category === category);

  const handleAddToCart = (product: Product) => {
    setCart((prev) => [...prev, product]);
  };

  const handleRemoveFromCart = (id: string) => {
    setCart((prev) => prev.filter((p) => p.id !== id));
  };

  return (
    <div className="flex min-h-[calc(100vh-56px)]">
      {/* Sidebar - Sketch 001-C Split Browse */}
      <Sidebar
        selectedCategory={category}
        onCategoryChange={setCategory}
        searchQuery={searchQuery}
      />

      {/* Main content */}
      <ProductGrid
        products={filteredProducts}
        searchQuery={searchQuery}
        onAddToCart={handleAddToCart}
      />

      {/* Floating Agent Feed - Sketch 004-C */}
      <AgentFeed />

      {/* Checkout Modal - Sketch 002-A */}
      <CheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        cart={cart}
        onRemoveFromCart={handleRemoveFromCart}
      />
    </div>
  );
}
