'use client';

import { useState, useEffect } from 'react';

export default function NavCartButton() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const handler = (e: Event) => {
      const customEvent = e as CustomEvent;
      setCount(customEvent.detail ?? 0);
    };
    window.addEventListener('pulsecart:cart-count', handler);
    return () => window.removeEventListener('pulsecart:cart-count', handler);
  }, []);

  return (
    <button
      onClick={() => window.dispatchEvent(new CustomEvent('pulsecart:open-checkout'))}
      className="px-3 py-1.5 text-sm text-muted hover:text-text hover:bg-white/5 rounded-lg transition-colors relative"
    >
      🛒 Cart{count > 0 && <span className="ml-1 text-primary font-medium">({count})</span>}
    </button>
  );
}
