'use client';
import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { readCart } from '@/services/storage';
export default function NavCartButton() {
  const [count, setCount] = useState(0);
  const pathname = usePathname();
  const router = useRouter();
  useEffect(() => { const initialLoad = window.setTimeout(() => setCount(readCart().length), 0); const handler = (event: Event) => setCount((event as CustomEvent).detail ?? 0); window.addEventListener('pulsecart:cart-count', handler); return () => { window.clearTimeout(initialLoad); window.removeEventListener('pulsecart:cart-count', handler); }; }, []);
  const openCart = () => { if (pathname === '/') window.dispatchEvent(new CustomEvent('pulsecart:open-checkout')); else { window.sessionStorage.setItem('pulsecart:open-cart', 'true'); router.push('/'); } };
  return <button onClick={openCart} className="relative grid h-10 w-10 place-items-center rounded-xl border border-border bg-surface text-text-secondary transition hover:border-primary/30 hover:bg-primary-light hover:text-primary" aria-label={`Open cart with ${count} items`}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="h-5 w-5"><path d="M3 4h2l2.2 10.2a2 2 0 0 0 2 1.6h7.7a2 2 0 0 0 2-1.6L20 8H6" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/><circle cx="10" cy="20" r="1" fill="currentColor"/><circle cx="18" cy="20" r="1" fill="currentColor"/></svg>{count > 0 && <span className="absolute -right-1.5 -top-1.5 grid min-h-5 min-w-5 place-items-center rounded-full bg-primary px-1 text-[10px] font-bold text-white ring-2 ring-surface">{count}</span>}</button>;
}
