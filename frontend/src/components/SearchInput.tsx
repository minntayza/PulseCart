'use client';

export default function SearchInput() {
  return <label className="relative block"><span className="sr-only">Search products</span><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted"><circle cx="11" cy="11" r="7" strokeWidth="2"/><path d="m20 20-4-4" strokeWidth="2" strokeLinecap="round"/></svg><input type="search" placeholder="Search laptops, chairs, headphones…" className="w-full rounded-xl border border-border bg-background/80 py-2.5 pl-10 pr-4 text-sm text-foreground outline-none transition placeholder:text-text-muted focus:border-primary/50 focus:bg-surface focus:ring-4 focus:ring-primary/10" onChange={(event) => window.dispatchEvent(new CustomEvent('pulsecart:search', { detail: event.target.value }))}/></label>;
}
