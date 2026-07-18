'use client';

import { useEffect, useRef, useState } from 'react';
import { Product } from '@/types';
import { readCart, writeCart } from '@/services/storage';
import { useAuth } from '@/components/AuthProvider';
import { trackProductView } from '@/services/searchService';

export default function ProductDetailActions({ product, stock }: { product: Product; stock: number }) {
  const { accessToken, isLoading } = useAuth();
  const tracked = useRef(false);
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  useEffect(() => {
    if (isLoading || !accessToken || tracked.current) return;
    tracked.current = true;
    void trackProductView(product.id, accessToken).catch(() => { tracked.current = false; });
  }, [accessToken, isLoading, product.id]);
  const addToCart = () => {
    const cart = readCart();
    writeCart([...cart, ...Array.from({ length: quantity }, () => product)]);
    setAdded(true);
    window.setTimeout(() => setAdded(false), 1800);
  };
  return <div className="space-y-3"><div className="flex items-center gap-3"><label className="text-sm font-medium text-text-secondary">Quantity</label><div className="flex items-center rounded-xl border border-border"><button onClick={() => setQuantity((value) => Math.max(1, value - 1))} className="h-10 w-10 text-lg" aria-label="Decrease quantity">−</button><span className="w-8 text-center text-sm font-bold">{quantity}</span><button onClick={() => setQuantity((value) => Math.min(stock, value + 1))} className="h-10 w-10 text-lg" aria-label="Increase quantity">+</button></div></div><button onClick={addToCart} className="w-full rounded-xl bg-primary px-5 py-3.5 text-sm font-bold text-white shadow-sm transition hover:bg-primary-hover">{added ? `Added ${quantity} to cart ✓` : `Add to cart · $${(product.price * quantity).toFixed(2)}`}</button></div>;
}
