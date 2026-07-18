'use client';

import { useState, useEffect } from 'react';
import { Product, formatPrice } from '@/types';
import { readCart, writeCart } from '@/services/storage';

export default function ProductDetailActions({ product, stock }: { product: Product; stock: number }) {
  const [quantity, setQuantity] = useState(stock > 0 ? 1 : 0);
  const [added, setAdded] = useState(false);

  useEffect(() => {
    if (stock === 0) setQuantity(0);
    else if (quantity > stock) setQuantity(stock);
    else if (quantity === 0 && stock > 0) setQuantity(1);
  }, [stock, quantity]);

  const addToCart = () => {
    if (stock === 0 || quantity === 0) return;
    const cart = readCart();
    writeCart([...cart, ...Array.from({ length: quantity }, () => product)]);
    setAdded(true);
    window.setTimeout(() => setAdded(false), 1800);
  };

  const isOutOfStock = stock === 0;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <label className="text-sm font-medium text-text-secondary">Quantity</label>
        <div className={`flex items-center rounded-xl border border-border ${isOutOfStock ? 'opacity-50 pointer-events-none' : ''}`}>
          <button 
            onClick={() => setQuantity((value) => Math.max(1, value - 1))} 
            className="h-10 w-10 text-lg disabled:opacity-50" 
            aria-label="Decrease quantity"
            disabled={isOutOfStock || quantity <= 1}
          >−</button>
          <span className="w-8 text-center text-sm font-bold">{quantity}</span>
          <button 
            onClick={() => setQuantity((value) => Math.min(stock, value + 1))} 
            className="h-10 w-10 text-lg disabled:opacity-50" 
            aria-label="Increase quantity"
            disabled={isOutOfStock || quantity >= stock}
          >+</button>
        </div>
      </div>
      <button 
        onClick={addToCart} 
        disabled={isOutOfStock}
        className="w-full rounded-xl bg-primary px-5 py-3.5 text-sm font-bold text-white shadow-sm transition hover:bg-primary-hover disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isOutOfStock ? 'Out of stock' : added ? `Added ${quantity} to cart ✓` : `Add to cart · ${formatPrice(product.price * quantity)}`}
      </button>
    </div>
  );
}
