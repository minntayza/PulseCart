'use client';

import { useState } from 'react';
import { Product, formatPrice } from '@/types';
import { readCart, writeCart } from '@/services/storage';

export default function ProductDetailActions({ product, stock }: { product: Product; stock: number }) {
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const isOutOfStock = stock === 0;
  const addToCart = () => {
    if (isOutOfStock) return;
    const cart = readCart();
    writeCart([...cart, ...Array.from({ length: quantity }, () => product)]);
    setAdded(true);
    window.setTimeout(() => setAdded(false), 1800);
  };
  return <div className="space-y-3">
    {!isOutOfStock && (
      <div className="flex items-center gap-3">
        <label className="text-sm font-medium text-text-secondary">Quantity</label>
        <div className="flex items-center rounded-xl border border-border">
          <button onClick={() => setQuantity((value) => Math.max(1, value - 1))} className="h-10 w-10 text-lg" aria-label="Decrease quantity">−</button>
          <span className="w-8 text-center text-sm font-bold">{quantity}</span>
          <button onClick={() => setQuantity((value) => Math.min(stock, value + 1))} className="h-10 w-10 text-lg" aria-label="Increase quantity">+</button>
        </div>
      </div>
    )}
    {isOutOfStock ? (
      <div className="w-full rounded-xl border border-danger/20 bg-danger/5 px-5 py-3.5 text-center text-sm font-bold text-danger">
        Out of stock — check back later
      </div>
    ) : (
      <button onClick={addToCart} className="w-full rounded-xl bg-primary px-5 py-3.5 text-sm font-bold text-white shadow-sm transition hover:bg-primary-hover">
        {added ? `Added ${quantity} to cart ✓` : `Add to cart · ${formatPrice(product.price * quantity)}`}
      </button>
    )}
  </div>;
}
